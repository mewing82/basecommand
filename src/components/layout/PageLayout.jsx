// ─── Responsive Page Layout & Grid Components ──────────────────────────────
// Uses CSS custom properties from global.css for responsive spacing

/**
 * PageLayout — wraps page content with responsive padding and optional max-width.
 * Replaces hard-coded `padding: "32px 40px"` across all pages.
 */
export function PageLayout({ children, maxWidth, center = true, largePadding = false, style = {} }) {
  return (
    <div style={{
      paddingTop: `var(${largePadding ? "--bc-page-py-lg" : "--bc-page-py"})`,
      paddingBottom: `var(${largePadding ? "--bc-page-py-lg" : "--bc-page-py"})`,
      maxWidth: maxWidth || undefined,
      margin: center ? "0 auto" : undefined,
      ...style,
    }}>
      {children}
    </div>
  );
}

/**
 * StatGrid — responsive grid for stat cards.
 * Desktop: 4 columns, Tablet: 2, Small mobile: 1 (via CSS custom property).
 */
export function StatGrid({ children, gap = 12, style = {} }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(var(--bc-stat-cols), 1fr)",
      gap,
      ...style,
    }}>
      {children}
    </div>
  );
}

/**
 * CardGrid — responsive auto-fill grid for cards.
 * Uses --bc-card-min for minimum card width.
 */
export function CardGrid({ children, gap = 14, minWidth, style = {} }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth || "var(--bc-card-min)"}, 1fr))`,
      gap,
      ...style,
    }}>
      {children}
    </div>
  );
}
