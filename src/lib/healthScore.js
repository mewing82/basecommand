// ─── Account Health Score Engine ──────────────────────────────────────────────
// Computes a composite health score (0–10) from multiple signals.
// The score is DECOMPOSABLE — each signal has a name, value, severity, and weight.
// This is the connective tissue across all agents.

// ─── Behavioral Archetypes ──────────────────────────────────────────────────
export const ARCHETYPES = {
  power_user:           { label: "Power User",           color: "#22D3EE", description: "Maximum intensity, high expansion likelihood" },
  enthusiastic_adopter: { label: "Enthusiastic Adopter",  color: "#6366F1", description: "High feature breadth, safe renewal" },
  convert:              { label: "Convert",               color: "#34D399", description: "Rising usage, prime for targeted upsell" },
  explorer:             { label: "Explorer",              color: "#A78BFA", description: "Broad but shallow, requires guided adoption" },
  struggler:            { label: "Struggler",             color: "#FBBF24", description: "Usage cliffs, high churn risk, immediate intervention needed" },
  disconnected:         { label: "Disconnected",          color: "#F87171", description: "Zero core engagement, near-certain churn" },
};

// Renewal probability by archetype (for forecasting)
export const ARCHETYPE_RENEWAL_PROB = {
  power_user: 0.90,
  enthusiastic_adopter: 0.80,
  convert: 0.68,
  explorer: 0.50,
  struggler: 0.28,
  disconnected: 0.05,
};

// ─── Signal Definitions ─────────────────────────────────────────────────────
const SIGNAL_DEFS = {
  renewal_proximity: { label: "Renewal Proximity", weight: 0.20, category: "urgency" },
  activity_recency:  { label: "Activity Recency",  weight: 0.20, category: "engagement" },
  risk_level:        { label: "Risk Assessment",    weight: 0.15, category: "risk" },
  champion_status:   { label: "Champion Status",    weight: 0.15, category: "relationship" },
  context_richness:  { label: "Context Coverage",   weight: 0.10, category: "data" },
  email_sentiment:   { label: "Email Sentiment",    weight: 0.10, category: "sentiment" },
  arr_significance:  { label: "ARR Significance",   weight: 0.10, category: "value" },
};

// ─── Severity Thresholds ────────────────────────────────────────────────────
const SEVERITY = {
  critical: { label: "Critical", color: "#F87171", min: 0, max: 2 },
  high:     { label: "High",     color: "#FBBF24", min: 2, max: 4 },
  medium:   { label: "Medium",   color: "#A78BFA", min: 4, max: 6 },
  low:      { label: "Low",      color: "#34D399", min: 6, max: 8 },
  healthy:  { label: "Healthy",  color: "#22D3EE", min: 8, max: 10 },
};

export function getSeverity(score) {
  if (score <= 2) return SEVERITY.critical;
  if (score <= 4) return SEVERITY.high;
  if (score <= 6) return SEVERITY.medium;
  if (score <= 8) return SEVERITY.low;
  return SEVERITY.healthy;
}

// ─── Signal Computations ────────────────────────────────────────────────────

function scoreRenewalProximity(account) {
  if (!account.renewalDate) return { score: 5, reason: "No renewal date set" };
  const daysOut = Math.floor((new Date(account.renewalDate) - Date.now()) / 86400000);
  if (daysOut < 0) return { score: 2, reason: `Renewal ${Math.abs(daysOut)}d overdue` };
  if (daysOut <= 30) return { score: 3, reason: `Renewal in ${daysOut}d — urgent` };
  if (daysOut <= 60) return { score: 5, reason: `Renewal in ${daysOut}d — approaching` };
  if (daysOut <= 90) return { score: 7, reason: `Renewal in ${daysOut}d — plan ahead` };
  return { score: 9, reason: `Renewal in ${daysOut}d — healthy runway` };
}

function scoreActivityRecency(account) {
  if (!account.lastActivity) return { score: 3, reason: "No activity recorded" };
  const daysAgo = Math.floor((Date.now() - new Date(account.lastActivity).getTime()) / 86400000);
  if (daysAgo <= 7) return { score: 9, reason: `Active ${daysAgo}d ago` };
  if (daysAgo <= 14) return { score: 8, reason: `Active ${daysAgo}d ago` };
  if (daysAgo <= 30) return { score: 6, reason: `Last activity ${daysAgo}d ago` };
  if (daysAgo <= 60) return { score: 4, reason: `Silent for ${daysAgo}d` };
  if (daysAgo <= 90) return { score: 2, reason: `No contact in ${daysAgo}d — at risk` };
  return { score: 1, reason: `${daysAgo}d since last contact — critical silence` };
}

function scoreRiskLevel(account) {
  const level = account.riskLevel || "medium";
  if (level === "low") return { score: 9, reason: "Risk: Low" };
  if (level === "medium") return { score: 5, reason: "Risk: Medium" };
  return { score: 2, reason: "Risk: High" };
}

function scoreChampionStatus(account) {
  const contacts = account.contacts || [];
  if (contacts.length === 0) return { score: 3, reason: "No contacts tracked" };
  const champions = contacts.filter(c => c.isChampion);
  if (champions.length === 0) return { score: 5, reason: `${contacts.length} contact${contacts.length !== 1 ? "s" : ""}, no champion identified` };
  const departed = champions.filter(c => c.status === "departed");
  if (departed.length > 0) return { score: 1, reason: `Champion departed: ${departed[0].name}` };
  const unresponsive = champions.filter(c => c.status === "unresponsive");
  if (unresponsive.length > 0) return { score: 3, reason: `Champion unresponsive: ${unresponsive[0].name}` };
  return { score: 8, reason: `Champion active: ${champions[0].name}` };
}

function scoreContextRichness(account, contextItems) {
  const count = contextItems?.length || 0;
  if (count === 0) return { score: 3, reason: "No context data — limited AI insight" };
  if (count === 1) return { score: 5, reason: "1 context source" };
  if (count <= 3) return { score: 7, reason: `${count} context sources` };
  return { score: 9, reason: `${count} context sources — rich data` };
}

function scoreEmailSentiment(account) {
  // Uses sentiment from most recent email scan if available
  const sentiment = account._emailSentiment;
  if (!sentiment) return { score: 5, reason: "No email sentiment data" };
  if (sentiment >= 0.8) return { score: 9, reason: "Email sentiment: Positive" };
  if (sentiment >= 0.6) return { score: 7, reason: "Email sentiment: Neutral-positive" };
  if (sentiment >= 0.4) return { score: 5, reason: "Email sentiment: Neutral" };
  if (sentiment >= 0.2) return { score: 3, reason: "Email sentiment: Concerned" };
  return { score: 1, reason: "Email sentiment: Frustrated/Negative" };
}

function scoreARRSignificance(account, portfolioTotalARR) {
  if (!account.arr || account.arr === 0) return { score: 5, reason: "No ARR set" };
  if (!portfolioTotalARR || portfolioTotalARR === 0) return { score: 5, reason: `$${(account.arr / 1000).toFixed(0)}k ARR` };
  const pct = account.arr / portfolioTotalARR;
  // Higher ARR = more important = lower health score tolerance (more attention needed)
  // We invert: higher pct = lower score (needs more monitoring)
  if (pct > 0.15) return { score: 4, reason: `${(pct * 100).toFixed(0)}% of portfolio — high-value, needs attention` };
  if (pct > 0.08) return { score: 6, reason: `${(pct * 100).toFixed(0)}% of portfolio — significant` };
  if (pct > 0.03) return { score: 7, reason: `${(pct * 100).toFixed(0)}% of portfolio` };
  return { score: 8, reason: `${(pct * 100).toFixed(1)}% of portfolio — low concentration` };
}

// ─── Main Health Score Computation ──────────────────────────────────────────

/**
 * Compute a composite health score for an account.
 *
 * @param {Object} account - The account object
 * @param {Object} options - Additional context
 * @param {Array} options.contextItems - Context items for this account
 * @param {number} options.portfolioTotalARR - Total ARR across all accounts
 * @returns {Object} { score, severity, signals, archetype, archetypeInfo }
 */
export function computeHealthScore(account, options = {}) {
  const { contextItems = [], portfolioTotalARR = 0 } = options;

  // Compute each signal
  const signals = {
    renewal_proximity: { ...SIGNAL_DEFS.renewal_proximity, ...scoreRenewalProximity(account) },
    activity_recency:  { ...SIGNAL_DEFS.activity_recency, ...scoreActivityRecency(account) },
    risk_level:        { ...SIGNAL_DEFS.risk_level, ...scoreRiskLevel(account) },
    champion_status:   { ...SIGNAL_DEFS.champion_status, ...scoreChampionStatus(account) },
    context_richness:  { ...SIGNAL_DEFS.context_richness, ...scoreContextRichness(account, contextItems) },
    email_sentiment:   { ...SIGNAL_DEFS.email_sentiment, ...scoreEmailSentiment(account) },
    arr_significance:  { ...SIGNAL_DEFS.arr_significance, ...scoreARRSignificance(account, portfolioTotalARR) },
  };

  // Add severity to each signal
  for (const key of Object.keys(signals)) {
    signals[key].severity = getSeverity(signals[key].score);
  }

  // Weighted composite score
  let totalWeight = 0;
  let weightedSum = 0;
  for (const key of Object.keys(signals)) {
    const s = signals[key];
    weightedSum += s.score * s.weight;
    totalWeight += s.weight;
  }
  const score = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 5;

  // Classify archetype
  const archetype = classifyArchetype(account, signals, contextItems);

  return {
    score,
    severity: getSeverity(score),
    signals,
    archetype,
    archetypeInfo: ARCHETYPES[archetype],
    renewalProbability: ARCHETYPE_RENEWAL_PROB[archetype],
    computedAt: new Date().toISOString(),
  };
}

// ─── Archetype Classification ───────────────────────────────────────────────

function classifyArchetype(account, signals, contextItems) {
  const activity = signals.activity_recency.score;
  const risk = signals.risk_level.score;
  const context = signals.context_richness.score;
  const champion = signals.champion_status.score;
  const arr = account.arr || 0;

  // Disconnected: no activity, no context, or very low scores across the board
  if (activity <= 2 && context <= 3) return "disconnected";

  // Struggler: declining activity, high risk, or champion issues
  if (risk <= 3 || (activity <= 4 && champion <= 3)) return "struggler";

  // Power User: high activity, low risk, good champion, significant ARR
  if (activity >= 8 && risk >= 7 && arr > 0 && context >= 5) return "power_user";

  // Enthusiastic Adopter: good activity and risk, decent context
  if (activity >= 6 && risk >= 6 && context >= 5) return "enthusiastic_adopter";

  // Convert: moderate-to-good signals, showing growth trajectory
  if (activity >= 5 && risk >= 5) return "convert";

  // Explorer: has context but shallow engagement
  return "explorer";
}

// ─── Portfolio-Level Health ─────────────────────────────────────────────────

/**
 * Compute health scores for all accounts in a portfolio.
 *
 * @param {Array} accounts - All accounts
 * @param {Object} contextMap - Map of accountId → contextItems[]
 * @returns {Array} Array of { account, health } sorted by score ascending (worst first)
 */
export function computePortfolioHealth(accounts, contextMap = {}) {
  const totalARR = accounts.reduce((sum, a) => sum + (a.arr || 0), 0);

  const results = accounts.map(account => ({
    account,
    health: computeHealthScore(account, {
      contextItems: contextMap[account.id] || [],
      portfolioTotalARR: totalARR,
    }),
  }));

  // Sort: worst health first
  results.sort((a, b) => a.health.score - b.health.score);

  return results;
}

/**
 * Compute portfolio summary stats from health results.
 */
export function computePortfolioSummary(healthResults) {
  const total = healthResults.length;
  if (total === 0) return { total: 0, avgScore: 0, archetypes: {}, severityCounts: {} };

  const avgScore = Math.round((healthResults.reduce((sum, r) => sum + r.health.score, 0) / total) * 10) / 10;

  const archetypes = {};
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, healthy: 0 };

  for (const r of healthResults) {
    const arch = r.health.archetype;
    archetypes[arch] = (archetypes[arch] || 0) + 1;

    const sev = r.health.severity.label.toLowerCase();
    if (severityCounts[sev] !== undefined) severityCounts[sev]++;
  }

  const totalARR = healthResults.reduce((sum, r) => sum + (r.account.arr || 0), 0);
  const atRiskARR = healthResults
    .filter(r => r.health.score <= 4)
    .reduce((sum, r) => sum + (r.account.arr || 0), 0);

  return {
    total,
    avgScore,
    totalARR,
    atRiskARR,
    archetypes,
    severityCounts,
  };
}
