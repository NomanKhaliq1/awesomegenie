import path from "node:path";

import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const { retrieveWebsiteChunksFromPinecone } = await import("../lib/langchain/retrieveWebsiteChunksFromPinecone");

const queries = process.argv.slice(2);
const sampleQueries = queries.length
  ? queries
  : [
      "Do you build mortgage websites?",
      "Do you provide MISMO integration?",
      "Do you work with Encompass?",
      "How can I contact AwesomeTech?"
    ];

try {
  for (const query of sampleQueries) {
    const matches = await retrieveWebsiteChunksFromPinecone(query, 4);

    console.log("");
    console.log(`Query: ${query}`);

    if (!matches.length) {
      console.log("No Pinecone matches found.");
      continue;
    }

    for (const [index, match] of matches.entries()) {
      const preview = match.chunk_text.replace(/\s+/g, " ").slice(0, 180);

      console.log(`${index + 1}. ${match.title}`);
      console.log(`   URL: ${match.url}`);
      console.log(`   Score: ${match.similarity_score.toFixed(4)}`);
      console.log(`   Section: ${match.chunk_title}`);
      console.log(`   Preview: ${preview}${match.chunk_text.length > 180 ? "..." : ""}`);
    }
  }
} catch (error) {
  console.error("Pinecone RAG test failed.");
  console.error(error);
  process.exitCode = 1;
}
