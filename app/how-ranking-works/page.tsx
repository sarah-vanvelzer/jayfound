"use client";
import Link from "next/link";

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function WeightBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: "10px", borderRadius: "999px", backgroundColor: "#E9E4D3", overflow: "hidden" }}>
      <div style={{ width: pct + "%", height: "100%", backgroundColor: color, borderRadius: "999px" }} />
    </div>
  );
}

export default function HowRankingWorksPage() {
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
          maxWidth: "760px",
          margin: "0 auto",
          padding: "3.5rem 1.5rem 8rem",
        }}
      >
        <BackButton />

        <h1
          style={{
            fontFamily: "var(--font-masthead), serif",
            fontWeight: 400,
            textTransform: "uppercase",
            fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            margin: "0 0 0.75rem",
          }}
        >
          How ranking works
        </h1>
        <p style={{ fontSize: "1.0625rem", color: "#4A4838", lineHeight: 1.6, margin: "0 0 3rem" }}>
          No black box, no magical AI agent deciding who&apos;s talented. Every candidate
          gets a weighted score built from three inputs, always in the same order
          of importance.
        </p>

        {/* The three inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div
            style={{
              backgroundColor: "rgba(253,252,247,0.9)",
              border: "1px solid #E9E4D3",
              borderRadius: "18px",
              padding: "1.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, margin: 0 }}>1. Portfolio depth</h2>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#8A8770" }}>Highest weight</span>
            </div>
            <WeightBar pct={100} color="#3FC8DA" />
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "#4A4838", margin: "0.85rem 0 0" }}>
              Rewards documented process and iteration, not merely upload count.
              Projections are assessed on depth according to start, rough version,
              final, lessons learned segments. A single project broken
              into real stages outweighs ten unlabeled files. Staging
              can be done retroactively.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "rgba(253,252,247,0.9)",
              border: "1px solid #E9E4D3",
              borderRadius: "18px",
              padding: "1.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, margin: 0 }}>2. Puzzle performance</h2>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#8A8770" }}>Second weight</span>
            </div>
            <WeightBar pct={55} color="#91DE49" />
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "#4A4838", margin: "0.85rem 0 0" }}>
              Culture-fair, nonverbal reasoning puzzles: pattern completion,
              odd-one-out, sequence, and grid logic. Deterministically graded, no AI
              judgment call involved. This is a discovery mechanic, most valuable
              for students with thinner portfolios (newer, younger, or earlier
              in their journey). Skipping the arcade doesn&apos;t hide a student;
              it just means they lean fully on their portfolio.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "rgba(253,252,247,0.9)",
              border: "1px solid #E9E4D3",
              borderRadius: "18px",
              padding: "1.75rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
              <h2 style={{ fontSize: "1.0625rem", fontWeight: 600, margin: 0 }}>3. Mentor endorsements</h2>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#8A8770" }}>Lowest weight</span>
            </div>
            <WeightBar pct={20} color="#F6E015" />
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.6, color: "#4A4838", margin: "0.85rem 0 0" }}>
              Tied to real names and organizations; a supplementary trust signal.
              Deliberately the smallest input, since mentorship access itself tracks
              the same networks and proximity this platform is trying to route around.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        fontSize: "0.875rem",
        color: "#4A4838",
        textDecoration: "none",
        display: "inline-block",
        marginBottom: "1.5rem",
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      ← Back
    </button>
  );
}