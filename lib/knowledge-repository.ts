import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  type ExtractionReport,
  type ExtractionReportRecord,
  type KnowledgeIndexRecord,
  loadExtractionReport as loadLocalExtractionReport,
  loadKnowledgeIndex as loadLocalKnowledgeIndex
} from "@/lib/local-knowledge";

type WebsiteSourceRow = {
  source_type: string | null;
  slug: string | null;
  title: string | null;
  url: string | null;
  word_count: number | null;
  headings_count: number | null;
  images_count: number | null;
  buttons_count: number | null;
  forms_count: number | null;
  sync_status: string | null;
  review_status: string | null;
  extraction_warnings: string[] | null;
  skip_reason: string | null;
};

export async function loadKnowledgeIndex(): Promise<KnowledgeIndexRecord[]> {
  if (shouldUseLocalKnowledge()) {
    return loadLocalKnowledgeIndex();
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("knowledge_index")
      .select("source_type,title,slug,url,keywords,summary,is_active,review_status")
      .order("title", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map((record) => ({
      source_type: record.source_type || "page",
      title: record.title || record.slug || "Untitled",
      slug: record.slug || "",
      url: record.url || "",
      json_file_path: "",
      keywords: record.keywords || [],
      summary: record.summary || "",
      status: record.is_active === false ? "skipped" : record.review_status || "pending_review"
    }));
  } catch {
    return loadLocalKnowledgeIndex();
  }
}

export async function loadExtractionReport(): Promise<ExtractionReport> {
  if (shouldUseLocalKnowledge()) {
    return loadLocalExtractionReport();
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("website_json_sources")
      .select(
        "source_type,slug,title,url,word_count,headings_count,images_count,buttons_count,forms_count,sync_status,review_status,extraction_warnings,skip_reason"
      )
      .order("word_count", { ascending: true });

    if (error) {
      throw error;
    }

    return buildReport((data || []).map(mapSourceRowToReportRecord));
  } catch {
    return loadLocalExtractionReport();
  }
}

function shouldUseLocalKnowledge() {
  return process.env.USE_LOCAL_KNOWLEDGE !== "false";
}

function mapSourceRowToReportRecord(row: WebsiteSourceRow): ExtractionReportRecord {
  const status = mapStatus(row.sync_status, row.review_status);

  return {
    url: row.url || "",
    slug: row.slug || row.title || "untitled",
    source_type: row.source_type || "page",
    json_file_path: "",
    word_count: row.word_count || 0,
    headings_count: row.headings_count || 0,
    images_count: row.images_count || 0,
    buttons_count: row.buttons_count || 0,
    forms_count: row.forms_count || 0,
    status,
    warnings: row.extraction_warnings || [],
    skip_reason: row.skip_reason || undefined
  };
}

function mapStatus(syncStatus?: string | null, reviewStatus?: string | null): string {
  if (syncStatus === "skipped" || reviewStatus === "skipped") {
    return "skipped";
  }

  if (syncStatus === "failed") {
    return "failed";
  }

  if (syncStatus === "needs_review" || reviewStatus === "needs_review") {
    return "needs_review";
  }

  return "ok";
}

function buildReport(records: ExtractionReportRecord[]): ExtractionReport {
  return {
    records,
    summary: {
      total_urls: records.length,
      ok_count: records.filter((record) => record.status === "ok").length,
      needs_review_count: records.filter((record) => record.status === "needs_review").length,
      skipped_count: records.filter((record) => record.status === "skipped").length,
      failed_count: records.filter((record) => record.status === "failed").length,
      pages_with_forms_count: records.filter((record) => record.forms_count > 0).length,
      top_10_lowest_word_count_pages: [...records].sort((a, b) => a.word_count - b.word_count).slice(0, 10),
      pages_with_no_headings: records.filter((record) => record.headings_count === 0),
      pages_with_forms: records.filter((record) => record.forms_count > 0),
      pages_with_highest_content_volume: [...records].sort((a, b) => b.word_count - a.word_count).slice(0, 10)
    }
  };
}
