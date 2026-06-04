import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { RagChunkMatch } from "@/lib/rag/retrieval";

type GenerateAnswerInput = {
  sessionId: string;
  messageId?: string;
  question: string;
  ragContext: string;
  matches: RagChunkMatch[];
};

type GenerateAnswerResult = {
  answer: string;
  provider: string;
  model: string;
  success: boolean;
};

export async function generateRagAnswer(input: GenerateAnswerInput): Promise<GenerateAnswerResult> {
  const prompt = buildPrompt(input.question, input.ragContext);
  const provider = selectProvider();

  if (!provider) {
    const answer = buildExtractiveFallback(input.question, input.matches);
    await logAiUsage(input, {
      provider: "fallback",
      model: "extractive",
      success: true,
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(answer),
      routingReason: "No AI provider key configured"
    });

    return {
      answer,
      provider: "fallback",
      model: "extractive",
      success: true
    };
  }

  try {
    const answer = await callProvider(provider, prompt);
    await logAiUsage(input, {
      provider: provider.name,
      model: provider.model,
      success: true,
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(answer),
      routingReason: "Phase 2 approved RAG answer"
    });

    return {
      answer,
      provider: provider.name,
      model: provider.model,
      success: true
    };
  } catch (error) {
    const answer = buildExtractiveFallback(input.question, input.matches);
    await logAiUsage(input, {
      provider: provider.name,
      model: provider.model,
      success: false,
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(answer),
      routingReason: "AI provider failed; used extractive fallback",
      errorMessage: error instanceof Error ? error.message : "Unknown AI error"
    });

    return {
      answer,
      provider: "fallback",
      model: "extractive",
      success: false
    };
  }
}

function selectProvider() {
  if (process.env.GROQ_API_KEY) {
    return {
      name: "groq",
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
      apiKey: process.env.GROQ_API_KEY
    };
  }

  if (process.env.GEMINI_API_KEY) {
    return {
      name: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      name: "openrouter",
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      apiKey: process.env.OPENROUTER_API_KEY
    };
  }

  return null;
}

async function callProvider(provider: { name: string; model: string; apiKey: string }, prompt: string) {
  if (provider.name === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${provider.model}:generateContent?key=${provider.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 500 }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }

  const endpoint =
    provider.name === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.apiKey}`
  };

  if (provider.name === "openrouter") {
    headers["HTTP-Referer"] = process.env.APP_URL || "http://localhost:3000";
    headers["X-Title"] = "Awesome Genie";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`${provider.name} request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function buildPrompt(question: string, ragContext: string) {
  return [
    "You are Awesome Genie, AwesomeTech's website assistant.",
    "Answer using only the approved AwesomeTech context below.",
    "Speak directly to the visitor using 'you' and 'we'.",
    "Do not say 'the user' or describe what the assistant should do.",
    "If the context is insufficient, tell the visitor AwesomeTech can review the request and ask them to share details or contact the team.",
    "Keep the answer concise, helpful, and do not invent services or claims.",
    "",
    "Approved context:",
    ragContext,
    "",
    `User question: ${question}`
  ].join("\n");
}

function buildExtractiveFallback(question: string, matches: RagChunkMatch[]) {
  const [topMatch] = matches;

  if (!topMatch) {
    return noApprovedContextMessage();
  }

  const excerpt = topMatch.chunk_text.split(/\s+/).slice(0, 65).join(" ");

  return [
    "Based on approved AwesomeTech knowledge, this looks relevant:",
    excerpt,
    `Source: ${topMatch.title} (${topMatch.url})`
  ].join("\n\n");
}

export function noApprovedContextMessage() {
  return "I do not have approved AwesomeTech knowledge for that yet. Please share a few details or contact AwesomeTech, and the team can review your request.";
}

async function logAiUsage(
  input: GenerateAnswerInput,
  result: {
    provider: string;
    model: string;
    success: boolean;
    inputTokens: number;
    outputTokens: number;
    routingReason: string;
    errorMessage?: string;
  }
) {
  const supabase = createSupabaseAdminClient();

  await supabase.from("ai_usage_logs").insert({
    session_id: input.sessionId,
    message_id: input.messageId || null,
    provider: result.provider,
    model_name: result.model,
    task_type: "rag_answer",
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    estimated_cost: 0,
    routing_reason: result.routingReason,
    success: result.success,
    error_message: result.errorMessage || null
  });
}

function estimateTokens(value: string) {
  return Math.ceil(value.split(/\s+/).filter(Boolean).length * 1.35);
}
