import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  note?: string;
};

export function StatCard({ label, value, icon: Icon, note }: StatCardProps) {
  return (
    <div className="group rounded-xl border border-brand-line bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(36,24,30,0.12)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-brand-muted">{label}</p>
          <p className="mt-2 text-3xl font-black text-brand-ink">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-pink text-brand-accent transition group-hover:bg-brand-accent group-hover:text-white">
          <Icon size={22} />
        </div>
      </div>
      {note ? <p className="mt-3 text-sm text-brand-muted">{note}</p> : null}
    </div>
  );
}
