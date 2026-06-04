import { Code2, MonitorSmartphone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { headers } from "next/headers";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Logo } from "@/components/shared/logo";

export default async function ChatPage() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    new URL(process.env.APP_URL || "http://localhost:3000").host;
  const protocol =
    requestHeaders.get("x-forwarded-proto")?.split(",")[0] ||
    (host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  const widgetScriptUrl = `${protocol}://${host}/widget.js`;

  return (
    <main className="min-h-screen bg-[#fbf7f8]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6">
        <header className="mb-5 flex items-center justify-between rounded-lg border border-brand-line bg-white px-5 py-4 shadow-soft">
          <Logo />
          <Link className="text-sm font-bold text-brand-muted hover:text-brand-ink" href="/admin/dashboard">
            Admin
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 lg:grid-cols-[1fr_460px]">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-wider text-brand-accent">
              Website chatbot preview
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-brand-ink">
              Floating widget style for AwesomeTech website
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-brand-muted">
              This is the version that should appear on the public site: compact launcher,
              bottom-right chat panel, quick prompts, upload action, and approved RAG messaging.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-brand-line bg-white p-5 shadow-soft">
                <MonitorSmartphone className="mb-4 text-brand-accent" size={24} />
                <h2 className="font-black text-brand-ink">Embeddable feel</h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Designed as a floating site widget, not a full chatbot page.
                </p>
              </div>
              <div className="rounded-lg border border-brand-line bg-white p-5 shadow-soft">
                <ShieldCheck className="mb-4 text-brand-accent" size={24} />
                <h2 className="font-black text-brand-ink">Approved RAG</h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Copy makes it clear answers use approved AwesomeTech content.
                </p>
              </div>
              <div className="rounded-lg border border-brand-line bg-white p-5 shadow-soft">
                <Code2 className="mb-4 text-brand-accent" size={24} />
                <h2 className="font-black text-brand-ink">Next step</h2>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Later this can be exposed as a script/embed for WordPress.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-brand-line bg-white p-5 shadow-soft">
              <h2 className="font-black text-brand-ink">Future embed target</h2>
              <pre className="mt-3 overflow-x-auto rounded-md bg-brand-pink p-4 text-sm text-brand-ink">
{`<script src="${widgetScriptUrl}"
  data-site="awesometechinc"
  data-position="bottom-right">
</script>`}
              </pre>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <ChatWidget embedded />
          </div>
        </section>
      </div>

      <ChatWidget defaultOpen={false} />
    </main>
  );
}
