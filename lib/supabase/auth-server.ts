import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import WebSocket from "ws";

import { getRequiredBrowserEnv } from "@/lib/env";

export async function createSupabaseAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getRequiredBrowserEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredBrowserEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components can read cookies but cannot always write refreshed auth cookies.
          }
        }
      },
      realtime: {
        transport: WebSocket as never
      }
    }
  );
}
