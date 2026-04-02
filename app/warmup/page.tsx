"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { Flame, Plus, Shield, Mail, Activity, RefreshCw, Play, Pause, Trash2, X, AlertCircle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface WarmupInbox {
  id: string;
  email: string;
  fromName: string;
  provider: "Gmail" | "Outlook" | "SMTP";
  status: "warming" | "ready" | "paused";
  score: number;
  dayStarted: string;
  dailyCap: number;
  sentToday: number;
  dkim: boolean;
  spf: boolean;
  dmarc: boolean;
}

const WARMUP_KEY = "scalesynq_warmup";
function load(): WarmupInbox[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WARMUP_KEY) || "[]"); } catch { return []; }
}
function save(d: WarmupInbox[]) { localStorage.setItem(WARMUP_KEY, JSON.stringify(d)); }

const scoreColor = (s: number) => s >= 90 ? "#10b981" : s >= 70 ? "#f59e0b" : "#ef4444";
const statusMap = {
  warming: { label: "Warming", cls: "badge-brand" },
  ready: { label: "Ready", cls: "badge-green" },
  paused: { label: "Paused", cls: "badge-cyan" },
};

const label: React.CSSProperties = { color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" };

export default function WarmupPage() {
  const [inboxes, setInboxes] = useState<WarmupInbox[]>([]);
  const [activeTab, setActiveTab] = useState<"pool" | "analytics">("pool");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: "", fromName: "", provider: "Gmail" as WarmupInbox["provider"], dailyCap: 30, dkim: false, spf: false, dmarc: false });

  useEffect(() => { setInboxes(load()); }, []);

  function addInbox() {
    if (!form.email.trim()) return;
    const inbox: WarmupInbox = {
      id: Date.now().toString(),
      email: form.email.trim(),
      fromName: form.fromName.trim() || form.email.split("@")[0],
      provider: form.provider,
      status: "warming",
      score: 40,
      dayStarted: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      dailyCap: form.dailyCap,
      sentToday: 0,
      dkim: form.dkim, spf: form.spf, dmarc: form.dmarc,
    };
    const updated = [...inboxes, inbox];
    setInboxes(updated); save(updated);
    setShowModal(false);
    setForm({ email: "", fromName: "", provider: "Gmail", dailyCap: 30, dkim: false, spf: false, dmarc: false });
  }

  function toggleStatus(id: string) {
    const updated = inboxes.map(i => {
      if (i.id !== id) return i;
      return { ...i, status: i.status === "paused" ? "warming" : "paused" } as WarmupInbox;
    });
    setInboxes(updated); save(updated);
  }

  function deleteInbox(id: string) {
    const updated = inboxes.filter(i => i.id !== id);
    setInboxes(updated); save(updated);
  }

  const avgScore = inboxes.length ? Math.round(inboxes.reduce((a, i) => a + i.score, 0) / inboxes.length) : 0;
  const readyCount = inboxes.filter(i => i.status === "ready").length;
  const totalSent = inboxes.reduce((a, i) => a + i.sentToday, 0);

  // Build a sample ramp chart from the inbox data
  const rampData = [1, 3, 5, 7, 10, 14, 18, 21].map((day, idx) => ({
    day: `Day ${day}`,
    target: Math.min(Math.round(5 * Math.pow(1.3, idx)), inboxes[0]?.dailyCap ?? 30),
  }));

  return (
    <DashboardLayout title="Email Warmup" subtitle="Build sender reputation and maximize inbox placement">
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Inboxes", value: inboxes.length, icon: Mail, color: "#6366f1", sub: `${readyCount} ready` },
          { label: "Avg Health Score", value: avgScore || "—", icon: Shield, color: "#10b981", sub: "out of 100" },
          { label: "Sent Today", value: totalSent, icon: Activity, color: "#06b6d4", sub: "across all inboxes" },
          { label: "Warming Active", value: inboxes.filter(i => i.status === "warming").length, icon: Flame, color: "#a855f7", sub: "in progress" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "#1a1a2e", border: "1px solid #252540", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.1rem" }}>{s.value}</div>
                <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{s.label}</div>
                <div style={{ color: "#94a3b8", fontSize: "0.68rem" }}>{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs + Actions */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16, gap: 8 }}>
        {(["pool", "analytics"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "7px 16px", borderRadius: 7, fontSize: "0.8rem", fontWeight: 600,
            border: "1px solid", cursor: "pointer",
            background: activeTab === tab ? "rgba(99,102,241,0.15)" : "transparent",
            borderColor: activeTab === tab ? "#6366f1" : "#252540",
            color: activeTab === tab ? "#a5b4fc" : "#64748b",
          }}>{tab === "pool" ? "Inbox Pool" : "Warmup Analytics"}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", border: "none" }}>
          <Plus size={14} /> Add Inbox
        </button>
      </div>

      {activeTab === "pool" && (
        inboxes.length === 0 ? (
          <div className="metric-card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <Flame size={32} style={{ color: "#3b3b6b", marginBottom: 14 }} />
            <div style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>No inboxes warming yet</div>
            <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 20 }}>Add an inbox to start building sender reputation.</div>
            <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, border: "none", cursor: "pointer" }}>
              <Plus size={14} /> Add Inbox
            </button>
          </div>
        ) : (
          <div className="metric-card" style={{ overflow: "hidden" }}>
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Inbox</th>
                  <th>Health Score</th>
                  <th>Status</th>
                  <th>Since</th>
                  <th>Daily Cap</th>
                  <th>Auth</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inboxes.map(inbox => {
                  const color = scoreColor(inbox.score);
                  const st = statusMap[inbox.status];
                  return (
                    <tr key={inbox.id}>
                      <td>
                        <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.84rem" }}>{inbox.email}</div>
                        <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{inbox.provider} · {inbox.fromName}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ background: "#252540", borderRadius: 999, height: 5, width: 60, overflow: "hidden" }}>
                            <div style={{ width: `${inbox.score}%`, height: "100%", background: color, borderRadius: 999 }} />
                          </div>
                          <span style={{ color, fontWeight: 700, fontSize: "0.82rem" }}>{inbox.score}/100</span>
                        </div>
                      </td>
                      <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td><span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{inbox.dayStarted}</span></td>
                      <td><span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{inbox.dailyCap}/day</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[["DKIM", inbox.dkim], ["SPF", inbox.spf], ["DMARC", inbox.dmarc]].map(([a, ok]) => (
                            <span key={a as string} style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: ok ? "#10b98120" : "#ef444420", color: ok ? "#10b981" : "#ef4444" }}>{a as string}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => toggleStatus(inbox.id)} title={inbox.status === "paused" ? "Resume" : "Pause"} style={{ background: "none", border: "none", cursor: "pointer", color: inbox.status === "paused" ? "#10b981" : "#f59e0b", padding: 3 }}>
                            {inbox.status === "paused" ? <Play size={13} /> : <Pause size={13} />}
                          </button>
                          <button onClick={() => deleteInbox(inbox.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 3 }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === "analytics" && (
        inboxes.length === 0 ? (
          <div className="metric-card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Add an inbox to see warmup analytics.</div>
          </div>
        ) : (
          <div className="metric-card">
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>Projected Warmup Ramp</div>
              <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Estimated daily send volume over 21 days</div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={rampData}>
                <defs>
                  <linearGradient id="rampGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #252540", borderRadius: 8, color: "#f1f5f9" }} />
                <Area type="monotone" dataKey="target" stroke="#6366f1" fill="url(#rampGrad)" strokeWidth={2} name="Target Volume" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
      )}

      {/* Add Inbox Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#13131f", border: "1px solid #252540", borderRadius: 14, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #1e1e35", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#f1f5f9", fontWeight: 700 }}>Add Inbox to Warmup</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 8, padding: "10px 14px", fontSize: "0.75rem", color: "#94a3b8" }}>
                Warmup gradually increases sending volume to build inbox reputation before launching campaigns.
              </div>
              <div>
                <label style={label}>Email Address *</label>
                <input className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@yourdomain.com" type="email" />
              </div>
              <div>
                <label style={label}>From Name</label>
                <input className="input-field" value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })} placeholder="Your Name" />
              </div>
              <div>
                <label style={label}>Provider</label>
                <select className="input-field" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value as WarmupInbox["provider"] })}>
                  <option value="Gmail">Gmail / Google Workspace</option>
                  <option value="Outlook">Microsoft Outlook</option>
                  <option value="SMTP">Custom SMTP</option>
                </select>
              </div>
              <div>
                <label style={label}>Target Daily Cap: {form.dailyCap} emails/day</label>
                <input type="range" min={10} max={200} step={5} value={form.dailyCap} onChange={e => setForm({ ...form, dailyCap: Number(e.target.value) })} style={{ width: "100%", accentColor: "#6366f1" }} />
                <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: 4 }}>Warmup will ramp up to this limit over 21 days.</div>
              </div>
              <div>
                <label style={label}>DNS Authentication</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[["dkim", "DKIM set up", form.dkim], ["spf", "SPF set up", form.spf], ["dmarc", "DMARC set up", form.dmarc]].map(([key, lbl, val]) => (
                    <label key={key as string} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.8rem", color: "#94a3b8" }}>
                      <input type="checkbox" checked={val as boolean} onChange={e => setForm({ ...form, [key as string]: e.target.checked })} style={{ accentColor: "#6366f1" }} />
                      {lbl as string}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #252540", background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>Cancel</button>
                <button onClick={addInbox} disabled={!form.email.trim()} className={form.email.trim() ? "btn-primary" : ""} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: form.email.trim() ? undefined : "#252540", color: form.email.trim() ? undefined : "#3b3b6b", cursor: form.email.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.82rem" }}>
                  Start Warmup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
