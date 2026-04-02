"use client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus, Search, Play, Pause, Trash2, Copy, Mail, Users,
  Eye, Reply, Clock, X, ChevronRight, ChevronLeft, Upload,
  Check, AlertCircle, Zap, Loader, Send
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  tags: string[];
  status: "draft" | "active" | "paused" | "completed";
  leads: string[];          // email addresses
  subject: string;
  body: string;
  fromEmail: string;
  dailyLimit: number;
  sendWindow: string;
  created: string;
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
}

const STORAGE_KEY = "scalesynq_campaigns";
const INBOX_KEY = "scalesynq_inboxes";

interface ConnectedInbox {
  id: string; email: string; fromName: string; provider: string;
  smtpHost: string; smtpPort: number; smtpUser: string;
  dailyLimit: number;
}

function loadInboxes(): ConnectedInbox[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(INBOX_KEY) || "[]"); } catch { return []; }
}

function loadCampaigns(): Campaign[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCampaigns(campaigns: Campaign[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
}

const statusColors: Record<string, string> = {
  active: "badge-green",
  paused: "badge-amber",
  draft: "badge-brand",
  completed: "badge-cyan",
};

// ─── Wizard Steps ─────────────────────────────────────────────────────────────
const STEPS = ["Basic Info", "Add Leads", "Email Content", "Settings", "Review"];

const DEFAULT_BODY = `Hi {{first_name}},

I came across {{company}} and was impressed by what you're building.

I'd love to share how we've helped similar companies achieve [specific result].

Would you be open to a quick 15-minute call this week?

Best,
{{sender_name}}`;

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sending, setSending] = useState<{ id: string; progress: number; total: number; error?: string } | null>(null);

  // Wizard form state
  const [name, setName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [leadsText, setLeadsText] = useState("");
  const [leadsError, setLeadsError] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(DEFAULT_BODY);
  const [fromEmail, setFromEmail] = useState("");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [sendWindow, setSendWindow] = useState("09:00–17:00");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCampaigns(loadCampaigns());
  }, []);

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Parse leads from textarea ──
  function parseLeads(text: string): string[] {
    return text
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  }

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      // extract anything that looks like an email
      const emails = (text.match(/[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+/g) || [])
        .map(e => e.toLowerCase());
      setLeadsText(prev => {
        const existing = new Set(parseLeads(prev));
        const merged = [...existing, ...emails.filter(e => !existing.has(e))];
        return merged.join("\n");
      });
    };
    reader.readAsText(file);
  }

  // ── Step validation ──
  function canProceed(): boolean {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return parseLeads(leadsText).length > 0;
    if (step === 2) return subject.trim().length > 0 && body.trim().length > 0;
    if (step === 3) return fromEmail.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail);
    return true;
  }

  function handleNext() {
    if (step === 1) {
      const count = parseLeads(leadsText).length;
      if (count === 0) { setLeadsError("No valid email addresses found."); return; }
      setLeadsError("");
    }
    setStep(s => s + 1);
  }

  function handleLaunch(asDraft = false) {
    const leads = parseLeads(leadsText);
    const campaign: Campaign = {
      id: Date.now().toString(),
      name: name.trim(),
      tags,
      status: asDraft ? "draft" : "active",
      leads,
      subject,
      body,
      fromEmail,
      dailyLimit,
      sendWindow,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sent: 0,
      opened: 0,
      replied: 0,
      bounced: 0,
    };
    const updated = [campaign, ...campaigns];
    setCampaigns(updated);
    saveCampaigns(updated);
    resetWizard();
  }

  async function sendCampaign(campaignId: string) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const inboxes = loadInboxes();
    const inbox = inboxes.find(i => i.email.toLowerCase() === campaign.fromEmail.toLowerCase());

    if (!inboxes.length) {
      setSending({ id: campaignId, progress: 0, total: 0, error: "No inboxes connected. Go to Settings → Inboxes to connect your email first." });
      return;
    }
    if (!inbox) {
      setSending({ id: campaignId, progress: 0, total: 0, error: `No connected inbox found for "${campaign.fromEmail}". Go to Settings → Inboxes to connect it, or check the from email matches exactly.` });
      return;
    }

    // Get SMTP password from localStorage (stored separately for security)
    const passKey = `smtp_pass_${inbox.id}`;
    const smtpPass = localStorage.getItem(passKey) || "";
    if (!smtpPass) {
      setSending({ id: campaignId, progress: 0, total: 0, error: "SMTP password not found. Please reconnect this inbox in Settings (you'll need to re-enter your password)." });
      return;
    }

    // Only send to leads that haven't been sent to yet
    const unsent = campaign.leads.slice(campaign.sent);
    const toSend = unsent.slice(0, campaign.dailyLimit);
    const total = toSend.length;

    if (total === 0) {
      setSending({ id: campaignId, progress: 0, total: 0, error: "All leads have already been sent to." });
      return;
    }

    setSending({ id: campaignId, progress: 0, total });

    let successCount = 0;
    let bounceCount = 0;

    for (let i = 0; i < toSend.length; i++) {
      const toEmail = toSend[i];
      const firstName = toEmail.split("@")[0].split(".")[0];
      const firstName2 = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      const personalizedSubject = campaign.subject
        .replace(/\{\{first_name\}\}/g, firstName2)
        .replace(/\{\{company\}\}/g, toEmail.split("@")[1]?.split(".")[0] ?? "your company");
      const personalizedBody = campaign.body
        .replace(/\{\{first_name\}\}/g, firstName2)
        .replace(/\{\{company\}\}/g, toEmail.split("@")[1]?.split(".")[0] ?? "your company")
        .replace(/\{\{sender_name\}\}/g, inbox.fromName);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtpHost: inbox.smtpHost,
            smtpPort: inbox.smtpPort,
            smtpUser: inbox.smtpUser,
            smtpPass,
            fromEmail: inbox.email,
            fromName: inbox.fromName,
            toEmail,
            subject: personalizedSubject,
            body: personalizedBody,
          }),
        });
        const data = await res.json();
        if (data.ok) successCount++;
        else bounceCount++;
      } catch {
        bounceCount++;
      }

      setSending({ id: campaignId, progress: i + 1, total });

      // Small delay between sends to avoid rate limiting (1-3 seconds)
      if (i < toSend.length - 1) {
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
      }
    }

    // Update campaign stats
    const updated = campaigns.map(c => c.id === campaignId ? {
      ...c,
      sent: c.sent + successCount + bounceCount,
      bounced: c.bounced + bounceCount,
      status: (c.sent + successCount + bounceCount >= c.leads.length ? "completed" : "active") as Campaign["status"],
    } : c);
    setCampaigns(updated);
    saveCampaigns(updated);
    setSending({ id: campaignId, progress: total, total, error: `Done! ${successCount} sent${bounceCount > 0 ? `, ${bounceCount} failed` : ""}.` });
  }

  function resetWizard() {
    setShowWizard(false);
    setStep(0);
    setName(""); setTagInput(""); setTags([]);
    setLeadsText(""); setLeadsError("");
    setSubject(""); setBody(DEFAULT_BODY);
    setFromEmail(""); setDailyLimit(50); setSendWindow("09:00–17:00");
  }

  function toggleStatus(id: string) {
    const updated = campaigns.map(c => {
      if (c.id !== id) return c;
      return { ...c, status: c.status === "active" ? "paused" : "active" } as Campaign;
    });
    setCampaigns(updated);
    saveCampaigns(updated);
  }

  function duplicateCampaign(id: string) {
    const original = campaigns.find(c => c.id === id);
    if (!original) return;
    const copy: Campaign = {
      ...original,
      id: Date.now().toString(),
      name: original.name + " (Copy)",
      status: "draft",
      sent: 0, opened: 0, replied: 0, bounced: 0,
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    const updated = [copy, ...campaigns];
    setCampaigns(updated);
    saveCampaigns(updated);
  }

  function deleteCampaign(id: string) {
    const updated = campaigns.filter(c => c.id !== id);
    setCampaigns(updated);
    saveCampaigns(updated);
    setDeleteConfirm(null);
  }

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }

  const leadCount = parseLeads(leadsText).length;

  return (
    <DashboardLayout title="Campaigns" subtitle="Manage and monitor all your outreach campaigns">

      {/* Actions bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#1a1a2e", border: "1px solid #252540",
          borderRadius: 8, padding: "8px 12px", flex: 1, maxWidth: 320,
        }}>
          <Search size={14} style={{ color: "#64748b" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            style={{ background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: "0.83rem", width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {["all", "active", "paused", "draft", "completed"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: "7px 14px", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600,
              border: "1px solid", cursor: "pointer",
              background: filterStatus === s ? "rgba(99,102,241,0.15)" : "transparent",
              borderColor: filterStatus === s ? "#6366f1" : "#252540",
              color: filterStatus === s ? "#a5b4fc" : "#64748b",
              textTransform: "capitalize",
            }}>{s}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <button className="btn-primary" onClick={() => setShowWizard(true)} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 18px", borderRadius: 8, fontSize: "0.82rem",
          fontWeight: 600, cursor: "pointer", border: "none",
        }}>
          <Plus size={14} />
          New Campaign
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Campaigns", value: campaigns.length, icon: Mail, color: "#6366f1" },
          { label: "Emails Sent", value: campaigns.reduce((a, c) => a + c.sent, 0).toLocaleString(), icon: Zap, color: "#06b6d4" },
          { label: "Total Replies", value: campaigns.reduce((a, c) => a + c.replied, 0), icon: Reply, color: "#10b981" },
          { label: "Active Leads", value: campaigns.reduce((a, c) => a + c.leads.length, 0).toLocaleString(), icon: Users, color: "#a855f7" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              background: "#1a1a2e", border: "1px solid #252540",
              borderRadius: 10, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: s.color + "18", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.1rem" }}>{s.value}</div>
                <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {campaigns.length === 0 ? (
        <div className="metric-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(99,102,241,0.1)", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Mail size={28} style={{ color: "#6366f1" }} />
          </div>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "1rem", marginBottom: 6 }}>No campaigns yet</div>
          <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 20 }}>
            Create your first campaign to start reaching out to leads.
          </div>
          <button className="btn-primary" onClick={() => setShowWizard(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 8, fontSize: "0.85rem",
            fontWeight: 600, cursor: "pointer", border: "none",
          }}>
            <Plus size={14} />
            Create Campaign
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="metric-card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ color: "#64748b", fontSize: "0.85rem" }}>No campaigns match your search.</div>
        </div>
      ) : (
        <div className="metric-card" style={{ overflow: "hidden" }}>
          <table className="data-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Status</th>
                <th>Leads</th>
                <th>Sent</th>
                <th>Open %</th>
                <th>Reply %</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const openRate = c.sent > 0 ? Math.round(c.opened / c.sent * 100) : 0;
                const replyRate = c.sent > 0 ? Math.round(c.replied / c.sent * 100) : 0;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.84rem", marginBottom: 3 }}>{c.name}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {c.tags.map(t => (
                          <span key={t} style={{
                            background: "#252540", color: "#94a3b8",
                            fontSize: "0.62rem", padding: "1px 6px",
                            borderRadius: 4, fontWeight: 600,
                          }}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${statusColors[c.status]}`}>
                        {c.status === "active" && (
                          <span className="health-dot health-dot-green" style={{ width: 6, height: 6, display: "inline-block" }} />
                        )}
                        {c.status}
                      </span>
                    </td>
                    <td style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.leads.length.toLocaleString()}</td>
                    <td style={{ color: "#94a3b8" }}>{c.sent.toLocaleString()}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ background: "#252540", borderRadius: 999, height: 4, width: 50, overflow: "hidden" }}>
                          <div className="progress-bar" style={{ width: `${openRate}%`, height: "100%" }} />
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#f1f5f9" }}>{openRate}%</span>
                      </div>
                    </td>
                    <td style={{ color: "#6ee7b7", fontWeight: 600 }}>{replyRate}%</td>
                    <td style={{ color: "#64748b", fontSize: "0.78rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock size={11} />
                        {c.created}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {/* Send button */}
                        {c.status !== "completed" && (
                          <button
                            onClick={() => sendCampaign(c.id)}
                            disabled={sending?.id === c.id && !sending?.error}
                            title="Send emails now"
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "4px 10px", borderRadius: 6, border: "none",
                              background: (sending?.id === c.id && !sending?.error) ? "#252540" : "rgba(99,102,241,0.15)",
                              color: (sending?.id === c.id && !sending?.error) ? "#3b3b6b" : "#a5b4fc",
                              cursor: (sending?.id === c.id && !sending?.error) ? "not-allowed" : "pointer",
                              fontSize: "0.72rem", fontWeight: 600,
                            }}
                          >
                            {(sending?.id === c.id && !sending?.error)
                              ? <><Loader size={11} style={{ animation: "spin 1s linear infinite" }} /> {sending.progress}/{sending.total}</>
                              : <><Send size={11} /> Send</>}
                          </button>
                        )}
                        {(c.status === "active" || c.status === "paused") && (
                          <button onClick={() => toggleStatus(c.id)} title={c.status === "active" ? "Pause" : "Resume"} style={{ background: "none", border: "none", cursor: "pointer", color: c.status === "active" ? "#f59e0b" : "#10b981", padding: 4 }}>
                            {c.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        )}
                        {c.status === "draft" && (
                          <button onClick={() => { const u = campaigns.map(x => x.id === c.id ? { ...x, status: "active" as const } : x); setCampaigns(u); saveCampaigns(u); }} title="Activate" style={{ background: "none", border: "none", cursor: "pointer", color: "#10b981", padding: 4 }}>
                            <Play size={14} />
                          </button>
                        )}
                        <button onClick={() => duplicateCampaign(c.id)} title="Duplicate" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
                          <Copy size={14} />
                        </button>
                        <button onClick={() => setDeleteConfirm(c.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: "#1a1a2e", border: "1px solid #252540",
            borderRadius: 12, padding: "28px 32px", width: 360, textAlign: "center",
          }}>
            <AlertCircle size={32} style={{ color: "#ef4444", marginBottom: 12 }} />
            <div style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 8 }}>Delete Campaign?</div>
            <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 24 }}>
              This action cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: "8px 20px", borderRadius: 8, border: "1px solid #252540",
                background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
              }}>Cancel</button>
              <button onClick={() => deleteCampaign(deleteConfirm)} style={{
                padding: "8px 20px", borderRadius: 8, border: "none",
                background: "#ef4444", color: "white", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send status toast ── */}
      {sending && (sending.error || sending.total > 0) && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 200,
          background: "#1a1a2e", border: `1px solid ${sending.error && sending.progress < sending.total ? "#ef444440" : sending.error ? "#10b98140" : "#6366f140"}`,
          borderRadius: 12, padding: "14px 18px", minWidth: 280, maxWidth: 380,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: sending.error ? 0 : 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {sending.error
                ? sending.error.startsWith("Done")
                  ? <Check size={14} style={{ color: "#10b981" }} />
                  : <AlertCircle size={14} style={{ color: "#ef4444" }} />
                : <Loader size={14} style={{ color: "#6366f1", animation: "spin 1s linear infinite" }} />}
              <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.82rem" }}>
                {sending.error ? (sending.error.startsWith("Done") ? "Send Complete" : "Send Error") : "Sending…"}
              </span>
            </div>
            <button onClick={() => setSending(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
              <X size={13} />
            </button>
          </div>
          {sending.error ? (
            <p style={{ color: sending.error.startsWith("Done") ? "#6ee7b7" : "#fca5a5", fontSize: "0.75rem", margin: 0 }}>{sending.error}</p>
          ) : (
            <>
              <div style={{ background: "#252540", borderRadius: 999, height: 5, overflow: "hidden", marginBottom: 5 }}>
                <div style={{ width: `${Math.round(sending.progress / sending.total * 100)}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#a855f7)", borderRadius: 999, transition: "width 0.3s" }} />
              </div>
              <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{sending.progress} of {sending.total} emails sent</div>
            </>
          )}
        </div>
      )}
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>

      {/* ── New Campaign Wizard ── */}
      {showWizard && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 100, padding: 20,
        }}>
          <div style={{
            background: "#13131f", border: "1px solid #252540",
            borderRadius: 16, width: "100%", maxWidth: 620,
            maxHeight: "90vh", display: "flex", flexDirection: "column",
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #1e1e35",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem" }}>New Campaign</div>
                <div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 2 }}>
                  Step {step + 1} of {STEPS.length} — {STEPS[step]}
                </div>
              </div>
              <button onClick={resetWizard} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            {/* Step indicators */}
            <div style={{ padding: "16px 24px 0", display: "flex", gap: 6 }}>
              {STEPS.map((s, i) => (
                <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    height: 4, width: "100%", borderRadius: 2,
                    background: i <= step ? "#6366f1" : "#252540",
                    transition: "background 0.3s",
                  }} />
                  <span style={{ fontSize: "0.62rem", color: i <= step ? "#a5b4fc" : "#3b3b6b", fontWeight: 600 }}>{s}</span>
                </div>
              ))}
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>

              {/* Step 0: Basic Info */}
              {step === 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Campaign Name *</label>
                    <input
                      className="input-field"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. SaaS Founders Q2 2025"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tags (optional)</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input
                        className="input-field"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                        placeholder="Type a tag and press Enter"
                        style={{ flex: 1 }}
                      />
                      <button onClick={addTag} style={{
                        padding: "8px 14px", borderRadius: 8, border: "1px solid #252540",
                        background: "#1a1a2e", color: "#a5b4fc", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
                      }}>Add</button>
                    </div>
                    {tags.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {tags.map(t => (
                          <span key={t} style={{
                            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                            color: "#a5b4fc", fontSize: "0.72rem", padding: "3px 10px", borderRadius: 999,
                            display: "flex", alignItems: "center", gap: 5,
                          }}>
                            {t}
                            <button onClick={() => setTags(tags.filter(x => x !== t))} style={{
                              background: "none", border: "none", cursor: "pointer", color: "#6366f1", padding: 0, lineHeight: 1,
                            }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Add Leads */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{
                    background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)",
                    borderRadius: 10, padding: "12px 16px", fontSize: "0.78rem", color: "#94a3b8",
                  }}>
                    Paste email addresses (one per line, or comma/semicolon separated), or upload a CSV file.
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <label style={labelStyle}>Email Addresses *</label>
                      <button onClick={() => fileRef.current?.click()} style={{
                        display: "flex", alignItems: "center", gap: 5, padding: "5px 12px",
                        borderRadius: 7, border: "1px solid #252540", background: "#1a1a2e",
                        color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                      }}>
                        <Upload size={12} />
                        Import CSV
                      </button>
                      <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleCSVUpload} style={{ display: "none" }} />
                    </div>
                    <textarea
                      className="input-field"
                      value={leadsText}
                      onChange={e => { setLeadsText(e.target.value); setLeadsError(""); }}
                      placeholder={"john@company.com\njane@startup.io\nbob@agency.co"}
                      style={{ minHeight: 180, resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem" }}
                    />
                    {leadsError && (
                      <div style={{ color: "#fca5a5", fontSize: "0.75rem", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                        <AlertCircle size={12} /> {leadsError}
                      </div>
                    )}
                    {leadCount > 0 && (
                      <div style={{ color: "#6ee7b7", fontSize: "0.75rem", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                        <Check size={12} /> {leadCount} valid email{leadCount !== 1 ? "s" : ""} detected
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Email Content */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{
                    background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.18)",
                    borderRadius: 10, padding: "10px 14px", fontSize: "0.75rem", color: "#94a3b8",
                  }}>
                    Use <code style={{ color: "#d8b4fe", background: "rgba(168,85,247,0.15)", padding: "1px 5px", borderRadius: 4 }}>{"{{first_name}}"}</code>,{" "}
                    <code style={{ color: "#d8b4fe", background: "rgba(168,85,247,0.15)", padding: "1px 5px", borderRadius: 4 }}>{"{{company}}"}</code>,{" "}
                    <code style={{ color: "#d8b4fe", background: "rgba(168,85,247,0.15)", padding: "1px 5px", borderRadius: 4 }}>{"{{sender_name}}"}</code> as variables.
                  </div>
                  <div>
                    <label style={labelStyle}>Subject Line *</label>
                    <input
                      className="input-field"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="e.g. Quick question about {{company}}"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Body *</label>
                    <textarea
                      className="input-field"
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      style={{ minHeight: 220, resize: "vertical", fontSize: "0.83rem", lineHeight: 1.6 }}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Settings */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>From Email Address *</label>
                    <input
                      className="input-field"
                      value={fromEmail}
                      onChange={e => setFromEmail(e.target.value)}
                      placeholder="you@yourdomain.com"
                      type="email"
                    />
                    <div style={{ color: "#64748b", fontSize: "0.72rem", marginTop: 5 }}>
                      The email account you'll send from. Make sure it's warmed up.
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Daily Send Limit</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="range" min={10} max={200} step={10}
                        value={dailyLimit}
                        onChange={e => setDailyLimit(Number(e.target.value))}
                        style={{ flex: 1, accentColor: "#6366f1" }}
                      />
                      <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem", minWidth: 40 }}>{dailyLimit}</span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.72rem" }}>
                      Recommended: 30–100/day per inbox for deliverability.
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Send Window</label>
                    <select
                      className="input-field"
                      value={sendWindow}
                      onChange={e => setSendWindow(e.target.value)}
                    >
                      <option value="09:00–17:00">09:00 – 17:00 (Business hours)</option>
                      <option value="08:00–18:00">08:00 – 18:00 (Extended)</option>
                      <option value="07:00–20:00">07:00 – 20:00 (Wide)</option>
                      <option value="06:00–22:00">06:00 – 22:00 (All day)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Campaign Name", value: name },
                    { label: "Tags", value: tags.length ? tags.join(", ") : "None" },
                    { label: "Leads", value: `${parseLeads(leadsText).length} email addresses` },
                    { label: "Subject", value: subject },
                    { label: "From", value: fromEmail },
                    { label: "Daily Limit", value: `${dailyLimit} emails/day` },
                    { label: "Send Window", value: sendWindow },
                  ].map(row => (
                    <div key={row.label} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "10px 14px", background: "#1a1a2e",
                      border: "1px solid #252540", borderRadius: 8,
                    }}>
                      <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{row.label}</span>
                      <span style={{ color: "#e2e8f0", fontSize: "0.8rem", fontWeight: 600, maxWidth: "55%", textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{
                    background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start",
                  }}>
                    <Check size={16} style={{ color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ color: "#6ee7b7", fontSize: "0.78rem" }}>
                      Everything looks good. Click <strong>Launch</strong> to start sending, or <strong>Save as Draft</strong> to launch later.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "16px 24px", borderTop: "1px solid #1e1e35",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <button
                onClick={step === 0 ? resetWizard : () => setStep(s => s - 1)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  border: "1px solid #252540", background: "transparent",
                  color: "#94a3b8", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                }}
              >
                <ChevronLeft size={14} />
                {step === 0 ? "Cancel" : "Back"}
              </button>

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={canProceed() ? "btn-primary" : ""}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 20px", borderRadius: 8, border: "none",
                    background: canProceed() ? undefined : "#252540",
                    color: canProceed() ? undefined : "#3b3b6b",
                    cursor: canProceed() ? "pointer" : "not-allowed",
                    fontSize: "0.82rem", fontWeight: 600,
                  }}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => handleLaunch(true)} style={{
                    padding: "8px 16px", borderRadius: 8, border: "1px solid #252540",
                    background: "transparent", color: "#94a3b8", cursor: "pointer",
                    fontSize: "0.82rem", fontWeight: 600,
                  }}>
                    Save as Draft
                  </button>
                  <button onClick={() => handleLaunch(false)} className="btn-primary" style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 20px", borderRadius: 8, border: "none",
                    cursor: "pointer", fontSize: "0.82rem", fontWeight: 600,
                  }}>
                    <Zap size={14} />
                    Launch Campaign
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: "0.78rem",
  fontWeight: 600,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
