import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type ChatDashboardStats = {
  sessions: number;
  messages: number;
  ragRetrievals: number;
  aiUsageLogs: number;
  approvedSources: number;
  approvedChunks: number;
};

export type ChatLogMessage = {
  id: string;
  role: string;
  message: string | null;
  created_at: string;
  model_used: string | null;
  metadata: {
    provider?: string;
    rag_match_count?: number;
    rag_sources?: Array<{ title?: string; url?: string; score?: number }>;
  } | null;
};

export type ChatLogSession = {
  id: string;
  session_status: string | null;
  current_state: string | null;
  started_at: string | null;
  last_message_at: string | null;
  messages: ChatLogMessage[];
};

export async function loadChatDashboardStats(): Promise<ChatDashboardStats> {
  const supabase = createSupabaseAdminClient();
  const [
    sessions,
    messages,
    ragRetrievals,
    aiUsageLogs,
    approvedSources,
    approvedChunks
  ] = await Promise.all([
    countRows("chat_sessions"),
    countRows("chat_messages"),
    countRows("rag_retrieval_logs"),
    countRows("ai_usage_logs"),
    countRows("website_json_sources", { approved_for_rag: true, review_status: "approved" }),
    countRows("rag_chunks", { approved_for_rag: true, is_active: true })
  ]);

  return {
    sessions,
    messages,
    ragRetrievals,
    aiUsageLogs,
    approvedSources,
    approvedChunks
  };

  async function countRows(table: string, filters: Record<string, string | boolean> = {}) {
    let query = supabase.from(table).select("*", { count: "exact", head: true });

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { count } = await query;
    return count || 0;
  }
}

export async function loadRecentChatSessions(limit = 12): Promise<ChatLogSession[]> {
  const supabase = createSupabaseAdminClient();
  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("id,session_status,current_state,started_at,last_message_at")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error || !sessions?.length) {
    return [];
  }

  const sessionIds = sessions.map((session) => session.id);
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("id,session_id,role,message,created_at,model_used,metadata")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: true });

  const messagesBySession = new Map<string, ChatLogMessage[]>();

  for (const message of messages || []) {
    const rows = messagesBySession.get(message.session_id) || [];
    rows.push({
      id: message.id,
      role: message.role,
      message: message.message,
      created_at: message.created_at,
      model_used: message.model_used,
      metadata: message.metadata
    });
    messagesBySession.set(message.session_id, rows);
  }

  return sessions.map((session) => ({
    id: session.id,
    session_status: session.session_status,
    current_state: session.current_state,
    started_at: session.started_at,
    last_message_at: session.last_message_at,
    messages: messagesBySession.get(session.id) || []
  }));
}
