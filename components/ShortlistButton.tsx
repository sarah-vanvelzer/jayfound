"use client";

import { useState } from "react";

export default function ShortlistButton({
  profileId,
  initialShortlisted,
}: {
  profileId: string;
  initialShortlisted: boolean;
}) {
  const [shortlisted, setShortlisted] = useState(initialShortlisted);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId }),
    });
    const data = await res.json();
    setShortlisted(data.shortlisted);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        background: shortlisted ? "#17160F" : "rgba(253,252,247,0.7)",
        color: shortlisted ? "#F7F4EC" : "#4A4838",
        border: "1px solid " + (shortlisted ? "#17160F" : "#DCD6C0"),
        borderRadius: "999px",
        padding: "0.55rem 1.25rem",
        fontSize: "0.875rem",
        fontWeight: 600,
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
        width: 110,
        textAlign: "center",
      }}
    >
      {shortlisted ? "Shortlisted" : "Shortlist"}
    </button>
  );
}