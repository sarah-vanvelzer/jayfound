import Link from "next/link";
import { supabase } from "@/lib/supabase";

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

type DbProfile = {
  id: string;
  name: string;
  projects: { id: string; title: string; summary: string }[];
  puzzle_attempts: { score: number }[];
};

const sectionLinkStyle = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#4A4838",
  textDecoration: "none",
  flexShrink: 0,
};

// Matches the "New Candidates" header on the recruiter dashboard exactly.
const sectionHeaderStyle = {
  fontSize: "1.125rem",
  fontWeight: 600,
  color: "#17160F",
  margin: 0,
};

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "rgba(253,252,247,0.9)",
        border: "1px solid #E9E4D3",
        borderRadius: "14px",
        padding: "1.1rem 1.25rem",
      }}
    >
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-masthead), serif",
          fontWeight: 600,
          fontSize: "2rem",
          color: "#17160F",
          lineHeight: 1,
          marginBottom: "0.3rem",
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: "0.8125rem", color: "#8A8770" }}>{label}</span>
    </div>
  );
}

export default async function JMattDashboardPage() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, projects(id, title, summary), puzzle_attempts(score)")
    .eq("name", "JMatt")
    .single();

  if (error || !data) {
    return (
      <div style={{ padding: "4rem", fontFamily: "var(--font-haskoy), sans-serif" }}>
        <p>Could not load profile. {error?.message}</p>
      </div>
    );
  }

  const profile = data as DbProfile;
  const puzzleCount = profile.puzzle_attempts.length;
  const avgScore =
    puzzleCount > 0
      ? Math.round(
          profile.puzzle_attempts.reduce((sum, a) => sum + a.score, 0) / puzzleCount
        )
      : null;

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
          maxWidth: "720px",
          margin: "0 auto",
          padding: "4.5rem 1.5rem 6rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-masthead), serif",
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            fontSize: "clamp(2.3rem, 6.2vw, 3.6rem)",
            lineHeight: 1.05,
            whiteSpace: "nowrap",
            margin: "0 0 1.1rem",
          }}
        >
          Welcome back, {profile.name}
        </h1>

        <p
          style={{
            fontSize: "0.9375rem",
            color: "#4A4838",
            lineHeight: 1.55,
            margin: "0 0 2.5rem",
          }}
        >
          What would you like to do?
        </p>

        {/* Recent Projects */}
        {profile.projects.length > 0 && (
          <div style={{ marginBottom: "1.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "0.85rem",
              }}
            >
              <h2 style={sectionHeaderStyle}>Recent Projects</h2>
              <Link href="/jmatt/new" style={sectionLinkStyle}>
                Upload Project →
              </Link>
            </div>

            <div style={{ display: "grid", gap: "0.85rem" }}>
              {profile.projects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    backgroundColor: "rgba(253,252,247,0.9)",
                    border: "1px solid #E9E4D3",
                    borderRadius: "16px",
                    padding: "1.25rem",
                  }}
                >
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.35rem", letterSpacing: "-0.01em" }}>
                    {project.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "#4A4838", lineHeight: 1.5, margin: "0 0 0.75rem" }}>
                    {project.summary}
                  </p>
                  <Link
                    href={`/project/${project.id}?from=/jmatt`}
                    style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#17160F", textDecoration: "none" }}
                  >
                    See more →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Profile */}
        <Link
          href="/jmatt/profile"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            backgroundColor: "#17160F",
            border: "1px solid #17160F",
            borderRadius: "16px",
            padding: "1.5rem 1.75rem",
            textDecoration: "none",
            marginBottom: "1.75rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-masthead), serif",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                fontSize: "1.625rem",
                color: "#F7F4EC",
                margin: "0 0 0.35rem",
              }}
            >
              View Profile
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#C9C5B3", lineHeight: 1.5, margin: 0 }}>
              View and edit your bio, skills, and contact info.
            </p>
          </div>
          <span style={{ fontSize: "1.25rem", color: "#F7F4EC", flexShrink: 0 }}>→</span>
        </Link>

        {/* Puzzle Arcade */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.85rem",
            }}
          >
            <h2 style={sectionHeaderStyle}>Puzzle Arcade</h2>
            <Link href="/arcade" style={sectionLinkStyle}>
              Go to Arcade →
            </Link>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <StatBox value={String(puzzleCount)} label="Puzzles Completed" />
            <StatBox value={avgScore !== null ? String(avgScore) : "—"} label="Average Score" />
          </div>
        </div>
      </div>
    </main>
  );
}