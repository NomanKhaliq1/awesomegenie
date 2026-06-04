import fs from "node:fs/promises";
import path from "node:path";

const generatedRoot = path.join(process.cwd(), "data", "generated");

export type KnowledgeIndexRecord = {
  source_type: "page" | "post" | string;
  title: string;
  slug: string;
  url: string;
  json_file_path: string;
  keywords: string[];
  summary: string;
  word_count?: number;
  status?: "ok" | "needs_review" | "skipped" | string;
  skip_reason?: string;
};

export type ExtractionReportRecord = {
  url: string;
  slug: string;
  source_type: string;
  json_file_path: string;
  word_count: number;
  headings_count: number;
  images_count: number;
  buttons_count: number;
  forms_count: number;
  status: "ok" | "needs_review" | "skipped" | string;
  warnings: string[];
  skip_reason?: string;
};

export type ExtractionReport = {
  records: ExtractionReportRecord[];
  summary: {
    total_urls: number;
    ok_count: number;
    needs_review_count: number;
    skipped_count: number;
    failed_count: number;
    pages_with_forms_count: number;
    top_10_lowest_word_count_pages: ExtractionReportRecord[];
    pages_with_no_headings: ExtractionReportRecord[];
    pages_with_forms: ExtractionReportRecord[];
    pages_with_highest_content_volume: ExtractionReportRecord[];
  };
};

export async function loadKnowledgeIndex(): Promise<KnowledgeIndexRecord[]> {
  return readJson(path.join(generatedRoot, "knowledge-index.json"), []);
}

export async function loadExtractionReport(): Promise<ExtractionReport> {
  const fallback: ExtractionReport = {
    records: [],
    summary: {
      total_urls: 0,
      ok_count: 0,
      needs_review_count: 0,
      skipped_count: 0,
      failed_count: 0,
      pages_with_forms_count: 0,
      top_10_lowest_word_count_pages: [],
      pages_with_no_headings: [],
      pages_with_forms: [],
      pages_with_highest_content_volume: []
    }
  };

  const report = await readJson<ExtractionReport | ExtractionReportRecord[]>(
    path.join(generatedRoot, "extraction-report.json"),
    fallback
  );

  if (Array.isArray(report)) {
    return {
      records: report,
      summary: {
        total_urls: report.length,
        ok_count: report.filter((record) => record.status === "ok").length,
        needs_review_count: report.filter((record) => record.status === "needs_review").length,
        skipped_count: report.filter((record) => record.status === "skipped").length,
        failed_count: report.filter((record) => record.warnings?.includes("EXTRACTION_FAILED")).length,
        pages_with_forms_count: report.filter((record) => record.forms_count > 0).length,
        top_10_lowest_word_count_pages: [...report].sort((a, b) => a.word_count - b.word_count).slice(0, 10),
        pages_with_no_headings: report.filter((record) => record.headings_count === 0),
        pages_with_forms: report.filter((record) => record.forms_count > 0),
        pages_with_highest_content_volume: [...report].sort((a, b) => b.word_count - a.word_count).slice(0, 10)
      }
    };
  }

  return report;
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}
