import { Settings2 } from "lucide-react";

import { loadServiceOnboardingFields } from "@/lib/onboarding/fields-repository";

export default async function SettingsPage() {
  const services = await loadServiceOnboardingFields();

  return (
    <div className="w-full">
      <div className="mb-6">
        <p className="text-sm font-black uppercase tracking-wider text-brand-accent">
          Phase 3 configuration
        </p>
        <h1 className="mt-2 text-3xl font-black text-brand-ink">Onboarding Fields</h1>
        <p className="mt-2 max-w-3xl text-brand-muted">
          Dynamic questions loaded from Supabase. The chatbot uses these fields to decide what to ask next and how to calculate completion.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-2">
        {services.map((service) => (
          <div className="rounded-xl border border-brand-line bg-white p-5 shadow-soft" key={service.id}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-brand-ink">{service.name}</h2>
                <p className="mt-1 text-sm text-brand-muted">{service.slug}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-pink text-brand-accent">
                <Settings2 size={21} />
              </div>
            </div>

            <div className="space-y-2">
              {service.fields.map((field) => (
                <div
                  className="rounded-lg border border-brand-line bg-[#fffafa] px-4 py-3"
                  key={field.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black text-brand-ink">{field.label}</p>
                    <div className="flex gap-2">
                      <Badge>{field.field_type}</Badge>
                      {field.is_required ? <Badge>required</Badge> : <Badge>optional</Badge>}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-brand-muted">{field.question_text}</p>
                  <p className="mt-2 font-mono text-xs text-brand-muted">{field.field_key}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand-pink px-2 py-1 text-xs font-black text-brand-accent">
      {children}
    </span>
  );
}
