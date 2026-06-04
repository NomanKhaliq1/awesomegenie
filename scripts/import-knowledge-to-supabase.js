import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

dotenv.config({ path: ".env.local", override: true, quiet: true });

const root = process.cwd();
const generatedRoot = path.join(root, "data", "generated");
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

const knowledgeIndex = await readJson(path.join(generatedRoot, "knowledge-index.json"), []);
const extractionReport = await readJson(path.join(generatedRoot, "extraction-report.json"), { records: [] });
const reportRecords = Array.isArray(extractionReport) ? extractionReport : extractionReport.records || [];
const reportByPath = new Map(reportRecords.map((record) => [normalizeGeneratedPath(record.json_file_path), record]));
const reportByUrl = new Map(reportRecords.map((record) => [record.url, record]));

let importedSources = 0;
let importedSections = 0;
let importedChunks = 0;
let skippedSources = 0;

console.log(`Starting knowledge import for ${knowledgeIndex.length} sources...`);

for (const [index, indexRecord] of knowledgeIndex.entries()) {
  const jsonPath = resolveGeneratedPath(indexRecord.json_file_path);
  const sourceJson = await readJson(jsonPath, null);

  if (!sourceJson) {
    skippedSources += 1;
    console.warn(`Skipped missing JSON: ${indexRecord.json_file_path}`);
    continue;
  }

  const reportRecord =
    reportByPath.get(normalizeGeneratedPath(indexRecord.json_file_path)) ||
    reportByUrl.get(indexRecord.url) ||
    {};

  const sourcePayload = buildSourcePayload(indexRecord, sourceJson, reportRecord);
  const { data: source, error: sourceError } = await supabase
    .from("website_json_sources")
    .upsert(sourcePayload, { onConflict: "url" })
    .select("id")
    .single();

  if (sourceError) {
    throw new Error(`Failed to upsert source ${indexRecord.slug}: ${sourceError.message}`);
  }

  await deleteExistingSourceChildren(source.id);

  const insertedSections = await insertSections(source.id, sourceJson.sections || []);
  await insertAssets(source.id, insertedSections, sourceJson.sections || []);
  await insertButtons(source.id, insertedSections, sourceJson.sections || []);
  await insertForms(source.id, insertedSections, sourceJson.sections || []);
  await insertKnowledgeIndex(source.id, indexRecord, sourceJson, reportRecord);
  const chunksCount = await insertRagChunks(source.id, insertedSections, sourceJson, reportRecord);

  importedSources += 1;
  importedSections += insertedSections.length;
  importedChunks += chunksCount;

  if (importedSources === 1 || importedSources % 10 === 0 || importedSources === knowledgeIndex.length) {
    console.log(
      `Imported ${index + 1}/${knowledgeIndex.length}: ${indexRecord.slug} (${insertedSections.length} sections, ${chunksCount} chunks)`
    );
  }
}

console.log("Knowledge import complete.");
console.log(`Sources imported: ${importedSources}`);
console.log(`Sections imported: ${importedSections}`);
console.log(`RAG chunks imported: ${importedChunks}`);
console.log(`Missing JSON skipped: ${skippedSources}`);
console.log("All imported RAG records remain unapproved until reviewed in the dashboard.");

async function deleteExistingSourceChildren(sourceId) {
  const tables = ["rag_chunks", "website_forms", "website_buttons", "website_assets", "website_sections"];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("source_id", sourceId);

    if (error) {
      throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
  }
}

async function insertSections(sourceId, sections) {
  const rows = sections.map((section, index) => ({
    source_id: sourceId,
    section_order: section.order ?? index + 1,
    section_title: section.title || null,
    section_type: section.type || "content_section",
    content: section.content || "",
    content_hash: hashText(section.content || ""),
    word_count: countWords(section.content || "")
  }));

  if (!rows.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("website_sections")
    .insert(rows)
    .select("id, section_order, section_title, section_type, content, word_count");

  if (error) {
    throw new Error(`Failed to insert sections: ${error.message}`);
  }

  return data || [];
}

async function insertAssets(sourceId, insertedSections, sections) {
  const rows = [];

  sections.forEach((section, index) => {
    const sectionId = insertedSections[index]?.id;
    for (const image of section.images || []) {
      if (!image?.src) {
        continue;
      }

      rows.push({
        source_id: sourceId,
        section_id: sectionId,
        asset_type: "image",
        url: image.src,
        alt_text: image.alt || null,
        caption: image.caption || null
      });
    }
  });

  await insertRows("website_assets", rows);
}

async function insertButtons(sourceId, insertedSections, sections) {
  const rows = [];

  sections.forEach((section, index) => {
    const sectionId = insertedSections[index]?.id;
    for (const button of section.buttons || []) {
      if (!button?.label && !button?.url) {
        continue;
      }

      rows.push({
        source_id: sourceId,
        section_id: sectionId,
        label: button.label || null,
        url: button.url || null,
        button_type: button.type || "cta"
      });
    }
  });

  await insertRows("website_buttons", rows);
}

async function insertForms(sourceId, insertedSections, sections) {
  const rows = [];

  sections.forEach((section, index) => {
    const sectionId = insertedSections[index]?.id;
    for (const form of section.forms || []) {
      rows.push({
        source_id: sourceId,
        section_id: sectionId,
        form_type: form.form_type || "unknown",
        form_id: form.form_id || null,
        form_title: form.title || null,
        submit_label: form.submit_label || null,
        fields_json: form.fields || []
      });
    }
  });

  await insertRows("website_forms", rows);
}

async function insertKnowledgeIndex(sourceId, indexRecord, sourceJson, reportRecord) {
  const reviewStatus = mapReviewStatus(reportRecord.status);
  const isActive = reportRecord.status !== "skipped";
  const payload = {
    source_id: sourceId,
    source_type: indexRecord.source_type || sourceJson.source_type,
    title: indexRecord.title || sourceJson.title,
    slug: indexRecord.slug || sourceJson.slug,
    url: indexRecord.url || sourceJson.url,
    keywords: cleanKeywords(indexRecord.keywords || sourceJson.keywords),
    summary: indexRecord.summary || sourceJson.summary || "",
    priority: sourceJson.priority || 0,
    is_active: isActive,
    approved_for_rag: false,
    review_status: reviewStatus,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("knowledge_index")
    .upsert(payload, { onConflict: "source_id" });

  if (error) {
    throw new Error(`Failed to upsert knowledge_index for ${payload.slug}: ${error.message}`);
  }
}

async function insertRagChunks(sourceId, insertedSections, sourceJson, reportRecord) {
  const isActive = reportRecord.status !== "skipped";
  const rows = insertedSections
    .filter((section) => section.content && countWords(section.content) > 0)
    .map((section) => ({
      source_id: sourceId,
      section_id: section.id,
      chunk_title: section.section_title || sourceJson.title || sourceJson.slug,
      chunk_text: section.content,
      chunk_type: section.section_type || "content_section",
      keywords: cleanKeywords(sourceJson.keywords),
      token_estimate: Math.ceil(countWords(section.content) * 1.35),
      metadata: {
        source_url: sourceJson.url,
        slug: sourceJson.slug,
        section_order: section.section_order,
        import_status: reportRecord.status || "ok"
      },
      is_active: isActive,
      approved_for_rag: false
    }));

  await insertRows("rag_chunks", rows);
  return rows.length;
}

async function insertRows(table, rows) {
  if (!rows.length) {
    return;
  }

  const { error } = await supabase.from(table).insert(rows);

  if (error) {
    throw new Error(`Failed to insert ${table}: ${error.message}`);
  }
}

function buildSourcePayload(indexRecord, sourceJson, reportRecord) {
  const text = getFullText(sourceJson);
  const status = reportRecord.status || indexRecord.status || "ok";

  return {
    source_type: indexRecord.source_type || sourceJson.source_type,
    external_id: sourceJson.id ? String(sourceJson.id) : null,
    slug: indexRecord.slug || sourceJson.slug,
    title: indexRecord.title || sourceJson.title,
    url: indexRecord.url || sourceJson.url,
    meta_title: sourceJson.meta_title || sourceJson.yoast_head_json?.title || null,
    meta_description: sourceJson.meta_description || sourceJson.yoast_head_json?.description || null,
    lastmod: sourceJson.modified_at || null,
    content_hash: hashText(JSON.stringify(sourceJson)),
    json_data: sourceJson,
    full_text: text,
    word_count: reportRecord.word_count ?? countWords(text),
    headings_count: reportRecord.headings_count ?? countHeadings(sourceJson.sections || []),
    images_count: reportRecord.images_count ?? countNested(sourceJson.sections || [], "images"),
    buttons_count: reportRecord.buttons_count ?? countNested(sourceJson.sections || [], "buttons"),
    forms_count: reportRecord.forms_count ?? countNested(sourceJson.sections || [], "forms"),
    search_summary: indexRecord.summary || sourceJson.summary || "",
    keywords: cleanKeywords(indexRecord.keywords || sourceJson.keywords),
    sync_status: mapSyncStatus(status, reportRecord.warnings),
    review_status: mapReviewStatus(status),
    extraction_warnings: reportRecord.warnings || [],
    skip_reason: reportRecord.skip_reason || indexRecord.skip_reason || null,
    sync_enabled: status !== "skipped",
    approved_for_rag: false,
    needs_review: status === "needs_review",
    last_synced_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function getFullText(sourceJson) {
  return (sourceJson.sections || [])
    .map((section) => [section.title, section.content].filter(Boolean).join("\n"))
    .join("\n\n")
    .trim();
}

function mapSyncStatus(status, warnings = []) {
  if (status === "skipped") {
    return "skipped";
  }

  if (warnings.includes("EXTRACTION_FAILED")) {
    return "failed";
  }

  if (status === "needs_review") {
    return "needs_review";
  }

  return "synced";
}

function mapReviewStatus(status) {
  if (status === "skipped") {
    return "skipped";
  }

  if (status === "needs_review") {
    return "needs_review";
  }

  return "pending_review";
}

function cleanKeywords(keywords = []) {
  return [...new Set((keywords || []).map((keyword) => String(keyword).trim()).filter(Boolean))].slice(0, 30);
}

function countWords(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function countHeadings(sections) {
  return sections.filter((section) => section.title).length;
}

function countNested(sections, key) {
  return sections.reduce((count, section) => count + (section[key]?.length || 0), 0);
}

function hashText(text) {
  return crypto.createHash("sha256").update(text || "").digest("hex");
}

function resolveGeneratedPath(filePath) {
  return path.join(root, normalizeGeneratedPath(filePath));
}

function normalizeGeneratedPath(filePath = "") {
  return filePath.replace(/^\/+/, "").replaceAll("\\", "/");
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}
