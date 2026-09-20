import Link from "next/link";
import ContactButton from "@/components/ContactButton";

import { supabase } from "@/lib/supabase";

import {
  portfolioScore,
  puzzleScore,
  mentorScore,
  WEIGHTS,
  Profile as RankProfile,
} from "@/lib/ranking";

import ShortlistButton from "@/components/ShortlistButton";

type DbProfile = {
  id: string;
  name: string;
  bio: string;
  location: string;
  skill_tags: string[];
  profile_picture_url: string | null;
  contact_info: string | null;
  shortlisted: boolean;
  projects: {
    id: string;
    title: string;
    summary: string;
    project_stages: {
      stage_type: "start" | "rough" | "final" | "lessons";
    }[];
  }[];
  puzzle_attempts: { score: number }[];
  mentor_endorsements: {
    mentor_name: string;
    org: string | null;
    note: string | null;
  }[];
};

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

function Avatar({
  name,
  photoUrl,
}: {
  name: string;
  photoUrl: string | null;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={{
          width: 96,
          height: 96,
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
        width: 96,
        height: 96,
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

function toRankProfile(db: DbProfile): RankProfile {
  return {
    projects: db.projects.map((p) => ({
      stages: p.project_stages,
    })),
    puzzle_attempts: db.puzzle_attempts,
    mentor_endorsements: db.mentor_endorsements,
  };
}

export default async function CandidatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;

  const backHref = from ?? "/recruiter";

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, name, bio, location, skill_tags, profile_picture_url, contact_info, shortlisted, projects(id, title, summary, project_stages(stage_type)), puzzle_attempts(score), mentor_endorsements(mentor_name, org, note)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div
        style={{
          padding: "4rem",
          fontFamily: "var(--font-haskoy), sans-serif",
        }}
      >
        <p>Could not load candidate. {error?.message}</p>
      </div>
    );
  }

  const db = data as DbProfile;
  const rp = toRankProfile(db);

  const portfolioContribution = portfolioScore(rp) * WEIGHTS.portfolio;
  const puzzleContribution = puzzleScore(rp) * WEIGHTS.puzzle;
  const mentorContribution = mentorScore(rp) * WEIGHTS.mentor;

  const total =
    portfolioContribution +
    puzzleContribution +
    mentorContribution || 1;

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
          padding: "3.5rem 1.5rem 6rem",
        }}
      >
        <Link
          href={backHref}
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

        <section style={{ marginBottom: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "1rem",
              marginBottom: "1.75rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <Avatar
                name={db.name}
                photoUrl={db.profile_picture_url}
              />

              <div>
                <h1
                  style={{
                    fontFamily: "var(--font-masthead), serif",
                    fontWeight: 400,
                    textTransform: "uppercase",
                    fontSize: "clamp(2rem, 4.4vw, 2.8rem)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.01em",
                    margin: 0,
                  }}
                >
                  {db.name}
                </h1>

                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#8A8770",
                    margin: "0.2rem 0 0",
                  }}
                >
                  {db.location}
                </p>
              </div>
            </div>

            {db.contact_info && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  flexShrink: 0,
                }}
              >
                <ShortlistButton
                  profileId={db.id}
                  initialShortlisted={db.shortlisted}
                />

                <ContactButton contactInfo={db.contact_info} />
              </div>
            )}
          </div>

          <p
            style={{
              fontSize: "0.9375rem",
              color: "#4A4838",
              lineHeight: 1.55,
              marginBottom: "0.85rem",
            }}
          >
            {db.bio}
          </p>

          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              flexWrap: "nowrap",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {db.skill_tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#4A4838",
                  backgroundColor: "rgba(253,252,247,0.7)",
                  border: "1px solid #E2DDC9",
                  borderRadius: 999,
                  padding: "0.4rem 0.85rem",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section
          style={{
            backgroundColor: "rgba(253,252,247,0.9)",
            border: "1px solid #E9E4D3",
            borderRadius: "16px",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.75rem",
          }}
        >
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#17160F",
              display: "block",
              marginBottom: "0.7rem",
            }}
          >
            Ranking Breakdown
          </span>

          <div
            style={{
              display: "flex",
              height: "8px",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "0.7rem",
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

          <div style={{ display: "flex", gap: "1.1rem" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8125rem",
                color: "#8A8770",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#3FC8DA",
                  display: "inline-block",
                }}
              />
              Portfolio
            </span>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8125rem",
                color: "#8A8770",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#91DE49",
                  display: "inline-block",
                }}
              />
              Puzzle
            </span>

            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.8125rem",
                color: "#8A8770",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#F6E015",
                  display: "inline-block",
                }}
              />
              Mentor
            </span>
          </div>
        </section>

        <section style={{ marginBottom: "1.75rem" }}>
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#6B6852",
              margin: "0 0 0.85rem",
            }}
          >
            Projects
          </h2>

          <div style={{ display: "grid", gap: "0.85rem" }}>
            {db.projects.map((project) => (
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
                  href={"/project/" + project.id + "?from=/recruiter/candidate/" + db.id}
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "#17160F",
                    textDecoration: "none",
                  }}
                >
                  See more →
                </Link>
              </div>
            ))}
          </div>
        </section>

        {db.mentor_endorsements.length > 0 && (
          <section>
            <h2
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#6B6852",
                margin: "0 0 0.85rem",
              }}
            >
              Mentor Endorsements
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              {db.mentor_endorsements.map((endorsement, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "0.8125rem",
                    color: "#6B6852",
                    backgroundColor: "rgba(253,252,247,0.9)",
                    border: "1px solid #E9E4D3",
                    borderRadius: "12px",
                    padding: "0.75rem 0.9rem",
                  }}
                >
                  <strong style={{ color: "#4A4838" }}>
                    {endorsement.mentor_name}
                  </strong>

                  {endorsement.org
                    ? ", " + endorsement.org
                    : ""}

                  {endorsement.note
                    ? ": " + endorsement.note
                    : ""}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}