import { analyzeWebsiteDeterministically, type WebsiteEvidence, type WebsitePage } from "@/lib/analysis-engine";
import { testGeminiVisibility } from "@/lib/gemini-visibility";

import { NextResponse } from "next/server";
import { resolve4 } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest, type IncomingHttpHeaders } from "node:http";
import { request as httpsRequest } from "node:https";

import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PAGE_BYTES = 1_500_000;
const MAX_TOTAL_HTML_BYTES = 8_000_000;
const MAX_SITEMAP_BYTES = 500_000;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 5_000;
const MAX_CRAWL_DURATION_MS = 30_000;
const MAX_PAGES = 10;

type FetchResult = {
  finalUrl: string;
  body: string;
  bytes: number;
  contentType: string;
  headers: IncomingHttpHeaders;
};

type CrawlResult = {
  finalUrl: string;
  pages: WebsitePage[];
  evidence: WebsiteEvidence[];
  homepageHtml: string;
  totalBytes: number;
  discoveredInternalPageCount: number;
};

type RawHttpResponse = {
  statusCode: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
};

function isPublicIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;

  const [a, b, c] = parts;
  if (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 2) ||
    (a === 192 && b === 88 && c === 99) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113)
  ) return false;

  return true;
}

async function resolvePublicIpv4(hostname: string): Promise<string> {
  if (isIP(hostname) === 6) {
    throw new Error("IPv6 website addresses are not supported yet.");
  }
  if (isIP(hostname) === 4) {
    if (!isPublicIpv4(hostname)) throw new Error("This website resolves to a restricted network address.");
    return hostname;
  }

  let addresses: string[];
  try {
    addresses = await resolve4(hostname);
  } catch {
    throw new Error("We couldn't resolve this website address.");
  }
  if (!addresses.length || addresses.some((address) => !isPublicIpv4(address))) {
    throw new Error("This website resolves to a restricted network address.");
  }
  return addresses[0];
}

async function validatePublicUrl(value: string): Promise<{ url: URL; address: string }> {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid website URL.");
  }

  if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new Error("Only public HTTP or HTTPS websites are supported.");
  }
  if (url.port && !((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443"))) {
    throw new Error("This website uses an unsupported port.");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") ||
    hostname.endsWith(".internal") || hostname.endsWith(".test") || hostname.endsWith(".invalid")
  ) {
    throw new Error("Private or local network addresses are not allowed.");
  }

  url.hostname = hostname;
  const address = await resolvePublicIpv4(hostname);
  return { url, address };
}

function requestPinnedAddress(url: URL, pinnedAddress: string, maxBytes: number): Promise<RawHttpResponse> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let totalBytes = 0;
    const chunks: Buffer[] = [];
    const requestOptions = {
      method: "GET",
      agent: false,
      headers: {
        "User-Agent": "QuansAI-WebsiteAnalyzer/2.0 (+https://quansai.com)",
        Accept: "text/html,application/xhtml+xml,application/xml,text/xml,text/plain;q=0.9,*/*;q=0.1",
        "Accept-Encoding": "identity",
        Connection: "close",
      },
      // Pin each socket to the address that was validated immediately before this request.
      lookup: (_hostname: string, _options: unknown, callback: (error: NodeJS.ErrnoException | null, address: string, family: number) => void) => {
        callback(null, pinnedAddress, 4);
      },
    } as never;
    const requester = (url.protocol === "https:" ? httpsRequest : httpRequest) as typeof httpRequest;

    const request = requester(url, requestOptions, (response) => {
      const statusCode = response.statusCode ?? 0;
      if ([301, 302, 303, 307, 308].includes(statusCode)) {
        // Redirect response bodies are irrelevant; close the stream instead of draining an unbounded body.
        settled = true;
        const headers = response.headers;
        response.destroy();
        resolve({ statusCode, headers, body: Buffer.alloc(0) });
        return;
      }

      const declaredLength = Number(response.headers["content-length"] ?? 0);
      if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
        settled = true;
        response.destroy();
        reject(new Error("The webpage is too large to analyze."));
        return;
      }

      response.on("data", (chunk: Buffer | string) => {
        if (settled) return;
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buffer.byteLength;
        if (totalBytes > maxBytes) {
          settled = true;
          response.destroy();
          request.destroy();
          reject(new Error("The webpage is too large to analyze."));
          return;
        }
        chunks.push(buffer);
      });

      response.on("end", () => {
        if (settled) return;
        settled = true;
        resolve({ statusCode, headers: response.headers, body: Buffer.concat(chunks) });
      });
      response.on("error", (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      });
    });

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("The website took too long to respond."));
    });
    request.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });
    request.end();
  });
}

async function fetchPublicResource(
  initialUrl: string,
  allowedOrigin: string | undefined,
  acceptedContentType: RegExp,
  maxBytes: number,
): Promise<FetchResult> {
  let currentUrl = initialUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const resolved = await validatePublicUrl(currentUrl);
    if (allowedOrigin && resolved.url.origin !== allowedOrigin) {
      throw new Error("The crawler cannot leave the original website.");
    }

    const response = await requestPinnedAddress(resolved.url, resolved.address, maxBytes);
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      const location = response.headers.location;
      if (!location || redirects === MAX_REDIRECTS) throw new Error("The website redirected too many times.");
      currentUrl = new URL(location, resolved.url).toString();
      continue;
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`The website returned an HTTP ${response.statusCode} response.`);
    }

    const rawContentType = response.headers["content-type"];
    const contentType = Array.isArray(rawContentType) ? rawContentType[0] : rawContentType ?? "";
    if (!acceptedContentType.test(contentType)) {
      throw new Error("The submitted URL does not return a supported public resource.");
    }
    if (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity") {
      throw new Error("The website returned an unsupported compressed response.");
    }

    return {
      finalUrl: resolved.url.toString(),
      body: response.body.toString("utf8"),
      bytes: response.body.byteLength,
      contentType,
      headers: response.headers,
    };
  }

  throw new Error("Unable to retrieve this website.");
}

function decodeCodePoint(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
    return " ";
  }
  return String.fromCodePoint(value);
}

function cleanText(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code: string) => decodeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => decodeCodePoint(parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function getTagAttribute(tag: string, attribute: string): string {
  const escaped = attribute.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*["']([^"']*)["']`, "i"));
  return match?.[1]?.trim() ?? "";
}

function getMetaContent(html: string, name: string): string {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of metaTags) {
    const key = getTagAttribute(tag, "name") || getTagAttribute(tag, "property");
    if (key.toLowerCase() === name.toLowerCase()) return cleanText(getTagAttribute(tag, "content"));
  }
  return "";
}

function getCanonicalUrl(html: string, pageUrl: string): string {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const rel = getTagAttribute(tag, "rel").toLowerCase().split(/\s+/);
    const href = getTagAttribute(tag, "href");
    if (!rel.includes("canonical") || !href) continue;
    try {
      const url = new URL(href, pageUrl);
      if (["http:", "https:"].includes(url.protocol) && !url.username && !url.password) return url.toString();
    } catch {
      return "";
    }
  }
  return "";
}

function getRobotsDirectives(html: string): string {
  const directives = [getMetaContent(html, "robots"), getMetaContent(html, "googlebot")]
    .filter(Boolean);
  return [...new Set(directives)].join(", ");
}

function inspectStructuredData(html: string) {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const types = new Set<string>();
  let parseErrors = 0;

  function collectTypes(value: unknown) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(collectTypes);
      return;
    }
    const object = value as Record<string, unknown>;
    const rawType = object["@type"];
    const values = typeof rawType === "string" ? [rawType] : Array.isArray(rawType) ? rawType : [];
    for (const type of values) {
      if (typeof type === "string") {
        const normalized = type.toLowerCase().split(/[\/#]/).pop();
        if (normalized) types.add(normalized);
      }
    }
    Object.values(object).forEach(collectTypes);
  }

  for (const script of scripts) {
    try {
      collectTypes(JSON.parse(script[1]));
    } catch {
      parseErrors += 1;
    }
  }
  return { types: [...types], scriptCount: scripts.length, parseErrors };
}

function extractBusinessNameFromStructuredData(html: string): string {
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const preferred = new Set(["organization", "localbusiness", "softwareapplication", "product", "service", "corporation", "store", "restaurant"]);
  for (const script of scripts) {
    try {
      const parsed: unknown = JSON.parse(script[1]);
      const stack = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (stack.length) {
        const current = stack.shift();
        if (!current || typeof current !== "object") continue;
        if (Array.isArray(current)) {
          stack.push(...current);
          continue;
        }
        const object = current as Record<string, unknown>;
        const types = typeof object["@type"] === "string" ? [object["@type"]] : Array.isArray(object["@type"]) ? object["@type"] : [];
        const hasPreferredType = types.some((type) => typeof type === "string" && preferred.has(type.toLowerCase().split(/[\/#]/).pop() ?? ""));
        if (hasPreferredType && typeof object.name === "string" && object.name.trim()) return object.name.trim().slice(0, 120);
        stack.push(...Object.values(object));
      }
    } catch {
      // Invalid JSON-LD is reported as evidence but never trusted for identity.
    }
  }
  return "";
}

function extractPageData(html: string, url: string, headers: IncomingHttpHeaders = {}): WebsitePage {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1] ? cleanText(titleMatch[1]) : "";
  const description = getMetaContent(html, "description") || getMetaContent(html, "og:description");
  const headings = [...html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
    .map((match) => cleanText(match[1])).filter(Boolean).slice(0, 30);
  const structuredData = inspectStructuredData(html);
  const headerRobots = headers["x-robots-tag"];
  const headerDirectives = (Array.isArray(headerRobots) ? headerRobots : headerRobots ? [headerRobots] : [])
    .map((value) => value.trim())
    .filter(Boolean);
  const robotsDirectives = [...new Set([getRobotsDirectives(html), ...headerDirectives].filter(Boolean))].join(", ");

  return {
    url,
    title,
    description,
    headings,
    text: cleanText(html).slice(0, 7_000),
    canonicalUrl: getCanonicalUrl(html, url),
    robotsDirectives,
    schemaTypes: structuredData.types,
  };
}

function isAllowedInternalPage(urlValue: string, baseUrl: string): boolean {
  try {
    const base = new URL(baseUrl);
    const url = new URL(urlValue, base);
    if (url.origin !== base.origin || !["http:", "https:"].includes(url.protocol) || url.username || url.password) return false;
    const excludedPaths = [
      /\/(?:login|logout|register|signup|signin|account|cart|checkout|search|admin|wp-admin)(?:\/|$)/i,
      /\.(?:pdf|jpg|jpeg|png|gif|svg|webp|css|js|zip|xml|mp4|mp3)$/i,
    ];
    if (excludedPaths.some((pattern) => pattern.test(url.pathname))) return false;
    url.hash = "";
    url.search = "";
    return url.pathname !== base.pathname || url.toString() !== base.toString();
  } catch {
    return false;
  }
}

function discoverInternalLinks(html: string, baseUrl: string): string[] {
  const candidates = new Set<string>();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
    try {
      const url = new URL(match[1], baseUrl);
      url.hash = "";
      url.search = "";
      if (isAllowedInternalPage(url.toString(), baseUrl)) candidates.add(url.toString());
    } catch {
      // Ignore malformed and non-HTTP links.
    }
  }
  const priority = (value: string) => {
    const path = new URL(value).pathname.toLowerCase();
    if (/about|company|who-we-are/.test(path)) return 1;
    if (/product|service|solution|feature|platform/.test(path)) return 2;
    if (/pricing|plan/.test(path)) return 3;
    if (/faq|help|question/.test(path)) return 4;
    if (/case-study|case-studies|customers|testimonials/.test(path)) return 5;
    return 10;
  };
  return [...candidates].sort((a, b) => priority(a) - priority(b));
}

function extractSitemapPages(xml: string, origin: string): string[] {
  const urls = new Set<string>();
  const matches = xml.matchAll(/<url\b[^>]*>[\s\S]*?<loc\b[^>]*>([\s\S]*?)<\/loc>[\s\S]*?<\/url>/gi);
  for (const match of matches) {
    const value = cleanText(match[1]);
    try {
      const url = new URL(value);
      if (url.origin === origin && isAllowedInternalPage(url.toString(), `${origin}/`)) {
        url.hash = "";
        url.search = "";
        urls.add(url.toString());
      }
    } catch {
      // Ignore malformed sitemap locations.
    }
  }
  return [...urls];
}

function getErrorStatus(error: unknown): WebsiteEvidence["status"] {
  const message = error instanceof Error ? error.message : "";
  return /HTTP 404|HTTP 410/.test(message) ? "not_found" : "unknown";
}

function getRobotsRules(robotsText: string): Array<{ allow: boolean; path: string }> {
  const groups: Array<{ userAgents: string[]; rules: Array<{ allow: boolean; path: string }> }> = [];
  let current: (typeof groups)[number] | undefined;

  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) {
      current = undefined;
      continue;
    }

    const userAgent = /^user-agent\s*:\s*(.+)$/i.exec(line);
    if (userAgent) {
      if (!current || current.rules.length > 0) {
        current = { userAgents: [], rules: [] };
        groups.push(current);
      }
      current.userAgents.push(userAgent[1].trim().toLowerCase());
      continue;
    }

    const directive = /^(allow|disallow)\s*:\s*(.*)$/i.exec(line);
    if (directive && current) {
      const path = directive[2].trim();
      if (path) current.rules.push({ allow: directive[1].toLowerCase() === "allow", path });
    }
  }

  const productToken = "quansai-websiteanalyzer";
  const matchingGroups = groups.filter((group) =>
    group.userAgents.some((agent) => {
      const agentProductToken = agent.split("/")[0];
      return agent !== "*" && productToken.startsWith(agentProductToken);
    }),
  );
  const selectedGroups = matchingGroups.length
    ? matchingGroups
    : groups.filter((group) => group.userAgents.includes("*"));
  return selectedGroups.flatMap((group) => group.rules);
}

function isAllowedByRobots(urlValue: string, robotsText: string): boolean {
  const rules = getRobotsRules(robotsText);
  if (!rules.length) return true;
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    return false;
  }
  const target = `${url.pathname}${url.search}`;
  let bestLength = -1;
  let allowed = true;
  for (const rule of rules) {
    const terminal = rule.path.endsWith("$");
    const rawPattern = terminal ? rule.path.slice(0, -1) : rule.path;
    const escaped = rawPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const pattern = new RegExp(`^${escaped}${terminal ? "$" : ""}`);
    if (!pattern.test(target)) continue;
    const specificity = rawPattern.replace(/\*/g, "").length;
    if (specificity > bestLength || (specificity === bestLength && rule.allow)) {
      bestLength = specificity;
      allowed = rule.allow;
    }
  }
  return allowed;
}

function robotsDisallowsEntireSite(robotsText: string, origin: string): boolean {
  return !isAllowedByRobots(`${origin}/`, robotsText);
}

async function crawlWebsite(startUrl: string): Promise<CrawlResult> {
  const crawlStartedAt = Date.now();
  const requested = await validatePublicUrl(startUrl);
  const requestedOrigin = requested.url.origin;
  const inspectRobotsFile = async (origin: string): Promise<{
    text: string;
    bytes: number;
    status: WebsiteEvidence["status"];
  }> => {
    try {
      const robots = await fetchPublicResource(`${origin}/robots.txt`, origin, /text\/plain|application\/octet-stream/i, 128_000);
      return { text: robots.body, bytes: robots.bytes, status: "found" };
    } catch (error) {
      return { text: "", bytes: 0, status: getErrorStatus(error) };
    }
  };

  // Check the requested origin's crawler rules before requesting its homepage.
  let robotsInfo = await inspectRobotsFile(requestedOrigin);
  if (robotsInfo.text && !isAllowedByRobots(requested.url.toString(), robotsInfo.text)) {
    throw new Error("The website's robots.txt disallows QuansAI from inspecting the submitted page.");
  }

  const homepage = await fetchPublicResource(startUrl, undefined, /text\/html|application\/xhtml\+xml/i, MAX_PAGE_BYTES);
  const origin = new URL(homepage.finalUrl).origin;
  if (origin !== requestedOrigin) {
    robotsInfo = await inspectRobotsFile(origin);
    if (robotsInfo.text && !isAllowedByRobots(homepage.finalUrl, robotsInfo.text)) {
      throw new Error("The destination website's robots.txt disallows QuansAI from inspecting the redirected page.");
    }
  }
  const { text: robotsText, bytes: robotsBytes, status: robotsStatus } = robotsInfo;

  const pages: WebsitePage[] = [];
  const evidence: WebsiteEvidence[] = [];
  let totalBytes = homepage.bytes + robotsBytes;

  const addSiteEvidence = (id: string, status: WebsiteEvidence["status"], detail: string) => {
    evidence.push({ id: `site.${id}`, status, detail, pageUrl: homepage.finalUrl });
  };
  addSiteEvidence(
    "robots_txt",
    robotsStatus,
    robotsStatus === "found"
      ? "robots.txt was publicly accessible and its applicable QuansAI rules were inspected."
      : "robots.txt could not be confirmed at the website root.",
  );

  const sitemapCandidates = new Set<string>([`${origin}/sitemap.xml`]);
  for (const match of robotsText.matchAll(/^\s*Sitemap\s*:\s*(\S+)/gim)) {
    try {
      const sitemapUrl = new URL(match[1], origin);
      if (sitemapUrl.origin === origin) sitemapCandidates.add(sitemapUrl.toString());
    } catch {
      // Ignore invalid sitemap declarations.
    }
  }

  const siteWideRobotsBlock = robotsDisallowsEntireSite(robotsText, origin);
  let sitemapFound = false;
  const sitemapPageCandidates: string[] = [];
  const allowedSitemaps = [...sitemapCandidates].filter((sitemapUrl) => isAllowedByRobots(sitemapUrl, robotsText));
  const sitemapAttempts = siteWideRobotsBlock
    ? []
    : await Promise.allSettled(
        allowedSitemaps.slice(0, 2).map((sitemapUrl) =>
          fetchPublicResource(sitemapUrl, origin, /application\/xml|text\/xml|application\/[^;]+\+xml|application\/octet-stream/i, MAX_SITEMAP_BYTES),
        ),
      );
  for (const attempt of sitemapAttempts) {
    if (attempt.status !== "fulfilled") continue;
    const sitemap = attempt.value;
    totalBytes += sitemap.bytes;
    if (/<urlset\b/i.test(sitemap.body)) {
      sitemapFound = true;
      sitemapPageCandidates.push(...extractSitemapPages(sitemap.body, origin));
    }
  }
  const sitemapCouldNotBeChecked = siteWideRobotsBlock || allowedSitemaps.length === 0 ||
    sitemapAttempts.some((attempt) => attempt.status === "rejected" && getErrorStatus(attempt.reason) === "unknown");
  addSiteEvidence(
    "sitemap_xml",
    sitemapFound ? "found" : sitemapCouldNotBeChecked ? "unknown" : "not_found",
    sitemapFound
      ? "A sitemap containing page URLs was found and inspected."
      : siteWideRobotsBlock
        ? "Sitemap retrieval was skipped because robots.txt disallows crawling the whole site."
        : sitemapCouldNotBeChecked
          ? "A sitemap could not be verified because access was blocked or the resource could not be reached."
          : "A readable URL sitemap could not be confirmed from robots.txt or /sitemap.xml.",
  );
  addSiteEvidence(
    "robots_block_all",
    siteWideRobotsBlock ? "found" : robotsText ? "not_found" : "unknown",
    siteWideRobotsBlock
      ? "robots.txt contains a Disallow: / rule for all crawlers."
      : robotsText
        ? "No site-wide Disallow: / rule for all crawlers was detected in robots.txt."
        : "The site's robots.txt rules could not be inspected.",
  );

  const visited = new Set<string>();
  const queued = new Set<string>();
  const queue: string[] = [];
  const addToQueue = (url: string) => {
    if (siteWideRobotsBlock || queue.length >= 120 || visited.has(url) || queued.has(url) || !isAllowedInternalPage(url, homepage.finalUrl) || !isAllowedByRobots(url, robotsText)) return;
    queue.push(url);
    queued.add(url);
  };

  const homepageLinks = discoverInternalLinks(homepage.body, homepage.finalUrl);
  const initialCandidates = [...new Set([...sitemapPageCandidates, ...homepageLinks])];
  for (const url of initialCandidates) addToQueue(url);
  const robotsAllowedCandidateCount = initialCandidates.filter((url) => isAllowedByRobots(url, robotsText)).length;
  addSiteEvidence(
    "discoverable_internal_pages",
    robotsAllowedCandidateCount ? "found" : initialCandidates.length ? "unknown" : "not_found",
    `${initialCandidates.length} same-site page URL(s) were discovered; ${robotsAllowedCandidateCount} passed the inspected robots.txt rules before applying the ${MAX_PAGES}-page inspection limit.`,
  );

  const addPageEvidence = (page: WebsitePage, pageNumber: number, html: string) => {
    const pageId = `page_${pageNumber}`;
    const add = (id: string, status: WebsiteEvidence["status"], detail: string) => evidence.push({ id: `${pageId}.${id}`, status, detail, pageUrl: page.url });
    add("title", page.title ? "found" : "not_found", page.title ? `HTML title found: ${page.title}` : "No HTML title element was detected.");
    add("meta_description", page.description ? "found" : "not_found", page.description ? "A standard or Open Graph description was detected." : "No standard or Open Graph description was detected.");
    add("headings", page.headings.length ? "found" : "not_found", page.headings.length ? `${page.headings.length} H1-H3 heading(s) were detected.` : "No H1-H3 headings were detected.");
    add("canonical", page.canonicalUrl ? "found" : "not_found", page.canonicalUrl ? `Canonical URL detected: ${page.canonicalUrl}` : "No canonical link was detected.");
    add("robots_directives", page.robotsDirectives ? "found" : "not_found", page.robotsDirectives ? `Robots directives detected: ${page.robotsDirectives}` : "No page-level robots meta directive was detected.");
    if (/\bnoindex\b/i.test(page.robotsDirectives ?? "")) add("noindex", "found", "A noindex directive was detected on this page.");

    const structured = inspectStructuredData(html);
    add("schema.jsonld", structured.scriptCount > 0 ? (structured.parseErrors > 0 ? "unknown" : "found") : "not_found", structured.scriptCount > 0 ? `${structured.scriptCount} JSON-LD block(s) detected; ${structured.parseErrors} could not be parsed.` : "No JSON-LD script was detected.");
    const typesToCheck = ["organization", "localbusiness", "corporation", "softwareapplication", "product", "service", "professionalservice", "medicalbusiness", "educationalorganization", "store", "restaurant", "course", "website", "webpage", "article", "faqpage"];
    for (const type of typesToCheck) {
      const status: WebsiteEvidence["status"] = page.schemaTypes?.includes(type)
        ? "found"
        : structured.parseErrors > 0
          ? "unknown"
          : "not_found";
      add(`schema.${type}`, status, status === "found" ? `${type} JSON-LD type detected.` : status === "unknown" ? `${type} could not be verified because some JSON-LD could not be parsed.` : `${type} JSON-LD type was not detected.`);
    }
  };

  const homepagePage = extractPageData(homepage.body, homepage.finalUrl, homepage.headers);
  pages.push(homepagePage);
  visited.add(homepage.finalUrl);
  addPageEvidence(homepagePage, pages.length, homepage.body);

  while (queue.length > 0 && pages.length < MAX_PAGES && totalBytes < MAX_TOTAL_HTML_BYTES && Date.now() - crawlStartedAt < MAX_CRAWL_DURATION_MS) {
    const currentUrl = queue.shift();
    if (!currentUrl || visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const result = await fetchPublicResource(currentUrl, origin, /text\/html|application\/xhtml\+xml/i, Math.min(MAX_PAGE_BYTES, MAX_TOTAL_HTML_BYTES - totalBytes));
      if (new URL(result.finalUrl).origin !== origin) continue;
      if (totalBytes + result.bytes > MAX_TOTAL_HTML_BYTES) break;
      totalBytes += result.bytes;
      const page = extractPageData(result.body, result.finalUrl, result.headers);
      if (visited.has(page.url) && pages.some((existing) => existing.url === page.url)) continue;
      pages.push(page);
      addPageEvidence(page, pages.length, result.body);
      for (const link of discoverInternalLinks(result.body, result.finalUrl)) addToQueue(link);
    } catch (error) {
      console.warn("A same-site page could not be inspected:", currentUrl, error instanceof Error ? error.message : "Unknown fetch error");
    }
  }

  if (!pages.length) throw new Error("No website pages could be analyzed.");
  return {
    finalUrl: homepage.finalUrl,
    pages,
    evidence,
    homepageHtml: homepage.body,
    totalBytes,
    discoveredInternalPageCount: initialCandidates.length,
  };
}

function deriveBrandName(homepage: WebsitePage, html: string, finalUrl: string): string {
  const structuredName = extractBusinessNameFromStructuredData(html);
  const heading = homepage.headings.find((value) => !/^(home|welcome|about us|contact us|index)$/i.test(value.trim()));
  const titleCandidate = homepage.title.split(/[|–—]/)[0].trim();
  const candidates = [heading, structuredName, titleCandidate, getMetaContent(html, "og:site_name")];
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value && !/^(home|welcome|official website|homepage)$/i.test(value) && value.length <= 120) return value;
  }
  return new URL(finalUrl).hostname.replace(/^www\./, "");
}

function providerRecords(gemini: Awaited<ReturnType<typeof testGeminiVisibility>>) {
  return [
    {
      id: "chatgpt",
      name: "ChatGPT",
      status: "not_integrated",
      detail: "A live ChatGPT search/answer integration is not connected. No ChatGPT visibility result was claimed.",
    },
    {
      id: "gemini",
      name: "Gemini + Google Search",
      status: gemini.providerStatus,
      detail: gemini.summary,
    },
    {
      id: "perplexity",
      name: "Perplexity",
      status: "not_integrated",
      detail: "A live Perplexity search/answer integration is not connected. No Perplexity visibility result was claimed.",
    },
  ];
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(tokenMatch[1]);
    } catch {
      return NextResponse.json({ error: "Your session is invalid or expired." }, { status: 401 });
    }
    if (decodedToken.email_verified !== true) return NextResponse.json({ error: "Please verify your email first." }, { status: 403 });

    const scansRef = adminDb.collection("users").doc(decodedToken.uid).collection("scans");
    const { searchParams } = new URL(request.url);
    const history = searchParams.get("history");
    const scanId = searchParams.get("scanId");

    if (history === "1") {
      const snapshot = await scansRef.orderBy("scannedAt", "desc").limit(50).get();
      const scans = snapshot.docs.map((doc) => {
        const data = doc.data();
        const report = data.report ?? {};
        return {
          scanId: doc.id,
          websiteUrl: data.websiteUrl ?? report.websiteUrl ?? "",
          brandName: data.brandName ?? report.brandName ?? "Your brand",
          scannedAt: data.scannedAt ?? report.scannedAt ?? "",
          readinessScore: typeof report.readinessScore === "number" ? report.readinessScore : null,
          overallScore: typeof report.overallScore === "number" ? report.overallScore : null,
          visibilityStatus: report.visibilityStatus ?? "not_configured",
          analysisStage: report.analysisStage ?? "",
          inspectedPageCount: report.inspectedPageCount ?? 0,
          maxPageCount: report.maxPageCount ?? MAX_PAGES,
        };
      });
      return NextResponse.json({ scans });
    }

    if (scanId) {
      const scanDoc = await scansRef.doc(scanId).get();
      if (!scanDoc.exists) return NextResponse.json({ error: "That saved report could not be found." }, { status: 404 });
      return NextResponse.json({ report: scanDoc.data()?.report ?? null, scanId: scanDoc.id });
    }

    const snapshot = await scansRef.orderBy("scannedAt", "desc").limit(1).get();
    if (snapshot.empty) return NextResponse.json({ report: null });
    const latestScan = snapshot.docs[0];
    return NextResponse.json({ report: latestScan.data().report, scanId: latestScan.id });
  } catch (error) {
    console.error("Loading AEO scans failed:", error);
    return NextResponse.json({ error: "Unable to load your saved scans." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(tokenMatch[1]);
    } catch {
      return NextResponse.json({ error: "Your session is invalid or expired. Please sign in again." }, { status: 401 });
    }
    if (decodedToken.email_verified !== true) return NextResponse.json({ error: "Please verify your email before running an analysis." }, { status: 403 });

    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || !("websiteUrl" in body) || typeof body.websiteUrl !== "string" || !body.websiteUrl.trim() || body.websiteUrl.length > 2048) {
      return NextResponse.json({ error: "A valid website URL is required." }, { status: 400 });
    }

    const initialUrl = await validatePublicUrl(body.websiteUrl.trim());
    const crawl = await crawlWebsite(initialUrl.url.toString());
    const homepage = crawl.pages[0];
    const brandName = deriveBrandName(homepage, crawl.homepageHtml, crawl.finalUrl);

    const pageText = crawl.pages.map((page) => [
      `PAGE: ${page.url}`,
      `TITLE: ${page.title}`,
      `DESCRIPTION: ${page.description}`,
      `HEADINGS: ${page.headings.join(" | ")}`,
      page.text,
    ].join("\n")).join("\n\n").slice(0, 30_000);

    const analysis = analyzeWebsiteDeterministically({
      brandName,
      pages: crawl.pages,
      evidence: crawl.evidence,
      inspectedPageCount: crawl.pages.length,
      maxPageCount: MAX_PAGES,
    });

    // The website readiness scan never depends on an LLM. Gemini is an optional,
    // explicitly enabled provider test and is skipped unless both env settings exist.
    const gemini = await testGeminiVisibility({
      brandName,
      websiteUrl: crawl.finalUrl,
      suggestedBuyerPrompts: analysis.suggestedBuyerPrompts,
    });
    const visibilityProviders = providerRecords(gemini);
    const report = {
      websiteUrl: crawl.finalUrl,
      brandName,
      scannedAt: new Date().toISOString(),
      // Legacy overallScore remains the AI visibility score, not AEO readiness.
      overallScore: gemini.overallScore,
      summary: analysis.summary,
      providerCoverage: gemini.providerCoverage,
      providerName: gemini.providerName,
      visibilityStatus: gemini.providerStatus,
      attemptedPromptCount: gemini.attemptedPromptCount,
      groundedPromptCount: gemini.groundedPromptCount,
      failedPromptCount: gemini.failedPromptCount,
      scoreMethodology: gemini.scoreMethodology,
      metrics: gemini.metrics,
      promptFindings: gemini.promptFindings,
      competitors: gemini.competitors,
      citations: gemini.citations,
      visibilityProviders,
      recommendations: analysis.recommendations,
      analysisStage: gemini.attemptedPromptCount > 0 ? "gemini_visibility" as const : "website_only" as const,
      analysisEngine: "deterministic_v2",
      readinessScore: analysis.readinessScore,
      readinessMetrics: analysis.metrics,
      readinessSummary: analysis.summary,
      inspectedPageCount: crawl.pages.length,
      maxPageCount: MAX_PAGES,
      crawlBytes: crawl.totalBytes,
      discoveredInternalPageCount: crawl.discoveredInternalPageCount,
      websiteProfile: {
        title: homepage.title,
        description: homepage.description,
        industry: analysis.industry,
        analyzedPageText: pageText,
      },
      suggestedBuyerPrompts: analysis.suggestedBuyerPrompts,
      evidence: analysis.evidenceSummary,
    };

    const scanRef = adminDb.collection("users").doc(decodedToken.uid).collection("scans").doc();
    await scanRef.set({
      report,
      websiteUrl: report.websiteUrl,
      brandName: report.brandName,
      scannedAt: report.scannedAt,
      createdAt: new Date(),
    });

    return NextResponse.json({ report, scanId: scanRef.id });
  } catch (error) {
    console.error("QuansAI website analysis error:", error);
    const message = error instanceof Error ? error.message : "";
    const clientErrorPrefixes = [
      "Enter ", "Only ", "Private ", "This website", "The website's robots.txt", "The destination website's robots.txt", "IPv6 ", "We couldn't", "The website",
      "The submitted", "The webpage", "Unable ", "No website pages", "The crawler",
    ];
    const isClientError = clientErrorPrefixes.some((prefix) => message.startsWith(prefix));
    return NextResponse.json({
      error: isClientError ? message : "We couldn't analyze this website. Check that it is publicly accessible and try again.",
    }, { status: isClientError ? 400 : 500 });
  }
}
