"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnalysisResult } from "@/types/analysis";

function SkeletonBlock({ width = "100%", height = 20, style = {} }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 8, ...style }}
    />
  );
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = 45;
  const circ = 2 * Math.PI * r; // ~283
  const dashOffset = circ - (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#f43f5e";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* Background ring */}
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      {/* Score ring */}
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ}
        transform="rotate(-90 50 50)"
        style={{
          transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
          filter: `drop-shadow(0 0 6px ${color}80)`,
        }}
        ref={(el) => {
          if (el) {
            setTimeout(() => {
              el.style.strokeDashoffset = String(dashOffset);
            }, 100);
          }
        }}
      />
      {/* Score text */}
      <text
        x="50"
        y="46"
        textAnchor="middle"
        fill="white"
        fontSize="20"
        fontWeight="700"
        fontFamily="Syne, sans-serif"
      >
        {score}
      </text>
      <text
        x="50"
        y="60"
        textAnchor="middle"
        fill="rgba(255,255,255,0.4)"
        fontSize="8"
        fontFamily="DM Sans, sans-serif"
      >
        /100
      </text>
    </svg>
  );
}

function SentimentBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 200 + delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "DM Sans, sans-serif" }}>
          {label}
        </span>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color, fontFamily: "Syne, sans-serif" }}>
          {value}%
        </span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: color,
            borderRadius: 4,
            transition: "width 1s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}

function TopicChip({ topic, index }: { topic: { name: string; frequency: number; sentiment: string }; index: number }) {
  const colors = {
    positive: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", text: "#34d399" },
    negative: { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", text: "#fb7185" },
    neutral: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", text: "#fbbf24" },
  };
  const c = colors[topic.sentiment as keyof typeof colors] || colors.neutral;

  return (
    <div
      className="animate-fade-up"
      style={{
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 100,
        background: c.bg,
        border: `1px solid ${c.border}`,
        fontSize: "0.82rem",
        color: c.text,
        fontFamily: "DM Sans, sans-serif",
        fontWeight: 500,
      }}
    >
      <span style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: Math.min(topic.frequency, 5) }).map((_, i) => (
          <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: c.text, opacity: i < topic.frequency / 2 ? 1 : 0.3 }} />
        ))}
      </span>
      {topic.name}
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const product = searchParams.get("product") || "";
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState(0);
  const fetchedRef = useRef(false);

  const PHASES = [
    "Searching the web...",
    "Collecting opinions...",
    "Reading comments...",
    "Running AI analysis...",
    "Building your report...",
  ];

  useEffect(() => {
    if (!product) {
      router.push("/");
      return;
    }
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // Phase animation
    let p = 0;
    const phaseInterval = setInterval(() => {
      p = Math.min(p + 1, PHASES.length - 1);
      setPhase(p);
    }, 2000);

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product }),
    })
      .then((res) => res.json())
      .then((data) => {
        clearInterval(phaseInterval);
        if (data.success) {
          setResult(data.data);
        } else {
          setError(data.error || "Analysis failed. Please try again.");
        }
      })
      .catch(() => {
        clearInterval(phaseInterval);
        setError("Network error. Please check your connection and try again.");
      })
      .finally(() => setLoading(false));
  }, [product, router]);

  if (!product) return null;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="orb orb-1" />

        {/* Animated loader */}
        <div style={{ position: "relative", marginBottom: 40 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: "2px solid var(--border)",
              borderTop: "2px solid var(--accent)",
              animation: "spin-slow 1s linear infinite",
            }}
          />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
            ⚡
          </div>
        </div>

        <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "var(--text-primary)", marginBottom: 12, textAlign: "center" }}>
          Analyzing{" "}
          <span className="gradient-text">{product}</span>
        </h2>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontFamily: "DM Sans, sans-serif", marginBottom: 40, textAlign: "center" }}>
          {PHASES[phase]}
        </p>

        {/* Phase indicator */}
        <div style={{ display: "flex", gap: 6 }}>
          {PHASES.map((_, i) => (
            <div
              key={i}
              style={{
                width: i <= phase ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i <= phase ? "var(--accent)" : "var(--border)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Skeleton preview */}
        <div style={{ width: "100%", maxWidth: 700, marginTop: 60 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card" style={{ padding: 24 }}>
                <SkeletonBlock height={12} width="60%" style={{ marginBottom: 12 }} />
                <SkeletonBlock height={36} style={{ marginBottom: 8 }} />
                <SkeletonBlock height={8} />
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ padding: 24 }}>
            <SkeletonBlock height={12} width="40%" style={{ marginBottom: 20 }} />
            <SkeletonBlock height={8} style={{ marginBottom: 10 }} />
            <SkeletonBlock height={8} width="80%" style={{ marginBottom: 10 }} />
            <SkeletonBlock height={8} width="65%" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1.4rem", color: "var(--text-primary)", marginBottom: 12 }}>
            Analysis Failed
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontFamily: "DM Sans, sans-serif", marginBottom: 32, lineHeight: 1.6 }}>
            {error}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => { fetchedRef.current = false; setLoading(true); setError(""); setPhase(0); }}
              className="btn-primary"
              style={{ padding: "12px 24px", fontSize: "0.9rem" }}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/")}
              style={{ padding: "12px 24px", fontSize: "0.9rem", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-secondary)", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const scoreColor = result.overallScore >= 70 ? "#10b981" : result.overallScore >= 45 ? "#f59e0b" : "#f43f5e";
  const scoreLabel = result.overallScore >= 70 ? "Well Received" : result.overallScore >= 45 ? "Mixed Opinions" : "Concerning Issues";

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Header */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,15,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid var(--border)", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          onClick={() => router.push("/")}
          style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)", background: "transparent", border: "none", cursor: "pointer", fontSize: "0.87rem", fontFamily: "DM Sans, sans-serif", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m19 12H5M12 19l-7-7 7-7" /></svg>
          New Search
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>⚡</div>
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>Product Pulse AI</span>
        </div>

        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif" }}>
          {result.dataPoints > 0 ? `${result.dataPoints.toLocaleString()} opinions analyzed` : "AI analysis"}
        </div>
      </nav>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Product title */}
        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {result.sources.map((s) => (
              <span key={s} style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "3px 10px", border: "1px solid var(--border)", borderRadius: 100, fontFamily: "DM Sans, sans-serif" }}>
                {s}
              </span>
            ))}
          </div>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", color: "var(--text-primary)", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {result.product}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 8, fontFamily: "DM Sans, sans-serif" }}>
            Analyzed {new Date(result.analyzedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Top row: Score + Sentiment */}
        <div
          className="animate-fade-up delay-100"
          style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, marginBottom: 16 }}
        >
          {/* Score card */}
          <div className="glass-card" style={{ padding: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <ScoreRing score={result.overallScore} size={110} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: scoreColor }}>
                {scoreLabel}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "DM Sans, sans-serif", marginTop: 2 }}>
                Overall Score
              </div>
            </div>
          </div>

          {/* Sentiment bars */}
          <div className="glass-card" style={{ padding: 28 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              Sentiment Breakdown
            </div>
            <SentimentBar label="Positive" value={result.sentiment.positive} color="#10b981" delay={0} />
            <SentimentBar label="Neutral" value={result.sentiment.neutral} color="#f59e0b" delay={100} />
            <SentimentBar label="Negative" value={result.sentiment.negative} color="#f43f5e" delay={200} />
          </div>
        </div>

        {/* AI Insight — highlighted */}
        <div className="insight-box animate-fade-up delay-200" style={{ padding: 28, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
              💡
            </div>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "0.8rem", color: "#a5b4fc", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              AI Market Insight
            </span>
          </div>
          <p style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "1.15rem", color: "var(--text-primary)", lineHeight: 1.5, letterSpacing: "-0.01em" }}>
            &ldquo;{result.insight}&rdquo;
          </p>
        </div>

        {/* Topics */}
        <div className="glass-card animate-fade-up delay-300" style={{ padding: 28, marginBottom: 16 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
            🔥 Hot Topics People Talk About
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {result.topics.map((topic, i) => (
              <TopicChip key={topic.name} topic={topic} index={i} />
            ))}
          </div>
        </div>

        {/* Positives + Complaints grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Positives */}
          <div className="glass-card animate-fade-up delay-400" style={{ padding: 28 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "#34d399", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              👍 What People Love
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {result.positives.map((item, i) => (
                <li
                  key={i}
                  className="animate-fade-up"
                  style={{ animationDelay: `${0.5 + i * 0.08}s`, opacity: 0, display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                    ✓
                  </span>
                  <span style={{ fontSize: "0.87rem", color: "var(--text-secondary)", lineHeight: 1.5, fontFamily: "DM Sans, sans-serif" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Complaints */}
          <div className="glass-card animate-fade-up delay-400" style={{ padding: 28 }}>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 600, fontSize: "0.82rem", color: "#fb7185", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              ⚠️ Common Complaints
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {result.complaints.map((item, i) => (
                <li
                  key={i}
                  className="animate-fade-up"
                  style={{ animationDelay: `${0.5 + i * 0.08}s`, opacity: 0, display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                    !
                  </span>
                  <span style={{ fontSize: "0.87rem", color: "var(--text-secondary)", lineHeight: 1.5, fontFamily: "DM Sans, sans-serif" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="animate-fade-up delay-600" style={{ textAlign: "center", paddingTop: 20 }}>
          <button
            onClick={() => router.push("/")}
            className="btn-primary"
            style={{ padding: "14px 32px", fontSize: "0.95rem" }}
          >
            Analyze Another Product →
          </button>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 12, fontFamily: "DM Sans, sans-serif" }}>
            Results are based on public internet data and AI analysis.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid var(--border)", borderTop: "2px solid var(--accent)", animation: "spin-slow 1s linear infinite" }} />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
