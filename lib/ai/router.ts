export type AiTaskType =
  | "no_model"
  | "slm_classification"
  | "slm_onboarding_extract"
  | "slm_rag_answer"
  | "llm_complex_answer"
  | "llm_pm_summary";

export type AiModelLayer = "none" | "slm" | "llm" | "fallback";

export type AiProviderName = "groq" | "gemini" | "openrouter" | "fallback" | "none";

export type AiRoute = {
  taskType: AiTaskType;
  layer: AiModelLayer;
  provider: AiProviderName;
  model: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  estimatedMaxCost: number;
  routingReason: string;
  canCallModel: boolean;
};

type SelectAiRouteInput = {
  taskType: AiTaskType;
  prompt: string;
  sessionId?: string;
  complexity?: "simple" | "complex";
};

const defaultCosts: Record<string, { input: number; output: number }> = {
  "groq:llama-3.1-8b-instant": { input: 0.00005, output: 0.00008 },
  "groq:llama-3.3-70b-versatile": { input: 0.00059, output: 0.00079 },
  "gemini:gemini-1.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini:gemini-1.5-pro": { input: 0.00125, output: 0.005 },
  "openrouter:openai/gpt-4o-mini": { input: 0.00015, output: 0.0006 }
};

export async function selectAiRoute(input: SelectAiRouteInput): Promise<AiRoute> {
  if (input.taskType === "no_model" || process.env.AI_ENABLE_PAID_CALLS === "false") {
    return noModelRoute(input.taskType, "Paid model calls are disabled for this task.");
  }

  const layer = chooseLayer(input);
  const provider = chooseProvider(layer);

  if (!provider) {
    return fallbackRoute(input.taskType, "No configured provider is available for this route.");
  }

  const estimatedMaxCost = estimateCost({
    inputTokens: estimateTokens(input.prompt),
    outputTokens: provider.maxTokens,
    inputCostPer1k: provider.inputCostPer1k,
    outputCostPer1k: provider.outputCostPer1k
  });

  return {
    taskType: input.taskType,
    layer,
    provider: provider.name,
    model: provider.model,
    apiKey: provider.apiKey,
    maxTokens: provider.maxTokens,
    temperature: provider.temperature,
    inputCostPer1k: provider.inputCostPer1k,
    outputCostPer1k: provider.outputCostPer1k,
    estimatedMaxCost,
    routingReason: `${layer.toUpperCase()} selected for ${input.taskType}; estimated max cost ${formatUsd(estimatedMaxCost)}`,
    canCallModel: true
  };
}

export function resolveRagTask(question: string): AiTaskType {
  return isComplexCustomerQuestion(question) ? "llm_complex_answer" : "slm_rag_answer";
}

export function isComplexCustomerQuestion(question: string) {
  const text = question.toLowerCase();
  const words = question.split(/\s+/).filter(Boolean).length;
  const complexTerms = [
    "compare",
    "difference",
    "architecture",
    "strategy",
    "migration",
    "compliance",
    "implementation plan",
    "integration steps",
    "api approach",
    "sdk",
    "data mapping",
    "workflow design",
    "technical approach"
  ];

  return words > 32 || complexTerms.some((term) => text.includes(term));
}

export function estimateTokens(value: string) {
  return Math.ceil(value.split(/\s+/).filter(Boolean).length * 1.35);
}

export function estimateCost(params: {
  inputTokens: number;
  outputTokens: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
}) {
  const inputCost = (params.inputTokens / 1000) * params.inputCostPer1k;
  const outputCost = (params.outputTokens / 1000) * params.outputCostPer1k;
  return Number((inputCost + outputCost).toFixed(8));
}

function chooseLayer(input: SelectAiRouteInput): "slm" | "llm" {
  if (input.taskType === "llm_complex_answer" || input.taskType === "llm_pm_summary") return "llm";
  return "slm";
}

function chooseProvider(layer: "slm" | "llm") {
  if (layer === "slm") {
    return (
      groqProvider(process.env.GROQ_SLM_MODEL || process.env.GROQ_MODEL || "llama-3.1-8b-instant", 260, 0.15) ||
      geminiProvider(process.env.GEMINI_SLM_MODEL || process.env.GEMINI_MODEL || "gemini-1.5-flash", 260, 0.15) ||
      openRouterProvider(process.env.OPENROUTER_SLM_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini", 260, 0.15)
    );
  }

  return (
    geminiProvider(process.env.GEMINI_LLM_MODEL || "gemini-1.5-pro", 620, 0.2) ||
    openRouterProvider(process.env.OPENROUTER_LLM_MODEL || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini", 620, 0.2) ||
    groqProvider(process.env.GROQ_LLM_MODEL || "llama-3.3-70b-versatile", 620, 0.2)
  );
}

function groqProvider(model: string, maxTokens: number, temperature: number) {
  if (!process.env.GROQ_API_KEY) return null;
  return provider("groq", model, process.env.GROQ_API_KEY, maxTokens, temperature);
}

function geminiProvider(model: string, maxTokens: number, temperature: number) {
  if (!process.env.GEMINI_API_KEY) return null;
  return provider("gemini", model, process.env.GEMINI_API_KEY, maxTokens, temperature);
}

function openRouterProvider(model: string, maxTokens: number, temperature: number) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  return provider("openrouter", model, process.env.OPENROUTER_API_KEY, maxTokens, temperature);
}

function provider(
  name: "groq" | "gemini" | "openrouter",
  model: string,
  apiKey: string,
  maxTokens: number,
  temperature: number
) {
  const cost = defaultCosts[`${name}:${model}`] || defaultCosts[`${name}:${fallbackCostModel(name)}`];

  return {
    name,
    model,
    apiKey,
    maxTokens,
    temperature,
    inputCostPer1k: cost.input,
    outputCostPer1k: cost.output
  };
}

function fallbackCostModel(provider: string) {
  if (provider === "groq") return "llama-3.1-8b-instant";
  if (provider === "gemini") return "gemini-1.5-flash";
  return "openai/gpt-4o-mini";
}

function noModelRoute(taskType: AiTaskType, routingReason: string): AiRoute {
  return {
    taskType,
    layer: "none",
    provider: "none",
    model: "no_model",
    maxTokens: 0,
    temperature: 0,
    inputCostPer1k: 0,
    outputCostPer1k: 0,
    estimatedMaxCost: 0,
    routingReason,
    canCallModel: false
  };
}

function fallbackRoute(taskType: AiTaskType, routingReason: string): AiRoute {
  return {
    taskType,
    layer: "fallback",
    provider: "fallback",
    model: "rule_fallback",
    maxTokens: 0,
    temperature: 0,
    inputCostPer1k: 0,
    outputCostPer1k: 0,
    estimatedMaxCost: 0,
    routingReason,
    canCallModel: false
  };
}

function formatUsd(value: number) {
  return `$${value.toFixed(4)}`;
}
