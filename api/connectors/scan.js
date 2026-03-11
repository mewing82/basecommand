/**
 * Email scan endpoint — fetches emails from connected providers, extracts items via Claude.
 * POST /api/connectors/scan
 * Body: { userId, provider: "gmail"|"outlook"|"all", timeframe: "24h"|"3d"|"7d"|"since_last", existingHashes: [...] }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId, provider = "all", timeframe = "24h", existingHashes = [] } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!kvUrl || !kvToken) {
    return res.status(500).json({ error: "KV not configured" });
  }
  if (!anthropicKey) {
    return res.status(500).json({ error: "Anthropic API key not configured" });
  }

  try {
    // Determine which providers to scan
    const providers = provider === "all" ? ["gmail", "outlook"] : [provider];
    const allEmails = [];
    const hashSet = new Set(existingHashes);

    for (const p of providers) {
      const tokens = await kvGet(kvUrl, kvToken, `bc2-oauth:${p}:${userId}`);
      if (!tokens?.access_token) continue;

      // Refresh token if expired
      const validTokens = await ensureFreshToken(p, tokens, userId, kvUrl, kvToken);
      if (!validTokens) continue;

      // Calculate time boundary
      const boundary = getTimeBoundary(timeframe, p, userId);

      // Fetch emails
      const emails = p === "gmail"
        ? await fetchGmailMessages(validTokens.access_token, boundary)
        : await fetchOutlookMessages(validTokens.access_token, boundary);

      // Update last scan timestamp
      await kvSet(kvUrl, kvToken, `bc2-connector:last-scan:${p}:${userId}`, { ts: Date.now() });

      // Deduplicate against already-scanned emails
      for (const email of emails) {
        const hash = simpleHash(`${email.id}:${email.subject}:${email.sender}`);
        if (!hashSet.has(hash)) {
          allEmails.push({ ...email, _hash: hash, _provider: p });
          hashSet.add(hash);
        }
      }
    }

    if (allEmails.length === 0) {
      return res.status(200).json({
        items: [],
        newHashes: [],
        emailCount: 0,
        summary: "No new emails found in the selected timeframe.",
      });
    }

    // Build email digest for Claude
    const digest = allEmails.slice(0, 50).map((e, i) =>
      `[Email ${i + 1}] From: ${e.sender} | Subject: ${e.subject} | Date: ${e.date}\n${(e.body || "").slice(0, 500)}`
    ).join("\n\n---\n\n");

    // Extract items via Claude
    const extractionPrompt = `You are Base Command (BC), analyzing an executive's recent emails to extract actionable items.

Review these ${allEmails.length} emails and extract tasks, decisions, and priorities that require attention.

EMAILS:
${digest}

RULES:
- Only extract genuinely actionable items, not FYI or newsletters
- Each item needs: type (task/decision/priority), title, context, and urgency
- For tasks: include a clear action and any deadline mentioned
- For decisions: include what needs to be decided and by when
- For priorities: include why this is a priority and suggested timeframe
- Be concise but specific — the executive needs to act on these

Return ONLY valid JSON:
{
  "items": [
    {
      "type": "task" | "decision" | "priority",
      "title": "Clear, actionable title",
      "context": "Brief context from the email",
      "priority": "critical" | "high" | "medium" | "low",
      "source_email": "sender name or email",
      "source_subject": "original email subject"
    }
  ],
  "summary": "2-3 sentence executive summary of email activity"
}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: "You are a precise data extraction system. Return only valid JSON as instructed.",
        messages: [{ role: "user", content: extractionPrompt }],
      }),
    });

    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) {
      console.error("Claude extraction error:", claudeData);
      return res.status(500).json({ error: "AI extraction failed" });
    }

    const rawText = claudeData.content?.[0]?.text || "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response", raw: rawText });
    }

    return res.status(200).json({
      items: parsed.items || [],
      summary: parsed.summary || "",
      newHashes: allEmails.map(e => e._hash),
      emailCount: allEmails.length,
    });
  } catch (err) {
    console.error("Scan error:", err);
    return res.status(500).json({ error: "Scan failed: " + err.message });
  }
}

// ─── Gmail adapter ───────────────────────────────────────────────────────────
async function fetchGmailMessages(accessToken, after) {
  const query = `newer_than:${after}`;
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  if (!listData.messages?.length) return [];

  const emails = [];
  // Fetch details in batches of 10
  const ids = listData.messages.slice(0, 50).map(m => m.id);
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const details = await Promise.all(batch.map(async (id) => {
      const r = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return r.json();
    }));

    for (const msg of details) {
      if (!msg.payload) continue;
      const headers = msg.payload.headers || [];
      const subject = headers.find(h => h.name.toLowerCase() === "subject")?.value || "(no subject)";
      const from = headers.find(h => h.name.toLowerCase() === "from")?.value || "";
      const date = headers.find(h => h.name.toLowerCase() === "date")?.value || "";

      // Skip likely newsletters (has unsubscribe header)
      const hasUnsubscribe = headers.some(h => h.name.toLowerCase() === "list-unsubscribe");
      if (hasUnsubscribe) continue;

      const body = extractGmailBody(msg.payload);
      emails.push({ id: msg.id, subject, sender: from, date, body });
    }
  }

  return emails;
}

function extractGmailBody(payload) {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8").slice(0, 500);
  }
  if (payload.parts) {
    const textPart = payload.parts.find(p => p.mimeType === "text/plain");
    if (textPart?.body?.data) {
      return Buffer.from(textPart.body.data, "base64url").toString("utf-8").slice(0, 500);
    }
    // Fallback to HTML part, strip tags roughly
    const htmlPart = payload.parts.find(p => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      const html = Buffer.from(htmlPart.body.data, "base64url").toString("utf-8");
      return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
    }
  }
  return "";
}

// ─── Outlook adapter ─────────────────────────────────────────────────────────
async function fetchOutlookMessages(accessToken, after) {
  const sinceDate = new Date(Date.now() - parseDuration(after)).toISOString();
  const url = `https://graph.microsoft.com/v1.0/me/messages?$top=50&$orderby=receivedDateTime desc&$filter=receivedDateTime ge ${sinceDate}&$select=id,subject,from,receivedDateTime,bodyPreview`;

  const listRes = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const listData = await listRes.json();
  if (!listData.value?.length) return [];

  return listData.value.map(msg => ({
    id: msg.id,
    subject: msg.subject || "(no subject)",
    sender: msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || "",
    date: msg.receivedDateTime || "",
    body: (msg.bodyPreview || "").slice(0, 500),
  }));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTimeBoundary(timeframe) {
  const map = { "24h": "1d", "3d": "3d", "7d": "7d", "since_last": "1d" };
  return map[timeframe] || "1d";
}

function parseDuration(str) {
  const match = str.match(/(\d+)([dhm])/);
  if (!match) return 86400000; // default 1 day
  const val = parseInt(match[1]);
  const unit = match[2];
  if (unit === "d") return val * 86400000;
  if (unit === "h") return val * 3600000;
  if (unit === "m") return val * 60000;
  return 86400000;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return "h_" + Math.abs(hash).toString(36);
}

async function ensureFreshToken(provider, tokens, userId, kvUrl, kvToken) {
  if (tokens.expires_at && Date.now() < tokens.expires_at - 60000) {
    return tokens; // Still valid with 1min buffer
  }

  if (!tokens.refresh_token) return null;

  try {
    let newTokens;
    if (provider === "gmail") {
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: tokens.refresh_token,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });
      newTokens = await r.json();
    } else {
      const r = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: tokens.refresh_token,
          client_id: process.env.MICROSOFT_CLIENT_ID,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });
      newTokens = await r.json();
    }

    if (!newTokens.access_token) return null;

    const updated = {
      ...tokens,
      access_token: newTokens.access_token,
      expires_at: Date.now() + (newTokens.expires_in || 3600) * 1000,
      ...(newTokens.refresh_token ? { refresh_token: newTokens.refresh_token } : {}),
    };

    await kvSet(kvUrl, kvToken, `bc2-oauth:${provider}:${userId}`, updated);
    return updated;
  } catch {
    return null;
  }
}

async function kvGet(kvUrl, kvToken, key) {
  const r = await fetch(`${kvUrl}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${kvToken}` },
  });
  if (!r.ok) return null;
  const json = await r.json();
  return json.result ? (typeof json.result === "string" ? JSON.parse(json.result) : json.result) : null;
}

async function kvSet(kvUrl, kvToken, key, value) {
  await fetch(`${kvUrl}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${kvToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
}
