import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../lib/tokens";

export function inlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: C.textPrimary, fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} style={{ fontFamily: FONT_MONO, fontSize: 12, background: "rgba(255,255,255,0.05)", padding: "1px 4px", borderRadius: 3 }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      elements.push(<br key={key++} />);
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<div key={key++} style={{ fontWeight: 600, fontSize: 15, color: C.textPrimary, marginTop: 12, marginBottom: 4, fontFamily: FONT_SANS }}>{inlineMarkdown(line.slice(4))}</div>);
    } else if (line.startsWith("## ")) {
      elements.push(<div key={key++} style={{ fontWeight: 700, fontSize: 15, color: C.textPrimary, marginTop: 14, marginBottom: 4, fontFamily: FONT_SANS }}>{inlineMarkdown(line.slice(3))}</div>);
    } else if (line.startsWith("# ")) {
      elements.push(<div key={key++} style={{ fontWeight: 700, fontSize: 16, color: C.textPrimary, marginTop: 16, marginBottom: 6, fontFamily: FONT_SANS }}>{inlineMarkdown(line.slice(2))}</div>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={key++} style={{ display: "flex", gap: 8, marginBottom: 3, fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary }}>
          <span style={{ color: C.gold, flexShrink: 0 }}>•</span>
          <span>{inlineMarkdown(line.slice(2))}</span>
        </div>
      );
    } else {
      elements.push(<div key={key++} style={{ marginBottom: 4, fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6 }}>{inlineMarkdown(line)}</div>);
    }
  }
  return elements;
}
