"use client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Mail, Plus, Trash2, CheckCircle, AlertCircle, Shield,
  Bell, Key, Eye, EyeOff, X, Lock, Info, Loader, Zap, Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";

interface ConnectedInbox {
  id: string;
  email: string;
  fromName: string;
  provider: "Gmail" | "Outlook" | "SMTP";
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  dailyLimit: number;
  warmup: boolean;
  status: "connected" | "error";
  connected: string;
  authType?: string;
}

const INBOX_KEY = "scalesynq_inboxes";
function load(): ConnectedInbox[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(INBOX_KEY) || "[]"); } catch { return []; }
}
function save(d: ConnectedInbox[]) { localStorage.setItem(INBOX_KEY, JSON.stringify(d)); }

const tabs = ["Inboxes", "AI", "Notifications", "Security"];

const lStyle: React.CSSProperties = { color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" };

const smtpDefaults: Record<string, { host: string; port: number }> = {
  Gmail: { host: "smtp.gmail.com", port: 587 },
  Outlook: { host: "smtp.office365.com", port: 587 },
  SMTP: { host: "", port: 587 },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Inboxes");
  const [inboxes, setInboxes] = useState<ConnectedInbox[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [form, setForm] = useState({
    email: "", fromName: "", provider: "Gmail" as ConnectedInbox["provider"],
    smtpHost: "smtp.gmail.com", smtpPort: 587, smtpUser: "", smtpPass: "",
    dailyLimit: 50, warmup: true,
  });

  useEffect(() => {
    setInboxes(load());
    setAnthropicKey(localStorage.getItem("anthropic_api_key") || "");
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function setProvider(p: ConnectedInbox["provider"]) {
    setForm(f => ({ ...f, provider: p, smtpHost: smtpDefaults[p].host, smtpPort: smtpDefaults[p].port }));
    setTestResult(null);
  }

  async function testConnection() {
    if (!form.smtpUser && !form.email) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: form.smtpHost,
          smtpPort: form.smtpPort,
          smtpUser: form.smtpUser || form.email,
          smtpPass: form.smtpPass,
        }),
      });
      const data = await res.json();
      setTestResult({ ok: data.ok, msg: data.ok ? "Connection successful! Your inbox is ready." : data.error });
    } catch {
      setTestResult({ ok: false, msg: "Network error — make sure the dev server is running." });
    } finally {
      setTesting(false);
    }
  }

  function connectInbox() {
    if (!form.email.trim()) return;
    const inbox: ConnectedInbox = {
      id: Date.now().toString(),
      email: form.email.trim(),
      fromName: form.fromName.trim() || form.email.split("@")[0],
      provider: form.provider,
      smtpHost: form.smtpHost,
      smtpPort: form.smtpPort,
      smtpUser: form.smtpUser || form.email,
      dailyLimit: form.dailyLimit,
      warmup: form.warmup,
      status: testResult?.ok ? "connected" : "error",
      connected: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    const updated = [...inboxes, inbox];
    setInboxes(updated); save(updated);
    if (form.smtpPass) {
      localStorage.setItem(`smtp_pass_${inbox.id}`, form.smtpPass);
    }
    setShowModal(false);
    setTestResult(null);
    setForm({ email: "", fromName: "", provider: "Gmail", smtpHost: "smtp.gmail.com", smtpPort: 587, smtpUser: "", smtpPass: "", dailyLimit: 50, warmup: true });
    setShowPass(false);
  }

  function removeInbox(id: string) {
    const updated = inboxes.filter(i => i.id !== id);
    setInboxes(updated); save(updated);
    localStorage.removeItem(`smtp_pass_${id}`);
  }

  function toggleWarmup(id: string) {
    const updated = inboxes.map(i => i.id === id ? { ...i, warmup: !i.warmup } : i);
    setInboxes(updated); save(updated);
  }

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account, inboxes, and preferences">
      {/* Mobile: stack vertically; Desktop: sidebar + content */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? 16 : 20,
        minHeight: isMobile ? "auto" : "calc(100vh - 160px)",
      }}>

        {/* Sidebar / Tab bar */}
        {isMobile ? (
          /* Horizontal scrollable tabs on mobile */
          <div style={{
            display: "flex",
            overflowX: "auto",
            gap: 6,
            paddingBottom: 4,
            WebkitOverflowScrolling: "touch" as any,
          }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flexShrink: 0,
                padding: "9px 18px",
                borderRadius: 20,
                border: activeTab === tab ? "1px solid #6366f1" : "1px solid #252540",
                background: activeTab === tab ? "rgba(99,102,241,0.12)" : "#0b2036",
                color: activeTab === tab ? "#a5b4fc" : "#64748b",
                fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                whiteSpace: "nowrap",
              }}>{tab}</button>
            ))}
          </div>
        ) : (
          /* Sidebar on desktop */
          <div style={{ width: 180, flexShrink: 0 }}>
            <div style={{ background: "#1a1a2e", border: "1px solid #252540", borderRadius: 10, overflow: "hidden" }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "11px 14px", textAlign: "left",
                  background: activeTab === tab ? "rgba(99,102,241,0.1)" : "transparent",
                  borderLeft: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
                  border: "none", borderBottom: "1px solid #252540",
                  color: activeTab === tab ? "#a5b4fc" : "#64748b",
                  fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                }}>{tab}</button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* ── Inboxes ── */}
          {activeTab === "Inboxes" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>Connected Inboxes</div>
                  <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{inboxes.length} inbox{inboxes.length !== 1 ? "es" : ""} connected</div>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, border: "none", cursor: "pointer" }}>
                  <Plus size={14} /> Connect Inbox
                </button>
              </div>

              {/* How-to banner */}
              <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "14px 18px", display: "flex", gap: 12 }}>
                <Info size={16} style={{ color: "#6366f1", flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.6 }}>
                  <strong style={{ color: "#a5b4fc" }}>To connect your email:</strong> enter your address and SMTP credentials below.
                  For <strong style={{ color: "#a5b4fc" }}>Gmail</strong>, use an <em>App Password</em> (not your Google password) — generate one at <code style={{ color: "#c4b5fd", background: "#252540", padding: "1px 5px", borderRadius: 3 }}>myaccount.google.com → Security → App passwords</code>.
                  For <strong style={{ color: "#a5b4fc" }}>Outlook</strong>, enable SMTP AUTH in your account settings first.
                  Your credentials are stored locally in your browser only.
                </div>
              </div>

              {inboxes.length === 0 ? (
                <div className="metric-card" style={{ padding: "50px 20px", textAlign: "center" }}>
                  <Mail size={32} style={{ color: "#3b3b6b", marginBottom: 14 }} />
                  <div style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>No inboxes connected yet</div>
                  <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 20 }}>Connect your outreach email to start launching campaigns.</div>
                  <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, border: "none", cursor: "pointer" }}>
                    <Plus size={14} /> Connect Inbox
                  </button>
                </div>
              ) : isMobile ? (
                /* Mobile: card list instead of table */
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {inboxes.map(inbox => (
                    <div key={inbox.id} className="metric-card" style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inbox.email}</div>
                          <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{inbox.fromName} · {inbox.provider}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          {inbox.status === "connected"
                            ? <CheckCircle size={14} style={{ color: "#10b981" }} />
                            : <AlertCircle size={14} style={{ color: "#ef4444" }} />}
                          <button onClick={() => removeInbox(inbox.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                        {inbox.authType === "oauth2" ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                            color: "#6ee7b7", fontSize: "0.7rem", fontWeight: 600,
                            padding: "2px 8px", borderRadius: 4,
                          }}>✓ OAuth2</span>
                        ) : (
                          <span style={{ color: "#64748b", fontSize: "0.72rem", fontFamily: "monospace" }}>{inbox.smtpHost}:{inbox.smtpPort}</span>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                          <span style={{ color: "#64748b", fontSize: "0.72rem" }}>Warmup</span>
                          <button onClick={() => toggleWarmup(inbox.id)} style={{
                            width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", position: "relative",
                            background: inbox.warmup ? "linear-gradient(90deg, #6366f1, #a855f7)" : "#252540", transition: "background 0.2s",
                          }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: inbox.warmup ? 18 : 2, transition: "left 0.2s" }} />
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#64748b", fontSize: "0.72rem", flexShrink: 0 }}>Daily limit:</span>
                        <input
                          type="number" min={1} max={500}
                          defaultValue={inbox.dailyLimit}
                          onBlur={e => {
                            const updated = inboxes.map(i => i.id === inbox.id ? { ...i, dailyLimit: Number(e.target.value) } : i);
                            setInboxes(updated); save(updated);
                          }}
                          style={{ background: "#13131f", border: "1px solid #252540", borderRadius: 6, color: "#e2e8f0", fontSize: "0.8rem", padding: "4px 8px", width: 70, outline: "none" }}
                        />
                        <span style={{ color: "#64748b", fontSize: "0.72rem" }}>emails/day</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop: table */
                <div className="metric-card" style={{ overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table" style={{ width: "100%", minWidth: 600 }}>
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Provider</th>
                          <th>SMTP Host</th>
                          <th>Status</th>
                          <th>Daily Limit</th>
                          <th>Warmup</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inboxes.map(inbox => (
                          <tr key={inbox.id}>
                            <td>
                              <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.84rem" }}>{inbox.email}</div>
                              <div style={{ color: "#64748b", fontSize: "0.7rem" }}>{inbox.fromName}</div>
                            </td>
                            <td><span style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{inbox.provider}</span></td>
                            <td>
                              {inbox.authType === "oauth2" ? (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                                  color: "#6ee7b7", fontSize: "0.7rem", fontWeight: 600,
                                  padding: "2px 8px", borderRadius: 4,
                                }}>✓ OAuth2 Connected</span>
                              ) : (
                                <span style={{ color: "#64748b", fontSize: "0.75rem", fontFamily: "monospace" }}>{inbox.smtpHost}:{inbox.smtpPort}</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                {inbox.status === "connected"
                                  ? <CheckCircle size={13} style={{ color: "#10b981" }} />
                                  : <AlertCircle size={13} style={{ color: "#ef4444" }} />}
                                <span style={{ color: inbox.status === "connected" ? "#10b981" : "#ef4444", fontSize: "0.78rem", fontWeight: 600, textTransform: "capitalize" }}>{inbox.status}</span>
                              </div>
                            </td>
                            <td>
                              <input
                                type="number" min={1} max={500}
                                defaultValue={inbox.dailyLimit}
                                onBlur={e => {
                                  const updated = inboxes.map(i => i.id === inbox.id ? { ...i, dailyLimit: Number(e.target.value) } : i);
                                  setInboxes(updated); save(updated);
                                }}
                                style={{ background: "#13131f", border: "1px solid #252540", borderRadius: 6, color: "#e2e8f0", fontSize: "0.8rem", padding: "4px 8px", width: 70, outline: "none" }}
                              />
                            </td>
                            <td>
                              <button onClick={() => toggleWarmup(inbox.id)} style={{
                                width: 38, height: 21, borderRadius: 11, border: "none", cursor: "pointer", position: "relative",
                                background: inbox.warmup ? "linear-gradient(90deg, #6366f1, #a855f7)" : "#252540", transition: "background 0.2s",
                              }}>
                                <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: inbox.warmup ? 19 : 2, transition: "left 0.2s" }} />
                              </button>
                            </td>
                            <td>
                              <button onClick={() => removeInbox(inbox.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── AI ── */}
          {activeTab === "AI" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>AI Configuration</div>
                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Configure your AI keys to power the AI Writer and smart features.</div>
              </div>

              <div className="metric-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(34,211,238,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Sparkles size={16} style={{ color: "#22d3ee" }} />
                  </div>
                  <div>
                    <div style={{ color: "#f1f5f9", fontSize: "0.88rem", fontWeight: 700 }}>Anthropic API Key</div>
                    <div style={{ color: "#64748b", fontSize: "0.72rem" }}>Used by AI Writer to generate cold email copy with Claude</div>
                  </div>
                </div>

                <div style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.18)", borderRadius: 8, padding: "10px 14px", fontSize: "0.75rem", color: "#94a3b8" }}>
                  Get your API key at <strong style={{ color: "#67e8f9" }}>console.anthropic.com → API Keys</strong>. Stored locally in your browser only.
                </div>

                <div>
                  <label style={lStyle}>API Key</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-field"
                      type={showApiKey ? "text" : "password"}
                      value={anthropicKey}
                      onChange={e => { setAnthropicKey(e.target.value); setApiKeySaved(false); }}
                      placeholder="sk-ant-api03-..."
                      style={{ paddingRight: 40 }}
                    />
                    <button onClick={() => setShowApiKey(!showApiKey)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                      {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem("anthropic_api_key", anthropicKey.trim());
                    setApiKeySaved(true);
                    setTimeout(() => setApiKeySaved(false), 2500);
                  }}
                  disabled={!anthropicKey.trim()}
                  className={anthropicKey.trim() ? "btn-primary" : ""}
                  style={{
                    alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 20px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600,
                    border: "none", cursor: anthropicKey.trim() ? "pointer" : "not-allowed",
                    background: !anthropicKey.trim() ? "#1e2235" : apiKeySaved ? "rgba(16,185,129,0.2)" : undefined,
                    color: !anthropicKey.trim() ? "#3b4a6b" : apiKeySaved ? "#10b981" : undefined,
                  }}
                >
                  {apiKeySaved ? <><CheckCircle size={13} /> Saved!</> : "Save API Key"}
                </button>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {activeTab === "Notifications" && (
            <div className="metric-card" style={{ padding: "16px 20px" }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem", marginBottom: 16 }}>Notification Preferences</div>
              {[
                { label: "New reply received", desc: "Get notified when a lead replies to your campaign", enabled: true },
                { label: "Bounce rate spike", desc: "Alert when any inbox exceeds 3% bounce rate", enabled: true },
                { label: "Campaign completed", desc: "Notify when all leads in a campaign have been contacted", enabled: false },
                { label: "Inbox warmup milestone", desc: "Notify when an inbox reaches warmup targets", enabled: true },
                { label: "Daily send summary", desc: "Morning digest of previous day's performance", enabled: false },
                { label: "Blacklist detection", desc: "Immediate alert if any domain gets blacklisted", enabled: true },
              ].map((notif, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "13px 0", borderBottom: "1px solid #252540" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#e2e8f0", fontSize: "0.82rem", fontWeight: 600 }}>{notif.label}</div>
                    <div style={{ color: "#64748b", fontSize: "0.72rem", marginTop: 2 }}>{notif.desc}</div>
                  </div>
                  <div style={{ width: 40, height: 22, borderRadius: 11, cursor: "pointer", background: notif.enabled ? "linear-gradient(90deg, #6366f1, #a855f7)" : "#252540", position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: notif.enabled ? 20 : 2 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Security ── */}
          {activeTab === "Security" && (
            <div className="metric-card" style={{ padding: "16px 20px" }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem", marginBottom: 14 }}>Security Settings</div>
              {[
                { icon: Lock, label: "Two-Factor Authentication", desc: "Add an extra layer of security", action: "Enable 2FA", color: "#10b981" },
                { icon: Shield, label: "Active Sessions", desc: "Manage where you're logged in", action: "Manage", color: "#6366f1" },
                { icon: Key, label: "Password", desc: "Update your account password", action: "Change", color: "#a855f7" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid #252540", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: item.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} style={{ color: item.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#e2e8f0", fontSize: "0.84rem", fontWeight: 600 }}>{item.label}</div>
                      <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{item.desc}</div>
                    </div>
                    <button style={{ padding: "8px 14px", borderRadius: 7, background: "rgba(99,102,241,0.1)", border: "1px solid #6366f130", color: "#a5b4fc", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                      {item.action}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Connect Inbox Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 100, padding: isMobile ? 0 : 20 }}>
          <div style={{
            background: "#13131f", border: "1px solid #252540",
            borderRadius: isMobile ? "16px 16px 0 0" : 16,
            width: "100%", maxWidth: isMobile ? "100%" : 500,
            maxHeight: isMobile ? "92vh" : "92vh",
            overflowY: "auto",
          }}>
            {/* Drag handle on mobile */}
            {isMobile && (
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#252540" }} />
              </div>
            )}

            <div style={{ padding: isMobile ? "12px 20px 16px" : "18px 24px", borderBottom: "1px solid #1e1e35", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem" }}>Connect Inbox</span>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 6 }}><X size={18} /></button>
            </div>

            <div style={{ padding: isMobile ? "16px 20px 32px" : "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Provider selector */}
              <div>
                <label style={lStyle}>Email Provider</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {(["Gmail", "Outlook", "SMTP"] as const).map(p => (
                    <button key={p} onClick={() => setProvider(p)} style={{
                      padding: isMobile ? "12px 8px" : "10px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                      border: `1px solid ${form.provider === p ? "#6366f1" : "#252540"}`,
                      background: form.provider === p ? "rgba(99,102,241,0.12)" : "#1a1a2e",
                      color: form.provider === p ? "#a5b4fc" : "#94a3b8",
                      fontSize: "0.82rem", fontWeight: 600,
                    }}>{p === "SMTP" ? "Custom" : p}</button>
                  ))}
                </div>
              </div>

              {form.provider === "Gmail" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)", borderRadius: 8, padding: "12px 14px", fontSize: "0.78rem", color: "#94a3b8" }}>
                    <strong style={{ color: "#22d3ee" }}>Easier: </strong>
                    Use{" "}
                    <button
                      type="button"
                      onClick={() => { window.location.href = "/api/auth/google"; }}
                      style={{ background: "none", border: "none", color: "#22d3ee", cursor: "pointer", fontWeight: 700, fontSize: "0.78rem", padding: 0, textDecoration: "underline" }}
                    >
                      Sign in with Gmail
                    </button>
                    {" "}on the login page to connect without an App Password.
                  </div>
                  <div style={{ background: "rgba(234,67,53,0.07)", border: "1px solid rgba(234,67,53,0.2)", borderRadius: 8, padding: "12px 14px", fontSize: "0.75rem", color: "#94a3b8" }}>
                    <strong style={{ color: "#fca5a5" }}>Or use an App Password:</strong> Go to{" "}
                    <code style={{ color: "#fca5a5", background: "#2d1a1a", padding: "1px 4px", borderRadius: 3 }}>myaccount.google.com → Security → App passwords</code>{" "}
                    and generate a password for "Mail".
                  </div>
                </div>
              )}

              {form.provider === "Outlook" && (
                <div style={{ background: "rgba(0,120,212,0.07)", border: "1px solid rgba(0,120,212,0.2)", borderRadius: 8, padding: "12px 14px", fontSize: "0.75rem", color: "#94a3b8" }}>
                  <strong style={{ color: "#93c5fd" }}>Outlook requires SMTP AUTH.</strong> Enable it in{" "}
                  <code style={{ color: "#93c5fd", background: "#0d1e30", padding: "1px 4px", borderRadius: 3 }}>admin.microsoft.com → Users → Mail → Manage email apps → Enable SMTP AUTH</code>.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={lStyle}>Email Address *</label>
                  <input className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@yourdomain.com" type="email" inputMode="email" autoCapitalize="none" />
                </div>
                <div>
                  <label style={lStyle}>From Name</label>
                  <input className="input-field" value={form.fromName} onChange={e => setForm(f => ({ ...f, fromName: e.target.value }))} placeholder="Your Name" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={lStyle}>SMTP Host</label>
                    <input className="input-field" value={form.smtpHost} onChange={e => setForm(f => ({ ...f, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" inputMode="url" autoCapitalize="none" />
                  </div>
                  <div>
                    <label style={lStyle}>SMTP Port</label>
                    <input className="input-field" value={form.smtpPort} onChange={e => setForm(f => ({ ...f, smtpPort: Number(e.target.value) }))} type="number" placeholder="587" inputMode="numeric" />
                  </div>
                </div>
                <div>
                  <label style={lStyle}>SMTP Username (usually your email)</label>
                  <input className="input-field" value={form.smtpUser || form.email} onChange={e => setForm(f => ({ ...f, smtpUser: e.target.value }))} placeholder="you@yourdomain.com" inputMode="email" autoCapitalize="none" />
                </div>
                <div>
                  <label style={lStyle}>{form.provider === "Gmail" ? "App Password" : "Password"}</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-field"
                      value={form.smtpPass}
                      onChange={e => setForm(f => ({ ...f, smtpPass: e.target.value }))}
                      type={showPass ? "text" : "password"}
                      placeholder={form.provider === "Gmail" ? "xxxx xxxx xxxx xxxx" : "Your email password"}
                      style={{ paddingRight: 44 }}
                    />
                    <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 6 }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: 4 }}>Stored locally in your browser only. Never sent to any server.</div>
                </div>
              </div>

              <div>
                <label style={lStyle}>Daily Send Limit: {form.dailyLimit} emails/day</label>
                <input type="range" min={10} max={300} step={10} value={form.dailyLimit} onChange={e => setForm(f => ({ ...f, dailyLimit: Number(e.target.value) }))} style={{ width: "100%", accentColor: "#6366f1" }} />
                <div style={{ color: "#64748b", fontSize: "0.7rem", marginTop: 3 }}>Recommended 30–100/day for cold outreach.</div>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <button onClick={() => setForm(f => ({ ...f, warmup: !f.warmup }))} style={{
                  width: 38, height: 21, borderRadius: 11, border: "none", cursor: "pointer", position: "relative",
                  background: form.warmup ? "linear-gradient(90deg, #6366f1, #a855f7)" : "#252540", transition: "background 0.2s", flexShrink: 0,
                }}>
                  <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: form.warmup ? 19 : 2, transition: "left 0.2s" }} />
                </button>
                <div>
                  <div style={{ color: "#e2e8f0", fontSize: "0.82rem", fontWeight: 600 }}>Enable Email Warmup</div>
                  <div style={{ color: "#64748b", fontSize: "0.7rem" }}>Gradually increases sending volume to build reputation</div>
                </div>
              </label>

              {testResult && (
                <div style={{
                  padding: "10px 14px", borderRadius: 8,
                  background: testResult.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                  border: `1px solid ${testResult.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  {testResult.ok
                    ? <CheckCircle size={15} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                    : <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />}
                  <span style={{ fontSize: "0.78rem", color: testResult.ok ? "#6ee7b7" : "#fca5a5" }}>{testResult.msg}</span>
                </div>
              )}

              {/* Action buttons — stack on mobile */}
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 10, paddingTop: 4 }}>
                <button
                  onClick={testConnection}
                  disabled={testing || !form.email.trim() || !form.smtpPass.trim()}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "11px 16px", borderRadius: 8,
                    border: "1px solid rgba(99,102,241,0.4)",
                    background: "rgba(99,102,241,0.08)",
                    color: (testing || !form.email.trim() || !form.smtpPass.trim()) ? "#3b3b6b" : "#a5b4fc",
                    cursor: (testing || !form.email.trim() || !form.smtpPass.trim()) ? "not-allowed" : "pointer",
                    fontWeight: 600, fontSize: "0.82rem", flex: isMobile ? undefined : 1,
                  }}
                >
                  {testing
                    ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Testing…</>
                    : <><Zap size={13} /> Test Connection</>}
                </button>
                <div style={{ display: "flex", gap: 10, flex: isMobile ? undefined : 1 }}>
                  <button onClick={() => { setShowModal(false); setTestResult(null); }} style={{ flex: 1, padding: "11px 18px", borderRadius: 8, border: "1px solid #252540", background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: "0.83rem" }}>Cancel</button>
                  <button onClick={connectInbox} disabled={!form.email.trim()} className={form.email.trim() ? "btn-primary" : ""} style={{ flex: 1, padding: "11px 22px", borderRadius: 8, border: "none", background: form.email.trim() ? undefined : "#252540", color: form.email.trim() ? undefined : "#3b3b6b", cursor: form.email.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "0.83rem" }}>
                    Save Inbox
                  </button>
                </div>
              </div>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
