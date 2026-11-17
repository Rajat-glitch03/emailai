export type GeminiPromptFinding = {
  prompt: string;
  status: "mentioned" | "not-mentioned" | "partial";
  summary: string;
  competitors: string[];
  grounded: boolean;
  recommended: boolean;
  citationCount: number;
  websiteCited: boolean;
};

export type GeminiVisibilityResult = {
  providerName: string;
  providerStatus: "success" | "partial" | "ungrounded" | "unavailable" | "not_configured";
  attemptedPromptCount: number;
  groundedPromptCount: number;
  failedPromptCount: number;
  overallScore: number | null;
  providerCoverage: string[];
  metrics: Array<{ label: string; value: number; description: string }>;
  promptFindings: GeminiPromptFinding[];
  competitors: Array<{ name: string; mentions: number }>;
  citations: Array<{ title: string; url: string; source: string }>;
  scoreMethodology: string;
  summary: string;
};

type GroundingChunk = { web?: { uri?: string; title?: string } };

const MODEL = process.env.GEMINI_VISIBILITY_MODEL || "gemini-3.8-flash";
const PROMPT_LIMIT = 3;
const REQUEST_TIMEOUT_MS = 8_000;

function normalizePhrase(value: string): string {
  return value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function hasPhrase(text: string, phrase: string): boolean {
  const normalizedPhrase = normalizePhrase(phrase);
  if (normalizedPhrase.length < 3) return false;
  return ` ${normalizePhrase(text)} `.includes(` ${normalizedPhrase} `);
}

function getResponseText(candidate: unknown): string {
  if (!candidate || typeof candidate !== "object") return "";
  const content = (candidate as { content?: { parts?: unknown[] } }).content;
  if (!Array.isArray(content?.parts)) return "";
  return content.parts.map((part) => {
    if (part && typeof part === "object" && "text" in part && typeof part.text === "string") return part.text;
    return "";
  }).join("\n").trim();
}

function getGroundingChunks(candidate: unknown): Array<{ title: string; url: string }> {
  if (!candidate || typeof candidate !== "object") return [];
  const metadata = (candidate as { groundingMetadata?: { groundingChunks?: GroundingChunk[] } }).groundingMetadata;
  if (!Array.isArray(metadata?.groundingChunks)) return [];
  return metadata.groundingChunks.flatMap((chunk) => {
    const rawUrl = chunk?.web?.uri;
    if (typeof rawUrl !== "string") return [];
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      return [{ title: typeof chunk.web?.title === "string" ? chunk.web.title : "", url: url.toString() }];
    } catch {
      return [];
    }
  });
}

function emptyResult(providerStatus: GeminiVisibilityResult["providerStatus"], summary: string): GeminiVisibilityResult {
  return {
    providerName: "Gemini + Google Search",
    providerStatus,
    attemptedPromptCount: 0,
    groundedPromptCount: 0,
    failedPromptCount: 0,
    overallScore: null,
    providerCoverage: [],
    metrics: [],
    promptFindings: [],
    competitors: [],
    citations: [],
    scoreMethodology: "Only responses returned with Google Search grounding are included. The score is a small sample of buyer prompts, not a universal ranking or a guarantee of what users see.",
    summary,
  };
}

export async function testGeminiVisibility(input: {
  brandName: string;
  websiteUrl: string;
  suggestedBuyerPrompts: string[];
}): Promise<GeminiVisibilityResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.ENABLE_GEMINI_VISIBILITY !== "true") {
    return emptyResult(
      "not_configured",
      "Gemini visibility testing is disabled. The deterministic website analysis still runs without an AI API key.",
    );
  }

  const prompts = [...new Set(
    input.suggestedBuyerPrompts
      .map((prompt) => prompt.trim())
      .filter((prompt) => Boolean(prompt) && !hasPhrase(prompt, input.brandName)),
  )].slice(0, PROMPT_LIMIT);
  if (!prompts.length) {
    return emptyResult("ungrounded", "No suitable buyer prompts were available for Gemini visibility testing.");
  }

  const analyzedHost = new URL(input.websiteUrl).hostname.toLowerCase().replace(/^www\./, "");
  const findings: GeminiPromptFinding[] = [];
  const citations = new Map<string, { title: string; url: string; source: string }>();
  let failedPromptCount = 0;

  for (const prompt of prompts) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: [
            "Answer this buyer question neutrally using current web research.",
            "Do not assume or favor any provider. Do not invent facts, rankings, businesses, or citations.",
            "If reliable information is limited, say so.",
            `Buyer question: ${prompt}`,
          ].join("\n\n") }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });

      if (!response.ok) {
        failedPromptCount += 1;
        continue;
      }

      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object") {
        failedPromptCount += 1;
        continue;
      }
      const candidates = (payload as { candidates?: unknown[] }).candidates;
      const candidate = Array.isArray(candidates) ? candidates[0] : undefined;
      const answer = getResponseText(candidate);
      if (!answer) {
        failedPromptCount += 1;
        continue;
      }

      const chunks = getGroundingChunks(candidate);
      const grounded = chunks.length > 0;
      const mentioned = hasPhrase(answer, input.brandName);
      const brandSentences = answer.split(/(?<=[.!?])\s+/).filter((sentence) => hasPhrase(sentence, input.brandName));
      const rejected = brandSentences.some((sentence) => /\b(not recommended|would not recommend|avoid|poor choice|not a good fit|not suitable)\b/i.test(sentence));
      const positive = brandSentences.some((sentence) => /\b(recommend|recommended|recommends|top choice|strong option|worth considering|shortlist|good fit|suitable option|best option)\b/i.test(sentence));
      const recommended = grounded && mentioned && positive && !rejected;
      let websiteCited = false;

      for (const chunk of chunks) {
        const urlHost = new URL(chunk.url).hostname.toLowerCase().replace(/^www\./, "");
        // Google may return a citation redirect URL while exposing the publisher domain as its title.
        const titleDomain = (chunk.title || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
        const source = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(titleDomain) ? titleDomain : urlHost;
        if (source === analyzedHost || source.endsWith(`.${analyzedHost}`)) websiteCited = true;
        if (!citations.has(chunk.url)) {
          citations.set(chunk.url, { title: chunk.title || source, url: chunk.url, source });
        }
      }

      findings.push({
        prompt,
        status: grounded ? (mentioned ? "mentioned" : "not-mentioned") : "partial",
        summary: answer.slice(0, 520),
        competitors: [],
        grounded,
        recommended,
        citationCount: chunks.length,
        websiteCited,
      });
    } catch {
      failedPromptCount += 1;
    }
  }

  const groundedFindings = findings.filter((finding) => finding.grounded);
  const groundedPromptCount = groundedFindings.length;
  const attemptedPromptCount = prompts.length;
  const mentionedCount = groundedFindings.filter((finding) => finding.status === "mentioned").length;
  const recommendedCount = groundedFindings.filter((finding) => finding.recommended).length;
  const websiteCitedCount = groundedFindings.filter((finding) => finding.websiteCited).length;
  const mentionRate = groundedPromptCount ? Math.round((mentionedCount / groundedPromptCount) * 100) : 0;
  const recommendationRate = groundedPromptCount ? Math.round((recommendedCount / groundedPromptCount) * 100) : 0;
  const websiteCitationRate = groundedPromptCount ? Math.round((websiteCitedCount / groundedPromptCount) * 100) : 0;
  const overallScore = groundedPromptCount
    ? Math.round(mentionRate * 0.5 + recommendationRate * 0.3 + websiteCitationRate * 0.2)
    : null;

  const providerStatus: GeminiVisibilityResult["providerStatus"] = groundedPromptCount === attemptedPromptCount
    ? "success"
    : groundedPromptCount > 0
      ? "partial"
      : failedPromptCount === attemptedPromptCount
        ? "unavailable"
        : "ungrounded";

  return {
    providerName: "Gemini + Google Search",
    providerStatus,
    attemptedPromptCount,
    groundedPromptCount,
    failedPromptCount,
    overallScore,
    providerCoverage: groundedPromptCount ? ["Gemini + Google Search"] : [],
    metrics: groundedPromptCount ? [
      { label: "Brand mention rate", value: mentionRate, description: `${mentionedCount} of ${groundedPromptCount} grounded answers mentioned ${input.brandName}.` },
      { label: "Recommendation rate", value: recommendationRate, description: `${recommendedCount} of ${groundedPromptCount} grounded answers used positive recommendation language for the brand.` },
      { label: "Website citation rate", value: websiteCitationRate, description: `${websiteCitedCount} of ${groundedPromptCount} grounded answers cited the analyzed website.` },
    ] : [],
    promptFindings: findings,
    competitors: [],
    citations: [...citations.values()].slice(0, 20),
    scoreMethodology: "Gemini Search Visibility = 50% brand mention rate + 30% recommendation rate + 20% website citation rate. Only Google Search-grounded responses are included. The sample uses up to three buyer prompts and is not a universal ranking or a guarantee of what every user sees.",
    summary: groundedPromptCount
      ? `Gemini visibility testing returned ${groundedPromptCount} grounded response(s) from ${attemptedPromptCount} attempted buyer prompts.`
      : failedPromptCount === attemptedPromptCount
        ? "Gemini visibility requests could not be completed. Website readiness results remain available."
        : "Gemini returned no responses with Google Search grounding for these buyer prompts. No visibility score was calculated.",
  };
}
