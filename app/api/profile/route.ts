import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body || typeof body.id !== "string") {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }

  const { id, bio, location, skill_tags, contact_info, profile_picture_url } =
    body;

  const { error } = await supabase
    .from("profiles")
    .update({
      bio,
      location,
      skill_tags,
      contact_info,
      profile_picture_url,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}