// ─── Design Tokens ────────────────────────────────────────────────────────────
// "Command Indigo" — AI-native design system
// Warm-neutral dark base (not pure black) for accessibility per Smashing Magazine
// Dual accent: Indigo = human actions/authority, Cyan = AI intelligence/data

export const C = {
  // Backgrounds — warm-neutral layered depth system
  bgPrimary: "#0F1013",
  bgCard: "#171921",
  bgCardHover: "#1E2029",
  bgSidebar: "#0B0C0F",
  bgAI: "#0F1319",
  bgElevated: "#1E2029",
  bgSurface: "#262830",
  // Borders
  borderDefault: "#262830",
  borderActive: "#6366F1",
  borderSubtle: "#32353D",
  borderAI: "#1E2A4A",
  // Text — high contrast hierarchy (no pure white — prevents halation)
  textPrimary: "#ECEDF0",
  textSecondary: "#9CA3AF",
  textTertiary: "#8B95A5",
  // Primary accent — indigo for human actions, decisions, authority
  gold: "#6366F1",
  goldHover: "#818CF8",
  goldMuted: "rgba(99, 102, 241, 0.14)",
  goldGlow: "rgba(99, 102, 241, 0.06)",
  // AI accent — cyan for AI-generated content, intelligence, data
  aiBlue: "#22D3EE",
  aiBlueMuted: "rgba(34, 211, 238, 0.10)",
  aiBlueGlow: "rgba(34, 211, 238, 0.06)",
  // Status — desaturated for dark mode (avoid oversaturation per Smashing)
  green: "#34D399",
  greenMuted: "rgba(52, 211, 153, 0.12)",
  amber: "#FBBF24",
  amberMuted: "rgba(251, 191, 36, 0.12)",
  red: "#F87171",
  redMuted: "rgba(248, 113, 113, 0.12)",
  blue: "#6366F1",
  blueMuted: "rgba(99, 102, 241, 0.12)",
  // Special
  purple: "#A78BFA",
  purpleMuted: "rgba(167, 139, 250, 0.12)",
};

// ─── Typography ───────────────────────────────────────────────────────────────
export const FONT_MONO = "'JetBrains Mono', monospace";
export const FONT_DISPLAY = "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif";
export const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
export const FONT_SANS = FONT_DISPLAY; // backward compat — explicit FONT_DISPLAY/FONT_BODY preferred

// Typography scale — constrained to 6 sizes
export const TYPE = {
  displayLg: { fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em" },
  displayMd: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" },
  displaySm: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" },
  body: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: 400, lineHeight: 1.6 },
  bodySm: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
  mono: { fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500 },
  monoSm: { fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500 },
  label: { fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em" },
};

// ─── Spacing Scale (4px base) ─────────────────────────────────────────────────
export const S = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const R = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 14,
};

// ─── Hover Levels ─────────────────────────────────────────────────────────────
export const HOVER = {
  subtle: "rgba(255,255,255,0.04)",
  default: "rgba(255,255,255,0.06)",
  strong: "rgba(255,255,255,0.10)",
};

// ─── Breakpoints ──────────────────────────────────────────────────────────────
export const BP = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
};
