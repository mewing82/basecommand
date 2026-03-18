import { C, FONT_SANS, FONT_BODY } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";

const LAST_UPDATED = "March 18, 2026";

const S = (isMobile) => ({
  page: { padding: isMobile ? "48px 20px 80px" : "80px 40px 120px", maxWidth: 760, margin: "0 auto" },
  h1: {
    fontFamily: FONT_SANS, fontSize: isMobile ? 28 : 36, fontWeight: 700,
    color: C.textPrimary, letterSpacing: "-0.04em", margin: "0 0 12px",
  },
  updated: { fontSize: 14, color: C.textTertiary, fontFamily: FONT_BODY, marginBottom: 48 },
  h2: {
    fontFamily: FONT_SANS, fontSize: isMobile ? 18 : 22, fontWeight: 600,
    color: C.textPrimary, letterSpacing: "-0.02em", margin: "40px 0 12px",
  },
  h3: {
    fontFamily: FONT_SANS, fontSize: isMobile ? 15 : 17, fontWeight: 600,
    color: C.textPrimary, margin: "24px 0 8px",
  },
  p: { fontFamily: FONT_BODY, fontSize: 15, color: C.textSecondary, lineHeight: 1.75, margin: "0 0 16px" },
  ul: { fontFamily: FONT_BODY, fontSize: 15, color: C.textSecondary, lineHeight: 1.75, margin: "0 0 16px", paddingLeft: 24 },
  li: { marginBottom: 6 },
});

export default function Privacy() {
  const { isMobile } = useMediaQuery();
  const s = S(isMobile);

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Privacy Policy</h1>
      <p style={s.updated}>Last updated: {LAST_UPDATED}</p>

      <p style={s.p}>
        BaseCommand ("we," "us," or "our") operates the basecommand.ai website and application
        (the "Service"). This Privacy Policy explains how we collect, use, disclose, and
        safeguard your information when you use our Service.
      </p>

      <h2 style={s.h2}>1. Information We Collect</h2>

      <h3 style={s.h3}>Account Information</h3>
      <p style={s.p}>
        When you create an account, we collect your name, email address, and authentication
        credentials. If you sign in with Google, we receive your name, email, and profile
        picture from Google's OAuth service.
      </p>

      <h3 style={s.h3}>Renewal & Account Data</h3>
      <p style={s.p}>
        You may import or enter business data into BaseCommand, including customer account
        names, renewal dates, contract values, health scores, and related notes. This data
        is provided by you and stored to power the Service's features.
      </p>

      <h3 style={s.h3}>Email Connector Data</h3>
      <p style={s.p}>
        If you connect your Gmail or Outlook account, we access email metadata and content
        solely to extract renewal-relevant signals (sentiment, engagement, risk indicators).
        We do not store full email content — only extracted insights linked to your accounts.
        You can disconnect email access at any time from Settings.
      </p>

      <h3 style={s.h3}>Usage Data</h3>
      <p style={s.p}>
        We collect standard usage information including pages visited, features used, AI
        agent interactions, browser type, and device information. This helps us improve the
        Service and understand how features are used.
      </p>

      <h2 style={s.h2}>2. How We Use Your Information</h2>
      <ul style={s.ul}>
        <li style={s.li}>Provide, maintain, and improve the Service</li>
        <li style={s.li}>Power AI agents that analyze your renewal data and generate insights</li>
        <li style={s.li}>Process your transactions and manage your subscription</li>
        <li style={s.li}>Send service-related communications (account confirmations, security alerts, billing)</li>
        <li style={s.li}>Enforce our Terms of Service and prevent abuse</li>
        <li style={s.li}>Comply with legal obligations</li>
      </ul>
      <p style={s.p}>
        We do not sell your personal information. We do not use your business data to train
        AI models. Your renewal data is yours.
      </p>

      <h2 style={s.h2}>3. AI Processing</h2>
      <p style={s.p}>
        BaseCommand uses third-party AI providers (Anthropic and OpenAI) to power its agent
        features. When you use an AI agent, relevant context from your account data is sent
        to these providers to generate analysis, recommendations, and drafts.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>AI providers process data per their own privacy policies and data processing agreements</li>
        <li style={s.li}>Anthropic and OpenAI do not use API inputs to train their models</li>
        <li style={s.li}>We send only the minimum context needed for each AI request</li>
        <li style={s.li}>AI-generated outputs are stored in your account for your reference</li>
      </ul>

      <h2 style={s.h2}>4. Third-Party Services</h2>
      <p style={s.p}>We use the following third-party services to operate BaseCommand:</p>
      <ul style={s.ul}>
        <li style={s.li}><strong style={{ color: C.textPrimary }}>Supabase</strong> — Authentication and database storage</li>
        <li style={s.li}><strong style={{ color: C.textPrimary }}>Vercel</strong> — Application hosting and serverless functions</li>
        <li style={s.li}><strong style={{ color: C.textPrimary }}>Stripe</strong> — Payment processing (Stripe's privacy policy governs payment data)</li>
        <li style={s.li}><strong style={{ color: C.textPrimary }}>Anthropic</strong> — AI processing (Claude)</li>
        <li style={s.li}><strong style={{ color: C.textPrimary }}>OpenAI</strong> — AI processing (GPT)</li>
      </ul>
      <p style={s.p}>
        Each service processes data according to their own privacy policies. We select
        providers that maintain appropriate security and privacy standards.
      </p>

      <h2 style={s.h2}>5. Data Storage & Security</h2>
      <p style={s.p}>
        Your data is stored on servers in the United States via Supabase (PostgreSQL) and
        Vercel. We use encryption in transit (TLS) and at rest. Authentication tokens and
        API keys are stored in encrypted key-value storage.
      </p>
      <p style={s.p}>
        While we implement commercially reasonable security measures, no method of
        electronic storage is 100% secure. We cannot guarantee absolute security.
      </p>

      <h2 style={s.h2}>6. Data Retention & Deletion</h2>
      <p style={s.p}>
        We retain your data for as long as your account is active. If you delete your
        account, we will delete your personal information and business data within 30 days,
        except where we are required to retain it for legal or compliance reasons.
      </p>
      <p style={s.p}>
        You can request data export or deletion by contacting us at the address below.
      </p>

      <h2 style={s.h2}>7. Your Rights</h2>
      <p style={s.p}>Depending on your jurisdiction, you may have the right to:</p>
      <ul style={s.ul}>
        <li style={s.li}>Access the personal information we hold about you</li>
        <li style={s.li}>Correct inaccurate information</li>
        <li style={s.li}>Delete your personal information</li>
        <li style={s.li}>Export your data in a portable format</li>
        <li style={s.li}>Object to or restrict certain processing</li>
      </ul>
      <p style={s.p}>
        To exercise any of these rights, contact us at privacy@basecommand.ai.
      </p>

      <h2 style={s.h2}>8. Cookies</h2>
      <p style={s.p}>
        We use essential cookies for authentication and session management. We do not use
        third-party advertising cookies or cross-site tracking. Your browser settings
        control cookie preferences.
      </p>

      <h2 style={s.h2}>9. Children's Privacy</h2>
      <p style={s.p}>
        BaseCommand is not intended for individuals under 16 years of age. We do not
        knowingly collect personal information from children.
      </p>

      <h2 style={s.h2}>10. Changes to This Policy</h2>
      <p style={s.p}>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes by posting the updated policy on this page and updating the "Last updated"
        date. Continued use of the Service after changes constitutes acceptance of the
        updated policy.
      </p>

      <h2 style={s.h2}>11. Contact Us</h2>
      <p style={s.p}>
        If you have questions about this Privacy Policy or our data practices, contact us at:
      </p>
      <p style={{ ...s.p, fontFamily: FONT_SANS, fontWeight: 500, color: C.textPrimary }}>
        privacy@basecommand.ai
      </p>
    </div>
  );
}
