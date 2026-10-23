import { getEmbeddingProvider } from "@/lib/langchain/embeddingProvider";
import { getPineconeIndex, getWebsiteNamespace } from "@/lib/langchain/pineconeClient";

export type PineconeWebsiteMatch = {
  chunk_id: string;
  source_id: string;
  title: string;
  url: string;
  slug: string;
  chunk_title: string;
  chunk_text: string;
  score: number;
  similarity_score: number;
  retrieval_method: "pinecone_vector";
  pinecone_namespace: string;
};

type PineconeMetadata = {
  chunk_id?: string;
  source_id?: string;
  page_title?: string;
  section_title?: string;
  source_url?: string;
  chunk_text?: string;
  approved_for_rag?: boolean;
};

const MIN_VECTOR_SCORE = 0.35;

export async function retrieveWebsiteChunksFromPinecone(query: string, limit = 4): Promise<PineconeWebsiteMatch[]> {
  const cleanQuery = query.replace(/\s+/g, " ").trim();

  if (!cleanQuery) {
    return [];
  }

  const namespace = getWebsiteNamespace();
  const embeddingProvider = getEmbeddingProvider();
  const pineconeNamespace = getPineconeIndex().namespace(namespace);
  const vector = await embeddingProvider.embedQuery(cleanQuery);

  if (!vector.length) {
    return [];
  }

  const response = await pineconeNamespace.query({
    vector,
    topK: Math.max(limit * 3, 12),
    includeMetadata: true,
    filter: {
      approved_for_rag: { $eq: true }
    }
  });

  const ranked = (response.matches || [])
    .map((match) => {
      const metadata = (match.metadata || {}) as PineconeMetadata;
      const similarity = Number(match.score || 0);
      const chunkText = String(metadata.chunk_text || "");
      const sourceId = String(metadata.source_id || "");

      if (!sourceId || !chunkText || similarity < MIN_VECTOR_SCORE) {
        return null;
      }

      const url = String(metadata.source_url || "");

      return {
        chunk_id: String(metadata.chunk_id || match.id),
        source_id: sourceId,
        title: String(metadata.page_title || "AwesomeTech knowledge"),
        url,
        slug: slugFromUrl(url),
        chunk_title: String(metadata.section_title || metadata.page_title || "Relevant section"),
        chunk_text: chunkText,
        score: Math.round(similarity * 100),
        similarity_score: similarity,
        retrieval_method: "pinecone_vector" as const,
        pinecone_namespace: namespace
      };
    })
    .filter((match): match is PineconeWebsiteMatch => Boolean(match))
    .sort((a, b) => b.similarity_score - a.similarity_score);

  return enforceSourceDiversity(ranked, limit);
}

function enforceSourceDiversity(matches: PineconeWebsiteMatch[], limit: number) {
  const selected: PineconeWebsiteMatch[] = [];
  const sourceIds = new Set<string>();

  for (const match of matches) {
    if (sourceIds.has(match.source_id)) {
      continue;
    }

    selected.push(match);
    sourceIds.add(match.source_id);

    if (selected.length >= limit) {
      break;
    }
  }

  return selected;
}

function slugFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname.replace(/^\/|\/$/g, "");
    return pathname.split("/").filter(Boolean).pop() || "";
  } catch {
    return "";
  }
}
