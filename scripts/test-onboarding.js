import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

dotenv.config({ path: ".env.local", override: true, quiet: true });

const baseUrl = process.env.APP_URL || "http://localhost:3000";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket }
  }
);

const messages = [
  "I need a Power BI dashboard for our sales reporting workflow using Salesforce and SQL data.",
  "We are Apex Lending and we use Power BI today. Email me at pm@example.com. The dashboard is for sales managers.",
  "Timeline is ASAP and budget is $25k-$50k.",
  "I also need Encompass automation for status updates and CRM sync."
];

let sessionId = null;

for (const message of messages) {
  const response = await fetch(`${baseUrl}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, message })
  });
  const data = await response.json();
  sessionId = data.session_id;

  console.log("\nUser:", message);
  console.log("Status:", response.status);
  console.log("Intent:", data.intent);
  console.log("Completion:", data.onboarding?.completion_score ?? "none");
  console.log("Missing:", (data.onboarding?.missing_fields || []).join(", ") || "none");
  console.log("Answer:", String(data.message?.message || data.error || "").replace(/\s+/g, " ").slice(0, 260));
}

const { data: requirement, error } = await supabase
  .from("client_requirements")
  .select("id,service_type,completion_score,missing_fields_json,requirements_json")
  .eq("session_id", sessionId)
  .order("updated_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (error) {
  throw error;
}

console.log("\nSaved requirement:");
console.log(JSON.stringify(requirement, null, 2));

const { data: sessionRequirements } = await supabase
  .from("client_requirements")
  .select("id,service_type,completion_score,missing_fields_json,requirements_json")
  .eq("session_id", sessionId)
  .order("created_at", { ascending: true });

console.log("\nAll requirements for session:");
console.log(JSON.stringify(sessionRequirements, null, 2));
