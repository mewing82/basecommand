import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Sparkles, Plus, Send, X, ChevronDown, FileText, Type, Image, Trash2, Eye, Upload, Pencil, ShieldAlert, Mail, TrendingUp, Calendar, Activity, AlertTriangle } from "lucide-react";
import { C, FONT_SANS, FONT_BODY, FONT_MONO, fs } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore } from "../lib/storage";
import { callAI } from "../lib/ai";
import { PageLayout } from "../components/layout/PageLayout";
import { renderMarkdown, Btn, Input, Modal, FormField } from "../components/ui/index";
import { computePortfolioHealth, getSeverity, ARCHETYPES } from "../lib/healthScore";
import { formatARR } from "../lib/utils";

function AddAccountModal({ onClose, onCreate, isMobile }) {
  const [name, setName] = useState(""); const [arr, setArr] = useState(""); const [renewalDate, setRenewalDate] = useState(""); const [riskLevel, setRiskLevel] = useState("medium");
  function handleSubmit() { if (!name.trim() || !arr || !renewalDate) return; onCreate({ name, arr, renewalDate, riskLevel }); }
  const riskColors = { low: C.green, medium: C.amber, high: C.red };
  return (
    <Modal title="Add Account" onClose={onClose} width={isMobile ? "calc(100vw - 32px)" : 480}>
      <FormField label="Account Name" required><Input value={name} onChange={setName} placeholder="Company name" onKeyDown={e => e.key === "Enter" && handleSubmit()} /></FormField>
      <FormField label="ARR" required>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textTertiary, fontFamily: FONT_MONO, fontSize: 14 }}>$</span>
          <input type="number" value={arr} onChange={e => setArr(e.target.value)} placeholder="187000" onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 14, padding: "10px 12px 10px 28px", outline: "none", boxSizing: "border-box" }} />
        </div>
      </FormField>
      <FormField label="Renewal Date" required>
        <input type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} style={{ width: "100%", background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 8, color: C.textPrimary, fontFamily: FONT_MONO, fontSize: 14, padding: "10px 12px", outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
      </FormField>
      <FormField label="Risk Level">
        <div style={{ display: "flex", gap: 8 }}>
          {["low", "medium", "high"].map(level => (<button key={level} onClick={() => setRiskLevel(level)} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${riskLevel === level ? riskColors[level] + "60" : C.borderDefault}`, background: riskLevel === level ? riskColors[level] + "14" : "transparent", color: riskLevel === level ? riskColors[level] : C.textSecondary, fontFamily: FONT_SANS, fontSize: 13, fontWeight: riskLevel === level ? 600 : 500, textTransform: "capitalize" }}>{level}</button>))}
        </div>
      </FormField>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={handleSubmit} disabled={!name.trim() || !arr || !renewalDate}>Add Account</Btn></div>
    </Modal>
  );
}

export default function Accounts() {
  const { isMobile } = useMediaQuery();
  const location = useLocation();
  const [accounts, setAccounts] = useState([]);
  const [mobilePane, setMobilePane] = useState("list");
  useEffect(() => { renewalStore.getAccounts().then(setAccounts); }, []);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const selectedAccount = selectedAccountId ? accounts.find(a => a.id === selectedAccountId) || null : null;
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  async function handleUpdateAccount(updated) {
    await renewalStore.saveAccount(updated);
    setAccounts(await renewalStore.getAccounts());
    setEditingAccount(null);
  }

  async function handleDeleteAccount(id) {
    await renewalStore.deleteAccount(id);
    setAccounts(await renewalStore.getAccounts());
    if (selectedAccountId === id) setSelectedAccountId(null);
    setConfirmDeleteId(null);
  }

  useEffect(() => {
    if (location.state?.accountId) {
      setSelectedAccountId(location.state.accountId);
      if (isMobile) setMobilePane("chat");
    }
  }, [location.state?.accountId]);

  async function handleCreateAccount(data) {
    const account = { id: `acct-${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, name: data.name.trim(), arr: parseFloat(data.arr) || 0, renewalDate: data.renewalDate, riskLevel: data.riskLevel || "medium", contacts: [], summary: "", tags: [], lastActivity: new Date().toISOString(), createdAt: new Date().toISOString() };
    await renewalStore.saveAccount(account); setAccounts(await renewalStore.getAccounts());
    setShowAddAccount(false); setSelectedAccountId(account.id); if (isMobile) setMobilePane("chat");
  }

  const [activeThreadId, setActiveThreadId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showThreadList, setShowThreadList] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [contextItems, setContextItems] = useState([]);
  const [showTextPaste, setShowTextPaste] = useState(false);
  const [pasteLabel, setPasteLabel] = useState(""); const [pasteSource, setPasteSource] = useState("manual"); const [pasteContent, setPasteContent] = useState("");
  const messagesEndRef = useRef(null); const inputRef = useRef(null); const csvInputRef = useRef(null); const imgInputRef = useRef(null);

  useEffect(() => {
    if (!selectedAccount) { setThreads([]); setActiveThreadId(null); setMessages([]); setContextItems([]); return; }
    (async () => {
      const acctThreads = await renewalStore.getThreads(selectedAccount.id); setThreads(acctThreads);
      if (acctThreads.length > 0) { const sorted = [...acctThreads].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)); setActiveThreadId(sorted[0].id); }
      else { setActiveThreadId(null); setMessages([]); }
      setShowThreadList(false); setContextItems(await renewalStore.getContext(selectedAccount.id));
    })();
  }, [selectedAccount?.id]);

  useEffect(() => { if (!activeThreadId) { setMessages([]); return; } renewalStore.getMessages(activeThreadId).then(setMessages); }, [activeThreadId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (selectedAccount && activeThreadId) inputRef.current?.focus(); }, [selectedAccount?.id, activeThreadId]);

  async function refreshContext() { if (selectedAccount) setContextItems(await renewalStore.getContext(selectedAccount.id)); }
  async function createThread(firstMessage) {
    const thread = { id: `thread_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, title: firstMessage ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "") : "New conversation", createdAt: new Date().toISOString(), lastMessageAt: new Date().toISOString() };
    await renewalStore.addThread(selectedAccount.id, thread); setThreads(await renewalStore.getThreads(selectedAccount.id)); setActiveThreadId(thread.id); setMessages([]); setShowThreadList(false); return thread;
  }
  async function deleteThread(threadId) { await renewalStore.deleteThread(selectedAccount.id, threadId); const remaining = await renewalStore.getThreads(selectedAccount.id); setThreads(remaining); if (activeThreadId === threadId) { if (remaining.length > 0) { setActiveThreadId([...remaining].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt))[0].id); } else { setActiveThreadId(null); setMessages([]); } } }
  async function deleteContextItem(itemId) { await renewalStore.deleteContextItem(selectedAccount.id, itemId); refreshContext(); }

  function handleCSVUpload(e) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { const text = ev.target.result; const lines = text.split("\n").filter(l => l.trim()); await renewalStore.addContextItem(selectedAccount.id, { id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, accountId: selectedAccount.id, type: "csv", label: file.name, source: "manual", content: text, metadata: { rows: Math.max(0, lines.length - 1), words: text.split(/\s+/).length, size: (file.size / 1024).toFixed(1) + " KB" }, uploadedAt: new Date().toISOString() }); refreshContext(); }; reader.readAsText(file); e.target.value = ""; }
  async function handleTextPasteSave() { if (!pasteContent.trim()) return; await renewalStore.addContextItem(selectedAccount.id, { id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, accountId: selectedAccount.id, type: "text", label: pasteLabel.trim() || "Pasted text", source: pasteSource, content: pasteContent, metadata: { words: pasteContent.trim().split(/\s+/).length, size: (new Blob([pasteContent]).size / 1024).toFixed(1) + " KB" }, uploadedAt: new Date().toISOString() }); refreshContext(); setPasteLabel(""); setPasteSource("manual"); setPasteContent(""); setShowTextPaste(false); }
  function handleImageUpload(e) { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { await renewalStore.addContextItem(selectedAccount.id, { id: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, accountId: selectedAccount.id, type: "image", label: file.name, source: "manual", content: ev.target.result, metadata: { size: (file.size / 1024).toFixed(1) + " KB", mimeType: file.type }, uploadedAt: new Date().toISOString() }); refreshContext(); }; reader.readAsDataURL(file); e.target.value = ""; }

  async function buildCoPilotSystemPrompt() {
    const acct = selectedAccount; const items = await renewalStore.getContext(acct.id);
    const daysToRenewal = acct.renewalDate ? Math.ceil((new Date(acct.renewalDate) - new Date()) / 86400000) : null;
    const contextSummary = items.length === 0 ? "No context items ingested yet." : items.map(ci => ci.type === "image" ? `[IMAGE] ${ci.label}` : `[${ci.type?.toUpperCase()}] ${ci.label}: ${ci.content?.slice(0, 800)}`).join("\n\n");
    return `You are a Renewal Co-Pilot inside Base Command.\n\nACCOUNT:\n- Name: ${acct.name}\n- ARR: $${(acct.arr || 0).toLocaleString()}\n- Renewal: ${acct.renewalDate || "Not set"}${daysToRenewal !== null ? ` (${daysToRenewal} days)` : ""}\n- Risk: ${acct.riskLevel}\n\nINGESTED DATA (${items.length}):\n${contextSummary}\n\nToday: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}\n\nCAPABILITIES: Email drafting, conversation prep, risk analysis, pricing strategies, next best actions, contract analysis, stakeholder mapping.\n\nGUIDELINES: Be direct and actionable. Reference account data. Use markdown. **Bold** key points.`;
  }

  async function handleSend() {
    const text = input.trim(); if (!text || sending) return; setInput(""); setSending(true);
    let threadId = activeThreadId; if (!threadId) { const thread = await createThread(text); threadId = thread.id; }
    const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
    await renewalStore.addMessage(threadId, userMsg); setMessages(prev => [...prev, userMsg]);
    const currentThreads = await renewalStore.getThreads(selectedAccount.id);
    const updatedThreads = currentThreads.map(t => t.id !== threadId ? t : { ...t, ...(messages.filter(m => m.role === "user").length === 0 ? { title: text.slice(0, 50) } : {}), lastMessageAt: new Date().toISOString() });
    await renewalStore.saveThreads(selectedAccount.id, updatedThreads); setThreads(updatedThreads);
    try {
      const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const response = await callAI(apiMessages, await buildCoPilotSystemPrompt(), 4000);
      const assistantMsg = { role: "assistant", content: response.toString(), timestamp: new Date().toISOString() };
      await renewalStore.addMessage(threadId, assistantMsg); setMessages(prev => [...prev, assistantMsg]);
    } catch (err) { const errorMsg = { role: "assistant", content: `**Error:** ${err.message}`, timestamp: new Date().toISOString(), isError: true }; await renewalStore.addMessage(threadId, errorMsg); setMessages(prev => [...prev, errorMsg]); }
    setSending(false);
  }

  const contextByType = { csv: [], text: [], image: [] }; contextItems.forEach(ci => { if (contextByType[ci.type]) contextByType[ci.type].push(ci); else contextByType.text.push(ci); });
  const typeConfig = { csv: { icon: FileText, label: "CSV Data", color: C.green }, text: { icon: Type, label: "Text / Notes", color: C.amber }, image: { icon: Image, label: "Screenshots", color: C.aiBlue } };

  return (
    <PageLayout maxWidth={1200}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <Btn variant="primary" onClick={() => setShowAddAccount(true)} size="sm"><Plus size={14} /> Add Account</Btn>
      </div>

      {accounts.length === 0 ? (
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 12, padding: 32, minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.goldMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><MessageSquare size={28} style={{ color: C.gold }} /></div>
          <div><h2 style={{ fontFamily: FONT_SANS, fontSize: 20, fontWeight: 600, color: C.textPrimary, margin: "0 0 4px", textAlign: "center" }}>No Accounts Yet</h2>
            <p style={{ fontFamily: FONT_MONO, fontSize: 12, letterSpacing: "0.01em", opacity: 0.8, color: C.textTertiary, maxWidth: 360, lineHeight: 1.5, margin: "8px 0 0", textAlign: "center" }}>Add your first account to start working with the Account Intelligence co-pilot.</p></div>
          <Btn variant="primary" onClick={() => setShowAddAccount(true)}><Plus size={14} /> Add Account</Btn>
        </div>
      ) : (<>
        {isMobile && (
          <div style={{ background: C.bgCard, borderRadius: 8, padding: 3, display: "flex", gap: 2, marginBottom: 12 }}>
            {[{ key: "list", label: "Accounts" }, { key: "chat", label: "Chat" }, { key: "context", label: "Context" }].map(tab => (
              <button key={tab.key} onClick={() => setMobilePane(tab.key)} style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: FONT_SANS, background: mobilePane === tab.key ? C.gold : "transparent", color: mobilePane === tab.key ? "#fff" : C.textSecondary }}>{tab.label}</button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 0, minHeight: isMobile ? 0 : 500, height: isMobile ? "calc(100vh - 352px)" : "calc(100vh - 280px)" }}>
          {/* Account list sidebar */}
          {(!isMobile || mobilePane === "list") && (
          <div style={{ width: isMobile ? "100%" : 240, flexShrink: 0, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: isMobile ? 12 : "12px 0 0 12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.borderDefault}`, fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textSecondary }}>Accounts ({accounts.length})</div>
            <div style={{ flex: 1, overflow: "auto" }}>
              {accounts.map(account => {
                const selected = selectedAccount?.id === account.id; const rc = { high: C.red, medium: C.amber, low: C.green };
                return (<button key={account.id} onClick={() => { setSelectedAccountId(account.id); if (isMobile) setMobilePane("chat"); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", textAlign: "left", background: selected ? "rgba(255,255,255,0.07)" : "transparent", border: "none", borderLeft: `3px solid ${selected ? C.gold : "transparent"}`, transition: "all 0.12s" }}
                  onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: rc[account.riskLevel] || C.textTertiary }} />
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: FONT_SANS, fontSize: 14, fontWeight: selected ? 600 : 500, color: selected ? C.textPrimary : C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{account.name}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary, marginTop: 2 }}>${(account.arr || 0).toLocaleString()}</div></div>
                </button>);
              })}
            </div>
          </div>
          )}

          {/* Chat area */}
          {(!isMobile || mobilePane === "chat") && (
          <div style={{ flex: 1, background: C.bgCard, borderTop: `1px solid ${C.borderDefault}`, borderBottom: `1px solid ${C.borderDefault}`, ...(isMobile ? { border: `1px solid ${C.borderDefault}`, borderRadius: 12 } : showContext ? {} : { borderRight: `1px solid ${C.borderDefault}`, borderRadius: "0 12px 12px 0" }), display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {selectedAccount ? (<>
              {/* Account header */}
              <div style={{ padding: isMobile ? "10px 14px" : "12px 20px", borderBottom: `1px solid ${C.borderDefault}`, display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 8 : 12, flexShrink: 0, flexWrap: isMobile ? "wrap" : "nowrap" }}>
                <h2 style={{ fontFamily: FONT_SANS, fontSize: isMobile ? 15 : 17, fontWeight: 600, color: C.textPrimary, margin: 0, flex: isMobile ? "1 1 100%" : 1 }}>{selectedAccount.name}</h2>
                <div style={{ display: "flex", gap: isMobile ? 6 : 8, alignItems: "center", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                  {[{ label: `$${(selectedAccount.arr || 0).toLocaleString()}`, color: C.textPrimary }, { label: selectedAccount.renewalDate || "No date", color: C.textSecondary }, { label: selectedAccount.riskLevel, color: { high: C.red, medium: C.amber, low: C.green }[selectedAccount.riskLevel] }].map((chip, i) => (
                    <span key={i} style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, color: chip.color, background: C.bgPrimary, padding: "3px 10px", borderRadius: 4, border: `1px solid ${C.borderDefault}`, textTransform: "capitalize" }}>{chip.label}</span>
                  ))}
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, color: C.aiBlue, background: C.aiBlueMuted, padding: "3px 10px", borderRadius: 4 }}>Co-Pilot</span>
                  <button onClick={() => setEditingAccount({ ...selectedAccount })} title="Edit account" style={{ display: "flex", alignItems: "center", padding: "3px 6px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 4, cursor: "pointer", color: C.textTertiary, transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = C.textPrimary} onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}><Pencil size={12} /></button>
                  <button onClick={() => setConfirmDeleteId(selectedAccount.id)} title="Delete account" style={{ display: "flex", alignItems: "center", padding: "3px 6px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 4, cursor: "pointer", color: C.textTertiary, transition: "color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.color = C.red} onMouseLeave={e => e.currentTarget.style.color = C.textTertiary}><Trash2 size={12} /></button>
                  {!isMobile && <button onClick={() => setShowContext(!showContext)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 10px", background: showContext ? "rgba(255,255,255,0.07)" : "transparent", border: `1px solid ${showContext ? C.aiBlue + "40" : C.borderDefault}`, borderRadius: 4, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 11, fontWeight: 500, color: showContext ? C.aiBlue : C.textTertiary }}><Eye size={12} /> Context{contextItems.length > 0 ? ` (${contextItems.length})` : ""}</button>}
                </div>
              </div>
              {/* Thread bar */}
              <div style={{ padding: isMobile ? "8px 14px" : "8px 20px", borderBottom: `1px solid ${C.borderDefault}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: C.bgPrimary }}>
                <button onClick={() => setShowThreadList(!showThreadList)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: showThreadList ? "rgba(255,255,255,0.07)" : "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: C.textSecondary }}>
                  <MessageSquare size={13} />{activeThreadId ? (threads.find(t => t.id === activeThreadId)?.title || "Conversation") : "No conversation"}<ChevronDown size={12} style={{ transform: showThreadList ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
                <div style={{ flex: 1 }} />
                <button onClick={() => createThread()} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", background: "transparent", border: `1px solid ${C.borderDefault}`, borderRadius: 6, cursor: "pointer", fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: C.textSecondary }}><Plus size={13} /> New</button>
                {threads.length > 0 && <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textTertiary }}>{threads.length} thread{threads.length !== 1 ? "s" : ""}</span>}
              </div>
              {/* Thread list dropdown */}
              {showThreadList && threads.length > 0 && (
                <div style={{ borderBottom: `1px solid ${C.borderDefault}`, background: C.bgPrimary, maxHeight: 200, overflow: "auto", flexShrink: 0 }}>
                  {[...threads].sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt)).map(thread => {
                    const isActive = thread.id === activeThreadId;
                    return (<div key={thread.id} onClick={() => { setActiveThreadId(thread.id); setShowThreadList(false); }} style={{ display: "flex", alignItems: "center", padding: "8px 20px", gap: 8, background: isActive ? "rgba(255,255,255,0.05)" : "transparent", cursor: "pointer", borderLeft: `2px solid ${isActive ? C.aiBlue : "transparent"}` }}>
                      <MessageSquare size={12} style={{ color: isActive ? C.aiBlue : C.textTertiary, flexShrink: 0 }} />
                      <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: isActive ? C.textPrimary : C.textSecondary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{thread.title}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>{new Date(thread.lastMessageAt || thread.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                      <button onClick={e => { e.stopPropagation(); deleteThread(thread.id); }} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: C.textTertiary, display: "flex", opacity: 0.5 }}><X size={12} /></button>
                    </div>);
                  })}
                </div>
              )}
              {/* Messages */}
              <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "12px 14px" : "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {!activeThreadId && messages.length === 0 && (
                  <AccountIntelPanel account={selectedAccount} contextItems={contextItems} onStartChat={(prompt) => { setInput(prompt); inputRef.current?.focus(); }} />
                )}
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: msg.role === "user" ? C.goldMuted : C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {msg.role === "user" ? <span style={{ fontFamily: FONT_SANS, fontSize: 11, fontWeight: 700, color: C.gold }}>M</span> : <Sparkles size={13} style={{ color: C.aiBlue }} />}
                    </div>
                    <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: 10, background: msg.role === "user" ? C.bgElevated : C.bgAI, border: `1px solid ${msg.role === "user" ? C.borderSubtle : C.borderAI}`, ...(msg.isError ? { borderColor: C.red + "40" } : {}) }}>
                      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textPrimary, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}</div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary, marginTop: 5, textAlign: msg.role === "user" ? "right" : "left" }}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                ))}
                {sending && <div style={{ display: "flex", gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: C.aiBlueMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><Sparkles size={13} style={{ color: C.aiBlue }} /></div><div style={{ padding: "10px 14px", borderRadius: 10, background: C.bgAI, border: `1px solid ${C.borderAI}` }}><div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textTertiary, animation: "aiPulse 1.5s ease-in-out infinite" }}>Thinking...</div></div></div>}
                <div ref={messagesEndRef} />
              </div>
              {/* Input */}
              <div style={{ padding: isMobile ? "10px 14px" : "12px 20px", borderTop: `1px solid ${C.borderDefault}`, flexShrink: 0, background: C.bgPrimary }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={`Ask about ${selectedAccount.name}...`} disabled={sending}
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 8, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, outline: "none" }}
                    onFocus={e => e.target.style.borderColor = C.aiBlue} onBlur={e => e.target.style.borderColor = C.borderDefault} />
                  <button onClick={handleSend} disabled={sending || !input.trim()} style={{ padding: "10px 16px", borderRadius: 8, border: "none", cursor: sending || !input.trim() ? "default" : "pointer", background: sending || !input.trim() ? C.bgElevated : `linear-gradient(135deg, ${C.gold}, ${C.aiBlue})`, color: sending || !input.trim() ? C.textTertiary : "#fff", fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, opacity: sending || !input.trim() ? 0.5 : 1 }}><Send size={14} /> Send</button>
                </div>
              </div>
            </>) : (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 12 }}><MessageSquare size={32} style={{ color: C.textTertiary, opacity: 0.5 }} /><p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textTertiary }}>Select an account to start working</p></div>)}
          </div>
          )}

          {/* Context Panel */}
          {(isMobile ? mobilePane === "context" && selectedAccount : showContext && selectedAccount) && (
            <div style={{ width: isMobile ? "100%" : 300, flexShrink: 0, background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderLeft: isMobile ? `1px solid ${C.borderDefault}` : "none", borderRadius: isMobile ? 12 : "0 12px 12px 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.borderDefault}`, display: "flex", alignItems: "center", gap: 8 }}>
                <Eye size={14} style={{ color: C.aiBlue }} /><span style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: C.textPrimary, flex: 1 }}>Account Context</span>
                {!isMobile && <button onClick={() => setShowContext(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textTertiary, display: "flex", padding: 2 }}><X size={14} /></button>}
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Summary */}
                <div style={{ background: C.bgPrimary, borderRadius: 8, padding: 12, border: `1px solid ${C.borderDefault}` }}>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>Summary</div>
                  {(() => { const dtr = selectedAccount.renewalDate ? Math.ceil((new Date(selectedAccount.renewalDate) - new Date()) / 86400000) : null; return (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[{ label: "ARR", value: `$${(selectedAccount.arr || 0).toLocaleString()}` }, { label: "Renewal", value: selectedAccount.renewalDate || "Not set" }, ...(dtr !== null ? [{ label: "Days Out", value: `${dtr} days`, color: dtr <= 30 ? C.red : dtr <= 60 ? C.amber : C.textPrimary }] : []), { label: "Risk", value: selectedAccount.riskLevel, color: { high: C.red, medium: C.amber, low: C.green }[selectedAccount.riskLevel] }, { label: "Threads", value: String(threads.length) }, { label: "Context", value: `${contextItems.length} item${contextItems.length !== 1 ? "s" : ""}` }].map((row, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary }}>{row.label}</span><span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 500, color: row.color || C.textPrimary, textTransform: "capitalize" }}>{row.value}</span></div>
                      ))}
                    </div>
                  ); })()}
                </div>
                {/* Add Context buttons */}
                <div>
                  <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 8 }}>Add Context</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input ref={csvInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSVUpload} />
                    <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
                    {[{ label: "CSV", icon: FileText, color: C.green, onClick: () => csvInputRef.current?.click() }, { label: "Text", icon: Type, color: C.amber, onClick: () => setShowTextPaste(true) }, { label: "Image", icon: Image, color: C.aiBlue, onClick: () => imgInputRef.current?.click() }].map((btn, i) => (
                      <button key={i} onClick={btn.onClick} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 8, cursor: "pointer", background: "transparent", border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 11, fontWeight: 500, transition: "all 0.12s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = btn.color + "60"; e.currentTarget.style.color = btn.color; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; }}>
                        <btn.icon size={16} />{btn.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Text paste form */}
                {showTextPaste && (
                  <div style={{ background: C.bgPrimary, borderRadius: 8, padding: 12, border: `1px solid ${C.amber}30` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}><span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: C.amber }}>Paste Text</span><button onClick={() => setShowTextPaste(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: C.textTertiary, display: "flex", padding: 2 }}><X size={12} /></button></div>
                    <input value={pasteLabel} onChange={e => setPasteLabel(e.target.value)} placeholder="Label (e.g. Gong call notes)" style={{ width: "100%", padding: "6px 10px", borderRadius: 6, marginBottom: 6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                    <select value={pasteSource} onChange={e => setPasteSource(e.target.value)} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, marginBottom: 6, background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textSecondary, fontFamily: FONT_BODY, fontSize: 12, outline: "none", boxSizing: "border-box" }}>
                      <option value="manual">Manual</option><option value="gong">Gong</option><option value="salesforce">Salesforce</option><option value="quickbase">Quickbase</option><option value="slack">Slack</option><option value="email">Email</option><option value="other">Other</option>
                    </select>
                    <textarea value={pasteContent} onChange={e => setPasteContent(e.target.value)} placeholder="Paste content here..." rows={5} style={{ width: "100%", padding: "6px 10px", borderRadius: 6, marginBottom: 8, resize: "vertical", background: C.bgCard, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 12, outline: "none", boxSizing: "border-box", lineHeight: 1.5 }} />
                    <button onClick={handleTextPasteSave} disabled={!pasteContent.trim()} style={{ width: "100%", padding: "7px 0", borderRadius: 6, border: "none", cursor: pasteContent.trim() ? "pointer" : "default", background: pasteContent.trim() ? C.amber : C.bgElevated, color: pasteContent.trim() ? "#000" : C.textTertiary, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, opacity: pasteContent.trim() ? 1 : 0.5 }}>Save Context</button>
                  </div>
                )}
                {/* Context items */}
                {contextItems.length === 0 && !showTextPaste && (<div style={{ textAlign: "center", padding: "20px 0" }}><Upload size={20} style={{ color: C.textTertiary, opacity: 0.4, marginBottom: 8 }} /><p style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textTertiary, margin: 0, lineHeight: 1.5 }}>No context loaded yet.</p></div>)}
                {["csv", "text", "image"].map(type => {
                  const items = contextByType[type]; if (items.length === 0) return null; const cfg = typeConfig[type]; const TypeIcon = cfg.icon;
                  return (<div key={type}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><TypeIcon size={13} style={{ color: cfg.color }} /><span style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span><span style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>({items.length})</span></div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {items.map(item => (<div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.bgPrimary, borderRadius: 6, border: `1px solid ${C.borderDefault}` }}>
                        {type === "image" && item.content && <img src={item.content} alt={item.label} style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textPrimary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>{item.source !== "manual" && <span style={{ textTransform: "capitalize" }}>{item.source} · </span>}{item.metadata?.rows != null && `${item.metadata.rows} rows · `}{item.metadata?.words != null && `${item.metadata.words} words · `}{item.metadata?.size || ""}</div></div>
                        <button onClick={() => deleteContextItem(item.id)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: C.textTertiary, display: "flex", opacity: 0.4 }} onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}><Trash2 size={12} /></button>
                      </div>))}
                    </div>
                  </div>);
                })}
              </div>
            </div>
          )}
        </div>
      </>)}

      {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} onCreate={handleCreateAccount} isMobile={isMobile} />}

      {/* Edit Account Modal */}
      {editingAccount && (
        <Modal onClose={() => setEditingAccount(null)} title="Edit Account">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField label="Account Name">
              <Input value={editingAccount.name} onChange={e => setEditingAccount(prev => ({ ...prev, name: e.target.value }))} />
            </FormField>
            <FormField label="ARR">
              <Input type="number" value={editingAccount.arr || ""} onChange={e => setEditingAccount(prev => ({ ...prev, arr: parseFloat(e.target.value) || 0 }))} />
            </FormField>
            <FormField label="Renewal Date">
              <Input type="date" value={editingAccount.renewalDate || ""} onChange={e => setEditingAccount(prev => ({ ...prev, renewalDate: e.target.value }))} style={{ colorScheme: "dark" }} />
            </FormField>
            <FormField label="Risk Level">
              <div style={{ display: "flex", gap: 6 }}>
                {["low", "medium", "high"].map(level => {
                  const rc = { low: C.green, medium: C.amber, high: C.red };
                  return (
                    <button key={level} onClick={() => setEditingAccount(prev => ({ ...prev, riskLevel: level }))} style={{
                      flex: 1, padding: "8px", borderRadius: 6, cursor: "pointer", textTransform: "capitalize",
                      border: `1px solid ${editingAccount.riskLevel === level ? rc[level] + "60" : C.borderDefault}`,
                      background: editingAccount.riskLevel === level ? rc[level] + "14" : "transparent",
                      color: editingAccount.riskLevel === level ? rc[level] : C.textTertiary,
                      fontFamily: FONT_SANS, fontSize: 13, fontWeight: editingAccount.riskLevel === level ? 600 : 400,
                    }}>{level}</button>
                  );
                })}
              </div>
            </FormField>
            <FormField label="Summary / Notes">
              <textarea value={editingAccount.summary || ""} onChange={e => setEditingAccount(prev => ({ ...prev, summary: e.target.value }))}
                rows={3} style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${C.borderDefault}`, color: C.textPrimary, fontFamily: FONT_BODY, fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </FormField>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <Btn variant="ghost" onClick={() => setEditingAccount(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={() => handleUpdateAccount(editingAccount)}>Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <Modal onClose={() => setConfirmDeleteId(null)} title="Delete Account">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textSecondary, lineHeight: 1.6, margin: 0 }}>
              This will permanently delete <strong style={{ color: C.textPrimary }}>{accounts.find(a => a.id === confirmDeleteId)?.name}</strong> and all its context data, conversations, and associated actions. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={() => handleDeleteAccount(confirmDeleteId)}>Delete Account</Btn>
            </div>
          </div>
        </Modal>
      )}
    </PageLayout>
  );
}

// ─── Account Intelligence Panel (replaces blank co-pilot state) ──────────────
function AccountIntelPanel({ account, contextItems, onStartChat }) {
  const navigate = useNavigate();
  const daysToRenewal = account.renewalDate ? Math.ceil((new Date(account.renewalDate) - new Date()) / 86400000) : null;
  const isAtRisk = account.riskLevel === "high";
  const isUpcoming = daysToRenewal !== null && daysToRenewal >= 0 && daysToRenewal <= 90;
  const isOverdue = daysToRenewal !== null && daysToRenewal < 0;
  const riskColors = { high: C.red, medium: C.amber, low: C.green };

  // Extract key signals from summary
  const signals = [];
  const summary = account.summary || "";
  if (summary.includes("left") || summary.includes("departed") || summary.includes("resigned")) signals.push({ icon: AlertTriangle, text: "Champion departure detected", color: C.red });
  if (summary.includes("competitor") || summary.includes("evaluating") || summary.includes("alternative")) signals.push({ icon: AlertTriangle, text: "Competitive threat identified", color: C.red });
  if (summary.includes("support ticket") || summary.includes("escalation") || summary.includes("frustrated")) signals.push({ icon: AlertTriangle, text: "Support issues flagged", color: C.amber });
  if (summary.includes("expansion") || summary.includes("additional") || summary.includes("more seats")) signals.push({ icon: TrendingUp, text: "Expansion opportunity", color: C.green });
  if (summary.includes("advocate") || summary.includes("referred") || summary.includes("champion")) signals.push({ icon: TrendingUp, text: "Strong internal champion", color: C.green });
  if (summary.includes("budget") || summary.includes("discount") || summary.includes("cost")) signals.push({ icon: AlertTriangle, text: "Budget sensitivity", color: C.amber });

  // Recommended actions based on account state — all pass accountId for focused mode
  const aid = account.id;
  const actions = [];
  if (isAtRisk || isOverdue) {
    actions.push({ label: "Generate Rescue Plan", icon: ShieldAlert, color: C.red, onClick: () => navigate(`/app/agents/renewal/rescue-planner?accountId=${aid}`) });
    actions.push({ label: "Draft Re-engagement Email", icon: Mail, color: C.amber, onClick: () => navigate(`/app/agents/renewal/outreach-drafter?accountId=${aid}`) });
  }
  if (isUpcoming && !isAtRisk) {
    actions.push({ label: "Build Renewal Playbook", icon: Calendar, color: C.gold, onClick: () => navigate(`/app/agents/coaching/playbook-builder?accountId=${aid}`) });
    actions.push({ label: "Draft Renewal Outreach", icon: Mail, color: C.aiBlue, onClick: () => navigate(`/app/agents/renewal/outreach-drafter?accountId=${aid}`) });
  }
  if (!isAtRisk && account.riskLevel === "low") {
    actions.push({ label: "Find Expansion Opportunities", icon: TrendingUp, color: C.green, onClick: () => navigate(`/app/agents/growth/expansion-scout?accountId=${aid}`) });
    actions.push({ label: "Draft Check-in Email", icon: Mail, color: C.aiBlue, onClick: () => navigate(`/app/agents/renewal/outreach-drafter?accountId=${aid}`) });
  }
  if (account.riskLevel === "medium") {
    actions.push({ label: "Analyze Risk Signals", icon: Activity, color: C.amber, onClick: () => navigate(`/app/agents/renewal/health-monitor?accountId=${aid}`) });
    actions.push({ label: "Draft Outreach", icon: Mail, color: C.aiBlue, onClick: () => navigate(`/app/agents/renewal/outreach-drafter?accountId=${aid}`) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "8px 0", flex: 1, overflow: "auto" }}>
      {/* Quick stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        <div style={{ padding: "12px 14px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${C.borderDefault}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>ARR</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: C.textPrimary }}>{formatARR(account.arr)}</div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${C.borderDefault}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Renewal</div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 18, fontWeight: 700, color: isOverdue ? C.red : daysToRenewal <= 30 ? C.amber : C.textPrimary }}>
            {daysToRenewal !== null ? (isOverdue ? `${Math.abs(daysToRenewal)}d overdue` : `${daysToRenewal}d`) : "—"}
          </div>
        </div>
        <div style={{ padding: "12px 14px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${riskColors[account.riskLevel]}20` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Risk</div>
          <div style={{ fontFamily: FONT_SANS, fontSize: 16, fontWeight: 700, color: riskColors[account.riskLevel], textTransform: "capitalize" }}>{account.riskLevel}</div>
        </div>
      </div>

      {/* AI Signals */}
      {signals.length > 0 && (
        <div style={{ padding: "12px 14px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${C.borderDefault}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Key Signals</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {signals.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <s.icon size={12} style={{ color: s.color, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {account.summary && (
        <div style={{ padding: "12px 14px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${C.borderDefault}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Account Summary</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSecondary, lineHeight: 1.6 }}>{account.summary}</div>
        </div>
      )}

      {/* Contacts */}
      {account.contacts?.length > 0 && (
        <div style={{ padding: "12px 14px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${C.borderDefault}` }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Contacts</div>
          {account.contacts.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < account.contacts.length - 1 ? 6 : 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: C.goldMuted, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, fontSize: 10, fontWeight: 600, color: C.gold, flexShrink: 0 }}>
                {(c.name || "?")[0]}
              </div>
              <div>
                <div style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500, color: C.textPrimary }}>{c.name}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textTertiary }}>{c.role || c.email || ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Actions */}
      <div style={{ padding: "12px 14px", borderRadius: 8, background: `${C.aiBlue}06`, border: `1px solid ${C.aiBlue}15` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Sparkles size={12} style={{ color: C.aiBlue }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.aiBlue, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Recommended Actions</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {actions.map((a, i) => (
            <button key={i} onClick={a.onClick} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textSecondary, fontFamily: FONT_SANS, fontSize: 12, fontWeight: 500,
              transition: "all 0.12s", textAlign: "left",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = a.color + "60"; e.currentTarget.style.color = C.textPrimary; e.currentTarget.style.background = a.color + "08"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.background = "transparent"; }}
            >
              <a.icon size={14} style={{ color: a.color, flexShrink: 0 }} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Co-Pilot quick prompts */}
      <div style={{ padding: "12px 14px", borderRadius: 8, background: C.bgPrimary, border: `1px solid ${C.borderDefault}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <MessageSquare size={12} style={{ color: C.gold }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Ask Co-Pilot</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            "What are the biggest risks for this account?",
            "Draft a renewal outreach email",
            "What's my best expansion play?",
            "Summarize recent activity",
          ].map((prompt, i) => (
            <button key={i} onClick={() => onStartChat(prompt)} style={{
              padding: "6px 10px", borderRadius: 6, cursor: "pointer",
              background: "transparent", border: `1px solid ${C.borderDefault}`,
              color: C.textTertiary, fontFamily: FONT_BODY, fontSize: 11,
              textAlign: "left", transition: "all 0.12s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "40"; e.currentTarget.style.color = C.textSecondary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderDefault; e.currentTarget.style.color = C.textTertiary; }}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
