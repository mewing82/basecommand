/**
 * Website Extraction API — crawls a URL + key subpages, extracts company info via AI.
 *
 * POST /api/website-extract
 * Body: { url: "https://example.com" }
 * Returns: { profile: { companyName, products, ... }, pages: [...] }
 */
import { resolveUser } from "./lib/auth.js";

const SUBPAGE_PATHS = ["/pricing", "/about", "/products", "/customers", "/why", "/features", "/about-us", "/company"];
const MAX_SUBPAGES = 5;
const MAX_TEXT_PER_PAGE = 8000;
const MAX_TOTAL_TEXT = 30000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const user = await resolveUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL is required" });

  let baseUrl;
  try {
    baseUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const origin = baseUrl.origin;
  const pages = [];

  // 1. Fetch homepage
  const homeText = await fetchPageText(origin);
  if (!homeText) return res.status(422).json({ error: "Could not fetch website. Check the URL and try again." });
  pages.push({ path: "/", chars: homeText.length });

  let allText = `=== HOMEPAGE (${origin}) ===\n${homeText}\n\n`;

  // 2. Discover and fetch subpages
  const discoveredPaths = discoverLinks(homeText, SUBPAGE_PATHS);
  const pathsToTry = [...new Set([...discoveredPaths, ...SUBPAGE_PATHS])].slice(0, MAX_SUBPAGES);

  for (const path of pathsToTry) {
    if (allText.length >= MAX_TOTAL_TEXT) break;
    const subUrl = `${origin}${path}`;
    const subText = await fetchPageText(subUrl);
    if (subText && subText.length > 200) {
      const label = path.replace(/^\//, "").toUpperCase() || "PAGE";
      allText += `=== ${label} (${subUrl}) ===\n${subText}\n\n`;
      pages.push({ path, chars: subText.length });
    }
  }

  // 3. Send to AI for extraction
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI not configured" });

  try {
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: "You are a company intelligence extraction system. Extract structured company data from website content. Return ONLY valid JSON — no markdown fences, no preamble.",
        messages: [{
          role: "user",
          content: buildExtractionPrompt(allText, origin),
        }],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      return res.status(500).json({ error: `AI error: ${aiRes.status}`, detail: err });
    }

    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text || "";

    // Parse JSON from response (handle possible markdown fences)
    const jsonStr = text.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    let profile;
    try {
      profile = JSON.parse(jsonStr);
    } catch {
      return res.status(422).json({ error: "AI returned invalid JSON", raw: text.slice(0, 500) });
    }

    return res.status(200).json({ profile, pages, totalChars: allText.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchPageText(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; BaseCommand/1.0; +https://basecommand.ai)",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null;
    const html = await res.text();
    return extractText(html).slice(0, MAX_TEXT_PER_PAGE);
  } catch {
    return null;
  }
}

function extractText(html) {
  // Remove script, style, nav, footer, header tags and their content
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // Extract meta tags before stripping HTML
  const meta = [];
  const metaMatches = html.matchAll(/<meta\s+[^>]*(?:name|property)=["']([^"']*)["'][^>]*content=["']([^"']*)["'][^>]*>/gi);
  for (const m of metaMatches) {
    const name = m[1].toLowerCase();
    if (["description", "og:title", "og:description", "og:site_name", "twitter:title", "twitter:description"].includes(name)) {
      meta.push(`[META ${m[1]}]: ${m[2]}`);
    }
  }
  // Also try reverse order (content before name)
  const metaMatches2 = html.matchAll(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']([^"']*)["'][^>]*>/gi);
  for (const m of metaMatches2) {
    const name = m[2].toLowerCase();
    if (["description", "og:title", "og:description", "og:site_name", "twitter:title", "twitter:description"].includes(name)) {
      meta.push(`[META ${m[2]}]: ${m[1]}`);
    }
  }

  // Extract JSON-LD structured data
  const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1]);
      meta.push(`[STRUCTURED DATA]: ${JSON.stringify(data).slice(0, 1000)}`);
    } catch { /* skip invalid JSON-LD */ }
  }

  // Strip all remaining HTML tags
  clean = clean.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  clean = clean
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ");

  // Collapse whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  return meta.join("\n") + "\n\n" + clean;
}

function discoverLinks(text, targetPaths) {
  // Look for href patterns that match our target subpages
  const found = [];
  for (const path of targetPaths) {
    const slug = path.replace(/^\//, "");
    // Match href="/pricing" or href="https://example.com/pricing" patterns
    if (text.toLowerCase().includes(`/${slug}`) || text.toLowerCase().includes(`"${slug}`)) {
      found.push(path);
    }
  }
  return found;
}

function buildExtractionPrompt(websiteText, origin) {
  return `Extract structured company information from this website content. The website is: ${origin}

WEBSITE CONTENT:
${websiteText}

Return ONLY valid JSON with this structure:
{
  "companyName": "Company name",
  "productDescription": "1-2 sentence description of what they sell and who it's for",
  "products": [
    { "name": "Product/Plan name", "description": "What it includes", "price": "Pricing if found, e.g. $49/mo" }
  ],
  "contractTerms": "Contract length, billing terms (e.g. 'Annual contracts, net-30 billing') — or null",
  "upliftRate": "Standard price increase at renewal (e.g. '7% annual') — or null",
  "competitors": [
    { "name": "Competitor name", "differentiation": "How this company positions against them" }
  ],
  "valueProps": "Key value propositions — the 3-5 main reasons customers choose this company",
  "discountRules": "Any discounting policies or guardrails mentioned — or null",
  "upsellPaths": "Natural upgrade paths between plans/products (e.g. 'Starter → Pro at 10 users') — or null",
  "websiteUrl": "${origin}",
  "industry": "Industry or market category (e.g. 'B2B SaaS', 'Healthcare IT', 'E-commerce')",
  "targetAudience": "Who they sell to (e.g. 'Mid-market SaaS companies', 'Enterprise IT teams')",
  "securityCerts": "Security certifications mentioned (SOC2, HIPAA, ISO 27001, etc.) — or null",
  "integrations": "Key integrations or technology partners mentioned — or null"
}

EXTRACTION RULES:
- Extract everything you can find. Leave fields as null if not present.
- For products: extract every distinct plan, tier, SKU, or add-on. Include pricing if visible.
- For competitors: look for "vs", "alternative to", "compared to", "unlike" language. Also infer from positioning.
- For value props: synthesize from hero copy, feature highlights, "why choose us" sections.
- Clean up and normalize — don't copy-paste raw HTML artifacts.
- Return ONLY the JSON. No markdown fences. No explanation.`;
}
