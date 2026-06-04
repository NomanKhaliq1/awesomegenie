import fs from "node:fs/promises";
import path from "node:path";
import { knowledgeIndexPath, projectRoot } from "./paths.js";
import { normalizeText } from "./content-utils.js";

const QUERY_STOP_WORDS = new Set([
  "awesome",
  "awesometech",
  "build",
  "can",
  "could",
  "does",
  "have",
  "how",
  "provide",
  "the",
  "you",
  "your",
  "with",
  "work"
]);

export async function searchKnowledgeIndex(query, options = {}) {
  const limit = options.limit || 5;
  const index = await loadKnowledgeIndex();
  const queryTerms = tokenize(query);

  return index
    .map((record) => ({
      ...record,
      score: scoreRecord(record, queryTerms, query)
    }))
    .filter((record) => record.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

export async function getRelevantJson(query) {
  const [selected] = await searchKnowledgeIndex(query, { limit: 1 });
  if (!selected) return null;

  const jsonPath = path.join(projectRoot, selected.json_file_path.replace(/^\/+/, ""));
  const content = await fs.readFile(jsonPath, "utf8");
  return {
    index_record: selected,
    json_file_path: selected.json_file_path,
    json: JSON.parse(content)
  };
}

export function buildRagContext(selectedJson) {
  const payload = selectedJson?.json || selectedJson;
  if (!payload) return "";

  const sections = (payload.sections || [])
    .slice(0, 6)
    .map((section) => {
      const content = normalizeText(section.content || "").slice(0, 900);
      const buttons = (section.buttons || [])
        .map((button) => `${button.label}: ${button.url}`)
        .join("; ");
      const forms = (section.forms || [])
        .map((form) => `${form.form_type}${form.form_id ? ` #${form.form_id}` : ""}: ${form.fields.map((field) => field.name).join(", ")}`)
        .join("; ");

      return [
        `Section: ${section.title}`,
        content && `Content: ${content}`,
        buttons && `CTA links: ${buttons}`,
        forms && `Forms: ${forms}`
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    `Source type: ${payload.source_type}`,
    `Title: ${payload.title}`,
    `URL: ${payload.url}`,
    `Summary: ${payload.summary}`,
    `Keywords: ${(payload.keywords || []).join(", ")}`,
    sections
  ]
    .filter(Boolean)
    .join("\n");
}

async function loadKnowledgeIndex() {
  const content = await fs.readFile(knowledgeIndexPath, "utf8");
  return JSON.parse(content);
}

function scoreRecord(record, queryTerms, query) {
  const rawQuery = normalizeText(query).toLowerCase();
  const phrase = queryTerms.join(" ");
  const weightedFields = [
    { value: record.title, weight: 10 },
    { value: record.slug, weight: 9 },
    { value: (record.keywords || []).join(" "), weight: 6 },
    { value: record.summary, weight: 3 },
    { value: record.url, weight: 2 }
  ];

  let score = weightedFields.reduce((total, field) => {
    const text = normalizeText(field.value || "").toLowerCase();
    return (
      total +
      queryTerms.reduce((fieldScore, term) => {
        if (text.includes(term)) return fieldScore + field.weight;
        return fieldScore;
      }, 0)
    );
  }, 0);

  const searchable = normalizeText(
    `${record.title} ${record.slug} ${(record.keywords || []).join(" ")} ${record.summary}`
  ).toLowerCase();

  if (phrase && searchable.includes(phrase)) score += 30;
  if (queryTerms.includes("contact") && /(^|[-\s])contact([-_\s]|$)|contact us/i.test(searchable)) score += 60;
  if (queryTerms.includes("mortgage") && queryTerms.includes("website") && /mortgage[-\s]website/.test(searchable)) {
    score += 35;
  }
  if (/build|develop|development/.test(rawQuery) && /mortgage[-\s]website[-\s]development/.test(searchable)) {
    score += 24;
  }
  if (queryTerms.includes("mismo") && /mismo[-\s]integration|integration[-\s]service/.test(searchable)) score += 25;
  if (queryTerms.includes("mismo") && !/bytepro|meridianlink/.test(rawQuery) && /mismo[-\s]integration[-\s]service/.test(searchable)) {
    score += 18;
  }
  if (queryTerms.includes("encompass") && /encompass[-\s](service|services|integration|automation|development)/.test(searchable)) {
    score += 18;
  }
  if (record.source_type === "page" && /\b(service|services|contact|integration|development|automation)\b/.test(searchable)) {
    score += 8;
  }

  return score;
}

function tokenize(query) {
  return [
    ...new Set(
      normalizeText(query)
        .toLowerCase()
        .match(/[a-z][a-z0-9]{2,}/g)
        ?.map((term) => singularize(term))
        .filter((term) => !QUERY_STOP_WORDS.has(term)) || []
    )
  ];
}

function singularize(term) {
  if (term.endsWith("ies") && term.length > 4) return `${term.slice(0, -3)}y`;
  if (term.endsWith("s") && term.length > 3) return term.slice(0, -1);
  return term;
}
