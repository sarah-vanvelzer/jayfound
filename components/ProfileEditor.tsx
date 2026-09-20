"use client";
import Link from "next/link";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { splitContact } from "@/lib/contact";

type Project = {
  id: string;
  title: string;
  summary: string;
};

type Props = {
  id: string;
  name: string;
  bio: string;
  location: string;
  skillTags: string[];
  contactInfo: string | null;
  profilePictureUrl: string | null;
  puzzleAttemptCount: number;
  projects: Project[];
};

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
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
          position: "absolute", top: "22%", left: "50%", transform: "translateX(-50%)",
          width: "36%", height: "36%", borderRadius: "50%", backgroundColor: "#9C9987",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: "-8%", left: "50%", transform: "translateX(-50%)",
          width: "72%", height: "42%", borderRadius: "50% 50% 0 0", backgroundColor: "#9C9987",
        }}
      />
    </div>
  );
}

const captionStyle = {
  display: "block" as const,
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "#6B6852",
  margin: "0 0 0.35rem",
};

const inputStyle = {
  fontSize: "0.875rem",
  color: "#4A4838",
  border: "1px solid #E2DDC9",
  borderRadius: "10px",
  padding: "0.5rem 0.65rem",
  backgroundColor: "#FDFCF7",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
};

const buttonBase = {
  borderRadius: "999px",
  padding: "0.55rem 1.25rem",
  fontSize: "0.875rem",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
  width: 110,
  textAlign: "center" as const,
};

export default function ProfileEditor({
  id,
  name,
  bio,
  location,
  skillTags,
  contactInfo,
  profilePictureUrl,
  projects,
}: Props) {
  const router = useRouter();
  const initialContact = splitContact(contactInfo);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formBio, setFormBio] = useState(bio);
  const [formLocation, setFormLocation] = useState(location);
  const [formSkillTags, setFormSkillTags] = useState(skillTags.join(", "));
  const [formEmail, setFormEmail] = useState(initialContact.email);
  const [formPhone, setFormPhone] = useState(initialContact.phone);
  const [formPhotoUrl, setFormPhotoUrl] = useState(profilePictureUrl ?? "");

  function startEdit() {
    const c = splitContact(contactInfo);
    setFormBio(bio);
    setFormLocation(location);
    setFormSkillTags(skillTags.join(", "));
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setFormPhotoUrl(profilePictureUrl ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const combinedContact = [formEmail.trim(), formPhone.trim()].filter(Boolean).join(", ");

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          bio: formBio,
          location: formLocation,
          skill_tags: formSkillTags.split(",").map((t) => t.trim()).filter(Boolean),
          contact_info: combinedContact || null,
          profile_picture_url: formPhotoUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save changes");
      }

      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ marginBottom: "1.75rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Avatar name={name} photoUrl={editing ? formPhotoUrl || null : profilePictureUrl} />

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
              {name}
            </h1>

            {editing ? (
              <div style={{ marginTop: "0.4rem" }}>
                <span style={captionStyle}>Location</span>
                <input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Location"
                  style={{ ...inputStyle, width: "auto" }}
                />
              </div>
            ) : (
              <p style={{ fontSize: "0.875rem", color: "#8A8770", margin: "0.2rem 0 0" }}>{location}</p>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
          {editing ? (
            <>
              <button
                onClick={save}
                disabled={saving}
                style={{ ...buttonBase, backgroundColor: "#17160F", color: "#F7F4EC", opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                style={{ ...buttonBase, backgroundColor: "transparent", color: "#4A4838", border: "1px solid #E2DDC9" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button onClick={startEdit} style={{ ...buttonBase, backgroundColor: "#17160F", color: "#F7F4EC" }}>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <div>
            <span style={captionStyle}>Bio</span>
            <textarea
              value={formBio}
              onChange={(e) => setFormBio(e.target.value)}
              rows={3}
              style={{ ...inputStyle, lineHeight: 1.5, resize: "vertical" }}
            />
          </div>

          <div>
            <span style={captionStyle}>Skills</span>
            <input
              value={formSkillTags}
              onChange={(e) => setFormSkillTags(e.target.value)}
              placeholder="Skill tags, comma separated"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={captionStyle}>Email</span>
              <input
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="name@example.com"
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={captionStyle}>Phone #</span>
              <input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+256 700 123 456"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <span style={captionStyle}>Photo URL</span>
            <input
              value={formPhotoUrl}
              onChange={(e) => setFormPhotoUrl(e.target.value)}
              placeholder="https://…"
              style={inputStyle}
            />
          </div>
        </div>
      ) : (
        <>
          <p style={{ fontSize: "0.9375rem", color: "#4A4838", lineHeight: 1.55, marginBottom: "0.85rem" }}>
            {bio}
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
            {skillTags.map((tag) => (
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
        </>
      )}

      {error && <p style={{ color: "#C0392B", fontSize: "0.8125rem", marginTop: "0.75rem" }}>{error}</p>}

      {!editing && projects.length > 0 && (
        <div style={{ marginTop: "1.75rem" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#6B6852", margin: "0 0 0.85rem" }}>
            Projects
          </h2>
          <div style={{ display: "grid", gap: "0.85rem" }}>
            {projects.map((project) => (
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
                  href={`/project/${project.id}?from=/jmatt/profile`}
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
        </div>
      )}
    </section>
  );
}