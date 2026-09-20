"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PatternCompletionData = { grid: string[][]; options: string[]; flavor_text?: string };
type SequenceData = { sequence: string[]; options: string[]; flavor_text?: string };
type RotationData = { steps: (number | "?")[]; options: number[]; flavor_text?: string };
type CountingData = { counts: (number | "?")[]; shape: string; options: number[]; flavor_text?: string };
type AnalogyData = { pairA: [string, string]; pairCFirst: string; options: string[]; flavor_text?: string };

type Puzzle = {
  id: string;
  puzzle_type: "pattern_completion" | "sequence" | "rotation" | "counting" | "analogy";
  prompt_data: PatternCompletionData | SequenceData | RotationData | CountingData | AnalogyData;
};

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";

const FILL_SHAPES: Record<string, Record<"filled" | "outline", string>> = {
  circle: { filled: "●", outline: "○" },
  triangle: { filled: "▲", outline: "△" },
  square: { filled: "■", outline: "□" },
  star: { filled: "★", outline: "☆" },
  diamond: { filled: "◆", outline: "◇" },
};

const CELL_SIZE = "3.75rem";

function parseToken(t: string): { symbol: string; fontSize: string } {
  const [shape, fill, size] = t.split("_");
  const symbol = FILL_SHAPES[shape]?.[fill as "filled" | "outline"] ?? shape;
  const fontSize = size === "large" ? "2rem" : "1.2rem";
  return { symbol, fontSize };
}

function formatPuzzleType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function promptCopy(type: Puzzle["puzzle_type"]) {
  switch (type) {
    case "pattern_completion":
      return "What completes the grid?";
    case "sequence":
      return "What comes next?";
    case "rotation":
      return "What's the next rotation?";
    case "counting":
      return "What comes next in the count?";
    case "analogy":
      return "Complete the analogy.";
  }
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getFlavorText(puzzle: Puzzle): string | undefined {
  const text = (puzzle.prompt_data as { flavor_text?: string }).flavor_text;
  return text ? capitalizeFirst(text) : undefined;
}

function getChoices(puzzle: Puzzle): string[] {
  switch (puzzle.puzzle_type) {
    case "rotation":
      return (puzzle.prompt_data as RotationData).options?.map(String) ?? [];
    case "counting":
      return (puzzle.prompt_data as CountingData).options?.map(String) ?? [];
    case "analogy":
      return (puzzle.prompt_data as AnalogyData).options ?? [];
    default:
      return (puzzle.prompt_data as PatternCompletionData | SequenceData).options ?? [];
  }
}

function CellBox({ children, size = CELL_SIZE }: { children: React.ReactNode; size?: string }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F7F4EC",
        border: "1px solid #E2DDC9",
        borderRadius: "10px",
        color: "#17160F",
        flexShrink: 0,
        overflow: "hidden", // prevents content (like large dot grids) from breaking layout
      }}
    >
      {children}
    </div>
  );
}

// Fixed 4-column grid, contained entirely inside its box — never overflows,
// dot size shrinks a bit as count grows so higher counts still fit cleanly.
function DotGroup({ shape, count }: { shape: string; count: number }) {
  const symbol = FILL_SHAPES[shape]?.filled ?? shape;
  const dotFontSize = count > 9 ? "0.6rem" : count > 4 ? "0.75rem" : "0.95rem";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1px",
        width: "100%",
        height: "100%",
        alignContent: "center",
        justifyItems: "center",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{ fontSize: dotFontSize, lineHeight: 1 }}>
          {symbol}
        </span>
      ))}
    </div>
  );
}

function TokenIcon({ tok, size = "1.75rem" }: { tok: string; size?: string }) {
  const { symbol, fontSize } = parseToken(tok);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, fontSize }}>
      {symbol}
    </span>
  );
}

const arrowStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  color: "#8A8770",
  flexShrink: 0,
};

export default function ArcadePage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; score: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Cancels any in-flight fetch before starting a new one, so a previous
  // request can never resolve after (or during) a newer one and briefly
  // flash a stale puzzle onto the screen.
  const abortControllerRef = useRef<AbortController | null>(null);

  async function loadPuzzle() {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setSelectedIndex(null);
    setResult(null);
    setPuzzle(null);

    try {
      const res = await fetch("/api/puzzles/next", { signal: controller.signal });
      const data = await res.json();

      if (controller.signal.aborted) return; // this call was superseded — do nothing

      if (data && !data.error && data.prompt_data) {
        setPuzzle(data);
      }
      setLoading(false);
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return; // expected when superseded, not a real error
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPuzzle();
    supabase
      .from("profiles")
      .select("id")
      .eq("name", "JMatt")
      .single()
      .then(({ data }) => {
        if (data) setProfileId(data.id);
      });
  }, []);

  async function handleSubmit() {
    if (!puzzle || selectedIndex === null || !profileId) return;

    const choices = getChoices(puzzle);
    const submittedAnswer = choices[selectedIndex];

    const res = await fetch("/api/puzzles/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puzzle_id: puzzle.id,
        profile_id: profileId,
        submitted_answer: submittedAnswer,
      }),
    });
    const data = await res.json();
    setResult(data);
  }

  const choices = puzzle ? getChoices(puzzle) : [];

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
          maxWidth: "560px",
          margin: "0 auto",
          padding: "3.5rem 1.5rem 6rem",
        }}
      >
        <Link
          href="/arcade"
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
          {puzzle ? formatPuzzleType(puzzle.puzzle_type) : "Puzzle Arcade"}
        </h1>
        <p style={{ fontSize: "0.9375rem", color: "#4A4838", lineHeight: 1.55, marginBottom: "0.5rem" }}>
          {puzzle ? promptCopy(puzzle.puzzle_type) : "Loading…"}
        </p>
        {puzzle && getFlavorText(puzzle) ? (
          <p style={{ fontSize: "0.8125rem", color: "#8A8770", fontStyle: "italic", lineHeight: 1.5, marginBottom: "1.75rem" }}>
            {getFlavorText(puzzle)}
          </p>
        ) : (
          <div style={{ marginBottom: "1.75rem" }} />
        )}

        {loading && <p style={{ color: "#8A8770" }}>Loading puzzle...</p>}

        {!loading && !puzzle && (
          <p style={{ color: "#8A8770" }}>No puzzles available right now.</p>
        )}

        {!loading && puzzle && (
          <div
            style={{
              backgroundColor: "rgba(253,252,247,0.9)",
              border: "1px solid #E9E4D3",
              borderRadius: "16px",
              padding: "1.75rem",
            }}
          >
            {/* Pattern Completion: 3x3 grid of tokens */}
            {puzzle.puzzle_type === "pattern_completion" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(3, ${CELL_SIZE})`,
                  gap: "0.5rem",
                  justifyContent: "center",
                  margin: "0 auto 2rem",
                }}
              >
                {(puzzle.prompt_data as PatternCompletionData).grid.flat().map((cell, i) =>
                  cell === "?" ? (
                    <CellBox key={i}>
                      <span style={{ fontSize: "1.75rem" }}>?</span>
                    </CellBox>
                  ) : (
                    <CellBox key={i}>
                      <TokenIcon tok={cell} size="2.1rem" />
                    </CellBox>
                  )
                )}
              </div>
            )}

            {/* Sequence: horizontal row of tokens */}
            {puzzle.puzzle_type === "sequence" && (
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", margin: "0 auto 2rem", flexWrap: "wrap" }}>
                {(puzzle.prompt_data as SequenceData).sequence.map((cell, i) =>
                  cell === "?" ? (
                    <CellBox key={i}>
                      <span style={{ fontSize: "1.5rem" }}>?</span>
                    </CellBox>
                  ) : (
                    <CellBox key={i}>
                      <TokenIcon tok={cell} />
                    </CellBox>
                  )
                )}
              </div>
            )}

            {/* Rotation: sequence of rotated triangles */}
            {puzzle.puzzle_type === "rotation" && (
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", margin: "0 auto 2rem", flexWrap: "wrap" }}>
                {(puzzle.prompt_data as RotationData).steps.map((deg, i) =>
                  deg === "?" ? (
                    <CellBox key={i}>
                      <span style={{ fontSize: "1.5rem" }}>?</span>
                    </CellBox>
                  ) : (
                    <CellBox key={i}>
                      <span style={{ fontSize: "1.5rem", display: "inline-block", transform: `rotate(${deg}deg)` }}>▲</span>
                    </CellBox>
                  )
                )}
              </div>
            )}

            {/* Counting: dot-groups showing quantity progression */}
            {puzzle.puzzle_type === "counting" && (
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", margin: "0 auto 2rem", flexWrap: "wrap" }}>
                {(puzzle.prompt_data as CountingData).counts.map((count, i) =>
                  count === "?" ? (
                    <CellBox key={i}>
                      <span style={{ fontSize: "1.5rem" }}>?</span>
                    </CellBox>
                  ) : (
                    <CellBox key={i}>
                      <DotGroup shape={(puzzle.prompt_data as CountingData).shape} count={count} />
                    </CellBox>
                  )
                )}
              </div>
            )}

            {/* Analogy: A → B, then C → ? */}
            {puzzle.puzzle_type === "analogy" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <CellBox>
                    <TokenIcon tok={(puzzle.prompt_data as AnalogyData).pairA[0]} />
                  </CellBox>
                  <span style={arrowStyle}>→</span>
                  <CellBox>
                    <TokenIcon tok={(puzzle.prompt_data as AnalogyData).pairA[1]} />
                  </CellBox>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <CellBox>
                    <TokenIcon tok={(puzzle.prompt_data as AnalogyData).pairCFirst} />
                  </CellBox>
                  <span style={arrowStyle}>→</span>
                  <CellBox>
                    <span style={{ fontSize: "1.5rem" }}>?</span>
                  </CellBox>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {choices.map((choice, i) => {
                const isSelected = selectedIndex === i;
                const showFeedback = result !== null;
                const isCorrectChoice = showFeedback && result.correct && isSelected;
                const isWrongSelected = showFeedback && !result.correct && isSelected;

                const rowStyle: React.CSSProperties = {
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  border: isSelected ? "2px solid #17160F" : "1px solid #E2DDC9",
                  backgroundColor: isCorrectChoice ? "#DCEED7" : isWrongSelected ? "#F3D9D6" : "#FDFCF7",
                  cursor: result ? "default" : "pointer",
                  fontSize: "0.9375rem",
                  color: "#4A4838",
                  textAlign: "left",
                  width: "100%",
                };

                if (puzzle.puzzle_type === "rotation") {
                  return (
                    <button key={i} onClick={() => !result && setSelectedIndex(i)} disabled={!!result} style={rowStyle}>
                      <span style={{ fontSize: "1.25rem", display: "inline-flex", width: "1.75rem", justifyContent: "center" }}>
                        <span style={{ display: "inline-block", transform: `rotate(${choice}deg)` }}>▲</span>
                      </span>
                      <span>{choice}°</span>
                    </button>
                  );
                }

                if (puzzle.puzzle_type === "counting") {
                  const shapeName = (puzzle.prompt_data as CountingData).shape;
                  return (
                    <button
                      key={i}
                      onClick={() => !result && setSelectedIndex(i)}
                      disabled={!!result}
                      style={{ ...rowStyle, justifyContent: "flex-start" }}
                    >
                      <span style={{ display: "inline-flex", width: "2.75rem", height: "2.75rem", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
                        <DotGroup shape={shapeName} count={Number(choice)} />
                      </span>
                    </button>
                  );
                }

                // pattern_completion / sequence / analogy: icon + readable label
                const [shapeName, fillName, sizeName] = choice.split("_");
                return (
                  <button key={i} onClick={() => !result && setSelectedIndex(i)} disabled={!!result} style={rowStyle}>
                    <span style={{ width: "1.75rem", display: "inline-flex", justifyContent: "center" }}>
                      <TokenIcon tok={choice} />
                    </span>
                    <span style={{ textTransform: "capitalize" }}>
                      {sizeName} {shapeName}
                    </span>
                  </button>
                );
              })}
            </div>

            {!result && (
              <button
                onClick={handleSubmit}
                disabled={selectedIndex === null}
                style={{
                  marginTop: "1.5rem",
                  width: "100%",
                  backgroundColor: selectedIndex !== null ? "#17160F" : "#E2DDC9",
                  color: "#F7F4EC",
                  border: "none",
                  borderRadius: "999px",
                  padding: "0.85rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  cursor: selectedIndex !== null ? "pointer" : "default",
                }}
              >
                Submit
              </button>
            )}

            {result && (
              <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "1rem", fontWeight: 600, color: "#17160F", marginBottom: "0.4rem" }}>
                  {result.correct ? "Correct!" : "Not quite."}
                </p>
                <p style={{ fontSize: "0.875rem", color: "#6B6852", marginBottom: "1.25rem" }}>
                  This contributed to your discovery boost, not a gate to your portfolio.
                </p>
                <button
                  onClick={loadPuzzle}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "1px solid #E2DDC9",
                    borderRadius: "999px",
                    padding: "0.6rem 1.25rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#4A4838",
                    cursor: loading ? "default" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  Try another
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}