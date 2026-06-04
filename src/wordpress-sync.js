import fs from "node:fs/promises";
import path from "node:path";
import {
  contentCompletenessSignals,
  extractContentRecord,
  extractPublicPageContentHtml,
  slugify
} from "./content-utils.js";
import { knowledgeIndexPath, pagesDir, postsDir } from "./paths.js";

const ENDPOINTS = {
  pageList: "https://awesometechinc.com/wp-json/wp/v2/pages?per_page=100",
  pageDetail: "https://awesometechinc.com/wp-json/wp/v2/pages",
  postList: "https://awesometechinc.com/wp-json/wp/v2/posts?per_page=100",
  postDetail: "https://awesometechinc.com/wp-json/wp/v2/posts"
};

const DETAIL_CONCURRENCY = 8;
const MIN_REST_CONTENT_TEXT_LENGTH = 450;

async function main() {
  await ensureOutputDirs();

  const [pages, posts] = await Promise.all([fetchAllItems("page"), fetchAllItems("post")]);
  const pageRecords = await writeRecords(pages, "page", pagesDir);
  const postRecords = await writeRecords(posts, "post", postsDir);

  const index = [...pageRecords, ...postRecords].map(({ record, filePath }) => ({
    source_type: record.source_type,
    title: record.title,
    slug: record.slug,
    url: record.url,
    json_file_path: toProjectRelativePath(filePath),
    keywords: record.keywords,
    summary: record.summary
  }));

  await fs.writeFile(knowledgeIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  console.log(`Generated ${pageRecords.length} page JSON files.`);
  console.log(`Generated ${postRecords.length} post JSON files.`);
  console.log(`Used live HTML fallback for ${countFallbacks([...pageRecords, ...postRecords])} items.`);
  console.log(`Generated knowledge index: ${toProjectRelativePath(knowledgeIndexPath)}`);
}

async function ensureOutputDirs() {
  await fs.mkdir(pagesDir, { recursive: true });
  await fs.mkdir(postsDir, { recursive: true });
}

async function fetchAllItems(sourceType) {
  const listItems = await fetchList(sourceType);
  return mapLimit(listItems, DETAIL_CONCURRENCY, async (item) => {
    const detail = await fetchDetail(sourceType, item.id);
    return withFallbackContent(detail);
  });
}

async function fetchList(sourceType) {
  const baseUrl = ENDPOINTS[`${sourceType}List`];
  const items = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${separator}page=${page}`;
    const response = await fetch(url);

    if (response.status === 400 && page > 1) break;
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sourceType}s page ${page}: ${response.status} ${response.statusText}`);
    }

    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    items.push(...batch.map((item) => ({ id: item.id, slug: item.slug })));

    const total = Number(response.headers.get("x-wp-total") || items.length);
    totalPages = Number(response.headers.get("x-wp-totalpages") || Math.ceil(total / 100) || page);
    page += 1;
  }

  return items;
}

async function fetchDetail(sourceType, id) {
  const response = await fetch(`${ENDPOINTS[`${sourceType}Detail`]}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceType} detail ${id}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function withFallbackContent(item) {
  const restHtml = item?.content?.rendered || "";
  const restSignals = contentCompletenessSignals(restHtml);
  const restTextLength = restSignals.text_length;
  const needsFallback = !restHtml || restTextLength < MIN_REST_CONTENT_TEXT_LENGTH;

  if (!needsFallback && !item.link) return item;

  let liveHtml = "";
  if (item.link) {
    liveHtml = await fetchLiveContent(item.link);
  }

  if (!liveHtml) {
    return {
      ...item,
      content_source: "wordpress_rest",
      content_quality: {
        rest_text_length: restTextLength,
        live_text_length: 0,
        fallback_used: false
      }
    };
  }

  const liveSignals = contentCompletenessSignals(liveHtml);
  const liveTextLength = liveSignals.text_length;
  const liveLooksMoreComplete =
    needsFallback ||
    (liveTextLength > restTextLength + 500 && liveTextLength >= restTextLength * 1.35) ||
    liveSignals.forms > restSignals.forms ||
    liveSignals.headings >= restSignals.headings + 3 ||
    liveSignals.images >= restSignals.images + 3 ||
    liveSignals.buttons >= restSignals.buttons + 3;

  if (!liveLooksMoreComplete) {
    return {
      ...item,
      content_source: "wordpress_rest",
      content_quality: {
        rest_text_length: restTextLength,
        live_text_length: liveTextLength,
        rest_signals: restSignals,
        live_signals: liveSignals,
        fallback_used: false
      }
    };
  }

  return {
    ...item,
    content: {
      ...(item.content || {}),
      rendered: liveHtml
    },
    content_source: "live_html",
    content_quality: {
      rest_text_length: restTextLength,
      live_text_length: liveTextLength,
      rest_signals: restSignals,
      live_signals: liveSignals,
      fallback_used: true
    }
  };
}

async function fetchLiveContent(url) {
  const response = await fetch(url);
  if (!response.ok) return "";

  const html = await response.text();
  return extractPublicPageContentHtml(html);
}

async function writeRecords(items, sourceType, directory) {
  const usedFileNames = new Map();
  const outputs = [];

  for (const item of items) {
    const record = extractContentRecord(item, sourceType);
    const baseName = slugify(record.slug || record.title);
    const fileName = uniqueFileName(baseName, usedFileNames);
    const filePath = path.join(directory, `${fileName}.json`);

    await fs.writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
    outputs.push({ record, filePath });
  }

  return outputs;
}

function uniqueFileName(baseName, usedFileNames) {
  const count = usedFileNames.get(baseName) || 0;
  usedFileNames.set(baseName, count + 1);
  return count === 0 ? baseName : `${baseName}-${count + 1}`;
}

function toProjectRelativePath(filePath) {
  return `/${path.relative(process.cwd(), filePath).replace(/\\/g, "/")}`;
}

function countFallbacks(outputs) {
  return outputs.filter(({ record }) => record.content_source === "live_html").length;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
