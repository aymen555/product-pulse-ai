"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const TRENDING = [
  { name: "iPhone 15 Pro", icon: "📱" },
  { name: "Samsung S24", icon: "📲" },
  { name: "AirPods Pro 2", icon: "🎧" },
  { name: "MacBook Pro M3", icon: "💻" },
  { name: "PS5 Slim", icon: "🎮" },
  { name: "Dyson V15", icon: "🌀" },
];

const STATS = [
  { value: "50K+", label: "Products Analyzed" },
  { value: "2M+", label: "Opinions Processed" },
  { value: "< 10s", label: "Average Analysis Time" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAnalyze = (productName?: string) => {
    const product = productName || query.trim();
    if (!product) {
      inputRef.current?.focus();
      return;
    }
    setIsLoading(true);
    router.push(`/results?product=${encodeURIComponent(product)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAnalyze();
  };

  return (
    <div
      style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}
    >
      {/* Background orbs */}
      <div className="orb orb-1 animate-float" />
      <div
        className="orb orb-2 animate-float"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="orb orb-3 animate-float"
        style={{ animationDelay: "4s" }}
      />

      {/* Grid background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Nav */}
      <nav
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 40px",
          borderBottom: "1px solid rgba(30,30,46,0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            ⚡
          </div>
          <span
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "1.05rem",
              color: "var(--text-primary)",
            }}
          >
            Product Pulse
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              padding: "4px 10px",
              border: "1px solid var(--border)",
              borderRadius: 100,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            Beta
          </span>
        </div>
      </nav>

      {/* Main hero */}
      <main
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "100px 24px 80px",
          maxWidth: 780,
          margin: "0 auto",
        }}
      >
        {/* Badge */}
        {mounted && (
          <div
            className="animate-fade-up"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 100,
              border: "1px solid rgba(99,102,241,0.3)",
              background: "rgba(99,102,241,0.07)",
              marginBottom: 32,
              fontSize: "0.82rem",
              color: "#a5b4fc",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
                boxShadow: "0 0 6px #10b981",
              }}
            />
            AI-powered opinion intelligence — live
          </div>
        )}

        {/* Title */}
        {mounted && (
          <h1
            className="animate-fade-up delay-100"
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              fontWeight: 800,
              textAlign: "center",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              marginBottom: 20,
              color: "var(--text-primary)",
            }}
          >
            What do people{" "}
            <span className="gradient-text">really think</span>
            <br />
            about any product?
          </h1>
        )}

        {/* Subtitle */}
        {mounted && (
          <p
            className="animate-fade-up delay-200"
            style={{
              fontSize: "1.05rem",
              color: "var(--text-secondary)",
              textAlign: "center",
              lineHeight: 1.65,
              marginBottom: 48,
              maxWidth: 520,
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            We scan thousands of YouTube comments and Reddit discussions to give
            you honest, unfiltered consumer sentiment in seconds.
          </p>
        )}

        {/* Search box */}
        {mounted && (
          <div
            className="animate-fade-up delay-300"
            style={{ width: "100%", maxWidth: 620 }}
          >
            <div
              style={{
                position: "relative",
                borderRadius: 16,
                padding: 1,
                background: isFocused
                  ? "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(6,182,212,0.3))"
                  : "transparent",
                transition: "background 0.3s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "var(--bg-card)",
                  borderRadius: 15,
                  padding: "6px 6px 6px 20px",
                  border: isFocused
                    ? "none"
                    : "1px solid var(--border-bright)",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Search icon */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isFocused ? "#6366f1" : "var(--text-muted)"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, transition: "stroke 0.2s" }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Try 'iPhone 15 Pro' or 'Sony WH-1000XM5'..."
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--text-primary)",
                    fontSize: "1rem",
                    fontFamily: "DM Sans, sans-serif",
                    padding: "12px 0",
                    caretColor: "#6366f1",
                  }}
                />

                <button
                  onClick={() => handleAnalyze()}
                  disabled={isLoading || !query.trim()}
                  className="btn-primary"
                  style={{
                    padding: "12px 28px",
                    fontSize: "0.9rem",
                    opacity: isLoading || !query.trim() ? 0.5 : 1,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {isLoading ? (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          animation: "spin-slow 1s linear infinite",
                        }}
                      >
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Analyzing
                    </>
                  ) : (
                    <>
                      Analyze
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Trending suggestions */}
            <div style={{ marginTop: 20 }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginBottom: 10,
                  fontFamily: "DM Sans, sans-serif",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                Trending searches
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                {TRENDING.map((item, i) => (
                  <button
                    key={item.name}
                    onClick={() => handleAnalyze(item.name)}
                    className="trending-tag animate-fade-up"
                    style={{ animationDelay: `${0.4 + i * 0.05}s`, opacity: 0 }}
                  >
                    {item.icon} {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        {mounted && (
          <div
            className="animate-fade-up delay-700"
            style={{
              display: "flex",
              gap: 0,
              marginTop: 80,
              width: "100%",
              maxWidth: 560,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  padding: "20px 16px",
                  textAlign: "center",
                  borderRight:
                    i < STATS.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 700,
                    fontSize: "1.4rem",
                    color: "var(--text-primary)",
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    fontFamily: "DM Sans, sans-serif",
                    letterSpacing: "0.02em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* How it works */}
        {mounted && (
          <div
            className="animate-fade-up delay-800"
            style={{ marginTop: 80, width: "100%", textAlign: "center" }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 32,
                fontFamily: "DM Sans, sans-serif",
              }}
            >
              How it works
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 16,
              }}
            >
              {[
                {
                  step: "01",
                  icon: "🔍",
                  title: "You type a product",
                  desc: "Any product, any brand",
                },
                {
                  step: "02",
                  icon: "📡",
                  title: "We scan the web",
                  desc: "YouTube, Reddit & more",
                },
                {
                  step: "03",
                  icon: "🧠",
                  title: "AI analyzes patterns",
                  desc: "Thousands of opinions",
                },
                {
                  step: "04",
                  icon: "⚡",
                  title: "You get clarity",
                  desc: "In under 10 seconds",
                },
              ].map((item) => (
                <div key={item.step} className="glass-card" style={{ padding: 20 }}>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      marginBottom: 8,
                    }}
                  >
                    {item.step}
                  </div>
                  <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                    {item.icon}
                  </div>
                  <div
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 600,
                      fontSize: "0.87rem",
                      color: "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          position: "relative",
          zIndex: 5,
          textAlign: "center",
          padding: "32px 24px",
          color: "var(--text-muted)",
          fontSize: "0.78rem",
          borderTop: "1px solid var(--border)",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        Product Pulse AI — Real opinions, zero noise
      </footer>
    </div>
  );
}
