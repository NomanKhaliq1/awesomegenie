import { CheckCircle2, FileWarning, Search, ShieldOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  approveCoreKnowledgeSources,
  approveKnowledgeSource,
  disableKnowledgeSource
} from "@/app/admin/knowledge/actions";
import { loadExtractionReport } from "@/lib/knowledge-repository";

const statusStyles: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  needs_review: "bg-amber-50 text-amber-700 border-amber-200",
  skipped: "bg-slate-50 text-slate-600 border-slate-200"
};

const pageSize = 25;
const statusOptions = [
  { label: "All", value: "all" },
  { label: "OK", value: "ok" },
  { label: "Needs review", value: "needs_review" },
  { label: "Skipped", value: "skipped" }
];
const coreServiceSlugs = [
  "mortgage-website-development-services",
  "best-modern-mortgage-website-designs",
  "mismo-integration-service",
  "mismo-meridianlink-integration",
  "mismo-bytepro-integration",
  "mortgage-automation-software-for-encompass",
  "mortgage-technology-for-encompass",
  "ultimate-guide-to-encompass-integration-for-faster-smarter-lending",
  "power-bi-consulting-services",
  "power-bi-development",
  "what-is-power-bi",
  "contact-us"
];

export default async function KnowledgePage({
  searchParams
}: {
  searchParams?: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const activeStatus = statusOptions.some((option) => option.value === params?.status)
    ? params?.status || "all"
    : "all";
  const currentPage = Math.max(1, Number(params?.page || 1) || 1);
  const report = await loadExtractionReport();
  const sortedRows = [...report.records].sort((a, b) => {
    const rank = (status: string) => (status === "needs_review" ? 0 : status === "skipped" ? 1 : 2);
    return rank(a.status) - rank(b.status) || b.word_count - a.word_count;
  });
  const filteredRows =
    activeStatus === "all"
      ? sortedRows
      : sortedRows.filter((record) => record.status === activeStatus);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const priorityRows = sortedRows
    .filter((record) => record.status !== "skipped" && record.word_count > 250)
    .slice(0, 6);
  const coreRows = sortedRows
    .filter((record) => coreServiceSlugs.includes(record.slug))
    .sort((a, b) => coreServiceSlugs.indexOf(a.slug) - coreServiceSlugs.indexOf(b.slug));

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-brand-accent">
            Knowledge approval
          </p>
          <h1 className="mt-2 text-3xl font-black text-brand-ink">Website Knowledge</h1>
          <p className="mt-2 max-w-3xl text-brand-muted">
            Synced content is visible here first. Production chatbot answers should use only
            sources approved for RAG.
          </p>
        </div>
        <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-brand-accent px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(181,33,47,0.22)]">
          <Search size={18} />
          Sync sitemap
        </button>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <SummaryPill icon={CheckCircle2} label="OK" value={report.summary.ok_count} />
        <SummaryPill icon={FileWarning} label="Needs review" value={report.summary.needs_review_count} />
        <SummaryPill icon={ShieldOff} label="Skipped" value={report.summary.skipped_count} />
      </div>

      <section className="mb-5 rounded-lg border border-brand-line bg-white p-5 shadow-soft">
        <div className="mb-5 rounded-lg border border-brand-line bg-[#fffafa] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-brand-ink">Core service approvals</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Approve these first so Phase 2 can answer mortgage, MISMO, Encompass, Power BI, and contact questions.
              </p>
            </div>
            <form action={approveCoreKnowledgeSources}>
              {coreRows.map((record) => (
                <input key={record.url} name="urls" type="hidden" value={record.url} />
              ))}
              <button
                className="focus-ring rounded-md bg-brand-accent px-4 py-3 text-sm font-black text-white"
                disabled={!coreRows.length}
                type="submit"
              >
                Approve core sources
              </button>
            </form>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {coreRows.map((record) => (
              <div className="rounded-md border border-brand-line bg-white px-3 py-2" key={record.url}>
                <p className="truncate text-sm font-black text-brand-ink">{record.slug}</p>
                <p className="mt-1 text-xs text-brand-muted">
                  {record.word_count} words - {record.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-brand-ink">Recommended approvals</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Start with high-content service pages, then use the table for full review.
            </p>
          </div>
          <span className="rounded-full bg-brand-pink px-3 py-1 text-xs font-black text-brand-accent">
            {sortedRows.length} total sources
          </span>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {priorityRows.map((record) => (
            <div className="rounded-lg border border-brand-line bg-[#fffafa] p-4" key={record.url}>
              <div className="min-w-0">
                <p className="truncate font-black text-brand-ink">{record.slug}</p>
                <p className="mt-1 text-sm text-brand-muted">
                  {record.word_count} words - {record.headings_count} headings
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <form action={approveKnowledgeSource}>
                  <input name="url" type="hidden" value={record.url} />
                  <button className="focus-ring rounded-md bg-brand-accent px-3 py-2 text-xs font-black text-white" type="submit">
                    Approve
                  </button>
                </form>
                <a className="focus-ring rounded-md border border-brand-line px-3 py-2 text-xs font-black text-brand-muted" href={record.url} rel="noreferrer" target="_blank">
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-brand-line bg-white shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-brand-ink">Knowledge sources</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Showing {paginatedRows.length} of {filteredRows.length} sources.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Link
                className={`focus-ring rounded-full border px-3 py-2 text-xs font-black ${
                  activeStatus === option.value
                    ? "border-brand-accent bg-brand-accent text-white"
                    : "border-brand-line bg-white text-brand-muted hover:text-brand-ink"
                }`}
                href={`/admin/knowledge?status=${option.value}&page=1`}
                key={option.value}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-brand-pink text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Words</th>
                <th className="px-5 py-3">Headings</th>
                <th className="px-5 py-3">Forms</th>
                <th className="px-5 py-3">Warnings</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((record) => (
                <tr className="border-t border-brand-line" key={record.url}>
                  <td className="max-w-[360px] px-5 py-3">
                    <div className="font-black text-brand-ink">{record.slug}</div>
                    <a className="mt-1 block truncate text-xs text-brand-muted hover:text-brand-accent" href={record.url}>
                      {record.url}
                    </a>
                    {record.skip_reason ? (
                      <p className="mt-2 text-xs text-brand-muted">{record.skip_reason}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-black ${statusStyles[record.status] ?? statusStyles.ok}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-bold text-brand-ink">{record.word_count}</td>
                  <td className="px-5 py-3 text-brand-muted">{record.headings_count}</td>
                  <td className="px-5 py-3 text-brand-muted">{record.forms_count}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {record.warnings.length ? (
                        record.warnings.map((warning) => (
                          <span className="rounded bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700" key={warning}>
                            {warning}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-brand-muted">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <form action={approveKnowledgeSource}>
                        <input name="url" type="hidden" value={record.url} />
                        <button
                          className="focus-ring inline-flex items-center gap-2 rounded-md border border-brand-line px-3 py-2 text-xs font-bold text-brand-muted hover:border-brand-accent hover:text-brand-accent"
                          type="submit"
                        >
                          Approve
                        </button>
                      </form>
                      <form action={disableKnowledgeSource}>
                        <input name="url" type="hidden" value={record.url} />
                        <button
                          className="focus-ring inline-flex items-center gap-2 rounded-md border border-brand-line px-3 py-2 text-xs font-bold text-brand-muted hover:text-brand-ink"
                          type="submit"
                        >
                          Disable
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-line px-5 py-4">
          <p className="text-sm font-bold text-brand-muted">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Link
              aria-disabled={safePage <= 1}
              className={`focus-ring rounded-md border border-brand-line px-3 py-2 text-sm font-black ${
                safePage <= 1 ? "pointer-events-none text-brand-muted opacity-45" : "text-brand-ink hover:text-brand-accent"
              }`}
              href={`/admin/knowledge?status=${activeStatus}&page=${Math.max(1, safePage - 1)}`}
            >
              Previous
            </Link>
            {buildPageWindow(safePage, totalPages).map((page) => (
              <Link
                className={`focus-ring rounded-md border px-3 py-2 text-sm font-black ${
                  page === safePage
                    ? "border-brand-accent bg-brand-accent text-white"
                    : "border-brand-line text-brand-muted hover:text-brand-ink"
                }`}
                href={`/admin/knowledge?status=${activeStatus}&page=${page}`}
                key={page}
              >
                {page}
              </Link>
            ))}
            <Link
              aria-disabled={safePage >= totalPages}
              className={`focus-ring rounded-md border border-brand-line px-3 py-2 text-sm font-black ${
                safePage >= totalPages ? "pointer-events-none text-brand-muted opacity-45" : "text-brand-ink hover:text-brand-accent"
              }`}
              href={`/admin/knowledge?status=${activeStatus}&page=${Math.min(totalPages, safePage + 1)}`}
            >
              Next
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function buildPageWindow(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function SummaryPill({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-brand-line bg-white p-4 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-pink text-brand-accent">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-brand-muted">{label}</p>
        <p className="text-2xl font-black text-brand-ink">{value}</p>
      </div>
    </div>
  );
}
