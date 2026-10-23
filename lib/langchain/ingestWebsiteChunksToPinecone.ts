import { getEmbeddingProvider } from "@/lib/langchain/embeddingProvider";
import { chunkWebsiteSection, hashText, type WebsiteChunk } from "@/lib/langchain/chunkWebsiteSections";
import { getPineconeIndex, getWebsiteNamespace } from "@/lib/langchain/pineconeClient";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type WebsiteSectionRow = {
  id: string;
  source_id: string;
  section_title: string | null;
  content: string | null;
  content_hash?: string | null;
  website_json_sources:
    | {
        id: string;
        title: string | null;
        url: string | null;
        keywords: string[] | null;
        approved_for_rag: boolean | null;
        review_status: string | null;
      }
    | Array<{
        id: string;
        title: string | null;
        url: string | null;
        keywords: string[] | null;
        approved_for_rag: boolean | null;
        review_status: string | null;
      }>
    | null;
};

export type WebsiteIngestResult = {
  sectionsProcessed: number;
  chunksCreated: number;
  chunksUpserted: number;
  failedChunks: number;
};

export async function ingestWebsiteChunksToPinecone(limit = 500): Promise<WebsiteIngestResult> {
  const supabase = createSupabaseAdminClient();
  const namespace = getWebsiteNamespace();
  const embeddingProvider = getEmbeddingProvider();
  const pineconeNamespace = getPineconeIndex().namespace(namespace);
  const sections = await loadApprovedSections(limit);
  const result: WebsiteIngestResult = {
    sectionsProcessed: 0,
    chunksCreated: 0,
    chunksUpserted: 0,
    failedChunks: 0
  };

  for (const section of sections) {
    const source = normalizeSource(section.website_json_sources);

    if (!source || !section.content) {
      continue;
    }

    result.sectionsProcessed += 1;

    const chunks = await chunkWebsiteSection({
      source_id: source.id,
      section_id: section.id,
      source_title: source.title || "AwesomeTech knowledge",
      source_url: source.url || "",
      section_title: section.section_title || source.title || "Relevant section",
      content: section.content,
      keywords: source.keywords || []
    });

    if (!chunks.length) {
      continue;
    }

    result.chunksCreated += chunks.length;

    try {
      const embeddings = await embeddingProvider.embedDocuments(chunks.map((chunk) => chunk.chunkText));
      const vectors = chunks.map((chunk, index) => ({
        id: chunk.vectorId,
        values: embeddings[index],
        metadata: chunk.metadata
      }));

      await pineconeNamespace.upsert({ records: vectors });
      await upsertChunkMetadata(chunks, namespace);
      await supabase
        .from("website_sections")
        .update({
          pinecone_synced: true,
          content_hash: hashText(section.content)
        })
        .eq("id", section.id);
      await supabase
        .from("website_json_sources")
        .update({
          pinecone_synced: true,
          pinecone_namespace: namespace,
          last_synced_at: new Date().toISOString()
        })
        .eq("id", source.id);

      result.chunksUpserted += chunks.length;
    } catch (error) {
      result.failedChunks += chunks.length;
      console.error(`Failed to ingest section ${section.id}:`, error);
    }
  }

  return result;
}

async function loadApprovedSections(limit: number) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("website_sections")
    .select(
      "id,source_id,section_title,content,content_hash,website_json_sources!inner(id,title,url,keywords,approved_for_rag,review_status)"
    )
    .not("content", "is", null)
    .eq("website_json_sources.approved_for_rag", true)
    .eq("website_json_sources.review_status", "approved")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as WebsiteSectionRow[];
}

async function upsertChunkMetadata(chunks: WebsiteChunk[], namespace: string) {
  const supabase = createSupabaseAdminClient();
  const rows = chunks.map((chunk) => ({
    source_id: chunk.sourceId,
    section_id: chunk.sectionId,
    pinecone_vector_id: chunk.vectorId,
    pinecone_namespace: namespace,
    chunk_title: chunk.chunkTitle,
    chunk_text: chunk.chunkText,
    chunk_type: "website_section",
    chunk_index: chunk.chunkIndex,
    keywords: (chunk.metadata.keywords as string[]) || [],
    token_estimate: chunk.tokenEstimate,
    content_hash: chunk.contentHash,
    metadata: chunk.metadata,
    is_active: true,
    approved_for_rag: true,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from("rag_chunks")
    .upsert(rows, { onConflict: "pinecone_vector_id" });

  if (error) {
    throw new Error(error.message);
  }
}

function normalizeSource(source: WebsiteSectionRow["website_json_sources"]) {
  return Array.isArray(source) ? source[0] || null : source;
}
