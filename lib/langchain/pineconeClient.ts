import { Pinecone } from "@pinecone-database/pinecone";

export function getPineconeConfig() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME || "awesome-genie-rag";
  const websiteNamespace = process.env.PINECONE_NAMESPACE_WEBSITE || "website";

  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is required.");
  }

  return {
    apiKey,
    indexName,
    websiteNamespace
  };
}

export function getPineconeIndex() {
  const config = getPineconeConfig();
  const pinecone = new Pinecone({ apiKey: config.apiKey });
  return pinecone.index(config.indexName);
}

export function getWebsiteNamespace() {
  return getPineconeConfig().websiteNamespace;
}

export function getClientFilesNamespace(clientId: string, sessionId: string) {
  return `client-files-${clientId}-${sessionId}`;
}
