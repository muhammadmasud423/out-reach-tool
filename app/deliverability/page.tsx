"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { Shield, CheckCircle, XCircle, RefreshCw, Globe, AlertCircle, Plus, X, Lock, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Domain {
  id: string;
  domain: string;
  score: number;
  spf: boolean;
  dkim: boolean;
  dmarc: boolean;
  bounceRate: number;
  spamRate: number;
  added: string;
}

const DOM_KEY = "scalesynq_domains";
function load(): Domain[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DOM_KEY) || "[]"); } catch { return []; }
}
function save(d: Domain[]) { localStorage.setItem(DOM_KEY, JSON.stringify(d)); }

const scoreColor = (s: number) => s >= 85 ? "#10b981" : s >= 65 ? "#f59e0b" : "#ef4444";
const scoreLabel = (s: number) => s >= 85 ? "Excellent" : s >= 65 ? "Fair" : "Poor";

const lStyle: React.CSSProperties = { color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" };

export default function DeliverabilityPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "blacklist">("overview");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ domain: "", spf: false, dkim: false, dmarc: false });

  useEffect(() => { setDomains(load()); }, []);

  function addDomain() {
    if (!form.domain.trim()) return;
    const d: Domain = {
      id: Date.now().toString(),
      domain: form.domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
      score: form.spf && form.dkim && form.dmarc ? 72 : form.spf && form.dkim ? 58 : 40,
      spf: form.spf, dkim: form.dkim, dmarc: form.dmarc,
      bounceRate: 0,
      spamRate: 0,
      added: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    const updated = [...domains, d];
    setDomains(updated); save(updated);
    setShowModal(false);
    setForm({ domain: "", spf: false, dkim: false, dmarc: false });
  }

  function removeDomain(id: string) {
    const updated = domains.filter(d => d.id !== id);
    setDomains(updated); save(updated);
  }

  const avgScore = domains.length ? Math.round(domains.reduce((a, d) => a + d.score, 0) / domains.length) : 0;
  const authIssues = domains.filter(d => !d.spf || !d.dkim || !d.dmarc).length;

  return (
    <DashboardLayout title="Deliverability" subtitle="Monitor domain health, authentication, and sender reputation">
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Domains Monitored", value: domains.length, icon: Globe, color: "#6366f1", sub: "tracking" },
          { label: "Avg Domain Score", value: avgScore ? `${avgScore}/100` : "—", icon: Shield, color: avgScore ? scoreColor(avgScore) : "#64748b", sub: avgScore ? scoreLabel(avgScore) : "no domains yet" },
          { label: "Auth Issues", value: authIssues, icon: Lock, color: "#f59e0b", sub: "need attention" },
          { label: "Clean Domains", value: domains.filter(d => d.spf && d.dkim && d.dmarc).length, icon: CheckCircle, color: "#10b981", sub: "fully configured" },
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

      {/* Tabs + Add */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        {(["overview", "blacklist"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "7px 16px", borderRadius: 7, fontSize: "0.8rem", fontWeight: 600,
            border: "1px solid", cursor: "pointer",
            background: activeTab === tab ? "rgba(99,102,241,0.15)" : "transparent",
            borderColor: activeTab === tab ? "#6366f1" : "#252540",
            color: activeTab === tab ? "#a5b4fc" : "#64748b",
          }}>{tab === "overview" ? "Domain Overview" : "Blacklist Guide"}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", border: "none" }}>
          <Plus size={14} /> Add Domain
        </button>
      </div>

      {activeTab === "overview" && (
        domains.length === 0 ? (
          <div className="metric-card" style={{ padding: "60px 20px", textAlign: "center" }}>
            <Shield size={32} style={{ color: "#3b3b6b", marginBottom: 14 }} />
            <div style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>No domains added</div>
            <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 20 }}>Add your sending domain to monitor authentication and health.</div>
            <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, border: "none", cursor: "pointer" }}>
              <Plus size={14} /> Add Domain
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {domains.map(d => {
              const color = scoreColor(d.score);
              const allAuth = d.spf && d.dkim && d.dmarc;
              return (
                <div key={d.id} style={{ background: "#1a1a2e", border: `1px solid ${!allAuth ? "#f59e0b30" : "#252540"}`, borderRadius: 10, padding: "16px 20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 50px", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Globe size={14} style={{ color: "#64748b" }} />
                        <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "0.88rem" }}>{d.domain}</span>
                      </div>
                      <div style={{ color: "#64748b", fontSize: "0.68rem", marginTop: 2 }}>Added {d.added}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ background: "#252540", borderRadius: 999, height: 6, flex: 1, overflow: "hidden" }}>
                        <div style={{ width: `${d.score}%`, height: "100%", background: color, borderRadius: 999 }} />
                      </div>
                      <span style={{ color, fontWeight: 700, fontSize: "0.85rem", minWidth: 28 }}>{d.score}</span>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[["SPF", d.spf], ["DKIM", d.dkim], ["DMARC", d.dmarc]].map(([label, ok]) => (
                        <span key={label as string} style={{ fontSize: "0.6rem", fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: ok ? "#10b98120" : "#ef444420", color: ok ? "#10b981" : "#ef4444" }}>{label as string}</span>
                      ))}
                    </div>
                    <div>
                      <div style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.84rem" }}>{d.bounceRate}%</div>
                      <div style={{ color: "#64748b", fontSize: "0.68rem" }}>Bounce</div>
                    </div>
                    <div>
                      <div style={{ color: "#94a3b8", fontWeight: 600, fontSize: "0.84rem" }}>{d.spamRate}%</div>
                      <div style={{ color: "#64748b", fontSize: "0.68rem" }}>Spam</div>
                    </div>
                    <button onClick={() => removeDomain(d.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  {!allAuth && (
                    <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <AlertCircle size={14} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {!d.spf && <span>Missing <strong style={{ color: "#fcd34d" }}>SPF</strong> record. </span>}
                        {!d.dkim && <span>Missing <strong style={{ color: "#fcd34d" }}>DKIM</strong> signing. </span>}
                        {!d.dmarc && <span>Missing <strong style={{ color: "#fcd34d" }}>DMARC</strong> policy. </span>}
                        Set these up in your DNS to improve deliverability.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === "blacklist" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="metric-card">
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>How to Check Blacklists</div>
              <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Steps to verify your domain reputation</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { step: "1", title: "Check MXToolbox", desc: "Go to mxtoolbox.com/blacklists.aspx and enter your sending domain to check 100+ blacklists at once." },
                { step: "2", title: "Check Spamhaus", desc: "Visit spamhaus.org and run a lookup for your domain and IP address." },
                { step: "3", title: "Check Google Postmaster", desc: "Sign up at postmaster.google.com to monitor your Gmail-specific sender reputation." },
                { step: "4", title: "Fix authentication", desc: "Ensure SPF, DKIM, and DMARC are configured. Missing any of these is the #1 cause of spam filtering." },
                { step: "5", title: "Submit delisting requests", desc: "If listed, pause sending from that domain and submit a delisting request directly to the blacklist provider." },
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", gap: 12, padding: "10px 12px", background: "#13131f", borderRadius: 8, border: "1px solid #252540" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: "#6366f120", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "#818cf8" }}>{item.step}</div>
                  <div>
                    <div style={{ color: "#e2e8f0", fontSize: "0.8rem", fontWeight: 600 }}>{item.title}</div>
                    <div style={{ color: "#64748b", fontSize: "0.71rem", marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="metric-card">
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>Authentication Setup Guide</div>
              <div style={{ color: "#64748b", fontSize: "0.75rem" }}>DNS records to configure for your sending domain</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { name: "SPF", color: "#06b6d4", desc: "Specifies which servers can send email on behalf of your domain.", example: "v=spf1 include:_spf.yourdomain.com ~all", type: "TXT record" },
                { name: "DKIM", color: "#a855f7", desc: "Adds a cryptographic signature to prove emails haven't been tampered with.", example: "Add via your email provider (Google, Outlook, etc.)", type: "TXT record" },
                { name: "DMARC", color: "#10b981", desc: "Tells receiving servers what to do with emails that fail SPF/DKIM checks.", example: "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com", type: "TXT record at _dmarc" },
              ].map((r) => (
                <div key={r.name} style={{ padding: "12px 14px", background: "#13131f", borderRadius: 8, border: `1px solid ${r.color}20` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: r.color + "20", color: r.color }}>{r.name}</span>
                    <span style={{ color: "#64748b", fontSize: "0.68rem" }}>{r.type}</span>
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "0.75rem", marginBottom: 6 }}>{r.desc}</div>
                  <code style={{ display: "block", color: "#a5b4fc", fontSize: "0.7rem", background: "#252540", padding: "6px 10px", borderRadius: 5, wordBreak: "break-all" }}>{r.example}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#13131f", border: "1px solid #252540", borderRadius: 14, width: "100%", maxWidth: 400 }}>
            <div style={{ padding: "18px 22px", borderBottom: "1px solid #1e1e35", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#f1f5f9", fontWeight: 700 }}>Add Domain</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
            </div>
            <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lStyle}>Domain *</label>
                <input className="input-field" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} placeholder="yourdomain.com" autoFocus />
              </div>
              <div>
                <label style={lStyle}>Authentication Status</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[["spf", "SPF configured"], ["dkim", "DKIM configured"], ["dmarc", "DMARC configured"]].map(([k, lbl]) => (
                    <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.8rem", color: "#94a3b8" }}>
                      <input type="checkbox" checked={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.checked }))} style={{ accentColor: "#6366f1" }} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setShowModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #252540", background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>Cancel</button>
                <button onClick={addDomain} disabled={!form.domain.trim()} className={form.domain.trim() ? "btn-primary" : ""} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: form.domain.trim() ? undefined : "#252540", color: form.domain.trim() ? undefined : "#3b3b6b", cursor: form.domain.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.82rem" }}>Add Domain</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
