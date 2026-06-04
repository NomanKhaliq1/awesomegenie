import { buildRagContext, getRelevantJson, searchKnowledgeIndex } from "./rag.js";

const queries = [
  "Do you build mortgage websites?",
  "Do you provide MISMO integration?",
  "Do you work with Encompass?",
  "How can I contact AwesomeTech?",
  "Do you provide Power BI dashboards?"
];

for (const query of queries) {
  const matches = await searchKnowledgeIndex(query, { limit: 3 });
  const selected = await getRelevantJson(query);

  console.log(`\nQuery: ${query}`);
  if (!selected) {
    console.log("Selected: no matching JSON file");
    continue;
  }

  console.log(`Selected: ${selected.json_file_path}`);
  console.log(`Title: ${selected.json.title}`);
  console.log(`Context preview: ${buildRagContext(selected).slice(0, 500)}...`);
  console.log(
    `Top matches: ${matches
      .map((match) => `${match.title} (${match.score})`)
      .join(" | ")}`
  );
}
