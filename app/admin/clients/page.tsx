import { CheckCircle2, ClipboardList, MessageSquare, Search } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/shared/stat-card";
import { loadClientLeadSummaries, loadRequirementStats, loadRequirementSummaries } from "@/lib/clients-repository";

export default async function ClientsPage() {
  const [stats, requirements, clients] = await Promise.all([
    loadRequirementStats(),
    loadRequirementSummaries(),
    loadClientLeadSummaries()
  ]);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-brand-accent">
            Phase 3 onboarding
          </p>
          <h1 className="mt-2 text-3xl font-black text-brand-ink">Client Requirements</h1>
          <p className="mt-2 max-w-3xl text-brand-muted">
            Requirement memory captured from chatbot conversations, grouped by service and completion score.
          </p>
        </div>
        <Link
          className="focus-ring rounded-md bg-brand-accent px-4 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(181,33,47,0.22)]"
          href="/chat"
        >
          Test onboarding chat
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ClipboardList} label="Requirement Sets" value={stats.total} />
        <StatCard icon={CheckCircle2} label="Qualified" value={stats.qualified} note="80% completion or higher" />
        <StatCard icon={Search} label="Needs Info" value={stats.needsInfo} />
        <StatCard icon={MessageSquare} label="Client Leads" value={clients.length} note={`${stats.averageCompletion}% average score`} />
      </div>

      <section className="mb-6 overflow-hidden rounded-lg border border-brand-line bg-white shadow-soft">
        <div className="border-b border-brand-line px-5 py-4">
          <h2 className="text-lg font-black text-brand-ink">Client Leads</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Leads are created automatically once the chatbot captures a company or email.
          </p>
        </div>
        <div className="grid gap-3 p-5 lg:grid-cols-3">
          {clients.length ? (
            clients.slice(0, 9).map((client) => (
              <div className="rounded-lg border border-brand-line bg-[#fffafa] p-4" key={client.id}>
                <p className="truncate font-black text-brand-ink">{client.company_name || "Unnamed company"}</p>
                <p className="mt-1 truncate text-sm text-brand-muted">{client.email || "No email captured"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-pink px-3 py-1 text-xs font-black text-brand-accent">
                    {client.status || "new"}
                  </span>
                  {client.service_interest ? (
                    <span className="rounded-full bg-brand-pink px-3 py-1 text-xs font-black text-brand-accent">
                      {client.service_interest}
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm font-bold text-brand-muted">No client leads captured yet.</div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-brand-line bg-white shadow-soft">
        <div className="border-b border-brand-line px-5 py-4">
          <h2 className="text-lg font-black text-brand-ink">Recent Requirement Memory</h2>
          <p className="mt-1 text-sm text-brand-muted">
            The chatbot updates these rows as it collects answers from the visitor.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
            <thead className="bg-brand-pink text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-5 py-3">Service</th>
                <th className="px-5 py-3">Completion</th>
                <th className="px-5 py-3">Captured</th>
                <th className="px-5 py-3">Missing</th>
                <th className="px-5 py-3">Session</th>
              </tr>
            </thead>
            <tbody>
              {requirements.length ? (
                requirements.map((requirement) => (
                  <tr className="border-t border-brand-line" key={requirement.id}>
                    <td className="px-5 py-4">
                      <p className="font-black text-brand-ink">
                        {requirement.service_type || requirement.service_categories?.name || "Uncategorized"}
                      </p>
                      <p className="mt-1 text-xs text-brand-muted">
                        {formatDate(requirement.updated_at)}
                      </p>
                      <Link
                        className="mt-2 inline-flex text-xs font-black text-brand-accent hover:underline"
                        href={`/admin/clients/${requirement.id}`}
                      >
                        View details
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-brand-pink">
                          <div
                            className="h-full rounded-full bg-brand-accent"
                            style={{ width: `${Number(requirement.completion_score || 0)}%` }}
                          />
                        </div>
                        <span className="font-black text-brand-ink">
                          {Number(requirement.completion_score || 0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-md flex-wrap gap-1">
                        {Object.keys(requirement.requirements_json || {})
                          .filter((key) => key !== "service_type")
                          .slice(0, 6)
                          .map((key) => (
                            <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700" key={key}>
                              {key}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex max-w-md flex-wrap gap-1">
                        {(requirement.missing_fields_json || []).length ? (
                          (requirement.missing_fields_json || []).map((field) => (
                            <span className="rounded bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700" key={field}>
                              {field}
                            </span>
                          ))
                        ) : (
                          <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                            Complete
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {requirement.session_id ? (
                        <span className="font-mono text-xs text-brand-muted">{requirement.session_id}</span>
                      ) : (
                        <span className="text-brand-muted">No session</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-sm font-bold text-brand-muted" colSpan={5}>
                    No requirement memory has been captured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "No timestamp";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
