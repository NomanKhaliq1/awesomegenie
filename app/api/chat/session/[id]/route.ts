import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id,role,message,created_at,metadata")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    session_id: id,
    messages: messages || []
  });
}
