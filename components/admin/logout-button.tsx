import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-brand-muted transition hover:bg-brand-pink hover:text-brand-ink"
        type="submit"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-brand-muted transition">
          <LogOut size={18} />
        </span>
        Sign out
      </button>
    </form>
  );
}
