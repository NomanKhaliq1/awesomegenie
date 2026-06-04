import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

const greeting =
  "Hi, I'm Awesome Genie. Ask me about AwesomeTech services, or tell me what project you want to build.";

export async function POST() {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .insert({
      session_status: "active",
      current_state: "greeting",
      last_message_at: now
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: sessionError?.message || "Unable to start chat session." },
      { status: 500 }
    );
  }

  const { data: message, error: messageError } = await supabase
    .from("chat_messages")
    .insert({
      session_id: session.id,
      role: "assistant",
      message: greeting,
      source_type: "system",
      metadata: { event: "chat_started" }
    })
    .select("id,role,message,created_at")
    .single();

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  return NextResponse.json({
    session_id: session.id,
    message
  });
}
