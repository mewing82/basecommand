// ─── Project Filter (shared across views) ────────────────────────────────────
import { useState, useEffect } from "react";
import { C, FONT_SANS, R } from "../lib/tokens";
import { store } from "../lib/storage";

export function useProjectLinks(projects) {
  const [linkMap, setLinkMap] = useState({});
  useEffect(() => {
    if (!projects || projects.length === 0) { setLinkMap({}); return; }
    Promise.all(projects.map(p => store.getLinks("project", p.id).then(links => ({ id: p.id, links })))).then(results => {
      const map = {};
      for (const { id, links } of results) { map[id] = new Set(links.map(l => l.id)); }
      setLinkMap(map);
    });
  }, [projects]);
  return linkMap;
}

export function ProjectFilterPills({ projects, filterProject, setFilterProject }) {
  if (!projects || projects.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }} role="group" aria-label="Filter by project">
      <button onClick={() => setFilterProject(null)} style={{
        padding: "5px 12px", borderRadius: R.md, cursor: "pointer",
        border: `1px solid ${filterProject === null ? C.borderSubtle : C.borderDefault}`,
        background: filterProject === null ? "rgba(255,255,255,0.08)" : "transparent",
        color: filterProject === null ? C.textPrimary : C.textSecondary,
        fontFamily: FONT_SANS, fontSize: 12, fontWeight: filterProject === null ? 600 : 400,
        transition: "all 0.15s ease",
      }} aria-pressed={filterProject === null}>All</button>
      {projects.map(p => (
        <button key={p.id} onClick={() => setFilterProject(filterProject === p.id ? null : p.id)} style={{
          padding: "5px 12px", borderRadius: R.md, cursor: "pointer",
          border: `1px solid ${filterProject === p.id ? C.borderSubtle : C.borderDefault}`,
          background: filterProject === p.id ? "rgba(255,255,255,0.08)" : "transparent",
          color: filterProject === p.id ? C.textPrimary : C.textSecondary,
          fontFamily: FONT_SANS, fontSize: 12, fontWeight: filterProject === p.id ? 600 : 400,
          transition: "all 0.15s ease", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }} aria-pressed={filterProject === p.id}>{p.title}</button>
      ))}
    </div>
  );
}

export function filterByProject(items, filterProject, linkMap) {
  if (!filterProject) return items;
  const ids = linkMap[filterProject];
  if (!ids) return items;
  return items.filter(item => ids.has(item.id));
}
