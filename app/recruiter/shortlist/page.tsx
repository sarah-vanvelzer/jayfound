import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { rankScore, portfolioScore, puzzleScore, mentorScore, WEIGHTS, Profile as RankProfile } from "@/lib/ranking";

type Status = "New" | "Contacted" | "Shortlisted" | "Follow-up Needed";

type DbProfile = {
  id: string;
  name: string;
  bio: string;
  location: string;
  skill_tags: string[];
  profile_picture_url: string | null;
  status: Status | null;
  projects: { id: string; project_stages: { stage_type: "start" | "rough" | "final" | "lessons" }[] }[];
  puzzle_attempts: { score: number }[];
  mentor_endorsements: { mentor_name: string }[];
};

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const STATUS_STYLES: Record<Status, { bg: string; color: string }> = {
  New: { bg: "#EFE9FB", color: "#7C63C9" },
  Contacted: { bg: "#DFF1F8", color: "#4C9BB8" },
  Shortlisted: { bg: "#E4F4E0", color: "#5C9A54" },
  "Follow-up Needed": { bg: "#FBEEDD", color: "#B9843C" },
};

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

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
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

function CompositionBar({
  portfolioContribution,
  puzzleContribution,
  mentorContribution,
}: {
  portfolioContribution: number;
  puzzleContribution: number;
  mentorContribution: number;
}) {
  const total = portfolioContribution + puzzleContribution + mentorContribution || 1;
  return (
    <div style={{ display: "flex", height: 6, borderRadius: 999, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${(portfolioContribution / total) * 100}%`, backgroundColor: "#3FC8DA" }} />
      <div style={{ width: `${(puzzleContribution / total) * 100}%`, backgroundColor: "#91DE49" }} />
      <div style={{ width: `${(mentorContribution / total) * 100}%`, backgroundColor: "#F6E015" }} />
    </div>
  );
}

function Legend() {
  const items = [
    { color: "#3FC8DA", label: "Portfolio" },
    { color: "#91DE49", label: "Puzzle" },
    { color: "#F6E015", label: "Mentor" },
  ];
  return (
    <div style={{ display: "flex", gap: "1.1rem", marginBottom: "1.5rem" }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.color, display: "inline-block" }} />
          <span style={{ fontSize: "0.8125rem", color: "#8A8770" }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function toRankProfile(db: DbProfile): RankProfile {
  return {
    projects: db.projects.map((p) => ({ stages: p.project_stages })),
    puzzle_attempts: db.puzzle_attempts,
    mentor_endorsements: db.mentor_endorsements,
  };
}

export default async function ShortlistPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const backHref = from || "/recruiter";
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, name, bio, location, skill_tags, profile_picture_url, status, projects(id, project_stages(stage_type)), puzzle_attempts(score), mentor_endorsements(mentor_name)"
    )
    .eq("shortlisted", true);

  if (error) {
    return (
      <div style={{ padding: "4rem", fontFamily: "var(--font-haskoy), sans-serif" }}>
        <p>Could not load shortlist. {error.message}</p>
      </div>
    );
  }

  const candidates = (data as DbProfile[])
    .map((db) => {
      const rp = toRankProfile(db);
      return {
        db,
        portfolioContribution: portfolioScore(rp) * WEIGHTS.portfolio,
        puzzleContribution: puzzleScore(rp) * WEIGHTS.puzzle,
        mentorContribution: mentorScore(rp) * WEIGHTS.mentor,
        rank: rankScore(rp),
      };
    })
    .sort((a, b) => b.rank - a.rank);

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

      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", padding: "3.5rem 1.5rem 8rem" }}>
        <Link
          href={backHref}
          style={{ fontSize: "0.875rem", color: "#4A4838", textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}
        >
          ← Back
        </Link>

        <h1
          style={{
            fontFamily: "var(--font-masthead), serif",
            fontWeight: 400,
            textTransform: "uppercase",
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.01em",
            margin: "0 0 0.75rem",
          }}
        >
          Shortlist
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#4A4838", marginBottom: "1.5rem" }}>
          {candidates.length === 0
            ? "No candidates shortlisted yet."
            : candidates.length + " candidate" + (candidates.length === 1 ? "" : "s") + " shortlisted."}
        </p>

        {candidates.length > 0 && <Legend />}

        {candidates.length === 0 && (
          <div
            style={{
              backgroundColor: "rgba(253,252,247,0.6)",
              border: "1px dashed #DCD6C0",
              borderRadius: "16px",
              padding: "2.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.9375rem", color: "#8A8770", margin: 0 }}>
              Shortlist candidates from their profile page to see them here.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {candidates.map(({ db, portfolioContribution, puzzleContribution, mentorContribution }) => (
            <Link
              key={db.id}
              href={"/recruiter/candidate/" + db.id + "?from=/recruiter/shortlist"}
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
              <Avatar name={db.name} photoUrl={db.profile_picture_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "1rem", fontWeight: 600 }}>{db.name}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.4rem",
                    marginBottom: "0.6rem",
                    flexWrap: "nowrap",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                  }}
                >
                  {db.skill_tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.75rem",
                        color: "#6B6852",
                        backgroundColor: "#EFEAD9",
                        borderRadius: 999,
                        padding: "0.2rem 0.6rem",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <CompositionBar
                  portfolioContribution={portfolioContribution}
                  puzzleContribution={puzzleContribution}
                  mentorContribution={mentorContribution}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}