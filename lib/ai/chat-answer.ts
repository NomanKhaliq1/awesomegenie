import {
  estimateCost,
  estimateTokens,
  resolveRagTask,
  selectAiRoute,
  type AiRoute
} from "@/lib/ai/router";
import { buildAwesomeGeniePromptPolicy } from "@/lib/chat/behavior-policy";
import type { RagChunkMatch } from "@/lib/rag/retrieval";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

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
  modelLayer: string;
  success: boolean;
};

export async function generateRagAnswer(input: GenerateAnswerInput): Promise<GenerateAnswerResult> {
  const prompt = buildPrompt(input.question, input.ragContext);
  const route = await selectAiRoute({
    taskType: resolveRagTask(input.question),
    prompt,
    sessionId: input.sessionId
  });

  if (!route.canCallModel || !route.apiKey) {
    const answer = buildRuleFallback(input.matches);
    await logAiUsage(input, route, {
      success: true,
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(answer),
      estimatedCost: 0
    });

    return {
      answer,
      provider: route.provider,
      model: route.model,
      modelLayer: route.layer,
      success: true
    };
  }

  try {
    const answer = await callProvider(route, prompt);
    const inputTokens = estimateTokens(prompt);
    const outputTokens = estimateTokens(answer);

    await logAiUsage(input, route, {
      success: true,
      inputTokens,
      outputTokens,
      estimatedCost: estimateCost({
        inputTokens,
        outputTokens,
        inputCostPer1k: route.inputCostPer1k,
        outputCostPer1k: route.outputCostPer1k
      })
    });

    return {
      answer,
      provider: route.provider,
      model: route.model,
      modelLayer: route.layer,
      success: true
    };
  } catch (error) {
    const answer = buildRuleFallback(input.matches);
    await logAiUsage(input, route, {
      success: false,
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(answer),
      estimatedCost: 0,
      errorMessage: error instanceof Error ? error.message : "Unknown AI error"
    });

    return {
      answer,
      provider: "fallback",
      model: "rule_fallback",
      modelLayer: "fallback",
      success: false
    };
  }
}

async function callProvider(route: AiRoute, prompt: string) {
  if (route.provider === "gemini") {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${route.model}:generateContent?key=${route.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: route.temperature, maxOutputTokens: route.maxTokens }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || buildRuleFallback([]);
  }

  const endpoint =
    route.provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${route.apiKey}`
  };

  if (route.provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.APP_URL || "http://localhost:3000";
    headers["X-Title"] = "Awesome Genie";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: route.model,
      messages: [{ role: "user", content: prompt }],
      temperature: route.temperature,
      max_tokens: route.maxTokens
    })
  });

  if (!response.ok) {
    throw new Error(`${route.provider} request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || buildRuleFallback([]);
}

function buildPrompt(question: string, ragContext: string) {
  return [
    buildAwesomeGeniePromptPolicy(),
    "",
    "Approved context:",
    ragContext,
    "",
    `User question: ${question}`
  ].join("\n");
}

function buildRuleFallback(matches: RagChunkMatch[]) {
  if (!matches.length) {
    return noApprovedContextMessage();
  }

  return "Yes, this looks like an area AwesomeTech can help with. Please share your current system, what you want to build or automate, and your ideal timeline so I can capture the right project details.";
}

export function noApprovedContextMessage() {
  return "Please share your project goal, current system, and contact details so the AwesomeTech team can review the request.";
}

async function logAiUsage(
  input: GenerateAnswerInput,
  route: AiRoute,
  result: {
    success: boolean;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    errorMessage?: string;
  }
) {
  const supabase = createSupabaseAdminClient();

  await supabase.from("ai_usage_logs").insert({
    session_id: input.sessionId,
    message_id: input.messageId || null,
    provider: route.provider,
    model_name: route.model,
    task_type: route.taskType,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    estimated_cost: result.estimatedCost,
    routing_reason: `${route.layer}: ${route.routingReason}`,
    success: result.success,
    error_message: result.errorMessage || null
  });
}
