import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckSquare, Bot, History } from "lucide-react";
import { C, FONT_SANS } from "../lib/tokens";
import { useMediaQuery } from "../lib/useMediaQuery";
import { renewalStore } from "../lib/storage";
import { PageLayout } from "../components/layout/PageLayout";
import AgentQueue from "./tasks/AgentQueue";
import MyActions from "./tasks/MyActions";
import ExecutionLog from "./tasks/ExecutionLog";

// ─── Action Center (Main Component) ─────────────────────────────────────────
export default function Tasks() {
  const navigate = useNavigate();
  const { isMobile } = useMediaQuery();
  const [activeTab, setActiveTab] = useState("queue");

  // Shared data
  const [tasks, setTasks] = useState([]);
  const [agentActions, setAgentActions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [persona, setPersona] = useState(null);

  useEffect(() => {
    Promise.all([
      renewalStore.getTaskItems(),
      renewalStore.getAutopilotActions(),
      renewalStore.getAccounts(),
      renewalStore.getSettings(),
    ]).then(([taskItems, actions, accts, settings]) => {
      setTasks(taskItems);
      setAgentActions(actions);
      setAccounts(accts);
      setPersona(settings?.persona || null);
    });
  }, []);

  async function refreshAll() {
    setTasks(await renewalStore.getTaskItems());
    setAgentActions(await renewalStore.getAutopilotActions());
  }

  const pendingActions = agentActions.filter(a => a.status === "pending");

  const TABS = [
    { id: "queue", label: "Agent Queue", icon: Bot, count: pendingActions.length, color: pendingActions.length > 0 ? C.amber : C.textTertiary },
    { id: "actions", label: "My Actions", icon: CheckSquare, count: tasks.filter(t => t.status !== "complete").length },
    { id: "log", label: "Execution Log", icon: History },
  ];

  return (
    <PageLayout maxWidth={1000}>
      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 4, marginBottom: isMobile ? 16 : 24,
        background: C.bgCard, borderRadius: 10, padding: 4,
        border: `1px solid ${C.borderDefault}`,
        overflowX: isMobile ? "auto" : undefined,
        flexWrap: isMobile ? "nowrap" : undefined,
        WebkitOverflowScrolling: "touch",
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: isMobile ? "0 0 auto" : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: isMobile ? "10px 14px" : "10px 16px", borderRadius: 8, border: "none", cursor: "pointer",
              background: isActive ? "rgba(0,0,0,0.05)" : "transparent",
              color: isActive ? C.textPrimary : C.textSecondary,
              fontFamily: FONT_SANS, fontSize: 13, fontWeight: isActive ? 600 : 500,
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              <Icon size={15} strokeWidth={isActive ? 2 : 1.5} />
              {tab.label}
              {tab.count > 0 && (
                <span style={{
                  fontFamily: FONT_SANS, fontSize: 10, fontWeight: 700,
                  color: tab.color || C.textTertiary,
                  background: (tab.color || C.textTertiary) + "18",
                  padding: "1px 6px", borderRadius: 4, minWidth: 18, textAlign: "center",
                }}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "queue" && (
        <AgentQueue
          actions={pendingActions}
          onRefresh={refreshAll}
          navigate={navigate}
          isMobile={isMobile}
        />
      )}
      {activeTab === "actions" && (
        <MyActions
          tasks={tasks}
          setTasks={setTasks}
          accounts={accounts}
          persona={persona}
          navigate={navigate}
          isMobile={isMobile}
        />
      )}
      {activeTab === "log" && (
        <ExecutionLog isMobile={isMobile} />
      )}
    </PageLayout>
  );
}
