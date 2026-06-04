import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  FileWarning,
  FolderGit2,
  Gauge,
  MessageSquare,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/shared/stat-card";
import { loadChatDashboardStats } from "@/lib/chat-repository";
import { loadExtractionReport, loadKnowledgeIndex } from "@/lib/knowledge-repository";

export default async function AdminDashboardPage() {
  const [report, index, chatStats] = await Promise.all([
    loadExtractionReport(),
    loadKnowledgeIndex(),
    loadChatDashboardStats()
  ]);
  const activeSources = index.filter((record) => record.status !== "skipped");
  const healthPercent = report.summary.total_urls
    ? Math.round((report.summary.ok_count / report.summary.total_urls) * 100)
    : 0;
  const reviewItems = report.records.filter((record) => record.status === "needs_review").slice(0, 4);

  return (
    <div className="w-full">
      <section className="mb-6 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-soft">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#ffffff_0%,#fff5f6_52%,#f5e6e8_100%)] p-6 lg:grid-cols-[1fr_360px] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-brand-accent">
              <ShieldCheck size={15} />
              Admin dashboard
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight text-brand-ink">
              Awesome Genie Operations
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-brand-muted">
              Monitor website knowledge quality, approve RAG sources, and prepare the app for
              Supabase-backed onboarding workflows.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="focus-ring inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(181,33,47,0.22)]"
                href="/admin/knowledge"
              >
                Review knowledge <ArrowRight size={17} />
              </Link>
              <Link
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-black text-brand-ink"
                href="/widget"
              >
                Preview widget
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-line bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-brand-muted">Extraction Health</p>
                <p className="mt-2 text-4xl font-black text-brand-ink">{healthPercent}%</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-pink text-brand-accent">
                <Gauge size={28} />
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-brand-pink">
              <div className="h-full rounded-full bg-brand-accent" style={{ width: `${healthPercent}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-brand-pink p-2">
                <p className="font-black text-brand-ink">{report.summary.ok_count}</p>
                <p className="text-brand-muted">OK</p>
              </div>
              <div className="rounded-lg bg-brand-pink p-2">
                <p className="font-black text-brand-ink">{report.summary.needs_review_count}</p>
                <p className="text-brand-muted">Review</p>
              </div>
              <div className="rounded-lg bg-brand-pink p-2">
                <p className="font-black text-brand-ink">{report.summary.skipped_count}</p>
                <p className="text-brand-muted">Skipped</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Database} label="Total URLs" value={report.summary.total_urls} />
        <StatCard icon={CheckCircle2} label="OK Sources" value={report.summary.ok_count} />
        <StatCard icon={FileWarning} label="Needs Review" value={report.summary.needs_review_count} />
        <StatCard icon={FolderGit2} label="Skipped" value={report.summary.skipped_count} />
        <StatCard icon={Bot} label="Approved Sources" value={chatStats.approvedSources} note={`${chatStats.approvedChunks} approved chunks`} />
        <StatCard icon={MessageSquare} label="Chat Sessions" value={chatStats.sessions} note={`${chatStats.messages} logged messages`} />
        <StatCard icon={Gauge} label="RAG Retrievals" value={chatStats.ragRetrievals} note="Approved-source retrieval logs" />
        <StatCard icon={WalletCards} label="AI Usage" value={chatStats.aiUsageLogs} note="Provider routing logs" />
      </div>

      <section className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-brand-line bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-brand-ink">Phase progress</h2>
              <p className="mt-1 text-sm text-brand-muted">Current implementation order</p>
            </div>
            <Clock3 className="text-brand-accent" size={24} />
          </div>
          <div className="mt-6 space-y-4">
            {[
              { label: "Phase 0", title: "Local RAG proof of concept", status: "Complete" },
              { label: "Phase 1", title: "Supabase foundation", status: "Complete" },
              { label: "Phase 2", title: "Basic chat + approved RAG", status: "Complete" },
              { label: "Phase 3", title: "Dynamic onboarding memory", status: "In progress" }
            ].map((item, index) => (
              <div className="flex gap-3" key={item.label}>
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-pink text-xs font-black text-brand-accent">
                    {index + 1}
                  </div>
                  {index < 3 ? <div className="h-full min-h-8 w-px bg-brand-line" /> : null}
                </div>
                <div className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-brand-ink">{item.title}</p>
                    <span className="rounded-full bg-brand-pink px-2 py-1 text-xs font-black text-brand-accent">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-brand-muted">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-brand-line bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-brand-ink">Review queue</h2>
              <p className="mt-1 text-sm text-brand-muted">Useful low-content pages need PM review</p>
            </div>
            <Link className="text-sm font-black text-brand-accent hover:underline" href="/admin/knowledge">
              Open all
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {reviewItems.map((record) => (
              <div
                className="flex items-center justify-between gap-4 rounded-lg border border-brand-line bg-[#fffafa] p-4"
                key={record.url}
              >
                <div className="min-w-0">
                  <p className="truncate font-black text-brand-ink">{record.slug}</p>
                  <p className="mt-1 text-sm text-brand-muted">
                    {record.word_count} words - {record.headings_count} headings - {record.forms_count} forms
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                  {record.warnings.join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-brand-line bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-brand-ink">Highest content volume</h2>
            <p className="mt-1 text-sm text-brand-muted">
              These sources are strong candidates for service/blog RAG after approval.
            </p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {report.summary.pages_with_highest_content_volume.slice(0, 6).map((record) => (
            <div className="rounded-lg border border-brand-line p-4" key={record.url}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-black text-brand-ink">{record.slug}</p>
                  <p className="mt-1 text-sm text-brand-muted">{record.url}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-pink px-3 py-1 text-xs font-black text-brand-accent">
                  {record.word_count} words
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
