import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    const { data, error } = await supabase
        .from("puzzles")
        .select("id, puzzle_type, prompt_data");

    if (error || !data || data.length === 0) {
        return NextResponse.json({ error: "No puzzles available" }, { status: 404 });
    }

    const puzzle = data[Math.floor(Math.random() * data.length)];

    // correct_answer deliberately exlcuded
    return NextResponse.json(puzzle);
}