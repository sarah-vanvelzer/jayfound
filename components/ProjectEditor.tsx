"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Stage = {
  id: string;
  stage_type: "start" | "rough" | "final" | "lessons";
  media_urls: string[];
  notes: string;
  stage_order: number;
};

type Props = {
  projectId: string;
  title: string;
  summary: string;
  stages: Stage[];
  editable: boolean;
  backHref: string;
};

const stageLabels: Record<Stage["stage_type"], string> = {
  start: "Start",
  rough: "Rough",
  final: "Final",
  lessons: "Lessons",
};

function isVideo(url: string) {
  return /\.(mov|mp4|webm)$/i.test(url);
}

const captionStyle = {
  display: "block" as const,
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#6B6852",
  margin: "0 0 0.35rem",
};

const inputStyle = {
  fontSize: "0.9375rem",
  color: "#4A4838",
  border: "1px solid #E2DDC9",
  borderRadius: "10px",
  padding: "0.6rem 0.75rem",
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
  textAlign: "center" as const,
};

const smallButtonStyle = {
  borderRadius: "8px",
  padding: "0.4rem 0.7rem",
  fontSize: "0.8125rem",
  fontWeight: 600,
  border: "1px solid #E2DDC9",
  backgroundColor: "transparent",
  color: "#4A4838",
  cursor: "pointer",
  flexShrink: 0,
};

export default function ProjectEditor({
  projectId,
  title,
  summary,
  stages,
  editable,
  backHref,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState(title);
  const [formSummary, setFormSummary] = useState(summary);
  const [formNotes, setFormNotes] = useState<Record<string, string>>(
    Object.fromEntries(stages.map((s) => [s.id, s.notes]))
  );
  const [formMedia, setFormMedia] = useState<Record<string, string[]>>(
    Object.fromEntries(stages.map((s) => [s.id, [...s.media_urls]]))
  );

  function startEdit() {
    setFormTitle(title);
    setFormSummary(summary);
    setFormNotes(Object.fromEntries(stages.map((s) => [s.id, s.notes])));
    setFormMedia(Object.fromEntries(stages.map((s) => [s.id, [...s.media_urls]])));
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  function updateMediaUrl(stageId: string, idx: number, value: string) {
    setFormMedia((prev) => {
      const arr = [...(prev[stageId] ?? [])];
      arr[idx] = value;
      return { ...prev, [stageId]: arr };
    });
  }

  function removeMediaUrl(stageId: string, idx: number) {
    setFormMedia((prev) => {
      const arr = [...(prev[stageId] ?? [])];
      arr.splice(idx, 1);
      return { ...prev, [stageId]: arr };
    });
  }

  function addMediaUrl(stageId: string) {
    setFormMedia((prev) => ({
      ...prev,
      [stageId]: [...(prev[stageId] ?? []), ""],
    }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          title: formTitle,
          summary: formSummary,
          stages: stages.map((s) => ({
            id: s.id,
            notes: formNotes[s.id] ?? "",
            media_urls: (formMedia[s.id] ?? []).map((u) => u.trim()).filter(Boolean),
          })),
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
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <Link
          href={backHref}
          style={{
            fontSize: "0.875rem",
            color: "#4A4838",
            textDecoration: "none",
          }}
        >
          ← Back
        </Link>

        {editable && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
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
                Edit Project
              </button>
            )}
          </div>
        )}
      </div>

      <section style={{ marginBottom: "2.5rem" }}>
        {editing ? (
          <div style={{ marginBottom: "0.9rem" }}>
            <span style={captionStyle}>Title</span>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              style={{ ...inputStyle, fontSize: "1.25rem", fontWeight: 600, color: "#17160F" }}
            />
          </div>
        ) : (
          <h1
            style={{
              fontFamily: "var(--font-masthead), serif",
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              fontSize: "clamp(1.9rem, 4.6vw, 2.6rem)",
              lineHeight: 1.08,
              margin: "0 0 1.1rem",
              color: "#17160F",
            }}
          >
            {title}
          </h1>
        )}

        {editing ? (
          <div>
            <span style={captionStyle}>Summary</span>
            <textarea
              value={formSummary}
              onChange={(e) => setFormSummary(e.target.value)}
              rows={3}
              style={{ ...inputStyle, lineHeight: 1.55, resize: "vertical", maxWidth: "560px" }}
            />
          </div>
        ) : (
          <p style={{ fontSize: "0.9375rem", color: "#4A4838", lineHeight: 1.55, maxWidth: "560px" }}>
            {summary}
          </p>
        )}

        {error && <p style={{ color: "#C0392B", fontSize: "0.8125rem", marginTop: "0.75rem" }}>{error}</p>}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {stages.map((stage) => (
          <article
            key={stage.id}
            style={{
              backgroundColor: "rgba(253,252,247,0.9)",
              border: "1px solid #E9E4D3",
              borderRadius: "16px",
              padding: "1.75rem",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-masthead), serif",
                fontWeight: 400,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                fontSize: "1.5rem",
                color: "#17160F",
                display: "block",
                marginBottom: "0.85rem",
              }}
            >
              {stageLabels[stage.stage_type]}
            </span>

            {editing ? (
              <textarea
                value={formNotes[stage.id] ?? ""}
                onChange={(e) => setFormNotes((prev) => ({ ...prev, [stage.id]: e.target.value }))}
                rows={4}
                style={{
                  ...inputStyle,
                  lineHeight: 1.55,
                  resize: "vertical",
                  maxWidth: "560px",
                  marginBottom: "1.25rem",
                }}
              />
            ) : (
              <p
                style={{
                  fontSize: "0.9375rem",
                  lineHeight: 1.55,
                  color: "#4A4838",
                  maxWidth: "560px",
                  marginBottom: stage.media_urls.length ? "1.5rem" : 0,
                }}
              >
                {stage.notes}
              </p>
            )}

            {editing ? (
              <div>
                <span style={captionStyle}>Media</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(formMedia[stage.id] ?? []).map((url, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "0.5rem" }}>
                      <input
                        value={url}
                        onChange={(e) => updateMediaUrl(stage.id, idx, e.target.value)}
                        placeholder="https://…"
                        style={{ ...inputStyle, flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => removeMediaUrl(stage.id, idx)}
                        style={smallButtonStyle}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addMediaUrl(stage.id)}
                    style={{ ...smallButtonStyle, alignSelf: "flex-start" }}
                  >
                    + Add media
                  </button>
                </div>
              </div>
            ) : (
              stage.media_urls.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: stage.media_urls.length > 1 ? "1fr 1fr" : "1fr",
                    gap: "0.75rem",
                  }}
                >
                  {stage.media_urls.map((url) =>
                    isVideo(url) ? (
                      <div
                        key={url}
                        style={{ aspectRatio: "4 / 3", borderRadius: "10px", overflow: "hidden", backgroundColor: "#000" }}
                      >
                        <video src={url} controls style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    ) : (
                      <div key={url} style={{ aspectRatio: "4 / 3", borderRadius: "10px", overflow: "hidden" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                      </div>
                    )
                  )}
                </div>
              )
            )}
          </article>
        ))}
      </section>
    </>
  );
}