import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, "..");
export const generatedRoot = path.join(projectRoot, "data", "generated");
export const pagesDir = path.join(generatedRoot, "pages");
export const postsDir = path.join(generatedRoot, "posts");
export const knowledgeIndexPath = path.join(generatedRoot, "knowledge-index.json");
export const extractionReportPath = path.join(generatedRoot, "extraction-report.json");
export const manualOverridesDir = path.join(projectRoot, "data", "manual-overrides");
