// app/recruiter/page.tsx

import Link from "next/link";
import { supabase } from "../../lib/supabase";
import {
  portfolioScore,
  puzzleScore,
  mentorScore,
  rankScore,
  WEIGHTS,
  type Profile,
} from "../../lib/ranking";

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

type Status = "New" | "Contacted" | "Shortlisted" | "Follow-up Needed";

type DbProfile = Profile & {
  id: string;
  created_at: string;
  name: string;
  skill_tags: string[] | null;
  status: Status | null;
  shortlisted: boolean | null;
  profile_picture_url: string | null;
};

const STATUS_STYLES: Record<Status, { bg: string; color: string }> = {
  New: { bg: "#EFE9FB", color: "#7C63C9" },
  Contacted: { bg: "#DFF1F8", color: "#4C9BB8" },
  Shortlisted: { bg: "#E4F4E0", color: "#5C9A54" },
  "Follow-up Needed": { bg: "#FBEEDD", color: "#B9843C" },
};

function CompositionBar({
  portfolioContribution,
  puzzleContribution,
  mentorContribution,
}: {
  portfolioContribution: number;
  puzzleContribution: number;
  mentorContribution: number;
}) {
  const total =
    portfolioContribution + puzzleContribution + mentorContribution || 1;
  return (
    <div
      style={{
        display: "flex",
        height: 6,
        borderRadius: 999,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          width: `${(portfolioContribution / total) * 100}%`,
          backgroundColor: "#3FC8DA",
        }}
      />
      <div
        style={{
          width: `${(puzzleContribution / total) * 100}%`,
          backgroundColor: "#91DE49",
        }}
      />
      <div
        style={{
          width: `${(mentorContribution / total) * 100}%`,
          backgroundColor: "#F6E015",
        }}
      />
    </div>
  );
}

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        backgroundColor: "#F1EFE6",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid #E9E4D3",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "36%",
          height: "36%",
          borderRadius: "50%",
          backgroundColor: "#9C9987",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "72%",
          height: "42%",
          borderRadius: "50% 50% 0 0",
          backgroundColor: "#9C9987",
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "0.3rem 0.7rem",
        borderRadius: 999,
        backgroundColor: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function Legend() {
  const items = [
    { color: "#3FC8DA", label: "Portfolio" },
    { color: "#91DE49", label: "Puzzle" },
    { color: "#F6E015", label: "Mentor" },
  ];
  return (
    <div style={{ display: "flex", gap: "1.1rem" }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: item.color,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "0.8125rem", color: "#8A8770" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default async function RecruiterDashboardPage() {
  const { data, error } = await supabase.from("profiles").select(`
      id,
      created_at,
      name,
      skill_tags,
      status,
      shortlisted,
      profile_picture_url,
      projects (
        id,
        stages:project_stages ( stage_type )
      ),
      puzzle_attempts ( score ),
      mentor_endorsements ( mentor_name )
    `);

  if (error) {
    return (
      <main style={{ padding: "3.5rem 1.5rem", fontFamily: "var(--font-haskoy), sans-serif" }}>
        <p>Couldn&apos;t load candidates: {error.message}</p>
      </main>
    );
  }

  const profiles = (data ?? []) as unknown as DbProfile[];

  const candidates = profiles.map((p) => {
    const portfolio = portfolioScore(p);
    const puzzle = puzzleScore(p);
    const mentor = mentorScore(p);
    const total = rankScore(p);

    return {
      id: p.id,
      createdAt: p.created_at,
      name: p.name,
      skillTags: p.skill_tags ?? [],
      photoUrl: p.profile_picture_url,
      status: (p.status ?? "New") as Status,
      shortlisted: p.shortlisted ?? false,
      totalScore: total,
      portfolioContribution: portfolio * WEIGHTS.portfolio,
      puzzleContribution: puzzle * WEIGHTS.puzzle,
      mentorContribution: mentor * WEIGHTS.mentor,
    };
  });

  const newCount = candidates.filter((c) => c.status === "New").length;
  const contactedCount = candidates.filter((c) => c.status === "Contacted").length;
  const shortlistedCount = candidates.filter((c) => c.shortlisted).length;
  const topThree = [...candidates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

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
          maxWidth: "900px",
          margin: "0 auto",
          padding: "3.5rem 1.5rem 6rem",
        }}
      >
        {/* header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontFamily: "var(--font-masthead), serif",
              fontWeight: 400,
              textTransform: "uppercase",
              fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.01em",
              margin: "0 0 1.25rem",
              whiteSpace: "nowrap",
            }}
          >
            Your Next Talent Find Awaits
          </h1>
          <Link
            href="/how-ranking-works"
            style={{ fontSize: "0.875rem", fontWeight: 600, color: "#4A4838", textDecoration: "none" }}
          >
            About the ranking system →
          </Link>
        </div>

        {/* stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          <StatCard label="Total candidates" value={candidates.length.toString()} />
          <StatCard label="Shortlisted" value={shortlistedCount.toString()} link="/recruiter/shortlist" />
          <StatCard label="Contacted" value={contactedCount.toString()} />
        </div>

        {/* candidates, ranked by total score */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: "0 0 0.75rem" }}>New Candidates</h2>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <Legend />
            <Link
              href="/recruiter/candidates"
              style={{ fontSize: "0.875rem", fontWeight: 600, color: "#4A4838", textDecoration: "none" }}
            >
              View all →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {topThree.map((c) => (
              <Link
                key={c.id}
                href={`/recruiter/candidate/${c.id}?from=/recruiter`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.25rem",
                  backgroundColor: "rgba(253,252,247,0.9)",
                  border: "1px solid #E9E4D3",
                  borderRadius: "16px",
                  padding: "1.1rem 1.4rem",
                  textDecoration: "none",
                  color: "#17160F",
                }}
              >
                <Avatar name={c.name} photoUrl={c.photoUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 600 }}>{c.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                    {c.skillTags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "0.75rem",
                          color: "#6B6852",
                          backgroundColor: "#EFEAD9",
                          borderRadius: 999,
                          padding: "0.2rem 0.6rem",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <CompositionBar
                    portfolioContribution={c.portfolioContribution}
                    puzzleContribution={c.puzzleContribution}
                    mentorContribution={c.mentorContribution}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div
      style={{
        backgroundColor: "rgba(253,252,247,0.9)",
        border: "1px solid #E9E4D3",
        borderRadius: "16px",
        padding: "1.1rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 88,
      }}
    >
      <p
        style={{
          fontSize: "2rem",
          fontWeight: 600,
          margin: "0 0 0.75rem",
          fontFamily: "var(--font-masthead), serif",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: "0.8125rem", color: "#8A8770", margin: 0 }}>{label}</p>
        {link && (
          <Link href={link} style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4A4838", textDecoration: "none" }}>
            View all →
          </Link>
        )}
      </div>
    </div>
  );
}