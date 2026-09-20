import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  const { id, title, summary, stages } = body as {
    id: string;
    title: string;
    summary: string;
    stages: { id: string; notes: string; media_urls: string[] }[];
  };

  const { error: projectError } = await supabase
    .from("projects")
    .update({ title, summary })
    .eq("id", id);

  if (projectError) {
    return NextResponse.json({ error: projectError.message }, { status: 500 });
  }

  if (Array.isArray(stages)) {
    for (const stage of stages) {
      const { error: stageError } = await supabase
        .from("project_stages")
        .update({ notes: stage.notes, media_urls: stage.media_urls })
        .eq("id", stage.id);

      if (stageError) {
        return NextResponse.json({ error: stageError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}