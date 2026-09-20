import Link from "next/link";
import { supabase } from "@/lib/supabase";

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export default async function ArcadeHubPage() {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("name", "JMatt")
    .single();

  const { count: attemptCount } = profile
    ? await supabase
      .from("puzzle_attempts")
      .select("*", { count: "exact", head: true })
      .eq("profile_id", profile.id)
    : { count: 0 };

  const { count: puzzleTotal } = await supabase
    .from("puzzles")
    .select("*", { count: "exact", head: true });

  const hasAttempted = (attemptCount ?? 0) > 0;

  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundColor: "#F7F4EC",
        color: "#17160F",
        fontFamily: "var(--font-haskoy), sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${NOISE_URI})`,
          backgroundRepeat: "repeat",
          opacity: 0.05,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "560px",
          margin: "0 auto",
          padding: "3.5rem 1.5rem 6rem",
        }}
      >
        <Link
          href="/jmatt"
          style={{
            fontSize: "0.875rem",
            color: "#4A4838",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: "1.5rem",
          }}
        >
          ← Back
        </Link>

        <h1
          style={{
            fontFamily: "var(--font-masthead), serif",
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            fontSize: "clamp(2.1rem, 5vw, 2.9rem)",
            lineHeight: 1.08,
            margin: "0 0 0.6rem",
          }}
        >
          Puzzle Arcade
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#4A4838", lineHeight: 1.55, marginBottom: "2rem", maxWidth: "460px" }}>
          Optional, culture-fair reasoning puzzles. This is a discovery boost, not a gate,
          skipping it doesn't hide your portfolio, it just means you lean fully on your
          staged projects.
        </p>

        <div
          style={{
            backgroundColor: "rgba(253,252,247,0.9)",
            border: "1px solid #E9E4D3",
            borderRadius: "16px",
            padding: "1.75rem",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-masthead), serif",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              fontSize: "1.375rem",
              color: "#17160F",
              margin: "0 0 0.4rem",
            }}
          >
            Logical Reasoning
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "#4A4838", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
            Figure out which shape completes the grid's logic. {puzzleTotal ?? 0} puzzles available.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: "#8A8770",
              backgroundColor: "rgba(253,252,247,0.6)",
              border: "1px solid #E9E4D3",
              borderRadius: "999px",
              padding: "0.4rem 0.85rem",
              marginBottom: "1.5rem",
            }}
          >
            <span>Status:</span>
            <span style={{ fontWeight: 600, color: "#4A4838" }}>
              {hasAttempted ? attemptCount + " attempted" : "Not started"}
            </span>
          </div>

          <div>
            <Link
              href="/arcade/play"
              style={{
                display: "inline-block",
                backgroundColor: "#17160F",
                color: "#F7F4EC",
                textDecoration: "none",
                borderRadius: "999px",
                padding: "0.8rem 1.5rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
              }}
            >
              {hasAttempted ? "Keep going" : "Start"}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}