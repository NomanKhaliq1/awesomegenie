import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

import { getRequiredServerEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  return createClient(
    getRequiredServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      realtime: {
        transport: WebSocket as never
      }
    }
  );
}
