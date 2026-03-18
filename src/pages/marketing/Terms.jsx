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
  p: { fontFamily: FONT_BODY, fontSize: 15, color: C.textSecondary, lineHeight: 1.75, margin: "0 0 16px" },
  ul: { fontFamily: FONT_BODY, fontSize: 15, color: C.textSecondary, lineHeight: 1.75, margin: "0 0 16px", paddingLeft: 24 },
  li: { marginBottom: 6 },
});

export default function Terms() {
  const { isMobile } = useMediaQuery();
  const s = S(isMobile);

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Terms of Service</h1>
      <p style={s.updated}>Last updated: {LAST_UPDATED}</p>

      <p style={s.p}>
        These Terms of Service ("Terms") govern your access to and use of BaseCommand
        ("the Service"), operated by BaseCommand ("we," "us," or "our"). By creating an
        account or using the Service, you agree to be bound by these Terms.
      </p>

      <h2 style={s.h2}>1. The Service</h2>
      <p style={s.p}>
        BaseCommand is an AI-powered renewal intelligence platform that helps SaaS companies
        manage customer renewals. The Service includes AI agents that analyze account data,
        generate insights, draft communications, and recommend actions. BaseCommand is a
        tool to assist your renewal operations — it does not replace your professional
        judgment.
      </p>

      <h2 style={s.h2}>2. Accounts</h2>
      <p style={s.p}>
        You must provide accurate information when creating an account. You are responsible
        for maintaining the security of your account credentials and for all activity under
        your account. Notify us immediately if you suspect unauthorized access.
      </p>
      <p style={s.p}>
        You must be at least 16 years old to use the Service. By using BaseCommand, you
        represent that you have the authority to bind yourself (or your organization) to
        these Terms.
      </p>

      <h2 style={s.h2}>3. Free Tier & Pro Subscription</h2>
      <p style={s.p}>
        BaseCommand offers a free tier and a paid Pro subscription. Every new account
        receives a 14-day Pro trial at no cost and with no credit card required.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong style={{ color: C.textPrimary }}>Free tier:</strong> 10 accounts,
          50 AI calls per month, all agent categories, co-pilot mode
        </li>
        <li style={s.li}>
          <strong style={{ color: C.textPrimary }}>Pro:</strong> Unlimited accounts,
          unlimited AI calls, supervised autopilot, email connectors, cloud sync
        </li>
      </ul>
      <p style={s.p}>
        After your trial ends, your account reverts to the free tier unless you subscribe
        to Pro. You will not be charged without your explicit consent.
      </p>

      <h2 style={s.h2}>4. Billing & Cancellation</h2>
      <p style={s.p}>
        Pro subscriptions are billed monthly or annually via Stripe. You can cancel at any
        time from Settings. Upon cancellation, you retain Pro access through the end of your
        current billing period, then revert to the free tier. We do not offer refunds for
        partial billing periods.
      </p>
      <p style={s.p}>
        Founding member pricing ($49/mo or $39/mo annual) is locked for the lifetime of
        your subscription. If you cancel and later re-subscribe, the then-current pricing
        applies.
      </p>

      <h2 style={s.h2}>5. Your Data</h2>
      <p style={s.p}>
        You retain all ownership of the data you upload or enter into BaseCommand. We do not
        claim any intellectual property rights over your business data.
      </p>
      <p style={s.p}>
        You grant us a limited license to process your data solely to provide the Service —
        including sending relevant context to AI providers (Anthropic, OpenAI) to generate
        agent outputs. See our Privacy Policy for details on how data is handled.
      </p>
      <p style={s.p}>
        You are responsible for ensuring you have the right to upload any data you provide
        to BaseCommand, including customer information and email data.
      </p>

      <h2 style={s.h2}>6. AI-Generated Content</h2>
      <p style={s.p}>
        AI agents may generate analysis, recommendations, email drafts, and other outputs
        based on your data. This content is provided for informational purposes and to
        assist your workflow.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>AI outputs may contain inaccuracies — always review before acting on them</li>
        <li style={s.li}>You are solely responsible for any actions taken based on AI-generated content</li>
        <li style={s.li}>AI-drafted emails should be reviewed before sending to customers</li>
        <li style={s.li}>Health scores and risk assessments are estimates, not guarantees</li>
      </ul>

      <h2 style={s.h2}>7. Acceptable Use</h2>
      <p style={s.p}>You agree not to:</p>
      <ul style={s.ul}>
        <li style={s.li}>Use the Service for any unlawful purpose</li>
        <li style={s.li}>Attempt to reverse-engineer, decompile, or extract source code from the Service</li>
        <li style={s.li}>Circumvent usage limits, rate limits, or access controls</li>
        <li style={s.li}>Share account credentials or allow unauthorized access</li>
        <li style={s.li}>Use the Service to send spam or unsolicited communications</li>
        <li style={s.li}>Upload malicious data designed to manipulate AI outputs</li>
        <li style={s.li}>Resell, sublicense, or redistribute the Service or its outputs</li>
      </ul>

      <h2 style={s.h2}>8. Service Availability</h2>
      <p style={s.p}>
        We strive to keep BaseCommand available and reliable, but we do not guarantee
        uninterrupted access. The Service may be temporarily unavailable for maintenance,
        updates, or due to circumstances beyond our control. We are not liable for any
        downtime or data loss resulting from service interruptions.
      </p>

      <h2 style={s.h2}>9. Third-Party Services</h2>
      <p style={s.p}>
        BaseCommand integrates with third-party services including AI providers, email
        platforms, and payment processors. Your use of these integrations is subject to the
        respective third party's terms. We are not responsible for the availability or
        performance of third-party services.
      </p>

      <h2 style={s.h2}>10. Limitation of Liability</h2>
      <p style={s.p}>
        To the maximum extent permitted by law, BaseCommand and its operators shall not be
        liable for any indirect, incidental, special, consequential, or punitive damages,
        including lost revenue, lost profits, or loss of data, arising from your use of the
        Service.
      </p>
      <p style={s.p}>
        Our total liability for any claim arising from the Service shall not exceed the
        amount you paid us in the 12 months preceding the claim, or $100, whichever is
        greater.
      </p>

      <h2 style={s.h2}>11. Disclaimer of Warranties</h2>
      <p style={s.p}>
        The Service is provided "as is" and "as available" without warranties of any kind,
        whether express or implied, including merchantability, fitness for a particular
        purpose, and non-infringement. We do not warrant that AI outputs will be accurate,
        complete, or suitable for any particular purpose.
      </p>

      <h2 style={s.h2}>12. Termination</h2>
      <p style={s.p}>
        You may delete your account at any time. We may suspend or terminate your account
        if you violate these Terms or engage in conduct that we reasonably believe is
        harmful to other users or the Service. Upon termination, your right to use the
        Service ceases immediately. We will delete your data in accordance with our Privacy
        Policy.
      </p>

      <h2 style={s.h2}>13. Changes to These Terms</h2>
      <p style={s.p}>
        We may update these Terms from time to time. We will notify you of material changes
        by posting the updated Terms on this page and updating the "Last updated" date.
        Continued use of the Service after changes constitutes acceptance.
      </p>

      <h2 style={s.h2}>14. Governing Law</h2>
      <p style={s.p}>
        These Terms are governed by the laws of the State of Delaware, without regard to
        conflict of law provisions. Any disputes arising from these Terms or the Service
        shall be resolved in the courts of Delaware.
      </p>

      <h2 style={s.h2}>15. Contact Us</h2>
      <p style={s.p}>
        If you have questions about these Terms, contact us at:
      </p>
      <p style={{ ...s.p, fontFamily: FONT_SANS, fontWeight: 500, color: C.textPrimary }}>
        legal@basecommand.ai
      </p>
    </div>
  );
}
