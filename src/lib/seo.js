/**
 * SEO utilities — per-page meta tags, OG tags, and Schema.org JSON-LD.
 * Epic 18: Discovery Optimization (SEO + AEO + GEO Foundation)
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_NAME = "BaseCommand";
const SITE_URL = "https://basecommand.ai";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

// ─── Per-page meta tag hook ─────────────────────────────────────────────────
export function usePageMeta({ title, description, ogImage, ogType = "website" }) {
  const location = useLocation();
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  useEffect(() => {
    // Title
    document.title = title;

    // Meta tags
    setMeta("description", description);

    // Open Graph
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonicalUrl, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE, "property");

    // Twitter Card
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);
  }, [title, description, canonicalUrl, ogImage, ogType]);
}

function setMeta(nameOrProp, content, attrType = "name") {
  const selector = attrType === "property"
    ? `meta[property="${nameOrProp}"]`
    : `meta[name="${nameOrProp}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attrType, nameOrProp);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// ─── Schema.org JSON-LD injection ───────────────────────────────────────────
export function useJsonLd(schema, id = "schema-jsonld") {
  const schemaStr = JSON.stringify(schema);
  useEffect(() => {
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = schemaStr;
    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [id, schemaStr]);
}

// ─── Pre-built schemas ──────────────────────────────────────────────────────
export const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BaseCommand",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "AI-powered renewal intelligence platform. Nine specialized agents run the entire renewal workflow: health monitoring, risk detection, outreach drafting, expansion signals, forecasting, and executive reporting.",
  "url": SITE_URL,
  "offers": [
    {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier — 10 accounts, 50 AI calls/month, all agent categories"
    },
    {
      "@type": "Offer",
      "price": "49",
      "priceCurrency": "USD",
      "description": "Individual Pro — founding member pricing, unlimited accounts and AI"
    },
    {
      "@type": "Offer",
      "price": "149",
      "priceCurrency": "USD",
      "description": "Team — unlimited users, shared portfolio, org-level billing"
    }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "BaseCommand",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.svg`
  }
};

export function buildFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      }
    }))
  };
}

// ─── Page-specific SEO configs ──────────────────────────────────────────────
export const PAGE_SEO = {
  landing: {
    title: "BaseCommand — AI-Powered Renewal Intelligence",
    description: "AI agents that run your entire renewal workflow, from health scoring to outreach drafts to board-ready forecasts. Free 14-day Pro trial.",
  },
  why: {
    title: "Why Renewal Teams Need AI — BaseCommand",
    description: "58% of SaaS companies report lower NRR. Traditional renewal playbooks have broken down. See how AI-powered renewal operations detect risk 90 days earlier and prevent up to 71% of churn.",
  },
  howItWorks: {
    title: "How BaseCommand Works — AI Revenue Engine",
    description: "5 AI functions, 9 specialized agents, continuous monitoring. See the architecture behind AI-powered renewal ops — from health scoring to board-ready forecasts.",
  },
  getStarted: {
    title: "Get Started with BaseCommand — Implementation Blueprint",
    description: "4-week implementation, ROI calculator, free trial. Go from spreadsheets to AI-powered renewals in under a month.",
  },
  agents: {
    title: "AI Agents for Renewal Teams — BaseCommand",
    description: "Free AI agents on agent.ai: CRM Parser, Renewal Autopilot, Exec Brief Generator, Forecast Intelligence. Try them instantly, no signup needed.",
  },
  pricing: {
    title: "Pricing — BaseCommand",
    description: "Free forever tier with 10 accounts and 50 AI calls/month. 14-day Pro trial, no credit card. Founding member pricing: $49/mo locked for life.",
  },
  login: {
    title: "Sign In — BaseCommand",
    description: "Sign in to your BaseCommand account to access your AI-powered renewal intelligence dashboard.",
  },
  signup: {
    title: "Start Your Free Trial — BaseCommand",
    description: "14-day Pro trial, no credit card required. AI-powered renewal intelligence for your entire portfolio.",
  },
};
