"use client";

import { useState } from "react";
import { splitContact } from "@/lib/contact";

export default function ContactButton({ contactInfo }: { contactInfo: string | null }) {
  const [open, setOpen] = useState(false);
  const { email, phone } = splitContact(contactInfo);

  if (!email && !phone) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          backgroundColor: "#17160F",
          color: "#F7F4EC",
          border: "none",
          borderRadius: "999px",
          padding: "0.55rem 1.25rem",
          fontSize: "0.875rem",
          fontWeight: 600,
          width: 110,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        Contact
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(23,22,15,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1.5rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FDFCF7",
              border: "1px solid #E9E4D3",
              borderRadius: "16px",
              padding: "1.5rem",
              maxWidth: "360px",
              width: "100%",
              position: "relative",
            }}
          >
            <div style={{ marginBottom: "1rem" }}>
                <span
                    style={{
                        fontFamily: "var(--font-masthead), serif",
                        fontWeight: 400,
                        textTransform: "uppercase",
                        letterSpacing: "-0.01em",
                        fontSize: "1.25rem",
                        color: "#17160F",
                    }}
                >
                    Contact
                </span>
                <button
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    style={{
                        position: "absolute",
                        top: "0.85rem",
                        right: "0.85rem",
                        border: "none",
                        background: "transparent",
                        color: "#8A8770",
                        fontSize: "1.1rem",
                        cursor: "pointer",
                        lineHeight: 1,
                        padding: "0.25rem",
                    }}
                >
                    ×
                </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {email && (
                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6B6852", marginBottom: "0.2rem" }}>
                    Email
                  </span>
                  <a href={`mailto:${email}`} style={{ fontSize: "0.9375rem", color: "#17160F", textDecoration: "none" }}>
                    {email}
                  </a>
                </div>
              )}
              {phone && (
                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#6B6852", marginBottom: "0.2rem" }}>
                    Phone #
                  </span>
                  <a href={`tel:${phone}`} style={{ fontSize: "0.9375rem", color: "#17160F", textDecoration: "none" }}>
                    {phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}