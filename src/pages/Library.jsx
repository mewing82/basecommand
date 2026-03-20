import { useState, useRef } from "react";
import { FileText, Sparkles, Grid3X3 } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, SUPPORTED_DOC_TYPES } from "../lib/tokens";
import { store } from "../lib/storage";
import { callAI, callAIForEntity } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { genId, isoNow, fmtRelative, extractFileContent } from "../lib/utils";
import { useEntityStore } from "../store/entityStore";
import { Badge, Btn, AIPanel, EmptyState, renderMarkdown, ProjectFilterPills, useProjectLinks } from "../components/ui/index";

export default function Library() {
  const { documents, setDocuments, projects } = useEntityStore();
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [filterSource, setFilterSource] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [filterProject, setFilterProject] = useState(null);
  const fileInputRef = useRef(null);
  const linkMap = useProjectLinks(projects);

  const dateSorted = sortBy === "oldest" ? [...documents].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) : [...documents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sourceFiltered = filterSource ? dateSorted.filter(d => (d.source || "upload") === filterSource) : dateSorted;
  const filtered = search.trim() ? sourceFiltered.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || (d.summary || "").toLowerCase().includes(search.toLowerCase())) : sourceFiltered;

  async function handleUpload(e) {
    const files = e.target.files; if (!files || files.length === 0) return;
    setUploading(true); setUploadError("");
    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!SUPPORTED_DOC_TYPES.includes(ext)) { setUploadError(`Unsupported: ${ext}`); continue; }
      try {
        const content = await extractFileContent(file);
        if (!content) { setUploadError(`Could not extract text from ${file.name}`); continue; }
        const doc = { id: genId("doc"), title: file.name, filename: file.name, fileType: ext.replace(".", ""), content, summary: null, fileSize: file.size, source: "upload", createdAt: isoNow(), updatedAt: isoNow() };
        await store.save("document", doc);
        try {
          const preview = content.slice(0, 4000);
          const summaryResponse = await callAI([{ role: "user", content: `Summarize this document in 3-5 concise bullet points.\n\nDocument: ${file.name}\n\nContent:\n${preview}` }]);
          doc.summary = summaryResponse; await store.save("document", doc);
        } catch (_) {}
        setDocuments(await store.list("document"));
      } catch (err) { setUploadError(`Error: ${err.message}`); }
    }
    setUploading(false); if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function deleteDocument(id) { await store.delete("document", id); setDocuments(documents.filter(d => d.id !== id)); if (expandedId === id) setExpandedId(null); }

  return (
    <PageLayout maxWidth={760} largePadding>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: FONT_SANS, fontSize: 26, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.03em", margin: "0 0 6px" }}>Library</h1>
          <p style={{ fontSize: 14, color: C.textSecondary, margin: 0, fontFamily: FONT_BODY }}>Upload documents and interact with them through BC.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textTertiary }}>{documents.length} doc{documents.length !== 1 ? "s" : ""}</span>
          <input ref={fileInputRef} type="file" accept=".txt,.md,.docx,.jsx" multiple onChange={handleUpload} style={{ display: "none" }} />
          <Btn variant="primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? "Uploading..." : "＋ Upload"}</Btn>
        </div>
      </div>
      {uploadError && <div style={{ marginBottom: 16, padding: "10px 14px", background: `${C.red}18`, border: `1px solid ${C.red}44`, borderRadius: 6, fontSize: 13, color: C.red, fontFamily: FONT_BODY }}>{uploadError}</div>}
      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 16 }}>Supported: .txt, .md, .docx, .jsx</div>
      <ProjectFilterPills projects={projects} filterProject={filterProject} setFilterProject={setFilterProject} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 4 }}>Source:</span>
          {[[null, "All"], ["upload", "Upload"], ["project", "Project"]].map(([val, lbl]) => (
            <button key={lbl} onClick={() => setFilterSource(val)} style={{ padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer", background: filterSource === val ? C.blue : "rgba(0,0,0,0.03)", color: filterSource === val ? "#fff" : C.textTertiary, fontSize: 11, fontFamily: FONT_MONO, fontWeight: filterSource === val ? 700 : 400 }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["newest", "Newest"], ["oldest", "Oldest"]].map(([val, lbl]) => (
            <button key={val} onClick={() => setSortBy(val)} style={{ padding: "3px 10px", borderRadius: 12, border: "none", cursor: "pointer", background: sortBy === val ? "rgba(0,0,0,0.05)" : "transparent", color: sortBy === val ? C.textPrimary : C.textSecondary, fontSize: 11, fontFamily: FONT_MONO, fontWeight: sortBy === val ? 600 : 400 }}>{lbl}</button>
          ))}
        </div>
      </div>
      {documents.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "9px 14px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
      )}
      {filtered.length === 0 ? (
        documents.length === 0 ? <EmptyState icon="▤" title="No documents yet" sub="Upload .txt, .md, or .docx files to get started." action="＋ Upload" onAction={() => fileInputRef.current?.click()} /> : <div style={{ textAlign: "center", padding: "40px 0", fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>No documents match "{search}"</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(d => <DocumentCard key={d.id} doc={d} expanded={expandedId === d.id} onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)} onDelete={() => deleteDocument(d.id)} />)}
        </div>
      )}
    </PageLayout>
  );
}

function DocumentCard({ doc, expanded, onToggle, onDelete }) {
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [headerHovered, setHeaderHovered] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function askBC() {
    const q = customPrompt.trim(); if (!q || aiLoading) return;
    setCustomPrompt(""); setAiLoading(true); setAiError(""); setAiResponse("");
    try {
      const contentPreview = (doc.content || "").slice(0, 3000);
      const ctx = `Document: ${doc.title}\nType: ${doc.fileType}\nSummary: ${doc.summary || "none"}\n\nContent (first 3000 chars):\n${contentPreview}`;
      const response = await callAIForEntity("document", doc.id, `${ctx}\n\nQuestion: ${q}`);
      setAiResponse(response);
    } catch (err) { setAiError(err.message); } finally { setAiLoading(false); }
  }

  const sizeLabel = doc.fileSize < 1024 ? `${doc.fileSize}B` : doc.fileSize < 1048576 ? `${(doc.fileSize / 1024).toFixed(1)}KB` : `${(doc.fileSize / 1048576).toFixed(1)}MB`;

  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 10, overflow: "hidden" }}>
      <div onClick={onToggle} onMouseEnter={() => setHeaderHovered(true)} onMouseLeave={() => setHeaderHovered(false)} style={{ padding: "14px 18px", cursor: "pointer", background: headerHovered ? C.bgCardHover : "transparent", transition: "background 0.15s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <FileText size={16} style={{ flexShrink: 0 }} />
            <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 600, color: C.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, fontFamily: FONT_MONO, fontSize: 11, color: headerHovered ? C.gold : C.textSecondary, border: `1px solid ${headerHovered ? C.gold : C.borderDefault}`, borderRadius: 10, padding: "2px 8px", transition: "all 0.15s" }}>{expanded ? "▴ Close" : "▾ Open"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Badge label={doc.fileType} /><Badge label={sizeLabel} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{fmtRelative(doc.createdAt)}</span>
        </div>
        {doc.summary && !expanded && <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.5, marginTop: 8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{doc.summary}</div>}
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.borderDefault}`, padding: "16px 18px" }}>
          {doc.summary && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Summary</div>
              <div style={{ background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 8, padding: "12px 14px" }}>{renderMarkdown(doc.summary)}</div>
            </div>
          )}
          {doc.content && (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => setShowContent(r => !r)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, textDecoration: "underline" }}>{showContent ? "Hide content" : "Show content"}</button>
              {showContent && <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, lineHeight: 1.6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 6, padding: "10px 14px", maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap" }}>{doc.content}</div>}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {confirmDelete ? (<><Btn variant="danger" size="sm" onClick={onDelete}>Confirm Delete</Btn><Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Btn></>) : (<Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>Delete</Btn>)}
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ask BC about this document</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && askBC()} placeholder="Summarize, find action items, ask anything..." disabled={aiLoading} style={{ flex: 1, background: C.bgAI, border: `1px solid ${C.borderAI}`, borderRadius: 6, padding: "7px 12px", color: C.textPrimary, fontFamily: FONT_SANS, fontSize: 13, outline: "none" }} />
            <button onClick={askBC} disabled={!customPrompt.trim() || aiLoading} style={{ background: customPrompt.trim() && !aiLoading ? C.gold : "transparent", border: `1px solid ${customPrompt.trim() && !aiLoading ? C.gold : C.borderAI}`, borderRadius: 6, padding: "7px 14px", cursor: customPrompt.trim() && !aiLoading ? "pointer" : "not-allowed", color: customPrompt.trim() && !aiLoading ? C.bgPrimary : C.textTertiary, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600 }}><Sparkles size={12} /></button>
          </div>
          <AIPanel response={aiResponse} loading={aiLoading} error={aiError} />
        </div>
      )}
    </div>
  );
}
