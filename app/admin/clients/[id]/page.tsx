import { notFound } from "next/navigation";
import Link from "next/link";

import {
  markRequirementCompleted,
  markRequirementNeedsInfo,
  markRequirementReviewed
} from "@/app/admin/clients/[id]/actions";
import { loadRequirementDetail } from "@/lib/clients-repository";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ChatMessageRow = {
  id: string;
  role: string;
  message: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export default async function RequirementDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requirement = await loadRequirementDetail(id);

  if (!requirement) {
    notFound();
  }

  const messages = requirement.session_id
    ? await loadSessionMessages(requirement.session_id)
    : [];

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-brand-accent">
            Requirement detail
          </p>
          <h1 className="mt-2 text-3xl font-black text-brand-ink">
            {requirement.service_type || "Client requirement"}
          </h1>
          <p className="mt-2 max-w-3xl text-brand-muted">
            Full requirement memory, field-level values, and linked conversation history.
          </p>
        </div>
        <Link
          className="focus-ring rounded-md border border-brand-line bg-white px-4 py-3 text-sm font-black text-brand-ink"
          href="/admin/clients"
        >
          Back to clients
        </Link>
      </div>

      <section className="mb-6 rounded-xl border border-brand-line bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-brand-ink">PM Review Actions</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Update the lead status after reviewing captured requirements.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusForm action={markRequirementNeedsInfo} id={requirement.id} label="Needs info" variant="secondary" />
            <StatusForm action={markRequirementReviewed} id={requirement.id} label="Mark reviewed" variant="primary" />
            <StatusForm action={markRequirementCompleted} id={requirement.id} label="Complete" variant="secondary" />
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <SummaryCard label="Completion" value={`${Number(requirement.completion_score || 0)}%`} />
        <SummaryCard label="Client" value={requirement.clients?.company_name || "Not captured"} note={requirement.clients?.email || ""} />
        <SummaryCard label="Status" value={requirement.clients?.status || "Requirement memory"} />
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-brand-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-black text-brand-ink">Field Values</h2>
          <div className="mt-4 space-y-3">
            {requirement.client_requirement_values.map((field) => (
              <div className="rounded-lg border border-brand-line bg-[#fffafa] p-4" key={field.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-brand-ink">{field.field_label || field.field_key}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      field.is_missing
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {field.is_missing ? "Missing" : "Captured"}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-muted">
                  {formatValue(field.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-brand-line bg-white p-5 shadow-soft">
          <h2 className="text-lg font-black text-brand-ink">Requirements JSON</h2>
          <pre className="mt-4 max-h-[620px] overflow-auto rounded-lg bg-brand-pink p-4 text-xs leading-6 text-brand-ink">
            {JSON.stringify(requirement.requirements_json || {}, null, 2)}
          </pre>
        </div>
      </section>

      <section className="rounded-xl border border-brand-line bg-white shadow-soft">
        <div className="border-b border-brand-line px-5 py-4">
          <h2 className="text-lg font-black text-brand-ink">Conversation</h2>
          <p className="mt-1 text-sm text-brand-muted">
            Messages linked to the session that produced this requirement memory.
          </p>
        </div>
        <div className="divide-y divide-brand-line">
          {messages.length ? (
            messages.map((message) => (
              <div className="p-5" key={message.id}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wide text-brand-accent">
                    {message.role}
                  </span>
                  <span className="text-xs font-bold text-brand-muted">{formatDate(message.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-brand-ink">{message.message}</p>
              </div>
            ))
          ) : (
            <div className="p-5 text-sm font-bold text-brand-muted">
              No linked chat messages found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-brand-line bg-white p-5 shadow-soft">
      <p className="text-sm font-black uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-2 text-2xl font-black text-brand-ink">{value}</p>
      {note ? <p className="mt-2 text-sm text-brand-muted">{note}</p> : null}
    </div>
  );
}

function StatusForm({
  action,
  id,
  label,
  variant
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  variant: "primary" | "secondary";
}) {
  return (
    <form action={action}>
      <input name="requirement_id" type="hidden" value={id} />
      <button
        className={`focus-ring rounded-md px-4 py-3 text-sm font-black ${
          variant === "primary"
            ? "bg-brand-accent text-white shadow-[0_12px_30px_rgba(181,33,47,0.22)]"
            : "border border-brand-line bg-white text-brand-ink"
        }`}
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}

async function loadSessionMessages(sessionId: string): Promise<ChatMessageRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("id,role,message,created_at,metadata")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return data || [];
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not captured";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
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
