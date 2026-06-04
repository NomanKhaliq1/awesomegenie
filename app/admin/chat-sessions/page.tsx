import { Bot, Database, MessageSquare, SearchCheck, WalletCards } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/shared/stat-card";
import { loadChatDashboardStats, loadRecentChatSessions } from "@/lib/chat-repository";

export default async function ChatSessionsPage() {
  const [stats, sessions] = await Promise.all([
    loadChatDashboardStats(),
    loadRecentChatSessions()
  ]);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-brand-accent">
            Phase 2 monitoring
          </p>
          <h1 className="mt-2 text-3xl font-black text-brand-ink">Chat Logs</h1>
          <p className="mt-2 max-w-3xl text-brand-muted">
            Review recent widget conversations, RAG usage, selected sources, and AI routing.
          </p>
        </div>
        <Link
          className="focus-ring rounded-md bg-brand-accent px-4 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(181,33,47,0.22)]"
          href="/chat"
        >
          Open chat preview
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MessageSquare} label="Sessions" value={stats.sessions} />
        <StatCard icon={Bot} label="Messages" value={stats.messages} />
        <StatCard icon={SearchCheck} label="RAG Retrievals" value={stats.ragRetrievals} />
        <StatCard icon={WalletCards} label="AI Usage Logs" value={stats.aiUsageLogs} />
      </div>

      <section className="mb-6 rounded-lg border border-brand-line bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-brand-ink">Approved RAG Coverage</h2>
            <p className="mt-1 text-sm text-brand-muted">
              The chatbot can answer only from approved sources and approved active chunks.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <CoveragePill label="Approved sources" value={stats.approvedSources} />
            <CoveragePill label="Approved chunks" value={stats.approvedChunks} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-brand-line bg-white shadow-soft">
        <div className="border-b border-brand-line px-5 py-4">
          <h2 className="text-lg font-black text-brand-ink">Recent Sessions</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Latest sessions are shown first. Each assistant message includes provider and RAG source metadata.
          </p>
        </div>

        <div className="divide-y divide-brand-line">
          {sessions.length ? (
            sessions.map((session) => <SessionCard key={session.id} session={session} />)
          ) : (
            <div className="p-6 text-sm font-bold text-brand-muted">
              No chat sessions have been recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CoveragePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-44 rounded-lg border border-brand-line bg-[#fffafa] px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-muted">
        <Database size={15} />
        {label}
      </div>
      <p className="mt-2 text-2xl font-black text-brand-ink">{value}</p>
    </div>
  );
}

function SessionCard({
  session
}: {
  session: Awaited<ReturnType<typeof loadRecentChatSessions>>[number];
}) {
  const assistantMessages = session.messages.filter((message) => message.role === "assistant");
  const lastAssistant = assistantMessages.at(-1);

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-brand-ink">{session.id}</p>
          <p className="mt-1 text-sm text-brand-muted">
            {session.current_state || "unknown"} - {formatDate(session.last_message_at || session.started_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{session.session_status || "unknown"}</Badge>
          {lastAssistant?.metadata?.provider ? <Badge>{lastAssistant.metadata.provider}</Badge> : null}
          <Badge>{lastAssistant?.metadata?.rag_match_count || 0} RAG matches</Badge>
        </div>
      </div>

      <div className="grid gap-3">
        {session.messages.slice(-4).map((message) => (
          <div
            className={`rounded-lg border p-4 ${
              message.role === "user"
                ? "border-brand-line bg-white"
                : "border-brand-line bg-[#fffafa]"
            }`}
            key={message.id}
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wide text-brand-accent">
                {message.role}
              </span>
              <span className="text-xs font-bold text-brand-muted">{formatDate(message.created_at)}</span>
            </div>
            <p className="line-clamp-3 text-sm leading-6 text-brand-ink">{message.message}</p>
            {message.metadata?.rag_sources?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {message.metadata.rag_sources.slice(0, 3).map((source, index) => (
                  <a
                    className="rounded-full bg-brand-pink px-3 py-1 text-xs font-black text-brand-accent hover:underline"
                    href={source.url}
                    key={`${source.url}-${source.score}-${index}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.title || "Source"} ({source.score || 0})
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand-pink px-3 py-1 text-xs font-black text-brand-accent">
      {children}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return "No timestamp";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
