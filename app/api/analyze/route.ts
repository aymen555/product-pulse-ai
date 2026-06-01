import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit } from "@/lib/rateLimit";
import { fetchYouTubeData } from "@/lib/youtube";
import { buildAnalysisPrompt, buildFallbackPrompt } from "@/lib/prompt";
import type { AnalysisResult } from "@/types/analysis";

function validateProduct(product: unknown): {
  valid: boolean;
  error?: string;
  clean?: string;
} {
  if (typeof product !== "string") {
    return { valid: false, error: "Product name must be a string" };
  }
  const clean = product.trim().replace(/\s+/g, " ");
  if (clean.length < 2) return { valid: false, error: "Product name is too short" };
  if (clean.length > 120) return { valid: false, error: "Product name is too long (max 120 characters)" };
  const blockedPatterns = [/[<>{}[\]\\]/, /javascript:/i, /data:/i, /on\w+=/i];
  if (blockedPatterns.some((p) => p.test(clean))) {
    return { valid: false, error: "Invalid characters in product name" };
  }
  return { valid: true, clean };
}

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const { allowed, remaining, resetIn } = checkRateLimit(ip, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { success: false, error: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 1000)} seconds.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { product } = (body as { product?: unknown }) ?? {};
  const validation = validateProduct(product);
  if (!validation.valid || !validation.clean) {
    return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
  }

  const cleanProduct = validation.clean;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
  }

  let contextText = "";
  let dataPoints = 0;
  let sources: string[] = ["AI Knowledge Base"];
  let usedYouTube = false;

  if (process.env.YOUTUBE_API_KEY) {
    try {
      const ytData = await fetchYouTubeData(cleanProduct, process.env.YOUTUBE_API_KEY);
      contextText = ytData.contextText;
      dataPoints = ytData.totalComments;
      sources = ["YouTube Comments", "YouTube Reviews"];
      usedYouTube = true;
    } catch (err) {
      console.warn("[analyze] YouTube fetch failed:", err);
    }
  }

  const prompt = usedYouTube
    ? buildAnalysisPrompt(cleanProduct, contextText)
    : buildFallbackPrompt(cleanProduct);

  let rawAnalysis: AnalysisResult;
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { temperature: 0.2, maxOutputTokens: 1000 },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    if (!raw) throw new Error("Empty response from Gemini");

    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    rawAnalysis = JSON.parse(cleaned);
  } catch (aiError) {
    console.error("[analyze] Gemini error:", aiError);
    return NextResponse.json(
      { success: false, error: aiError instanceof SyntaxError ? "AI returned malformed data." : "Analysis service unavailable. Please try again." },
      { status: 500 }
    );
  }

  const sentiment = rawAnalysis.sentiment ?? { positive: 50, neutral: 30, negative: 20 };
  const total = (sentiment.positive ?? 0) + (sentiment.neutral ?? 0) + (sentiment.negative ?? 0);
  if (total !== 100 && total > 0) {
    sentiment.positive = Math.round((sentiment.positive / total) * 100);
    sentiment.neutral = Math.round((sentiment.neutral / total) * 100);
    sentiment.negative = 100 - sentiment.positive - sentiment.neutral;
  }

  const finalResult: AnalysisResult = {
    product: cleanProduct,
    analyzedAt: new Date().toISOString(),
    sentiment,
    overallScore: Math.min(100, Math.max(0, rawAnalysis.overallScore ?? sentiment.positive)),
    topics: (rawAnalysis.topics ?? []).slice(0, 5),
    complaints: (rawAnalysis.complaints ?? []).slice(0, 4),
    positives: (rawAnalysis.positives ?? []).slice(0, 4),
    insight: rawAnalysis.insight ?? "No insight available.",
    dataPoints: usedYouTube ? dataPoints : (rawAnalysis.dataPoints ?? 0),
    sources,
  };

  return NextResponse.json(
    { success: true, data: finalResult },
    { status: 200, headers: { "X-RateLimit-Remaining": String(remaining), "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  return NextResponse.json({ success: false, error: "Method not allowed." }, { status: 405 });
}
