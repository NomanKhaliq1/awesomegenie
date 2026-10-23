import crypto from "crypto";

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export type WebsiteSectionForChunking = {
  source_id: string;
  section_id: string;
  source_title: string;
  source_url: string;
  section_title: string;
  content: string;
  keywords?: string[];
};

export type WebsiteChunk = {
  vectorId: string;
  sourceId: string;
  sectionId: string;
  chunkTitle: string;
  chunkText: string;
  chunkIndex: number;
  contentHash: string;
  tokenEstimate: number;
  metadata: Record<string, string | number | boolean | string[]>;
};

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 900,
  chunkOverlap: 140
});

export async function chunkWebsiteSection(section: WebsiteSectionForChunking): Promise<WebsiteChunk[]> {
  const cleanText = normalizeText(section.content);

  if (!cleanText || cleanText.split(/\s+/).length < 12) {
    return [];
  }

  const chunks = await splitter.splitText(cleanText);

  return chunks.map((chunkText, index) => {
    const vectorId = `website-${section.source_id}-${section.section_id}-${index}`;
    const contentHash = hashText(chunkText);

    return {
      vectorId,
      sourceId: section.source_id,
      sectionId: section.section_id,
      chunkTitle: section.section_title || section.source_title,
      chunkText,
      chunkIndex: index,
      contentHash,
      tokenEstimate: estimateTokens(chunkText),
      metadata: {
        chunk_id: vectorId,
        source_type: "website",
        source_id: section.source_id,
        section_id: section.section_id,
        page_title: section.source_title,
        section_title: section.section_title || section.source_title,
        source_url: section.source_url,
        approved_for_rag: true,
        chunk_text: chunkText,
        keywords: section.keywords || []
      }
    };
  });
}

export function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function hashText(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function estimateTokens(value: string) {
  return Math.ceil(value.split(/\s+/).filter(Boolean).length * 1.35);
}
