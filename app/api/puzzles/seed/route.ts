import { NextResponse } from "next/server";
import { genAI } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

type FillState = "filled" | "outline";
type SizeState = "small" | "large";
type PuzzleType = "pattern_completion" | "sequence" | "rotation" | "analogy";

const SHAPE_NAMES = ["circle", "triangle", "square", "star", "diamond"];
const FILLS: FillState[] = ["filled", "outline"];
const SIZES: SizeState[] = ["small", "large"];
const DISTRACTOR_COUNT = 4; // 1 correct + 4 distractors = 5 total options

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickN<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

function randOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function token(shape: string, fill: FillState, size: SizeState) {
  return `${shape}_${fill}_${size}`;
}

/* ---------- Flavor text (Gemini, cosmetic only — never affects grading) ---------- */

const flavorTextSchema = {
  type: "OBJECT" as const,
  properties: { flavor_text: { type: "STRING" as const } },
  required: ["flavor_text"],
};

const FALLBACK_FLAVOR_TEXT: Record<PuzzleType, string> = {
  pattern_completion: "Three rules are stacked in this grid at once.",
  sequence: "More than one cycle is running through this row.",
  rotation: "Track the turn, not just the shape.",
  analogy: "Figure out the rule, then apply it to something new.",
};

async function generateFlavorText(puzzleType: PuzzleType): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: flavorTextSchema,
      },
    });

    const prompt = `Write one short, playful sentence (under 12 words) introducing a "${puzzleType.replace(
      /_/g,
      " "
    )}" visual reasoning puzzle. Start with a capital letter and end with a period. Do not describe specific shapes, colors, fills, sizes, or rotation angles, and do not give away the answer — just a fun, general framing line. No exclamation marks. Return only valid JSON matching the schema.`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    if (typeof parsed.flavor_text === "string" && parsed.flavor_text.trim()) {
      return parsed.flavor_text.trim();
    }
    return FALLBACK_FLAVOR_TEXT[puzzleType];
  } catch {
    return FALLBACK_FLAVOR_TEXT[puzzleType];
  }
}

/* ---------- Pattern Completion: 3 independent attribute cycles ---------- */

function generatePatternPuzzle() {
  const shapes = pickN(SHAPE_NAMES, 3);

  const grid: string[][] = [];
  for (let r = 0; r < 3; r++) {
    const row: string[] = [];
    for (let c = 0; c < 3; c++) {
      const shape = shapes[(r + c) % 3];
      const fill = FILLS[(r + c) % 2];
      const size = SIZES[(r + 2 - c) % 2];
      row.push(token(shape, fill, size));
    }
    grid.push(row);
  }

  const correctToken = grid[2][2];
  grid[2][2] = "?";

  const allCombos = shapes.flatMap((s) => FILLS.flatMap((f) => SIZES.map((sz) => token(s, f, sz))));
  const wrongCombos = shuffle(allCombos.filter((t) => t !== correctToken)).slice(0, DISTRACTOR_COUNT);
  const options = shuffle([correctToken, ...wrongCombos]);

  return {
    puzzle_type: "pattern_completion" as PuzzleType,
    prompt_data_base: { grid, options },
    correct_answer: correctToken,
  };
}

/* ---------- Sequence: shape, fill, and size cycle at different periods ---------- */

function generateSequencePuzzle() {
  const shapeCycle = pickN(SHAPE_NAMES, 3);
  const sequenceLength = 9;

  const tokens = Array.from({ length: sequenceLength }, (_, i) =>
    token(shapeCycle[i % 3], FILLS[i % 2], SIZES[(i + 1) % 2])
  );

  const correctToken = tokens[tokens.length - 1];
  const displaySequence = [...tokens.slice(0, -1), "?"];

  const allCombos = shapeCycle.flatMap((s) => FILLS.flatMap((f) => SIZES.map((sz) => token(s, f, sz))));
  const wrongCombos = shuffle(allCombos.filter((t) => t !== correctToken)).slice(0, DISTRACTOR_COUNT);
  const options = shuffle([correctToken, ...wrongCombos]);

  return {
    puzzle_type: "sequence" as PuzzleType,
    prompt_data_base: { sequence: displaySequence, options },
    correct_answer: correctToken,
  };
}

/* ---------- Rotation: extrapolate a rotating shape's next angle ---------- */

function generateRotationPuzzle() {
  const stepOptions = [72, 60, 45];
  const stepDeg = randOf(stepOptions);
  const stateCount = 360 / stepDeg;

  const knownSteps = 5;
  const degrees = Array.from({ length: knownSteps + 1 }, (_, i) => (i * stepDeg) % 360);
  const correctDeg = degrees[degrees.length - 1];

  const displaySteps: (number | "?")[] = [...degrees.slice(0, -1), "?"];

  const allStates = Array.from({ length: stateCount }, (_, i) => (i * stepDeg) % 360);
  const wrongDegs = shuffle(allStates.filter((d) => d !== correctDeg)).slice(0, DISTRACTOR_COUNT);
  const options = shuffle([correctDeg, ...wrongDegs]);

  return {
    puzzle_type: "rotation" as PuzzleType,
    prompt_data_base: { steps: displaySteps, options },
    correct_answer: String(correctDeg),
  };
}

/* ---------- Analogy: infer a transformation from A→B, apply it to C→? ---------- */

function generateAnalogyPuzzle() {
  const [shapeA, shapeC] = pickN(SHAPE_NAMES, 2);
  const transformation: "flip_fill" | "flip_size" = Math.random() < 0.5 ? "flip_fill" : "flip_size";

  const flip = (fill: FillState, size: SizeState) =>
    transformation === "flip_fill"
      ? { fill: fill === "filled" ? "outline" : ("filled" as FillState), size }
      : { fill, size: size === "small" ? "large" : ("small" as SizeState) };

  const fillA = randOf(FILLS);
  const sizeA = randOf(SIZES);
  const pairAFirst = token(shapeA, fillA, sizeA);
  const flippedA = flip(fillA, sizeA);
  const pairASecond = token(shapeA, flippedA.fill, flippedA.size);

  const fillC = randOf(FILLS);
  const sizeC = randOf(SIZES);
  const pairCFirst = token(shapeC, fillC, sizeC);
  const flippedC = flip(fillC, sizeC);
  const correctToken = token(shapeC, flippedC.fill, flippedC.size);

  const noChange = pairCFirst;
  const otherTransform =
    transformation === "flip_fill"
      ? token(shapeC, fillC, sizeC === "small" ? "large" : "small")
      : token(shapeC, fillC === "filled" ? "outline" : "filled", sizeC);
  const bothFlipped = token(
    shapeC,
    fillC === "filled" ? "outline" : "filled",
    sizeC === "small" ? "large" : "small"
  );

  const wrongOptions = new Set<string>([noChange, otherTransform, bothFlipped].filter((t) => t !== correctToken));

  const allCombos = SHAPE_NAMES.flatMap((s) => FILLS.flatMap((f) => SIZES.map((sz) => token(s, f, sz))));
  while (wrongOptions.size < DISTRACTOR_COUNT) {
    const candidate = randOf(allCombos.filter((t) => t !== correctToken));
    wrongOptions.add(candidate);
  }

  const options = shuffle([correctToken, ...Array.from(wrongOptions).slice(0, DISTRACTOR_COUNT)]);

  return {
    puzzle_type: "analogy" as PuzzleType,
    prompt_data_base: { pairA: [pairAFirst, pairASecond], pairCFirst, options },
    correct_answer: correctToken,
  };
}

/* ---------- Route ---------- */

export async function GET() {
  try {
    const generators = [
      ...Array.from({ length: 3 }, generatePatternPuzzle),
      ...Array.from({ length: 3 }, generateSequencePuzzle),
      ...Array.from({ length: 3 }, generateRotationPuzzle),
      ...Array.from({ length: 3 }, generateAnalogyPuzzle),
    ];

    const rows = [];
    for (let i = 0; i < generators.length; i++) {
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const g = generators[i];
      const flavor_text = await generateFlavorText(g.puzzle_type);

      rows.push({
        puzzle_type: g.puzzle_type,
        prompt_data: { ...g.prompt_data_base, flavor_text },
        correct_answer: g.correct_answer,
      });
    }

    const { data, error } = await supabase.from("puzzles").insert(rows).select();
    if (error) throw error;

    return NextResponse.json({ success: true, created: data.length, puzzles: data });
  } catch (err) {
    let message: string;
    if (err instanceof Error) {
      message = err.message;
    } else if (err && typeof err === "object") {
      message = JSON.stringify(err);
    } else {
      message = String(err);
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}