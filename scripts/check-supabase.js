import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

dotenv.config({ path: ".env.local", override: true, quiet: true });

const required = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    realtime: {
      transport: WebSocket
    }
  }
);

const { data, error } = await supabase
  .from("service_categories")
  .select("id, slug")
  .limit(1);

if (error) {
  console.error("Supabase connection reached, but schema check failed.");
  console.error(`Table check: ${error.message}`);
  console.error("Apply supabase/migrations/0001_initial_schema.sql and supabase/seed.sql, then run this again.");
  process.exit(1);
}

console.log("Supabase connection OK.");
console.log(`Schema OK. service_categories rows visible: ${data?.length ?? 0}`);
