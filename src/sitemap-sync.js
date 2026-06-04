import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import { chromium } from "playwright";
import { buildKeywordsFromText, buildSummaryFromText, normalizeText, slugify } from "./content-utils.js";
import {
  extractionReportPath,
  knowledgeIndexPath,
  manualOverridesDir,
  pagesDir,
  postsDir,
  projectRoot
} from "./paths.js";

const SITEMAP_INDEX_URL = "https://awesometechinc.com/sitemap_index.xml";
const TARGET_SITEMAPS = new Set([
  "https://awesometechinc.com/page-sitemap.xml",
  "https://awesometechinc.com/post-sitemap.xml"
]);
const RENDER_CONCURRENCY = 8;
const PAGE_TIMEOUT_MS = 25000;

async function main() {
  await ensureOutputDirs();
  await clearGeneratedJson(pagesDir);
  await clearGeneratedJson(postsDir);

  const sitemapUrls = await fetchSitemapIndex();
  const targetSitemaps = sitemapUrls.filter((url) => TARGET_SITEMAPS.has(url));
  const sitemapEntries = assignUniqueSlugs((await Promise.all(targetSitemaps.map(fetchUrlSet))).flat());

  const browser = await chromium.launch({ headless: true });
  const outputs = [];
  const reports = [];

  try {
    const rendered = await mapLimit(sitemapEntries, RENDER_CONCURRENCY, async (entry) => {
      const page = await browser.newPage();
      try {
        return await extractRenderedPage(page, entry);
      } finally {
        await page.close();
      }
    });

    for (const result of rendered) {
      const directory = result.record.source_type === "post" ? postsDir : pagesDir;
      const filePath = path.join(directory, `${result.record.slug}.json`);
      const withOverride = await applyManualOverride(result.record);

      await fs.writeFile(filePath, `${JSON.stringify(withOverride, null, 2)}\n`, "utf8");
      outputs.push({ record: withOverride, filePath });
      reports.push(buildReportRecord(withOverride, filePath, result.warnings));
    }
  } finally {
    await browser.close();
  }

  const index = outputs.map(({ record, filePath }) => ({
    source_type: record.source_type,
    title: record.title,
    slug: record.slug,
    url: record.url,
    json_file_path: toProjectRelativePath(filePath),
    keywords: record.keywords,
    summary: record.summary,
    word_count: record.word_count,
    status: record.status === "skipped" ? "skipped" : validationStatus(record, []).status,
    skip_reason: record.skip_reason || undefined
  }));

  await fs.writeFile(knowledgeIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  await fs.writeFile(extractionReportPath, `${JSON.stringify(buildExtractionReport(reports), null, 2)}\n`, "utf8");

  const okCount = reports.filter((report) => report.status === "ok").length;
  const needsReviewCount = reports.filter((report) => report.status === "needs_review").length;
  const skippedCount = reports.filter((report) => report.status === "skipped").length;
  const failedCount = reports.filter((report) => report.warnings.includes("EXTRACTION_FAILED")).length;

  console.log(`Total URLs: ${sitemapEntries.length}`);
  console.log(`Generated files: ${outputs.length}`);
  console.log(`OK: ${okCount}`);
  console.log(`Needs review: ${needsReviewCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log(`Generated knowledge index: ${toProjectRelativePath(knowledgeIndexPath)}`);
  console.log(`Generated extraction report: ${toProjectRelativePath(extractionReportPath)}`);
}

async function ensureOutputDirs() {
  await fs.mkdir(pagesDir, { recursive: true });
  await fs.mkdir(postsDir, { recursive: true });
  await fs.mkdir(manualOverridesDir, { recursive: true });
}

async function clearGeneratedJson(directory) {
  const files = await fs.readdir(directory).catch(() => []);
  await Promise.all(
    files.filter((file) => file.endsWith(".json")).map((file) => fs.unlink(path.join(directory, file)))
  );
}

async function fetchSitemapIndex() {
  const xml = await fetchText(SITEMAP_INDEX_URL);
  const $ = cheerio.load(xml, { xmlMode: true });
  return $("sitemap loc")
    .toArray()
    .map((node) => normalizeText($(node).text()))
    .filter(Boolean);
}

async function fetchUrlSet(sitemapUrl) {
  const xml = await fetchText(sitemapUrl);
  const $ = cheerio.load(xml, { xmlMode: true });
  const sourceType = sitemapUrl.includes("post-sitemap") ? "post" : "page";

  return $("url")
    .toArray()
    .map((node) => ({
      url: normalizeText($(node).find("loc").first().text()),
      modified_at: normalizeText($(node).find("lastmod").first().text()) || null,
      source_type: sourceType
    }))
    .filter((entry) => entry.url);
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  return response.text();
}

async function extractRenderedPage(page, entry) {
  const warnings = [];
  try {
    await page.goto(entry.url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
    await page.waitForLoadState("load", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(500);

    const extracted = await page.evaluate(() => {
      const unwantedSelectors = [
        "script",
        "style",
        "noscript",
        "svg",
        "template",
        "header",
        "footer",
        "nav",
        "aside",
        "[hidden]",
        "[aria-hidden='true']",
        ".site-header",
        ".site-footer",
        ".main-navigation",
        ".elementor-location-header",
        ".elementor-location-footer",
        ".cookie-notice",
        ".cky-consent-container",
        ".grecaptcha-badge",
        ".skip-link",
        ".screen-reader-text",
        ".swiper-button-next",
        ".swiper-button-prev",
        ".swiper-pagination",
        ".slick-arrow",
        ".slick-dots",
        ".slider-controls"
      ];

      const clone = document.body.cloneNode(true);
      clone.querySelectorAll(unwantedSelectors.join(",")).forEach((node) => node.remove());
      clone.querySelectorAll("a").forEach((node) => {
        if ((node.textContent || "").trim().toLowerCase() === "skip to content") node.remove();
      });
      clone.querySelectorAll("*").forEach((node) => {
        const style = window.getComputedStyle(node);
        const className = node.getAttribute("class") || "";
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          className.match(/elementor-shape|elementor-icon|swiper|slick|slider-arrow|slider-control/i)
        ) {
          node.remove();
        }
      });

      const candidateSelectors = [
        "main",
        "article",
        ".entry-content",
        ".page-content",
        ".post-content",
        ".site-main",
        "#content",
        ".elementor"
      ];
      let root = clone;
      let bestLength = textOf(root).length;
      for (const selector of candidateSelectors) {
        clone.querySelectorAll(selector).forEach((node) => {
          const length = textOf(node).length;
          if (length > bestLength) {
            root = node;
            bestLength = length;
          }
        });
      }

      const absolutize = (value) => {
        try {
          return new URL(value, window.location.href).href;
        } catch {
          return value || "";
        }
      };
      const clean = (value) => (value || "").replace(/\s+/g, " ").trim();
      const visibleText = (node) => clean(textOf(node));

      function textOf(node) {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
          acceptNode(textNode) {
            const parent = textNode.parentElement;
            const text = textNode.textContent?.replace(/\s+/g, " ").trim();
            if (!parent || !text) return NodeFilter.FILTER_REJECT;
            if (["SCRIPT", "STYLE", "NOSCRIPT", "SVG"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        const parts = [];
        while (walker.nextNode()) parts.push(walker.currentNode.textContent || "");
        return parts.join(" ");
      }

      function uniqueBy(items, keyFn) {
        const seen = new Set();
        return items.filter((item) => {
          const key = keyFn(item);
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      function extractImages(scope) {
        return uniqueBy(
          Array.from(scope.querySelectorAll("img[src]")).map((img) => ({
            src: absolutize(img.getAttribute("src")),
            alt: clean(img.getAttribute("alt"))
          })),
          (image) => image.src
        );
      }

      function extractButtons(scope) {
        return uniqueBy(
          Array.from(scope.querySelectorAll("a[href],button,input[type='submit'],input[type='button']")).map((node) => ({
            label: clean(node.textContent || node.getAttribute("value") || node.getAttribute("title")),
            url: node.getAttribute("href") ? absolutize(node.getAttribute("href")) : ""
          })),
          (button) => `${button.label}|${button.url}`
        ).filter((button) => button.label && button.label.length <= 100);
      }

      function fieldLabel(form, field) {
        const id = field.getAttribute("id");
        if (id) {
          const label = form.querySelector(`label[for="${CSS.escape(id)}"]`);
          if (label) return clean(label.textContent);
        }
        const wrapped = field.closest("label");
        if (wrapped) return clean(wrapped.textContent.replace(field.value || "", ""));
        return clean(field.getAttribute("placeholder") || field.getAttribute("name") || "");
      }

      function extractForms(scope) {
        return Array.from(scope.querySelectorAll("form")).map((form) => {
          const fields = Array.from(form.querySelectorAll("input,textarea,select"))
            .filter((field) => !["hidden", "submit", "button"].includes((field.getAttribute("type") || "").toLowerCase()))
            .map((field) => ({
              name: field.getAttribute("name") || field.getAttribute("id") || "",
              label: fieldLabel(form, field),
              type: field.getAttribute("type") || field.tagName.toLowerCase(),
              required: field.required || field.getAttribute("aria-required") === "true"
            }))
            .filter((field) => field.name || field.label);

          const submit = form.querySelector("input[type='submit'],button[type='submit'],button");
          return {
            form_type: form.querySelector("input[name='_wpcf7']") ? "contact_form_7" : "contact_form",
            form_id: form.getAttribute("id") || form.querySelector("input[name='_wpcf7']")?.getAttribute("value") || "",
            fields,
            submit_label: clean(submit?.textContent || submit?.getAttribute("value") || "Submit")
          };
        });
      }

      function extractLinks(scope) {
        return uniqueBy(
          Array.from(scope.querySelectorAll("a[href]")).map((anchor) => ({
            label: clean(anchor.textContent || anchor.getAttribute("title")),
            url: absolutize(anchor.getAttribute("href"))
          })),
          (link) => `${link.label}|${link.url}`
        ).filter((link) => link.label && link.label.length <= 120 && !link.url.startsWith("javascript:"));
      }

      function expandInteractiveContent() {
        root.querySelectorAll("details").forEach((node) => node.setAttribute("open", ""));
        root
          .querySelectorAll(
            "[aria-expanded='false'],.elementor-tab-title,.elementor-accordion-title,.elementor-toggle-title,[role='tab']"
          )
          .forEach((node) => {
            node.setAttribute("aria-expanded", "true");
            const controls = node.getAttribute("aria-controls");
            if (controls) root.querySelector(`#${CSS.escape(controls)}`)?.removeAttribute("hidden");
          });
        root
          .querySelectorAll(
            ".elementor-tab-content,.elementor-accordion-item .elementor-tab-content,.elementor-toggle-item .elementor-tab-content,[role='tabpanel']"
          )
          .forEach((node) => {
            node.removeAttribute("hidden");
            node.style.display = "block";
            node.style.visibility = "visible";
          });
      }

      function sectionType(title, content, sectionRoot) {
        const value = `${title} ${content}`.toLowerCase();
        if (sectionRoot.querySelector("form,input,textarea,select") || /contact|quote|consultation|get in touch/.test(value)) {
          return "form_section";
        }
        if (/faq|question|answer/.test(value)) return "faq_section";
        if (/testimonial|review|client/.test(value)) return "testimonial_section";
        if (/service|solution|feature|design|integration|automation/.test(value)) return "service_section";
        return "content_section";
      }

      const title = clean(document.querySelector("h1")?.textContent || document.title);
      const metaTitle = clean(document.querySelector("title")?.textContent || "");
      const metaDescription = clean(document.querySelector("meta[name='description']")?.getAttribute("content") || "");
      expandInteractiveContent();
      const headings = Array.from(root.querySelectorAll("h1,h2,h3,h4"));
      const sections = [];

      if (headings.length === 0) {
        const content = visibleText(root);
        sections.push({
          order: 1,
          title: "Page Content",
          type: "content_section",
          content,
          images: extractImages(root),
          buttons: extractButtons(root),
          forms: extractForms(root)
        });
      } else {
        const introNodes = [];
        let cursor = root.firstElementChild;
        while (cursor && !["H1", "H2", "H3", "H4"].includes(cursor.tagName)) {
          introNodes.push(cursor.cloneNode(true));
          cursor = cursor.nextElementSibling;
        }
        const intro = document.createElement("section");
        introNodes.forEach((node) => intro.appendChild(node));
        const introText = visibleText(intro);
        if (introText) {
          sections.push({
            order: sections.length + 1,
            title: "Intro",
            type: "content_section",
            content: introText,
            images: extractImages(intro),
            buttons: extractButtons(intro),
            forms: extractForms(intro)
          });
        }

        headings.forEach((heading) => {
          const sectionRoot = document.createElement("section");
          sectionRoot.appendChild(heading.cloneNode(true));
          let next = heading.nextElementSibling;
          while (next && !next.querySelector?.("h1,h2,h3,h4") && !["H1", "H2", "H3", "H4"].includes(next.tagName)) {
            sectionRoot.appendChild(next.cloneNode(true));
            next = next.nextElementSibling;
          }
          const sectionTitle = clean(heading.textContent) || `Section ${sections.length + 1}`;
          const content = clean(visibleText(sectionRoot).replace(sectionTitle, ""));
          if (!content && !sectionRoot.querySelector("img,a,button,form,input,textarea,select")) return;
          sections.push({
            order: sections.length + 1,
            title: sectionTitle,
            type: sectionType(sectionTitle, content, sectionRoot),
            content,
            images: extractImages(sectionRoot),
            buttons: extractButtons(sectionRoot),
            forms: extractForms(sectionRoot)
          });
        });
      }

      const fullText = clean(sections.map((section) => `${section.title} ${section.content}`).join(" "));
      return {
        title,
        meta_title: metaTitle,
        meta_description: metaDescription,
        full_text: fullText,
        word_count: fullText ? fullText.split(/\s+/).length : 0,
        headings_count: headings.length,
        images: extractImages(root),
        buttons: extractButtons(root),
        forms: extractForms(root),
        links: extractLinks(root),
        sections
      };
    });

    const summary = buildSummaryFromText(extracted.full_text, extracted.meta_description);
    const slug = entry.slug || slugFromUrl(entry.url);
    const record = {
      id: null,
      source_type: entry.source_type,
      slug,
      title: normalizeText(extracted.title),
      url: entry.url,
      meta_title: normalizeText(extracted.meta_title),
      meta_description: normalizeText(extracted.meta_description),
      modified_at: entry.modified_at,
      status: "public",
      summary,
      keywords: buildKeywordsFromText({
        title: extracted.title,
        summary,
        fullText: extracted.full_text,
        metaTitle: extracted.meta_title,
        metaDescription: extracted.meta_description
      }),
      full_text: normalizeText(extracted.full_text),
      word_count: extracted.word_count,
      headings_count: extracted.headings_count,
      images_count: extracted.images.length,
      buttons_count: extracted.buttons.length,
      forms_count: extracted.forms.length,
      sections: extracted.sections.map((section, index) => ({
        ...section,
        order: index + 1,
        content: normalizeText(section.content)
      })),
      images: extracted.images,
      buttons: extracted.buttons,
      forms: extracted.forms,
      links: extracted.links
    };

    applySkipRules(record);

    warnings.push(...validationStatus(record, warnings).warnings);
    return { record, warnings: [...new Set(warnings)] };
  } catch (error) {
    const slug = entry.slug || slugFromUrl(entry.url);
    const record = emptyRecord(entry, slug, error);
    const failureWarnings = ["EXTRACTION_FAILED"];
    if (/timeout/i.test(error.message || "")) failureWarnings.push("TIMEOUT");
    return { record, warnings: failureWarnings };
  }
}

function emptyRecord(entry, slug, error) {
  return {
    id: null,
    source_type: entry.source_type,
    slug,
    title: "",
    url: entry.url,
    meta_title: "",
    meta_description: "",
    modified_at: entry.modified_at,
    status: "public",
    summary: "",
    keywords: [],
    full_text: "",
    word_count: 0,
    headings_count: 0,
    images_count: 0,
    buttons_count: 0,
    forms_count: 0,
    sections: [],
    images: [],
    buttons: [],
    forms: [],
    links: [],
    extraction_error: error.message
  };
}

async function applyManualOverride(record) {
  const overridePath = path.join(manualOverridesDir, `${record.slug}.json`);
  try {
    const override = JSON.parse(await fs.readFile(overridePath, "utf8"));
    return deepMerge(record, override);
  } catch (error) {
    if (error.code === "ENOENT") return record;
    throw error;
  }
}

function buildReportRecord(record, filePath, priorWarnings = []) {
  const validation = validationStatus(record, priorWarnings);
  return {
    url: record.url,
    slug: record.slug,
    source_type: record.source_type,
    json_file_path: toProjectRelativePath(filePath),
    word_count: record.word_count,
    headings_count: record.headings_count,
    images_count: record.images_count,
    buttons_count: record.buttons_count,
    forms_count: record.forms_count,
    status: validation.status,
    warnings: validation.warnings,
    skip_reason: record.skip_reason || undefined
  };
}

function buildExtractionReport(records) {
  const ok = records.filter((record) => record.status === "ok");
  const needsReview = records.filter((record) => record.status === "needs_review");
  const skipped = records.filter((record) => record.status === "skipped");
  const failed = records.filter((record) => record.warnings.includes("EXTRACTION_FAILED"));
  const pagesWithForms = records.filter((record) => record.forms_count > 0);

  return {
    records,
    summary: {
      total_urls: records.length,
      ok_count: ok.length,
      needs_review_count: needsReview.length,
      skipped_count: skipped.length,
      failed_count: failed.length,
      top_10_lowest_word_count_pages: [...records]
        .sort((a, b) => a.word_count - b.word_count)
        .slice(0, 10),
      pages_with_no_headings: records.filter((record) => record.headings_count === 0),
      pages_with_forms: pagesWithForms,
      pages_with_forms_count: pagesWithForms.length,
      pages_with_highest_content_volume: [...records]
        .sort((a, b) => b.word_count - a.word_count)
        .slice(0, 10)
    }
  };
}

function validationStatus(record, warnings = []) {
  if (record.status === "skipped") {
    return {
      status: "skipped",
      warnings: []
    };
  }

  const nextWarnings = new Set(warnings);
  if ((record.word_count || 0) < 150) nextWarnings.add("LOW_WORD_COUNT");
  if ((record.headings_count || 0) === 0) nextWarnings.add("NO_HEADINGS");
  if (!record.full_text) nextWarnings.add("NO_VISIBLE_TEXT");
  if (!record.title) nextWarnings.add("MISSING_TITLE");
  if (record.extraction_error) nextWarnings.add("EXTRACTION_FAILED");
  return {
    status: nextWarnings.size ? "needs_review" : "ok",
    warnings: [...nextWarnings]
  };
}

function applySkipRules(record) {
  const slug = record.slug;
  const url = record.url;
  const title = `${record.title} ${record.meta_title}`.toLowerCase();
  const utilitySlugs = new Set(["page-not-found", "thank-you", "conference-thank-you"]);
  if (utilitySlugs.has(slug) || /404|page not found/.test(title)) {
    record.status = "skipped";
    record.skip_reason = "Utility page with no durable RAG value.";
  } else if (url.includes("/events-photos/")) {
    record.status = "skipped";
    record.skip_reason = "Event photo gallery page; low text value for chatbot retrieval.";
  } else if (slug === "conference-registration-ai-for-mortgage-leaders") {
    record.status = "skipped";
    record.skip_reason = "Bare duplicate registration/contact form page; insufficient standalone RAG content.";
  }
}

function assignUniqueSlugs(entries) {
  const seen = new Map();
  return entries.map((entry) => {
    const baseSlug = slugFromUrl(entry.url);
    const count = seen.get(baseSlug) || 0;
    seen.set(baseSlug, count + 1);
    if (count === 0) return { ...entry, slug: baseSlug };

    const parsed = new URL(entry.url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const parent = parts.length > 1 ? slugify(parts.at(-2)) : "duplicate";
    return { ...entry, slug: `${parent}-${baseSlug}` };
  });
}

function slugFromUrl(url) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);
  return parts.length ? slugify(parts.at(-1)) : "home";
}

function toProjectRelativePath(filePath) {
  return `/${path.relative(projectRoot, filePath).replace(/\\/g, "/")}`;
}

function deepMerge(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) return override;
  const merged = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === "object" && !Array.isArray(value) && typeof merged[key] === "object") {
      merged[key] = deepMerge(merged[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let completed = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
      completed += 1;
      if (completed % 25 === 0 || completed === items.length) {
        console.log(`Rendered ${completed}/${items.length} URLs`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
