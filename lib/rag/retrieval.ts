import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { ChatIntent } from "@/lib/chat/intent";

const STOP_WORDS = new Set([
  "about",
  "awesome",
  "awesometech",
  "build",
  "can",
  "could",
  "does",
  "have",
  "help",
  "how",
  "need",
  "provide",
  "the",
  "you",
  "your",
  "with",
  "work"
]);
const MIN_RELEVANCE_SCORE = 20;

export type RagChunkMatch = {
  chunk_id: string;
  source_id: string;
  title: string;
  url: string;
  slug: string;
  chunk_title: string;
  chunk_text: string;
  score: number;
};

type ChunkRow = {
  id: string;
  source_id: string;
  chunk_title: string | null;
  chunk_text: string | null;
  chunk_type: string | null;
  keywords: string[] | null;
  metadata: Record<string, unknown> | null;
};

type SourceRow = {
  id: string;
  title: string | null;
  slug: string | null;
  url: string | null;
  approved_for_rag: boolean | null;
  review_status: string | null;
};

export async function retrieveApprovedRag(
  query: string,
  limit = 4,
  options: { intent?: ChatIntent } = {}
): Promise<RagChunkMatch[]> {
  const terms = tokenize(query);
  const topic = inferQueryTopic(query);

  if (!terms.length) {
    return [];
  }

  const supabase = createSupabaseAdminClient();
  const { data: chunks, error } = await supabase
    .from("rag_chunks")
    .select("id,source_id,chunk_title,chunk_text,chunk_type,keywords,metadata")
    .eq("approved_for_rag", true)
    .eq("is_active", true)
    .limit(1200);

  if (error || !chunks?.length) {
    return [];
  }

  const sourceIds = [...new Set(chunks.map((chunk) => chunk.source_id).filter(Boolean))];
  const { data: sources, error: sourceError } = await supabase
    .from("website_json_sources")
    .select("id,title,slug,url,approved_for_rag,review_status")
    .in("id", sourceIds)
    .eq("approved_for_rag", true)
    .eq("review_status", "approved");

  if (sourceError || !sources?.length) {
    return [];
  }

  const sourceById = new Map((sources as SourceRow[]).map((source) => [source.id, source]));

  const ranked = (chunks as ChunkRow[])
    .map((chunk) => {
      const source = sourceById.get(chunk.source_id);

      if (
        !source ||
        !chunk.chunk_text ||
        shouldSkipSourceForIntent(source, options.intent) ||
        !sourceMatchesTopic(source, topic)
      ) {
        return null;
      }

      const score = scoreChunk(chunk, source, terms, query);

      if (score < MIN_RELEVANCE_SCORE) {
        return null;
      }

      return {
        chunk_id: chunk.id,
        source_id: chunk.source_id,
        title: source.title || chunk.chunk_title || "AwesomeTech knowledge",
        url: source.url || "",
        slug: source.slug || "",
        chunk_title: chunk.chunk_title || source.title || "Relevant section",
        chunk_text: chunk.chunk_text,
        score
      };
    })
    .filter((match): match is RagChunkMatch => Boolean(match))
    .sort((a, b) => b.score - a.score);

  return enforceSourceDiversity(ranked, limit);
}

export function buildApprovedRagContext(matches: RagChunkMatch[]) {
  return matches
    .map((match, index) => {
      const content = normalizeText(match.chunk_text).slice(0, 1200);

      return [
        `Source ${index + 1}: ${match.title}`,
        `URL: ${match.url}`,
        `Section: ${match.chunk_title}`,
        `Content: ${content}`
      ].join("\n");
    })
    .join("\n\n");
}

export async function logRagRetrieval(params: {
  sessionId: string;
  messageId?: string;
  query: string;
  matches: RagChunkMatch[];
}) {
  const supabase = createSupabaseAdminClient();
  const [topMatch] = params.matches;

  await supabase.from("rag_retrieval_logs").insert({
    session_id: params.sessionId,
    message_id: params.messageId || null,
    query: params.query,
    selected_source_id: topMatch?.source_id || null,
    selected_chunk_ids: params.matches.map((match) => match.chunk_id),
    retrieval_method: "keyword_approved_chunks",
    score: topMatch?.score || 0,
    context_tokens: estimateTokens(buildApprovedRagContext(params.matches)),
    created_at: new Date().toISOString()
  });
}

function scoreChunk(chunk: ChunkRow, source: SourceRow, terms: string[], rawQuery: string) {
  const text = normalizeText(chunk.chunk_text || "").toLowerCase();
  const title = normalizeText(`${source.title || ""} ${source.slug || ""} ${chunk.chunk_title || ""}`).toLowerCase();
  const keywords = normalizeText((chunk.keywords || []).join(" ")).toLowerCase();
  const query = normalizeText(rawQuery).toLowerCase();

  let score = 0;

  for (const term of terms) {
    if (title.includes(term)) score += 12;
    if (keywords.includes(term)) score += 8;
    if (text.includes(term)) score += 4;
  }

  const phrase = terms.join(" ");
  if (phrase && `${title} ${text}`.includes(phrase)) score += 25;
  if (terms.includes("contact") && /contact|quote|consultation/.test(`${title} ${text}`)) score += 40;
  if (terms.includes("mortgage") && terms.includes("website") && /mortgage.*website|website.*mortgage/.test(`${title} ${text}`)) {
    score += 35;
  }
  if (terms.includes("mismo") && /mismo|integration/.test(`${title} ${text}`)) score += 35;
  if (terms.includes("encompass") && /encompass|los|automation/.test(`${title} ${text}`)) score += 35;
  if (/power\s*bi|dashboard|reporting/.test(query) && /power\s*bi|dashboard|reporting|analytics/.test(`${title} ${text}`)) {
    score += 30;
  }

  return score;
}

function enforceSourceDiversity(matches: RagChunkMatch[], limit: number) {
  const selected: RagChunkMatch[] = [];
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

function shouldSkipSourceForIntent(source: SourceRow, intent?: ChatIntent) {
  if (intent === "contact_request") {
    return source.slug !== "contact-us";
  }

  return source.slug === "contact-us";
}

function inferQueryTopic(query: string) {
  const text = query.toLowerCase();

  if (text.includes("mismo")) return "mismo";
  if (text.includes("encompass")) return "encompass";
  if (text.includes("power bi") || text.includes("dashboard") || text.includes("reporting")) return "power_bi";
  if (text.includes("mortgage") && text.includes("website")) return "mortgage_website";
  if (text.includes("mortgage")) return "mortgage";
  if (text.includes("sharepoint")) return "sharepoint";

  return "general";
}

function sourceMatchesTopic(source: SourceRow, topic: string) {
  if (topic === "general") {
    return true;
  }

  const sourceText = `${source.title || ""} ${source.slug || ""}`.toLowerCase();

  if (topic === "mismo") return sourceText.includes("mismo");
  if (topic === "encompass") return sourceText.includes("encompass");
  if (topic === "power_bi") {
    return sourceText.includes("power-bi") || sourceText.includes("power bi") || sourceText.includes("dashboard");
  }
  if (topic === "mortgage_website") {
    return sourceText.includes("mortgage") && sourceText.includes("website");
  }
  if (topic === "mortgage") return sourceText.includes("mortgage");
  if (topic === "sharepoint") return sourceText.includes("sharepoint");

  return true;
}

function tokenize(query: string) {
  return [
    ...new Set(
      normalizeText(query)
        .toLowerCase()
        .match(/[a-z][a-z0-9]{2,}/g)
        ?.map(singularize)
        .filter((term) => !STOP_WORDS.has(term)) || []
    )
  ];
}

function singularize(term: string) {
  if (term.endsWith("ies") && term.length > 4) return `${term.slice(0, -3)}y`;
  if (term.endsWith("s") && term.length > 3) return term.slice(0, -1);
  return term;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function estimateTokens(value: string) {
  return Math.ceil(value.split(/\s+/).filter(Boolean).length * 1.35);
}
