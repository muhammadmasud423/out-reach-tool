"use client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus, Search, Upload, Download, Trash2, Mail,
  Users, Star, CheckSquare, Square, X, Building2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  status: "new" | "contacted" | "replied" | "interested" | "not-interested";
  tags: string[];
  created: string;
}

const LEADS_KEY = "scalesynq_leads";
function load(): Lead[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LEADS_KEY) || "[]"); } catch { return []; }
}
function save(d: Lead[]) { localStorage.setItem(LEADS_KEY, JSON.stringify(d)); }

const statusMap: Record<string, { label: string; cls: string }> = {
  new: { label: "New", cls: "badge-brand" },
  contacted: { label: "Contacted", cls: "badge-cyan" },
  replied: { label: "Replied", cls: "badge-green" },
  interested: { label: "Interested", cls: "badge-green" },
  "not-interested": { label: "Not Interested", cls: "badge-amber" },
};

const lStyle: React.CSSProperties = { color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" };

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", title: "", tagInput: "", tags: [] as string[] });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLeads(load()); }, []);

  const filtered = leads.filter(l => {
    const s = search.toLowerCase();
    const matchSearch = l.name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s) || l.company.toLowerCase().includes(s);
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function addLead() {
    if (!form.email.trim() || !form.name.trim()) return;
    const lead: Lead = {
      id: Date.now().toString(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      company: form.company.trim(),
      title: form.title.trim(),
      status: "new",
      tags: form.tags,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    const updated = [lead, ...leads];
    setLeads(updated); save(updated);
    setShowModal(false);
    setForm({ name: "", email: "", company: "", title: "", tagInput: "", tags: [] });
  }

  function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").slice(1); // skip header
      const newLeads: Lead[] = [];
      lines.forEach(line => {
        const cols = line.split(",").map(c => c.replace(/"/g, "").trim());
        const email = cols.find(c => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c));
        if (!email) return;
        newLeads.push({
          id: Date.now().toString() + Math.random(),
          name: cols[0] || email.split("@")[0],
          email,
          company: cols[2] || "",
          title: cols[1] || "",
          status: "new",
          tags: [],
          created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        });
      });
      const updated = [...newLeads.filter(n => !leads.some(l => l.email === n.email)), ...leads];
      setLeads(updated); save(updated);
    };
    reader.readAsText(file);
  }

  function exportCSV() {
    const rows = [["Name","Email","Company","Title","Status","Tags","Created"], ...leads.map(l => [l.name, l.email, l.company, l.title, l.status, l.tags.join(";"), l.created])];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "leads.csv"; a.click();
  }

  function deleteLead(id: string) {
    const updated = leads.filter(l => l.id !== id);
    setLeads(updated); save(updated);
    setSelected(prev => prev.filter(x => x !== id));
  }

  function deleteSelected() {
    const updated = leads.filter(l => !selected.includes(l.id));
    setLeads(updated); save(updated);
    setSelected([]);
  }

  const allSelected = filtered.length > 0 && filtered.every(l => selected.includes(l.id));
  const toggleAll = () => allSelected ? setSelected([]) : setSelected(filtered.map(l => l.id));

  function addTag() {
    const t = form.tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t], tagInput: "" }));
    else setForm(f => ({ ...f, tagInput: "" }));
  }

  return (
    <DashboardLayout title="Leads" subtitle="Manage your lead database and track engagement">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a1a2e", border: "1px solid #252540", borderRadius: 8, padding: "8px 12px", flex: 1, maxWidth: 300 }}>
          <Search size={13} style={{ color: "#64748b" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…" style={{ background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: "0.82rem", width: "100%" }} />
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["all", "new", "contacted", "replied", "interested"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "6px 12px", borderRadius: 7, fontSize: "0.75rem", fontWeight: 600,
              border: "1px solid", cursor: "pointer",
              background: filterStatus === s ? "rgba(99,102,241,0.15)" : "transparent",
              borderColor: filterStatus === s ? "#6366f1" : "#252540",
              color: filterStatus === s ? "#a5b4fc" : "#64748b",
              textTransform: "capitalize",
            }}>{s}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {selected.length > 0 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{selected.length} selected</span>
            <button onClick={deleteSelected} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "1px solid #ef444430", color: "#fca5a5", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
        <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #252540", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
          <Download size={13} /> Export
        </button>
        <button onClick={() => fileRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #252540", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
          <Upload size={13} /> Import CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} style={{ display: "none" }} />
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", border: "none" }}>
          <Plus size={14} /> Add Lead
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Total Leads", value: leads.length, color: "#6366f1", icon: Users },
          { label: "New", value: leads.filter(l => l.status === "new").length, color: "#06b6d4", icon: Mail },
          { label: "Contacted", value: leads.filter(l => l.status === "contacted").length, color: "#a855f7", icon: Mail },
          { label: "Interested", value: leads.filter(l => l.status === "interested" || l.status === "replied").length, color: "#10b981", icon: Star },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "#1a1a2e", border: "1px solid #252540", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={13} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem" }}>{s.value}</div>
                <div style={{ color: "#64748b", fontSize: "0.68rem" }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="metric-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <Users size={32} style={{ color: "#3b3b6b", marginBottom: 14 }} />
          <div style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>No leads yet</div>
          <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 20 }}>Add leads manually or import a CSV file.</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button onClick={() => fileRef.current?.click()} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "1px solid #252540", background: "#1a1a2e", color: "#94a3b8", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
              <Upload size={13} /> Import CSV
            </button>
            <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, border: "none", cursor: "pointer" }}>
              <Plus size={14} /> Add Lead
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="metric-card" style={{ padding: "30px", textAlign: "center" }}>
          <div style={{ color: "#64748b", fontSize: "0.82rem" }}>No leads match your filter.</div>
        </div>
      ) : (
        <div className="metric-card" style={{ overflow: "hidden" }}>
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <button onClick={toggleAll} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
                    {allSelected ? <CheckSquare size={14} style={{ color: "#6366f1" }} /> : <Square size={14} />}
                  </button>
                </th>
                <th>Lead</th>
                <th>Company</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const st = statusMap[lead.status];
                const isSel = selected.includes(lead.id);
                return (
                  <tr key={lead.id} style={{ background: isSel ? "rgba(99,102,241,0.05)" : "transparent" }}>
                    <td>
                      <button onClick={() => setSelected(prev => isSel ? prev.filter(x => x !== lead.id) : [...prev, lead.id])} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex" }}>
                        {isSel ? <CheckSquare size={14} style={{ color: "#6366f1" }} /> : <Square size={14} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.84rem" }}>{lead.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.7rem" }}>{lead.title}</div>
                      <div style={{ color: "#64748b", fontSize: "0.68rem" }}>{lead.email}</div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 4, background: "#252540", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Building2 size={10} style={{ color: "#64748b" }} />
                        </div>
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{lead.company || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        value={lead.status}
                        onChange={e => {
                          const updated = leads.map(l => l.id === lead.id ? { ...l, status: e.target.value as Lead["status"] } : l);
                          setLeads(updated); save(updated);
                        }}
                        style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer", color: "#94a3b8", fontSize: "0.78rem" }}
                      >
                        {Object.entries(statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {lead.tags.map(t => (
                          <span key={t} style={{ background: "#252540", color: "#94a3b8", fontSize: "0.6rem", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "0.73rem" }}>{lead.created}</td>
                    <td>
                      <button onClick={() => deleteLead(lead.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lead Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#13131f", border: "1px solid #252540", borderRadius: 14, width: "100%", maxWidth: 420 }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #1e1e35", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#f1f5f9", fontWeight: 700 }}>Add Lead</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lStyle}>Full Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" autoFocus />
              </div>
              <div>
                <label style={lStyle}>Email *</label>
                <input className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" type="email" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lStyle}>Company</label>
                  <input className="input-field" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Inc" />
                </div>
                <div>
                  <label style={lStyle}>Title</label>
                  <input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="CEO" />
                </div>
              </div>
              <div>
                <label style={lStyle}>Tags</label>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <input className="input-field" value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="e.g. SaaS" style={{ flex: 1 }} />
                  <button onClick={addTag} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #252540", background: "#1a1a2e", color: "#a5b4fc", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Add</button>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {form.tags.map(t => (
                    <span key={t} style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#a5b4fc", fontSize: "0.7rem", padding: "2px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 4 }}>
                      {t}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #252540", background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>Cancel</button>
                <button onClick={addLead} disabled={!form.name.trim() || !form.email.trim()} className={(form.name.trim() && form.email.trim()) ? "btn-primary" : ""} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: (form.name.trim() && form.email.trim()) ? undefined : "#252540", color: (form.name.trim() && form.email.trim()) ? undefined : "#3b3b6b", cursor: (form.name.trim() && form.email.trim()) ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.82rem" }}>Add Lead</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
