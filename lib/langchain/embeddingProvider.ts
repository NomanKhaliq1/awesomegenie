import crypto from "crypto";

export type EmbeddingProvider = {
  provider: string;
  model: string;
  dimension: number;
  embedQuery: (text: string) => Promise<number[]>;
  embedDocuments: (texts: string[]) => Promise<number[][]>;
};

export function getEmbeddingProvider(): EmbeddingProvider {
  const provider = process.env.EMBEDDING_PROVIDER || "gemini";
  const model = process.env.EMBEDDING_MODEL || "text-embedding-004";
  const dimension = Number(process.env.EMBEDDING_DIMENSION || 768);

  if (provider === "local_hash") {
    return {
      provider,
      model: "local_hash",
      dimension,
      embedQuery: async (text) => hashEmbedding(text, dimension),
      embedDocuments: async (texts) => texts.map((text) => hashEmbedding(text, dimension))
    };
  }

  if (provider !== "gemini") {
    throw new Error(`Unsupported embedding provider: ${provider}`);
  }

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required for Gemini embeddings.");
  }

  return {
    provider,
    model,
    dimension,
    embedQuery: (text) => embedGeminiText(text, model, dimension),
    embedDocuments: (texts) => embedGeminiBatch(texts, model, dimension)
  };
}

async function embedGeminiText(text: string, model: string, dimension: number) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        outputDimensionality: dimension
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini embedding failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.embedding?.values || [];
}

async function embedGeminiBatch(texts: string[], model: string, dimension: number) {
  if (!texts.length) return [];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:batchEmbedContents?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          outputDimensionality: dimension
        }))
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini batch embedding failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return (data.embeddings || []).map((embedding: { values?: number[] }) => embedding.values || []);
}

function hashEmbedding(text: string, dimension: number) {
  const values = Array.from({ length: dimension }, (_, index) => {
    const hash = crypto.createHash("sha256").update(`${index}:${text}`).digest();
    return (hash.readUInt32BE(0) / 0xffffffff) * 2 - 1;
  });
  const magnitude = Math.sqrt(values.reduce((total, value) => total + value * value, 0)) || 1;
  return values.map((value) => value / magnitude);
}
