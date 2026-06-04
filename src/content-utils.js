import * as cheerio from "cheerio";

const STOP_WORDS = new Set([
  "about",
  "above",
  "after",
  "again",
  "also",
  "awesome",
  "awesometech",
  "before",
  "being",
  "below",
  "between",
  "business",
  "company",
  "could",
  "development",
  "every",
  "from",
  "have",
  "into",
  "more",
  "need",
  "page",
  "post",
  "service",
  "services",
  "than",
  "that",
  "their",
  "there",
  "these",
  "this",
  "through",
  "with",
  "work",
  "your"
]);

const ALLOWED_ATTRS = new Set([
  "href",
  "src",
  "alt",
  "title",
  "name",
  "type",
  "value",
  "required",
  "aria-required",
  "placeholder",
  "id",
  "for"
]);

export function decodeText(value = "") {
  return cheerio.load(String(value), { decodeEntities: true }).text();
}

export function normalizeText(value = "") {
  return decodeText(String(value))
    .replace(/\u00a0/g, " ")
    .replace(/\[[^\]]*(elementor|vc_|et_|rev_slider|slider|shortcode)[^\]]*\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(value = "") {
  const slug = normalizeText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "untitled";
}

export function stripHtml(html = "") {
  const $ = cheerio.load(html);
  removeNoise($);
  return normalizeText($("body").text() || $.root().text());
}

export function contentCompletenessSignals(html = "") {
  const $ = cheerio.load(html, { decodeEntities: true });
  removeNoise($);
  return {
    text_length: normalizeText($("body").text() || $.root().text()).length,
    headings: $("h1,h2,h3").length,
    images: $("img[src]").length,
    buttons: $("a[href],button,input[type='submit'],input[type='button']").length,
    forms: $("form").length + $("input,textarea,select").length
  };
}

export function cleanHtml(html = "") {
  const $ = cheerio.load(html, { decodeEntities: true });
  removeNoise($);
  removeUnnecessaryAttributes($);
  removeEmptyContainers($);
  return $.root().html() || "";
}

export function extractPublicPageContentHtml(html = "") {
  const $ = cheerio.load(html, { decodeEntities: true });
  removeNoise($);
  $(
    [
      "header",
      "footer",
      "nav",
      "aside",
      ".site-header",
      ".site-footer",
      ".main-navigation",
      ".elementor-location-header",
      ".elementor-location-footer",
      ".cookie-notice",
      ".grecaptcha-badge"
    ].join(",")
  ).remove();

  const candidates = [
    "main",
    "article",
    ".entry-content",
    ".page-content",
    ".post-content",
    ".site-main",
    "#content",
    ".elementor"
  ];

  let bestNode = $("body");
  let bestLength = normalizeText(bestNode.text()).length;

  for (const selector of candidates) {
    $(selector).each((_, element) => {
      const node = $(element);
      const textLength = normalizeText(node.text()).length;
      if (textLength > bestLength) {
        bestNode = node;
        bestLength = textLength;
      }
    });
  }

  return bestNode.html() || "";
}

export function extractContentRecord(raw, sourceType) {
  const title = normalizeText(raw?.title?.rendered || raw?.title || raw?.slug || "");
  const excerpt = stripHtml(raw?.excerpt?.rendered || "");
  const html = raw?.content?.rendered || "";
  const cleanedHtml = cleanHtml(html);
  const $ = cheerio.load(cleanedHtml, { decodeEntities: true });
  const sections = extractSections($);
  const fullText = sections.map((section) => `${section.title} ${section.content}`).join(" ");
  const summary = buildSummary(excerpt || fullText, raw?.yoast_head_json?.description);
  const keywords = extractKeywords({
    title,
    summary,
    fullText,
    yoast: raw?.yoast_head_json
  });

  const base = {
    id: raw.id,
    source_type: sourceType,
    slug: raw.slug || slugify(title),
    title,
    url: raw.link,
    modified_at: raw.modified,
    status: raw.status,
    content_source: raw.content_source || "wordpress_rest",
    content_quality: raw.content_quality || null,
    summary,
    keywords,
    sections
  };

  if (sourceType === "page") {
    base.parent = raw.parent ?? 0;
  } else {
    base.categories = raw.categories || [];
    base.tags = raw.tags || [];
  }

  return base;
}

export function buildSummaryFromText(text = "", metaDescription = "") {
  return buildSummary(text, metaDescription);
}

export function buildKeywordsFromText({ title = "", summary = "", fullText = "", metaTitle = "", metaDescription = "" }) {
  return extractKeywords({
    title,
    summary,
    fullText,
    yoast: {
      title: metaTitle,
      description: metaDescription
    }
  });
}

function removeNoise($) {
  $(
    [
      "script",
      "style",
      "svg",
      "noscript",
      "template",
      "link",
      "meta",
      "iframe",
      "input[type='hidden']",
      "[aria-hidden='true']",
      "[hidden]",
      ".elementor-screen-only",
      ".screen-reader-text",
      ".swiper-button-next",
      ".swiper-button-prev",
      ".swiper-pagination",
      ".slick-arrow",
      ".slick-dots",
      ".slider-controls",
      ".rev_slider",
      ".rs-module-wrap",
      ".yoast-schema-graph"
    ].join(",")
  ).remove();

  $("[class]").each((_, element) => {
    const className = $(element).attr("class") || "";
    if (/(elementor-shape|elementor-icon|swiper|slick|rev-slider|slider-arrow|slider-control)/i.test(className)) {
      $(element).remove();
    }
  });
}

function removeUnnecessaryAttributes($) {
  $("*").each((_, element) => {
    for (const attr of Object.keys(element.attribs || {})) {
      if (!ALLOWED_ATTRS.has(attr)) {
        $(element).removeAttr(attr);
      }
    }
  });
}

function removeEmptyContainers($) {
  let removed = true;
  while (removed) {
    removed = false;
    $("div,section,article,span,p").each((_, element) => {
      const node = $(element);
      const hasMedia = node.find("img,a,button,form,input,textarea,select").length > 0;
      if (!hasMedia && normalizeText(node.text()) === "") {
        node.remove();
        removed = true;
      }
    });
  }
}

function extractSections($) {
  const body = $("body").length ? $("body") : $.root();
  const headings = body.find("h1,h2,h3").toArray();

  if (headings.length === 0) {
    const content = normalizeText(body.text());
    return content
      ? [
          {
            order: 1,
            title: "Main Content",
            type: "content_section",
            content,
            images: extractImages(body, $),
            buttons: extractButtons(body, $),
            forms: extractForms(body, $)
          }
        ]
      : [];
  }

  const sections = [];
  headings.forEach((heading, index) => {
    const headingNode = $(heading);
    const title = normalizeText(headingNode.text()) || `Section ${index + 1}`;
    const nodes = [headingNode];
    let cursor = headingNode.next();

    while (cursor.length && !/^h[1-3]$/i.test(cursor.get(0).tagName || "")) {
      nodes.push(cursor);
      cursor = cursor.next();
    }

    const container = $("<div></div>");
    nodes.forEach((node) => container.append(node.clone()));
    const content = normalizeText(container.text().replace(title, ""));

    if (!content && !container.find("img,a,button,form,input,textarea,select").length) {
      return;
    }

    sections.push({
      order: sections.length + 1,
      title,
      type: detectSectionType(title, container),
      content,
      images: extractImages(container, $),
      buttons: extractButtons(container, $),
      forms: extractForms(container, $)
    });
  });

  return sections;
}

function detectSectionType(title, container) {
  const text = `${title} ${container.text()}`.toLowerCase();
  if (container.find("form,input,textarea,select").length || /contact|quote|consultation|get in touch/.test(text)) {
    return "form_section";
  }
  if (/faq|question|answer/.test(text)) {
    return "faq_section";
  }
  if (/testimonial|review|client/.test(text)) {
    return "testimonial_section";
  }
  if (/service|solution|feature/.test(text)) {
    return "service_section";
  }
  return "content_section";
}

function extractImages(container, $) {
  const seen = new Set();
  return container
    .find("img")
    .toArray()
    .map((img) => ({
      src: $(img).attr("src") || "",
      alt: normalizeText($(img).attr("alt") || "")
    }))
    .filter((image) => {
      if (!image.src || seen.has(image.src)) return false;
      seen.add(image.src);
      return true;
    });
}

function extractButtons(container, $) {
  const seen = new Set();
  const links = container.find("a,button,input[type='submit'],input[type='button']").toArray();

  return links
    .map((link) => {
      const node = $(link);
      const label = normalizeText(node.text() || node.attr("value") || node.attr("title") || "");
      const url = node.attr("href") || "";
      return { label, url };
    })
    .filter((button) => {
      if (!button.label || button.label.length > 80) return false;
      const key = `${button.label}|${button.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return /contact|consult|quote|demo|learn|read|start|submit|apply|call|get|book|schedule|send|download|view|more/i.test(
        button.label
      );
    });
}

function extractForms(container, $) {
  const forms = [];
  container.find("form").each((_, form) => {
    const formNode = $(form);
    const formId =
      formNode.attr("id")?.match(/\d+/)?.[0] ||
      formNode.find("input[name='_wpcf7']").attr("value") ||
      formNode.find("input[name='_wpcf7_unit_tag']").attr("value") ||
      "";
    const fields = [];

    formNode.find("input,textarea,select").each((__, field) => {
      const fieldNode = $(field);
      const type = fieldNode.attr("type") || field.tagName || "text";
      if (type === "hidden" || type === "submit" || type === "button") return;
      const name = fieldNode.attr("name") || fieldNode.attr("id") || "";
      if (!name) return;
      fields.push({
        name,
        label: fieldLabel(formNode, fieldNode, $),
        type,
        required: fieldNode.attr("required") !== undefined || fieldNode.attr("aria-required") === "true"
      });
    });

    forms.push({
      form_type: formNode.find("input[name='_wpcf7']").length ? "contact_form_7" : "html_form",
      form_id: formId,
      fields,
      submit_label: normalizeText(formNode.find("input[type='submit'],button[type='submit'],button").first().text() || formNode.find("input[type='submit']").first().attr("value") || "Submit")
    });
  });

  return forms;
}

function fieldLabel(formNode, fieldNode, $) {
  const id = fieldNode.attr("id");
  if (id) {
    const explicit = formNode.find(`label[for='${id}']`).first();
    if (explicit.length) return normalizeText(explicit.text());
  }

  const wrappingLabel = fieldNode.closest("label");
  if (wrappingLabel.length) {
    const labelText = normalizeText(wrappingLabel.clone().children().remove().end().text());
    if (labelText) return labelText;
  }

  return normalizeText(fieldNode.attr("placeholder") || fieldNode.attr("name") || "");
}

function buildSummary(text, yoastDescription) {
  const source = normalizeText(yoastDescription || text);
  if (!source) return "";
  const sentences = source.match(/[^.!?]+[.!?]*/g) || [source];
  return normalizeText(sentences.slice(0, 2).join(" ")).slice(0, 320);
}

function extractKeywords({ title, summary, fullText, yoast }) {
  const text = normalizeText(
    [
      title,
      summary,
      yoast?.title,
      yoast?.description,
      yoast?.og_title,
      yoast?.og_description,
      fullText
    ]
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();

  const phrases = [];
  const phrasePatterns = [
    /mortgage [a-z ]{3,30}/g,
    /loan officer [a-z ]{3,30}/g,
    /mismo [a-z ]{0,30}/g,
    /encompass [a-z ]{0,30}/g,
    /contact [a-z ]{0,24}/g,
    /website [a-z ]{3,30}/g,
    /integration [a-z ]{3,30}/g
  ];

  for (const pattern of phrasePatterns) {
    for (const match of text.matchAll(pattern)) {
      phrases.push(normalizeText(match[0]).replace(/\s+/g, " "));
    }
  }

  const counts = new Map();
  for (const token of text.match(/[a-z][a-z0-9]{2,}/g) || []) {
    if (STOP_WORDS.has(token)) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  const terms = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([term]) => term);

  return [...new Set([...phrases, ...terms])].filter(Boolean).slice(0, 16);
}
