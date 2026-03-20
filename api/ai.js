/**
 * AI proxy — routes to Anthropic or OpenAI.
 * Default: uses BaseCommand's server-side API key (zero friction for users).
 * BYOK: if byokKey is provided, uses the user's own key instead.
 * Metering: tracks usage per user per month in Supabase.
 *
 * POST /api/ai                          — Standard AI proxy
 * POST /api/ai?action=website-extract   — Crawl URL + extract company profile
 *
 * Headers: Authorization: Bearer <supabase-jwt> (optional, enables metering)
 */
import { createClient } from "@supabase/supabase-js";
import { resolveUser } from "./lib/auth.js";

const FREE_MONTHLY_LIMIT = 50;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Route to website extraction if action specified
  if (req.query.action === "website-extract") {
    return handleWebsiteExtract(req, res);
  }

  const body = req.body;
  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const provider = body.provider || "anthropic";
  const model = body.model || "claude-sonnet-4-20250514";
  const maxTokens = body.max_tokens || 4000;
  const system = body.system || "";
  const messages = body.messages;

  // ─── Resolve user identity from Supabase JWT ────────────────────────────
  let userId = null;
  let orgId = null;
  let userTier = "free"; // default tier
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
          // Resolve org: from header or first membership
          orgId = req.headers["x-org-id"] || null;
          if (!orgId) {
            const { data: mem } = await supabase
              .from("org_members")
              .select("org_id")
              .eq("user_id", userId)
              .order("joined_at", { ascending: true })
              .limit(1)
              .single();
            orgId = mem?.org_id || null;
          }
          userTier = await resolveTier(supabase, userId, orgId);
        }
      } catch (e) {
        console.error("[ai] Auth error:", e.message);
      }
    }
  }

  // ─── Usage metering (free tier only, skip for BYOK) ─────────────────────
  if (userId && !body.byokKey) {
    const usage = await getUsage(userId);
    if (usage !== null && userTier === "free" && usage >= FREE_MONTHLY_LIMIT) {
      return res.status(429).json({
        error: "Free tier limit reached. Upgrade to Pro for unlimited AI.",
        usage,
        limit: FREE_MONTHLY_LIMIT,
      });
    }
  }

  // ─── Resolve API key ────────────────────────────────────────────────────
  let apiKey = null;

  // BYOK: user provided their own key
  if (body.byokKey) {
    apiKey = body.byokKey;
  }

  // Default: use BaseCommand's server-side key
  if (!apiKey) {
    if (provider === "anthropic") {
      apiKey = process.env.ANTHROPIC_API_KEY;
    } else if (provider === "openai") {
      apiKey = process.env.OPENAI_API_KEY;
    }
  }

  if (!apiKey) {
    return res.status(500).json({ error: `No API key available for ${provider}.` });
  }

  // ─── Make the AI call ───────────────────────────────────────────────────
  try {
    let result;
    if (provider === "anthropic") {
      result = await handleAnthropic(apiKey, model, maxTokens, system, messages);
    } else if (provider === "openai") {
      result = await handleOpenAI(apiKey, model, maxTokens, system, messages);
    } else {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    if (result.error) {
      return res.status(result.status || 500).json({ error: result.error });
    }

    // ─── Track usage (after successful call, skip for BYOK) ─────────────
    if (userId && !body.byokKey) {
      await trackUsage(userId, model, result.data.usage);
    }

    return res.status(200).json(result.data);
  } catch (err) {
    console.error(`[ai] proxy error (${provider}):`, err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ─── Anthropic handler ───────────────────────────────────────────────────────
async function handleAnthropic(apiKey, model, maxTokens, system, messages) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { error: data.error?.message || "Anthropic API error", status: response.status };
  }
  return { data };
}

// ─── OpenAI handler ──────────────────────────────────────────────────────────
async function handleOpenAI(apiKey, model, maxTokens, system, messages) {
  const openaiMessages = [];
  if (system) openaiMessages.push({ role: "system", content: system });
  for (const msg of messages) openaiMessages.push({ role: msg.role, content: msg.content });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: openaiMessages }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { error: data.error?.message || "OpenAI API error", status: response.status };
  }

  const choice = data.choices?.[0];
  return {
    data: {
      content: [{ text: choice?.message?.content || "" }],
      stop_reason: choice?.finish_reason === "stop" ? "end_turn"
        : choice?.finish_reason === "length" ? "max_tokens"
        : choice?.finish_reason || "end_turn",
      model: data.model,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
      },
    },
  };
}

// ─── Tier resolution from subscriptions table ───────────────────────────────

async function resolveTier(supabase, userId, orgId) {
  try {
    // Try org-scoped subscription first, fall back to user-scoped
    let sub = null;
    if (orgId) {
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, status, trial_end, stripe_subscription_id, role")
        .eq("org_id", orgId)
        .single();
      sub = data;
    }
    if (!sub) {
      const { data } = await supabase
        .from("subscriptions")
        .select("tier, status, trial_end, stripe_subscription_id, role")
        .eq("user_id", userId)
        .single();
      sub = data;
    }

    if (!sub) return "free";

    // Admin → always unlimited
    if (sub.role === "admin") return "pro";

    // Active paid subscription → pro
    if (sub.tier === "pro" && (sub.status === "active" || sub.status === "past_due")) {
      return "pro";
    }

    // Active trial → pro
    if (sub.status === "trialing" && sub.trial_end) {
      const trialEnd = new Date(sub.trial_end);
      if (trialEnd > new Date()) return "pro";
    }

    return "free";
  } catch {
    // Table may not exist yet — default to free
    return "free";
  }
}

// ─── Usage tracking via Supabase ─────────────────────────────────────────────
function getPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function getUsage(userId) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from("ai_usage")
    .select("call_count")
    .eq("user_id", userId)
    .eq("period", getPeriod())
    .single();

  return data?.call_count || 0;
}

async function trackUsage(userId, model, usage) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const period = getPeriod();
  const inputTokens = usage?.input_tokens || 0;
  const outputTokens = usage?.output_tokens || 0;

  // Upsert: increment call_count and token totals
  const { data: existing } = await supabase
    .from("ai_usage")
    .select("id, call_count, input_tokens, output_tokens")
    .eq("user_id", userId)
    .eq("period", period)
    .single();

  if (existing) {
    await supabase
      .from("ai_usage")
      .update({
        call_count: existing.call_count + 1,
        input_tokens: existing.input_tokens + inputTokens,
        output_tokens: existing.output_tokens + outputTokens,
        model,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("ai_usage")
      .insert({
        user_id: userId,
        period,
        call_count: 1,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        model,
      });
  }
}

// ─── Website Extraction ─────────────────────────────────────────────────────

const WE_SUBPAGE_PATHS = ["/pricing", "/about", "/products", "/customers", "/why", "/features", "/about-us", "/company"];
const WE_MAX_SUBPAGES = 5;
const WE_MAX_TEXT_PER_PAGE = 8000;
const WE_MAX_TOTAL_TEXT = 30000;

async function handleWebsiteExtract(req, res) {
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

  const homeText = await weFetchPageText(origin);
  if (!homeText) return res.status(422).json({ error: "Could not fetch website. Check the URL and try again." });
  pages.push({ path: "/", chars: homeText.length });

  let allText = `=== HOMEPAGE (${origin}) ===\n${homeText}\n\n`;

  const discoveredPaths = weDiscoverLinks(homeText, WE_SUBPAGE_PATHS);
  const pathsToTry = [...new Set([...discoveredPaths, ...WE_SUBPAGE_PATHS])].slice(0, WE_MAX_SUBPAGES);

  for (const path of pathsToTry) {
    if (allText.length >= WE_MAX_TOTAL_TEXT) break;
    const subUrl = `${origin}${path}`;
    const subText = await weFetchPageText(subUrl);
    if (subText && subText.length > 200) {
      const label = path.replace(/^\//, "").toUpperCase() || "PAGE";
      allText += `=== ${label} (${subUrl}) ===\n${subText}\n\n`;
      pages.push({ path, chars: subText.length });
    }
  }

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
        messages: [{ role: "user", content: weBuildPrompt(allText, origin) }],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      return res.status(500).json({ error: `AI error: ${aiRes.status}`, detail: err });
    }

    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text || "";
    const jsonStr = text.replace(/^```json?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    let profile;
    try { profile = JSON.parse(jsonStr); } catch {
      return res.status(422).json({ error: "AI returned invalid JSON", raw: text.slice(0, 500) });
    }

    // Enrich with reliable fallbacks
    const domain = baseUrl.hostname.replace(/^www\./, "");
    if (!profile.branding) profile.branding = {};
    // Google Favicon API — always works
    if (!profile.branding.faviconUrl) {
      profile.branding.faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }

    return res.status(200).json({ profile, pages, totalChars: allText.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

async function weFetchPageText(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BaseCommand/1.0; +https://basecommand.ai)", Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;
    const html = await res.text();
    return weExtractText(html).slice(0, WE_MAX_TEXT_PER_PAGE);
  } catch { return null; }
}

function weExtractText(html) {
  const meta = [];

  // Extract meta tags
  for (const m of html.matchAll(/<meta\s+[^>]*(?:name|property)=["']([^"']*)["'][^>]*content=["']([^"']*)["'][^>]*>/gi)) {
    if (["description", "og:title", "og:description", "og:site_name", "og:image", "twitter:title", "twitter:description", "theme-color"].includes(m[1].toLowerCase())) {
      meta.push(`[META ${m[1]}]: ${m[2]}`);
    }
  }
  for (const m of html.matchAll(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']([^"']*)["'][^>]*>/gi)) {
    if (["description", "og:title", "og:description", "og:site_name", "og:image", "twitter:title", "twitter:description", "theme-color"].includes(m[2].toLowerCase())) {
      meta.push(`[META ${m[2]}]: ${m[1]}`);
    }
  }

  // Extract favicon / icon links
  for (const m of html.matchAll(/<link\s+[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']*)["'][^>]*>/gi)) {
    meta.push(`[FAVICON]: ${m[1]}`);
  }

  // Extract logo images (img tags with "logo" in class, alt, or src)
  for (const m of html.matchAll(/<img\s+[^>]*(?:class|alt|src)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']*)["'][^>]*>/gi)) {
    meta.push(`[LOGO IMG]: ${m[1]}`);
  }
  for (const m of html.matchAll(/<img\s+[^>]*src=["']([^"']*logo[^"']*)["'][^>]*>/gi)) {
    meta.push(`[LOGO IMG]: ${m[1]}`);
  }

  // Extract Google Fonts
  for (const m of html.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&\s]+)/gi)) {
    meta.push(`[GOOGLE FONT]: ${decodeURIComponent(m[1]).replace(/\+/g, " ")}`);
  }

  // Extract CSS custom properties and prominent colors from inline styles and style blocks
  const styleBlocks = html.match(/<style[\s\S]*?<\/style>/gi) || [];
  const cssColors = new Set();
  for (const block of styleBlocks) {
    // Look for --primary, --brand, --accent, etc.
    for (const m of block.matchAll(/--(?:primary|brand|accent|secondary|main)[^:]*:\s*([^;}\n]+)/gi)) {
      cssColors.add(m[1].trim());
    }
    // Look for hex colors in prominent selectors
    for (const m of block.matchAll(/(?:background|color|background-color|border-color)\s*:\s*(#[0-9a-fA-F]{3,8})/gi)) {
      cssColors.add(m[1]);
    }
  }
  if (cssColors.size > 0) meta.push(`[CSS COLORS]: ${[...cssColors].slice(0, 15).join(", ")}`);

  // Extract social links
  for (const m of html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:linkedin\.com|twitter\.com|x\.com|youtube\.com|facebook\.com|instagram\.com)\/[^"'\s]+)["']/gi)) {
    meta.push(`[SOCIAL LINK]: ${m[1]}`);
  }

  // Extract JSON-LD structured data
  for (const m of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { meta.push(`[STRUCTURED DATA]: ${JSON.stringify(JSON.parse(m[1])).slice(0, 1000)}`); } catch { /* skip */ }
  }

  // Clean body text
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  clean = clean.replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ").replace(/\s+/g, " ").trim();

  return meta.join("\n") + "\n\n" + clean;
}

function weDiscoverLinks(text, targetPaths) {
  const found = [];
  for (const path of targetPaths) {
    const slug = path.replace(/^\//, "");
    if (text.toLowerCase().includes(`/${slug}`) || text.toLowerCase().includes(`"${slug}`)) found.push(path);
  }
  return found;
}

function weBuildPrompt(websiteText, origin) {
  const domain = new URL(origin).hostname.replace(/^www\./, "");
  return `Extract structured company information about the company at ${origin} (domain: ${domain}).

You have two sources of information:
1. WEBSITE CONTENT extracted below (may be incomplete if the site is a JavaScript SPA)
2. YOUR TRAINING KNOWLEDGE about this company

IMPORTANT: If the website content is sparse or mostly JavaScript configuration, USE YOUR TRAINING KNOWLEDGE to fill in company details, products, pricing, branding, and competitors. Many modern websites are SPAs that don't return useful HTML to server-side fetches. You likely know this company — use what you know.

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
  "integrations": "Key integrations or technology partners mentioned — or null",
  "branding": {
    "logoUrl": "Full URL to the company logo. Check [LOGO IMG] tags first. If not found, try ${origin}/logo.png or ${origin}/images/logo.svg. For well-known companies, use a known public logo URL if you have one. Return null only as last resort.",
    "faviconUrl": "URL of the favicon — or null",
    "primaryColor": "Primary brand color as hex. For well-known companies (Dropbox=#0061FF, Slack=#4A154B, Salesforce=#00A1E0, HubSpot=#FF7A59, etc.), USE YOUR KNOWLEDGE of their brand color. For others, infer from CSS/meta. NEVER return #000000 or #FFFFFF. Return null if truly unknown.",
    "secondaryColor": "Secondary brand color as hex. Use your knowledge of the brand. NOT #000000/#FFFFFF — null if unknown.",
    "accentColor": "Accent/CTA color as hex. NOT #000000/#FFFFFF — null if unknown.",
    "fonts": ["Font family names — from [GOOGLE FONT] tags, CSS, or your knowledge of the brand's typography"],
    "socialLinks": {
      "linkedin": "LinkedIn company URL — check [SOCIAL LINK] tags or use your knowledge — or null",
      "twitter": "Twitter/X URL — or null",
      "youtube": "YouTube URL — or null"
    }
  }
}

EXTRACTION RULES:
- CRITICAL: For well-known companies, USE YOUR TRAINING KNOWLEDGE to fill in ALL fields. Do not return null/empty just because the HTML was sparse.
- For products: include all known plans/tiers with current pricing if you know them.
- For competitors: include major known competitors even if not mentioned on the site.
- For branding colors: if you know the company's brand colors from your training, USE THEM. This is the most reliable source for major brands.
- For logoUrl: prefer URLs from the HTML. If none found, return null (we have a fallback).
- For socialLinks: check [SOCIAL LINK] tags first, then use your knowledge of the company's social presence.
- Clean up and normalize — don't copy-paste raw HTML artifacts.
- Return ONLY the JSON. No markdown fences. No explanation.`;
}
