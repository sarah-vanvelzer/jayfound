"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type StageDraft = {
  stage_type: "start" | "rough" | "final" | "lessons";
  notes: string;
  media_url: string;
};

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.75rem",
  borderRadius: "10px",
  border: "1px solid #E2DDC9",
  backgroundColor: "#FDFCF7",
  fontSize: "0.9375rem",
  color: "#4A4838",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B6852' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.9rem center",
  backgroundSize: "10px",
  paddingRight: "2.25rem",
  cursor: "pointer",
};

const captionStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "#6B6852",
  margin: "0 0 0.4rem",
};

export default function NewProjectPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [stages, setStages] = useState<StageDraft[]>([
    { stage_type: "start", notes: "", media_url: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id")
      .eq("name", "JMatt")
      .single()
      .then(({ data }) => {
        if (data) setProfileId(data.id);
      });
  }, []);

  function updateStage(index: number, field: keyof StageDraft, value: string) {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  function addStageRow() {
    setStages((prev) => [...prev, { stage_type: "rough", notes: "", media_url: "" }]);
  }

  function removeStageRow(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) {
      setErrorMsg("Could not find profile. Try refreshing.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({ profile_id: profileId, title, summary })
      .select()
      .single();

    if (projectError || !project) {
      setErrorMsg(projectError?.message ?? "Failed to create project.");
      setSubmitting(false);
      return;
    }

    const stageRows = stages
      .filter((s) => s.notes.trim().length > 0)
      .map((s, index) => ({
        project_id: project.id,
        stage_type: s.stage_type,
        notes: s.notes,
        media_urls: s.media_url ? [s.media_url] : [],
        stage_order: index + 1,
      }));

    if (stageRows.length > 0) {
      const { error: stagesError } = await supabase
        .from("project_stages")
        .insert(stageRows);

      if (stagesError) {
        setErrorMsg(stagesError.message);
        setSubmitting(false);
        return;
      }
    }

    router.push("/project/" + project.id + "?from=/jmatt");
  }

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
          maxWidth: "640px",
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
          Add a Project
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#4A4838", lineHeight: 1.55, margin: "0 0 2.25rem" }}>
          For maximum visibility, break it down into stages.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          <div
            style={{
              backgroundColor: "rgba(253,252,247,0.9)",
              border: "1px solid #E9E4D3",
              borderRadius: "16px",
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div>
              <label style={captionStyle}>Project title</label>
              <input
                style={inputStyle}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., VEX Voyager: Uganda Robotics League Championships"
                required
              />
            </div>
            <div>
              <label style={captionStyle}>Summary</label>
              <textarea
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A one or two sentence overview of the project."
                required
              />
            </div>
          </div>

          {stages.map((stage, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "rgba(253,252,247,0.9)",
                border: "1px solid #E9E4D3",
                borderRadius: "16px",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <label style={{ ...captionStyle, margin: 0 }}>Stage type</label>
                  {stages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStageRow(index)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#8A8770",
                        fontSize: "0.8125rem",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <select
                  style={selectStyle}
                  value={stage.stage_type}
                  onChange={(e) => updateStage(index, "stage_type", e.target.value)}
                >
                  <option value="start">Start</option>
                  <option value="rough">Rough</option>
                  <option value="final">Final</option>
                  <option value="lessons">Lessons</option>
                </select>
              </div>

              <div>
                <label style={captionStyle}>Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
                  value={stage.notes}
                  onChange={(e) => updateStage(index, "notes", e.target.value)}
                  placeholder="What happened at this stage?"
                />
              </div>

              <div>
                <label style={captionStyle}>Media URL (optional)</label>
                <input
                  style={inputStyle}
                  value={stage.media_url}
                  onChange={(e) => updateStage(index, "media_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addStageRow}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "1px solid #E2DDC9",
              borderRadius: "999px",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#4A4838",
              cursor: "pointer",
            }}
          >
            + Add another stage
          </button>

          {errorMsg && (
            <p style={{ color: "#C0392B", fontSize: "0.8125rem" }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              backgroundColor: "#17160F",
              color: "#F7F4EC",
              border: "none",
              borderRadius: "999px",
              padding: "0.85rem 1.5rem",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Saving..." : "Save project"}
          </button>
        </form>
      </div>
    </main>
  );
}