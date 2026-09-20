import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { profile_id } = await request.json();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("shortlisted")
    .eq("id", profile_id)
    .single();

  if (fetchError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const newValue = !profile.shortlisted;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ shortlisted: newValue })
    .eq("id", profile_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ shortlisted: newValue });
}