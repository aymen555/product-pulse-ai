import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkRateLimit } from "@/lib/rateLimit";
import { fetchYouTubeData } from "@/lib/youtube";
import { buildAnalysisPrompt, buildFallbackPrompt } from "@/lib/prompt";
import type { AnalysisResult } from "@/types/analysis";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation
function validateProduct(product: unknown): {
  valid: boolean;
  error?: string;
  clean?: string;
} {
  if (typeof product !== "string") {
    return { valid: false, error: "Product name must be a string" };
  }

  const clean = product.trim().replace(/\s+/g, " ");

  if (clean.length < 2) {
    return { valid: false, error: "Product name is too short" };
  }

  if (clean.length > 120) {
    return {
      valid: false,
      error: "Product name is too long (max 120 characters)",
    };
  }

  // Block obvious spam/injection attempts
  const blockedPatterns = [
    /[<>{}[\]\\]/,
    /javascript:/i,
    /data:/i,
    /on\w+=/i,
  ];
  if (blockedPatterns.some((p) => p.test(clean))) {
    return { valid: false, error: "Invalid characters in product name" };
  }

  return { valid: true, clean };
}

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const { allowed, remaining, resetIn } = checkRateLimit(ip, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Rate limit exceeded. Try again in ${Math.ceil(resetIn / 1000)} seconds.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Date.now() + resetIn),
          "Retry-After": String(Math.ceil(resetIn / 1000)),
        },
      }
    );
  }

  // 2. Parse and validate input
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { product } =
    (body as { product?: unknown }) ?? {};
  const validation = validateProduct(product);

  if (!validation.valid || !validation.clean) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  const cleanProduct = validation.clean;

  // 3. Check required env vars
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY is not set");
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  // 4. Attempt to fetch YouTube data
  let contextText = "";
  let dataPoints = 0;
  let sources: string[] = ["AI Knowledge Base"];
  let usedYouTube = false;

  if (process.env.YOUTUBE_API_KEY) {
    try {
      const ytData = await fetchYouTubeData(
        cleanProduct,
        process.env.YOUTUBE_API_KEY
      );
      contextText = ytData.contextText;
      dataPoints = ytData.totalComments;
      sources = ["YouTube Comments", "YouTube Reviews"];
      usedYouTube = true;
      console.log(
        `[analyze] YouTube: ${ytData.videos.length} videos, ${dataPoints} comments for "${cleanProduct}"`
      );
    } catch (ytError) {
      console.warn("[analyze] YouTube fetch failed, using fallback:", ytError);
    }
  }

  // 5. Build prompt & call OpenAI
  const prompt = usedYouTube
    ? buildAnalysisPrompt(cleanProduct, contextText)
    : buildFallbackPrompt(cleanProduct);

  let rawAnalysis: AnalysisResult;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      temperature: 0.2, // Low temp for consistent, factual output
      messages: [
        {
          role: "system",
          content:
            "You are a precise market intelligence engine. You respond ONLY with valid JSON. Never include markdown, explanations, or code fences.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from OpenAI");

    // Strip any accidental markdown fences
    const cleaned = raw
      .replace(/^```(?:json)?\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    rawAnalysis = JSON.parse(cleaned);
  } catch (aiError) {
    console.error("[analyze] OpenAI error:", aiError);
    return NextResponse.json(
      {
        success: false,
        error:
          aiError instanceof SyntaxError
            ? "AI returned malformed data. Please try again."
            : "Analysis service temporarily unavailable. Please try again.",
      },
      { status: 500 }
    );
  }

  // 6. Validate and normalize AI output
  const sentiment = rawAnalysis.sentiment ?? { positive: 50, neutral: 30, negative: 20 };
  const total = (sentiment.positive ?? 0) + (sentiment.neutral ?? 0) + (sentiment.negative ?? 0);

  // Normalize to 100 if AI drifted
  if (total !== 100 && total > 0) {
    sentiment.positive = Math.round((sentiment.positive / total) * 100);
    sentiment.neutral = Math.round((sentiment.neutral / total) * 100);
    sentiment.negative = 100 - sentiment.positive - sentiment.neutral;
  }

  const result: AnalysisResult = {
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
    { success: true, data: result },
    {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": String(remaining),
        "Cache-Control": "no-store",
      },
    }
  );
}

// Reject non-POST
export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
