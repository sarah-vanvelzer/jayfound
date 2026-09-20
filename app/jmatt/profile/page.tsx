import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProfileEditor from "@/components/ProfileEditor";

type DbProfile = {
  id: string;
  name: string;
  bio: string;
  location: string;
  skill_tags: string[];
  profile_picture_url: string | null;
  contact_info: string | null;
  projects: { id: string; title: string; summary: string }[];
  puzzle_attempts: { score: number }[];
  mentor_endorsements: {
    mentor_name: string;
    org: string | null;
    note: string | null;
  }[];
};

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

export default async function JMattPage() {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, name, bio, location, skill_tags, profile_picture_url, contact_info, projects(id, title, summary), puzzle_attempts(score), mentor_endorsements(mentor_name, org, note)"
    )
    .eq("name", "JMatt")
    .single();

  if (error || !data) {
    return (
      <div style={{ padding: "4rem", fontFamily: "var(--font-haskoy), sans-serif" }}>
        <p>Could not load profile. {error?.message}</p>
      </div>
    );
  }

  const db = data as DbProfile;

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

        <ProfileEditor
          id={db.id}
          name={db.name}
          bio={db.bio}
          location={db.location}
          skillTags={db.skill_tags}
          contactInfo={db.contact_info}
          profilePictureUrl={db.profile_picture_url}
          puzzleAttemptCount={db.puzzle_attempts.length}
          projects={db.projects}
        />

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

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
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
                  <strong style={{ color: "#4A4838" }}>{endorsement.mentor_name}</strong>
                  {endorsement.org ? ", " + endorsement.org : ""}
                  {endorsement.note ? " — " + endorsement.note : ""}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}