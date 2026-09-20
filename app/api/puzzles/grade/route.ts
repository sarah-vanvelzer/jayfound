import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
    const { puzzle_id, profile_id, submitted_answer } = await request.json();

    const { data: puzzle, error: puzzleError } = await supabase
        .from("puzzles")
        .select("correct_answer")
        .eq("id", puzzle_id)
        .single();
    
    if (puzzleError || !puzzle) {
        return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    const isCorrect = submitted_answer === puzzle.correct_answer;
    const score = isCorrect ? 100 : 0;

    const { error: attemptError } = await supabase.from("puzzle_attempts").insert({
        profile_id,
        puzzle_id,
        score,
        completed_at: new Date().toISOString(),
    });

    if (attemptError) {
        return NextResponse.json({ error: attemptError.message }, { status: 500 });
    }

    return NextResponse.json({ correct: isCorrect, score });
}