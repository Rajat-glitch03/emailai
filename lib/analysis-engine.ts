export type WebsiteEvidence = {
  id: string;
  status: "found" | "not_found" | "unknown";
  detail: string;
  pageUrl: string;
};

export type WebsitePage = {
  url: string;
  title: string;
  description: string;
  headings: string[];
  text: string;
  canonicalUrl?: string;
  robotsDirectives?: string;
  schemaTypes?: string[];
};

type Recommendation = {
  title: string;
  priority: "high" | "medium" | "low";
  reason: string;
  action: string;
};

type ReadinessMetric = {
  label: string;
  value: number;
  description: string;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function inferIndustry(text: string): string {
  const value = text.toLowerCase();
  const categories: Array<[string, string[]]> = [
    ["E-commerce and Retail", ["ecommerce", "e-commerce", "online store", "shopping cart", "retail", "shop products"]],
    ["Healthcare", ["healthcare", "clinic", "medical practice", "patient care", "dental practice", "physiotherapy"]],
    ["Education", ["education platform", "online learning", "courses", "academy", "school", "tutoring"]],
    ["Finance and Accounting", ["accounting software", "bookkeeping", "financial services", "payments", "invoicing", "expense management"]],
    ["Legal Services", ["law firm", "legal services", "attorney", "solicitor", "legal advice"]],
    ["Marketing and Advertising", ["marketing agency", "advertising agency", "digital marketing", "brand strategy", "public relations"]],
    ["Real Estate", ["real estate", "property management", "estate agency", "property listings"]],
    ["Travel and Hospitality", ["hotel booking", "travel agency", "tour operator", "hospitality", "vacation rental"]],
    ["Food and Restaurants", ["restaurant", "food delivery", "catering", "cafe", "menu"]],
    ["Video and Collaboration Software", ["video meeting", "video conferencing", "online meetings", "screen sharing", "team collaboration"]],
    ["Project and Workflow Software", ["project management", "task management", "kanban", "workflow automation", "project tracking"]],
    ["Software and Technology", ["saas", "software platform", "web application", "developer tool", "cloud platform", "api"]],
    ["Home and Professional Services", ["plumbing", "electrician", "roofing", "home services", "consulting firm", "professional services"]],
  ];

  const ranked = categories
    .map(([name, terms]) => ({
      name,
      score: terms.reduce((score, term) => score + (value.includes(term) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);

  return !ranked[0] || ranked[0].score === 0 || ranked[0].score === ranked[1]?.score
    ? "Not identified"
    : ranked[0].name;
}

function createBuyerPrompts(brandName: string, industry: string, title: string, description: string): string[] {
  const removeBrand = (value: string) => value
    .replace(new RegExp(brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), " ")
    .replace(/\s+/g, " ")
    .trim();
  const descriptionText = removeBrand(description)
    .replace(/^[:|–—,\s]*(?:is|are|offers|provides|helps|makes|builds|creates)\b\s*/i, "")
    .replace(/[.!?]+$/, "")
    .trim();
  const titleText = removeBrand(title).replace(/[|–—:]+/g, " ").replace(/\s+/g, " ").trim();
  const subject = (descriptionText.length >= 18 ? descriptionText : titleText).slice(0, 110).trim();
  const category = industry !== "Not identified" ? industry.toLowerCase() : "solution";

  if (industry !== "Not identified") {
    return [
      `What should buyers compare when choosing a ${category} provider?`,
      subject
        ? `Which ${category} options are suitable for buyers who need ${subject}?`
        : `Which ${category} options are suitable for small teams and growing businesses?`,
      subject
        ? `What alternatives should buyers evaluate when looking for ${subject}?`
        : `What are the main differences between ${category} providers?`,
    ];
  }
  return subject ? [
    `What should buyers compare when choosing a solution for ${subject}?`,
    `Which alternatives help people who need ${subject}?`,
    `What questions should buyers ask before choosing a provider for ${subject}?`,
  ] : [
    "What should customers compare before choosing a business provider?",
    "What questions should buyers ask before choosing a business solution?",
    "How can buyers compare the trade-offs between competing business solutions?",
  ];
}

export function analyzeWebsiteDeterministically(input: {
  brandName: string;
  pages: WebsitePage[];
  evidence: WebsiteEvidence[];
  inspectedPageCount: number;
  maxPageCount: number;
}) {
  const { brandName, pages, evidence, inspectedPageCount, maxPageCount } = input;
  const home = pages[0];
  const allText = pages.map((page) => `${page.title} ${page.description} ${page.headings.join(" ")} ${page.text}`).join(" ");
  const industry = inferIndustry(`${home.title} ${home.description} ${home.headings.join(" ")} ${home.text}`);
  const inspectedUrls = pages.map((page) => page.url);
  const pageCount = Math.max(1, inspectedUrls.length);

  const metadataPageScores = pages.map((page) =>
    (Number(Boolean(page.title)) * 60) + (Number(Boolean(page.description)) * 40),
  );
  const metadataScore = clamp(metadataPageScores.reduce((sum, value) => sum + value, 0) / pageCount);

  const headingCoverage = pages.filter((page) => page.headings.length > 0).length / pageCount;
  const questionContentFound = /\b(frequently asked questions|\bfaq\b|common questions|questions and answers)\b/i.test(allText);
  const contentScore = clamp((headingCoverage * 70) + (Number(questionContentFound) * 30));

  const businessSchemaTypes = new Set([
    "organization", "localbusiness", "corporation", "softwareapplication", "product",
    "service", "professionalservice", "medicalbusiness", "educationalorganization",
    "store", "restaurant", "course",
  ]);
  const allSchemaTypes = new Set(pages.flatMap((page) => page.schemaTypes ?? []));
  const hasBusinessSchema = [...allSchemaTypes].some((type) => businessSchemaTypes.has(type.toLowerCase()));
  const hasAnySchema = allSchemaTypes.size > 0;
  const structuredDataScore = hasBusinessSchema ? 100 : hasAnySchema ? 50 : 0;

  const robotsEvidence = evidence.find((item) => item.id === "site.robots_txt");
  const sitemapEvidence = evidence.find((item) => item.id === "site.sitemap_xml");
  const noindexDetected = pages.some((page) => /\bnoindex\b/i.test(page.robotsDirectives ?? ""));
  const robotsBlockAll = evidence.some((item) => item.id === "site.robots_block_all" && item.status === "found");
  const crawlabilityScore = noindexDetected || robotsBlockAll
    ? 0
    : clamp(70 + (Number(sitemapEvidence?.status === "found") * 15) + (Number(robotsEvidence?.status === "found") * 15));

  const metrics: ReadinessMetric[] = [
    {
      label: "Page metadata",
      value: metadataScore,
      description: `${pages.filter((page) => page.title && page.description).length} of ${pageCount} inspected pages had both a title and a meta description.`,
    },
    {
      label: "Content structure",
      value: contentScore,
      description: `${pages.filter((page) => page.headings.length > 0).length} of ${pageCount} inspected pages had headings; FAQ or question-led content ${questionContentFound ? "was detected" : "was not detected"}.`,
    },
    {
      label: "Structured data",
      value: structuredDataScore,
      description: hasBusinessSchema
        ? `Business or product schema types detected: ${[...allSchemaTypes].join(", ")}.`
        : hasAnySchema
          ? `JSON-LD was detected, but no business or product type was identified (${[...allSchemaTypes].join(", ")}).`
          : "No parseable JSON-LD types were detected on the inspected pages.",
    },
    {
      label: "Crawlability signals",
      value: crawlabilityScore,
      description: `robots.txt ${robotsEvidence?.status === "found" ? "was found" : "was not confirmed"}; sitemap.xml ${sitemapEvidence?.status === "found" ? "was found" : "was not confirmed"}${noindexDetected ? "; a noindex directive was detected" : robotsBlockAll ? "; robots.txt blocks all crawlers from the site" : ""}.`,
    },
  ];

  const readinessScore = clamp(metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length);
  const recommendations: Recommendation[] = [];
  const add = (item: Recommendation) => {
    if (!recommendations.some((existing) => existing.title === item.title)) recommendations.push(item);
  };

  if (pages.some((page) => !page.title)) {
    add({
      title: "Add descriptive page titles",
      priority: "high",
      reason: "One or more inspected pages did not expose an HTML title element.",
      action: "Give each important page a distinct title that describes its actual content or offering.",
    });
  }
  if (!home.description) {
    add({
      title: "Clarify the homepage description",
      priority: "medium",
      reason: "No standard meta description was detected on the inspected homepage.",
      action: "Write a concise description of what the business offers, who it helps, and the problem it solves.",
    });
  }
  if (pages.some((page) => page.headings.length === 0)) {
    add({
      title: "Improve page heading structure",
      priority: "medium",
      reason: "At least one inspected page did not expose H1–H3 headings.",
      action: "Add a clear primary heading and descriptive section headings that reflect the information on each page.",
    });
  }
  if (noindexDetected) {
    add({
      title: "Review the noindex directive",
      priority: "high",
      reason: "A noindex directive was detected on at least one inspected page.",
      action: "Confirm that the affected page is intentionally excluded from search indexes. Remove noindex only from pages that should be publicly discoverable.",
    });
  }
  if (robotsBlockAll) {
    add({
      title: "Review the site-wide robots.txt block",
      priority: "high",
      reason: "The inspected robots.txt file contains a Disallow: / rule for all crawlers.",
      action: "Check whether the rule is intentional. Only remove or narrow it when public search discovery is desired and the affected pages are safe to crawl.",
    });
  }
  if (sitemapEvidence?.status !== "found" && inspectedPageCount > 1) {
    add({
      title: "Publish a sitemap for important pages",
      priority: "medium",
      reason: "A sitemap could not be confirmed during this scan, although multiple internal pages were discoverable.",
      action: "Publish an XML sitemap containing canonical, indexable pages and reference it from robots.txt.",
    });
  }
  if (!questionContentFound && (industry !== "Not identified" || home.description)) {
    add({
      title: "Answer real buyer questions on key pages",
      priority: "low",
      reason: "Question-led or FAQ-style content was not detected in the text extracted from the inspected pages.",
      action: "Add clear answers to genuine questions about fit, pricing, limitations, setup, and alternatives. Keep each answer visible on the page.",
    });
  }
  if (!hasBusinessSchema && home.title && home.description && industry !== "Not identified") {
    add({
      title: "Add structured data that matches the offering",
      priority: "low",
      reason: "The inspected pages did not expose a recognized schema type for the identified business category.",
      action: "Choose an accurate schema type for the actual business or product, populate it with verified details, and keep it consistent with visible page content.",
    });
  }

  const summary = `This report inspected ${inspectedPageCount} page(s), up to a limit of ${maxPageCount}. The AEO readiness score is a heuristic checklist based on metadata, content structure, structured data, and crawlability signals found on those pages. It is not a search ranking, an AI recommendation score, or proof that an assistant mentions the business. ${industry === "Not identified" ? "The site's category could not be identified confidently from the inspected text." : `The inspected homepage appears related to ${industry.toLowerCase()}.`} AI assistant mentions and citations are reported separately and are only scored when a live provider returns verifiable grounding data.`;

  return {
    readinessScore,
    metrics,
    recommendations: recommendations.slice(0, 8),
    summary,
    industry,
    evidenceSummary: evidence.map(({ id, status, detail, pageUrl }) => ({ id, status, detail, pageUrl })),
    suggestedBuyerPrompts: createBuyerPrompts(brandName, industry, home.title, home.description),
  };
}
