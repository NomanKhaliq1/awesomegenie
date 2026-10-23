import path from "node:path";

import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const { ingestWebsiteChunksToPinecone } = await import("../lib/langchain/ingestWebsiteChunksToPinecone");

const limitArg = Number(process.argv[2] || process.env.RAG_INGEST_LIMIT || 500);
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 500;

console.log(`Starting Pinecone website RAG ingest. Limit: ${limit}`);

try {
  const result = await ingestWebsiteChunksToPinecone(limit);

  console.log("Pinecone website RAG ingest complete.");
  console.log(`Sections processed: ${result.sectionsProcessed}`);
  console.log(`Chunks created: ${result.chunksCreated}`);
  console.log(`Chunks upserted: ${result.chunksUpserted}`);
  console.log(`Failed chunks: ${result.failedChunks}`);
} catch (error) {
  console.error("Pinecone website RAG ingest failed.");
  console.error(error);
  process.exitCode = 1;
}
