import { BarChart3, Database, MessageSquare, Settings, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/app/actions/auth";
import { LogoutButton } from "@/components/admin/logout-button";
import { Logo } from "@/components/shared/logo";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/knowledge", label: "Knowledge", icon: Database },
  { href: "/admin/chat-sessions", label: "Chat Logs", icon: MessageSquare },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAdminUser();

  if (!user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#fbf4f5]">
      <div className="grid min-h-screen lg:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="sticky top-0 flex h-screen flex-col overflow-hidden border-r border-brand-line bg-white px-5 py-6">
          <div className="pb-6">
            <Logo />
          </div>
          <div className="rounded-lg border border-brand-line bg-brand-pink p-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-accent">
              <ShieldCheck size={16} />
              RAG Guard
            </div>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Customer answers use approved website knowledge only.
            </p>
          </div>
          <nav className="mt-7 grid gap-1">
            {navItems.map((item) => (
              <Link
                className="group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-brand-muted transition hover:bg-brand-pink hover:text-brand-ink"
                href={item.href}
                key={item.href}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-brand-muted transition group-hover:border-brand-line group-hover:bg-white group-hover:text-brand-accent">
                  <item.icon size={18} />
                </span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-2">
            <LogoutButton />
          </div>
          <div className="mt-auto rounded-lg border border-brand-line bg-white p-4">
            <p className="text-sm font-black text-brand-ink">Signed in</p>
            <p className="mt-1 text-sm leading-6 text-brand-muted">
              {user.email}
            </p>
          </div>
        </aside>
        <section className="min-w-0 px-5 py-6 lg:px-7 xl:px-8">{children}</section>
      </div>
    </main>
  );
}
