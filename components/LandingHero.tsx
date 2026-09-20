// app/components/LandingHero.tsx

import Link from "next/link";

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export default function LandingHero() {
  return (
    <section
      style={{
        position: "relative",
        background: "#F7F4EC",
        minHeight: "100vh",
        overflow: "hidden",
        fontFamily: "var(--font-haskoy), sans-serif",
        color: "#17160F",
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

      {/* content column */}
      <div style={{ position: "relative", zIndex: 1, marginLeft: 88, paddingRight: 48 }}>
        {/* top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingTop: 40,
            paddingBottom: 64,
            gap: 24,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/jmatt"
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "0.55rem 1.4rem",
                borderRadius: "999px",
                border: "1px solid #DCD6C0",
                backgroundColor: "rgba(253,252,247,0.7)",
                color: "#17160F",
                textDecoration: "none",
              }}
            >
              Candidate
            </Link>
            <Link
              href="/recruiter"
              style={{
                fontSize: 14,
                fontWeight: 600,
                padding: "0.55rem 1.4rem",
                borderRadius: "999px",
                backgroundColor: "#17160F",
                color: "#F7F4EC",
                textDecoration: "none",
              }}
            >
              Recruiter
            </Link>
          </div>
        </div>

        {/* headline */}
        <div style={{ marginTop: 160 }}>
          <h1
            style={{
              fontFamily: "var(--font-masthead), serif",
              fontWeight: 400,
              textTransform: "uppercase",
              fontSize: "clamp(4.4rem, 9.5vw, 8.5rem)",
              lineHeight: 1,
              letterSpacing: "-0.01em",
              margin: "0 0 1.75rem",
            }}
          >
            Jayfound
          </h1>
          <p
            style={{
              maxWidth: 600,
              fontSize: 20,
              lineHeight: 1.55,
              color: "#4A4838",
              margin: "0 0 1.25rem",
            }}
          >
            A talent discovery platform for overlooked, self-taught builders
          </p>

          <Link
            href="/how-ranking-works"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 16,
              fontWeight: 600,
              color: "#4A4838",
              textDecoration: "none",
            }}
          >
            About the ranking system →
          </Link>
        </div>
      </div>
    </section>
  );
}