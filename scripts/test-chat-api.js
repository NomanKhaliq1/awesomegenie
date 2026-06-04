import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true, quiet: true });

const baseUrl = process.env.APP_URL || "http://localhost:3000";
const queries = [
  "Do you build mortgage websites?",
  "Do you provide MISMO integration?",
  "Can you help with MISMO?",
  "Do you work with Encompass?",
  "How can I contact AwesomeTech?",
  "I need a Power BI dashboard"
];

console.log(`Testing chat API at ${baseUrl}`);

for (const query of queries) {
  const response = await fetch(`${baseUrl}/api/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: query })
  });
  const data = await response.json();

  console.log("\nQuery:", query);
  console.log("Status:", response.status);
  console.log("Intent:", data.intent || "unknown");
  console.log("Used approved RAG:", Boolean(data.used_approved_rag));
  console.log("Provider:", data.provider || "none");
  console.log("Sources:", (data.sources || []).map((source) => source.title).join(" | ") || "none");
  console.log("Answer:", String(data.message?.message || data.error || "").replace(/\s+/g, " ").slice(0, 240));
}
