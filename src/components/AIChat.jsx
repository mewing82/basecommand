// ─── Reusable AI Chat Component ───────────────────────────────────────────────
// Deduplicates the "custom prompt + send + response" pattern used across views
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { C, FONT_SANS, FONT_MONO, S, R } from "../theme/tokens.js";
import { callAIForEntity } from "../lib/ai.js";
import { AIPanel, AIConfigPicker } from "./ui.jsx";

export default function AIChat({ entityType, entityId, contextBuilder, placeholder }) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiConfig, setAiConfig] = useState(null);

  async function askBC() {
    const q = customPrompt.trim();
    if (!q || aiLoading) return;
    setCustomPrompt("");
    setAiLoading(true);
    setAiError("");
    setAiResponse("");
    try {
      const ctx = contextBuilder ? contextBuilder() : "";
      const prompt = ctx ? `${ctx}\n\nQuestion: ${q}` : q;
      const response = await callAIForEntity(entityType, entityId, prompt, aiConfig);
      setAiResponse(String(response));
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: S.sm }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Ask BC
        </div>
        <AIConfigPicker value={aiConfig} onChange={setAiConfig} />
      </div>
      <div style={{ display: "flex", gap: S.sm }}>
        <input
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askBC()}
          placeholder={placeholder || "Ask anything..."}
          disabled={aiLoading}
          aria-label="Ask BC a question"
          style={{
            flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`,
            borderRadius: R.sm + 2, padding: "7px 12px",
            color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none",
          }}
        />
        <button
          onClick={askBC}
          disabled={!customPrompt.trim() || aiLoading}
          aria-label="Send question to BC"
          style={{
            background: customPrompt.trim() && !aiLoading ? C.gold : "transparent",
            border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`,
            borderRadius: R.sm + 2, padding: "7px 14px",
            cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed",
            color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary,
            fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
          }}
        >
          <Sparkles size={12} />
        </button>
      </div>
      <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
    </div>
  );
}
