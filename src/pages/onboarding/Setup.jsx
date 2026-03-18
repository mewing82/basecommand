import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Sparkles, Check, Loader, ArrowRight } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO } from "../../lib/tokens";
import { useMediaQuery } from "../../lib/useMediaQuery";
import { useAuthStore } from "../../store/authStore";
import { renewalStore } from "../../lib/storage";
import { loadDemoData, ONBOARDING } from "../../lib/demoData";
import { ProgressBar } from "../../components/onboarding/OnboardingWidgets";

const PATHS = [
  { id: "csv", label: "Upload CSV", desc: "Upload a file with your renewal accounts", icon: Upload, accent: C.gold },
  { id: "paste", label: "Paste from spreadsheet", desc: "Copy rows from Excel or Google Sheets", icon: FileText, accent: C.textSecondary },
  { id: "demo", label: "Explore with demo data", desc: "See BaseCommand in action with sample accounts", icon: Sparkles, accent: C.aiBlue },
];

export default function Setup() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const { user, loading: authLoading } = useAuthStore();
  const [activePath, setActivePath] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [done, setDone] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) navigate("/signup", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (localStorage.getItem(ONBOARDING.step) === "complete") {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  function handleComplete(count) {
    setImportCount(count);
    setDone(true);
    localStorage.setItem(ONBOARDING.step, "complete");
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING.step, "complete");
    navigate("/app");
  }

  function goToApp() {
    navigate("/app");
  }

  if (authLoading || !user) return null;

  return (
    <div style={{ minHeight: "100vh", background: C.bgPrimary, fontFamily: FONT_SANS }}>
      <ProgressBar step={3} total={3} />

      <div style={{
        maxWidth: 620, margin: "0 auto",
        padding: isMobile ? "60px 24px 40px" : "80px 24px 40px",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", marginBottom: 8 }}>
            {done ? "You're all set!" : "Get started with your accounts"}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>
            {done
              ? `${importCount} account${importCount !== 1 ? "s" : ""} ready to go`
              : "Choose how you'd like to add your first accounts"
            }
          </div>
        </div>

        {done ? (
          /* ─── Success state ────────────────────────────────────────── */
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, margin: "0 auto 24px",
              background: C.greenMuted, border: `1px solid ${C.green}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check size={28} style={{ color: C.green }} />
            </div>
            <button onClick={goToApp} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 36px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
              color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600,
              cursor: "pointer", boxShadow: `0 4px 16px ${C.goldGlow}`,
            }}>
              Go to Command Center <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* ─── Path selection ───────────────────────────────────────── */
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PATHS.map(path => (
                <PathCard
                  key={path.id}
                  path={path}
                  isActive={activePath === path.id}
                  onClick={() => setActivePath(activePath === path.id ? null : path.id)}
                  onComplete={handleComplete}
                  importing={importing}
                  setImporting={setImporting}
                />
              ))}
            </div>

            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button onClick={handleSkip} style={{
                background: "none", border: "none", cursor: "pointer",
                fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary,
                textDecoration: "underline", opacity: 0.7,
              }}>
                I'll add accounts later
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Path Card ───────────────────────────────────────────────────────────────

function PathCard({ path, isActive, onClick, onComplete, importing, setImporting }) {
  const Icon = path.icon;

  return (
    <div style={{
      borderRadius: 14, overflow: "hidden", cursor: isActive ? "default" : "pointer",
      border: `1px solid ${isActive ? path.accent + "60" : C.borderDefault}`,
      background: isActive ? `${path.accent}06` : C.bgCard,
      transition: "all 0.15s",
    }}
      onClick={!isActive ? onClick : undefined}
    >
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, padding: "16px 20px",
      }}
        onClick={isActive ? onClick : undefined}
      >
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `${path.accent}12`, border: `1px solid ${path.accent}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} style={{ color: path.accent }} />
        </div>
        <div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600, color: C.textPrimary }}>
            {path.label}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, marginTop: 2 }}>
            {path.desc}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isActive && (
        <div style={{ padding: "0 20px 20px" }}>
          {path.id === "csv" && <CSVUpload onComplete={onComplete} importing={importing} setImporting={setImporting} />}
          {path.id === "paste" && <PasteUpload onComplete={onComplete} importing={importing} setImporting={setImporting} />}
          {path.id === "demo" && <DemoLoader onComplete={onComplete} importing={importing} setImporting={setImporting} />}
        </div>
      )}
    </div>
  );
}

// ─── CSV Upload ──────────────────────────────────────────────────────────────

function CSVUpload({ onComplete, importing, setImporting }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState([]);

  function parseCSV(text) {
    const lines = text.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h => h.includes("name") || h.includes("account") || h.includes("company"));
    const arrIdx = headers.findIndex(h => h.includes("arr") || h.includes("revenue") || h.includes("value") || h.includes("mrr"));
    const dateIdx = headers.findIndex(h => h.includes("renewal") || h.includes("date") || h.includes("expir"));

    return lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      return {
        name: cols[nameIdx >= 0 ? nameIdx : 0] || "",
        arr: parseFloat(cols[arrIdx >= 0 ? arrIdx : 1]) || 0,
        renewalDate: cols[dateIdx >= 0 ? dateIdx : 2] || "",
      };
    }).filter(r => r.name);
  }

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseCSV(e.target.result));
    reader.readAsText(file);
  }

  async function handleImport() {
    setImporting(true);
    let count = 0;
    for (const row of rows) {
      await renewalStore.saveAccount({
        id: `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: row.name, arr: row.arr, renewalDate: row.renewalDate,
        riskLevel: "medium", contacts: [], summary: "", tags: [],
        lastActivity: new Date().toISOString(), createdAt: new Date().toISOString(),
      });
      count++;
    }
    setImporting(false);
    onComplete(count);
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? C.gold : C.borderDefault}`,
          borderRadius: 10, padding: "28px 20px", textAlign: "center", cursor: "pointer",
          background: dragOver ? `${C.gold}06` : "transparent",
          transition: "all 0.15s",
        }}
      >
        <Upload size={20} style={{ color: C.textTertiary, marginBottom: 8 }} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary }}>
          Drop your CSV here, or <span style={{ color: C.gold }}>browse</span>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginTop: 6 }}>
          Columns: Account Name, ARR, Renewal Date
        </div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
          onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
      </div>
      {rows.length > 0 && <ImportPreview rows={rows} onImport={handleImport} importing={importing} />}
    </div>
  );
}

// ─── Paste Upload ────────────────────────────────────────────────────────────

function PasteUpload({ onComplete, importing, setImporting }) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState([]);

  function handleParse() {
    const lines = text.trim().split("\n").filter(l => l.trim());
    const parsed = lines.map(line => {
      const cols = line.split(/[\t,]/).map(c => c.trim().replace(/^"|"$/g, ""));
      return { name: cols[0] || "", arr: parseFloat(cols[1]) || 0, renewalDate: cols[2] || "" };
    }).filter(r => r.name);
    setRows(parsed);
  }

  async function handleImport() {
    setImporting(true);
    let count = 0;
    for (const row of rows) {
      await renewalStore.saveAccount({
        id: `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: row.name, arr: row.arr, renewalDate: row.renewalDate,
        riskLevel: "medium", contacts: [], summary: "", tags: [],
        lastActivity: new Date().toISOString(), createdAt: new Date().toISOString(),
      });
      count++;
    }
    setImporting(false);
    onComplete(count);
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={"Account Name, ARR, Renewal Date\nMeridian Health, 420000, 2026-06-15\nTechForge, 185000, 2026-04-30"}
        style={{
          width: "100%", minHeight: 100, padding: 14, borderRadius: 10, boxSizing: "border-box",
          background: C.bgPrimary, border: `1px solid ${C.borderDefault}`,
          color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 12, outline: "none",
          resize: "vertical",
        }}
      />
      {text.trim() && rows.length === 0 && (
        <button onClick={handleParse} style={{
          marginTop: 10, padding: "8px 20px", borderRadius: 8, border: "none",
          background: C.bgCard, color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 13,
          fontWeight: 500, cursor: "pointer", border: `1px solid ${C.borderDefault}`,
        }}>
          Parse rows
        </button>
      )}
      {rows.length > 0 && <ImportPreview rows={rows} onImport={handleImport} importing={importing} />}
    </div>
  );
}

// ─── Demo Data Loader ────────────────────────────────────────────────────────

function DemoLoader({ onComplete, importing, setImporting }) {
  async function handleLoad() {
    setImporting(true);
    const count = await loadDemoData();
    setImporting(false);
    onComplete(count);
  }

  return (
    <div style={{ textAlign: "center", padding: "8px 0" }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>
        We'll load 8 realistic accounts with health scores, risk levels, and renewal dates so you can experience the full platform immediately.
      </div>
      <button onClick={handleLoad} disabled={importing} style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "10px 24px", borderRadius: 10, border: "none",
        background: `linear-gradient(135deg, ${C.aiBlue}, ${C.aiBlue}CC)`,
        color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
        cursor: importing ? "wait" : "pointer", opacity: importing ? 0.7 : 1,
      }}>
        {importing ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Loading...</>
          : <><Sparkles size={14} /> Load demo accounts</>}
      </button>
    </div>
  );
}

// ─── Import Preview ──────────────────────────────────────────────────────────

function ImportPreview({ rows, onImport, importing }) {
  const preview = rows.slice(0, 5);
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Preview ({rows.length} account{rows.length !== 1 ? "s" : ""})
      </div>
      <div style={{
        borderRadius: 8, border: `1px solid ${C.borderDefault}`, overflow: "hidden",
      }}>
        {preview.map((r, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "8px 12px", fontSize: 12,
            borderBottom: i < preview.length - 1 ? `1px solid ${C.borderDefault}` : "none",
            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
          }}>
            <span style={{ flex: 2, color: C.textPrimary, fontFamily: FONT_SANS, fontWeight: 500 }}>{r.name}</span>
            <span style={{ flex: 1, color: C.textSecondary, fontFamily: FONT_MONO }}>{r.arr ? `$${r.arr.toLocaleString()}` : "—"}</span>
            <span style={{ flex: 1, color: C.textTertiary, fontFamily: FONT_MONO }}>{r.renewalDate || "—"}</span>
          </div>
        ))}
        {rows.length > 5 && (
          <div style={{ padding: "6px 12px", fontSize: 11, color: C.textTertiary, fontFamily: FONT_MONO }}>
            +{rows.length - 5} more
          </div>
        )}
      </div>
      <button onClick={onImport} disabled={importing} style={{
        marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8,
        padding: "10px 24px", borderRadius: 10, border: "none",
        background: `linear-gradient(135deg, ${C.gold}, ${C.goldHover})`,
        color: C.bgPrimary, fontFamily: FONT_SANS, fontSize: 14, fontWeight: 600,
        cursor: importing ? "wait" : "pointer", opacity: importing ? 0.7 : 1,
        boxShadow: `0 4px 16px ${C.goldGlow}`,
      }}>
        {importing ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Importing...</>
          : <>Import {rows.length} account{rows.length !== 1 ? "s" : ""} <ArrowRight size={14} /></>}
      </button>
    </div>
  );
}
