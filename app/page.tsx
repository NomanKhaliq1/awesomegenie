import { LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { signInAction } from "@/app/actions/auth";
import { Logo } from "@/components/shared/logo";

const errorMessages: Record<string, string> = {
  missing_credentials: "Email and password are required.",
  invalid_login: "Email or password is incorrect.",
  not_admin: "This account does not have admin dashboard access."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params?.error ? errorMessages[params.error] : null;

  return (
    <main className="min-h-screen bg-brand-pink">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden lg:block">
          <p className="text-sm font-black uppercase tracking-wider text-brand-accent">
            AwesomeTech internal system
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight text-brand-ink">
            AI client onboarding control center
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-brand-muted">
            Review leads, approve website knowledge for RAG, manage onboarding fields, and prepare PM handoffs.
          </p>
          <div className="mt-8 grid max-w-lg gap-3">
            {[
              "Admin/PM dashboard access",
              "Approved RAG knowledge workflow",
              "Client onboarding and project brief pipeline"
            ].map((item) => (
              <div className="flex items-center gap-3 rounded-lg border border-brand-line bg-white p-4 shadow-soft" key={item}>
                <ShieldCheck className="text-brand-accent" size={20} />
                <span className="font-bold text-brand-ink">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-xl border border-brand-line bg-white p-8 shadow-soft">
          <div className="mb-8">
            <Logo />
            <p className="mt-6 text-sm font-black uppercase tracking-wider text-brand-accent">
              Admin login
            </p>
            <h2 className="mt-2 text-3xl font-black text-brand-ink">Welcome back</h2>
            <p className="mt-2 leading-7 text-brand-muted">
              Sign in to manage Awesome Genie operations.
            </p>
          </div>

          <form action={signInAction} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-bold text-brand-ink">Email</span>
              <div className="flex items-center gap-3 rounded-md border border-brand-line px-3 py-3">
                <Mail size={18} className="text-brand-muted" />
                <input
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-brand-muted"
                  name="email"
                  placeholder="admin@awesometechinc.com"
                  type="email"
                />
              </div>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-brand-ink">Password</span>
              <div className="flex items-center gap-3 rounded-md border border-brand-line px-3 py-3">
                <LockKeyhole size={18} className="text-brand-muted" />
                <input
                  className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-brand-muted"
                  name="password"
                  placeholder="Enter password"
                  type="password"
                />
              </div>
            </label>

            {errorMessage ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              className="focus-ring mt-2 rounded-md bg-brand-accent px-4 py-3 text-center text-sm font-black text-white shadow-[0_12px_30px_rgba(181,33,47,0.22)]"
              type="submit"
            >
              Sign in
            </button>
          </form>

          <div className="mt-6 border-t border-brand-line pt-5 text-sm text-brand-muted">
            Chatbot website preview:
            <Link className="ml-2 font-black text-brand-accent hover:underline" href="/widget">
              Open widget
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
