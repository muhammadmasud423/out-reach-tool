"use client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Mail, Users, Eye, Reply, AlertCircle, Flame,
  ArrowUpRight, Plus, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
  tags: string[];
  status: "draft" | "active" | "paused" | "completed";
  leads: string[];
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

function loadCampaigns(): Campaign[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "#1a1a2e", border: "1px solid #252540",
        borderRadius: 8, padding: "10px 14px", fontSize: "0.78rem",
      }}>
        <div style={{ color: "#94a3b8", marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    setCampaigns(loadCampaigns());
  }, []);

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totalOpened = campaigns.reduce((a, c) => a + c.opened, 0);
  const totalReplied = campaigns.reduce((a, c) => a + c.replied, 0);
  const totalLeads = campaigns.reduce((a, c) => a + c.leads.length, 0);
  const totalBounced = campaigns.reduce((a, c) => a + c.bounced, 0);
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";
  const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0.0";
  const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : "0.0";
  const activeCampaigns = campaigns.filter(c => c.status === "active");

  const metrics = [
    { label: "Emails Sent", value: totalSent.toLocaleString(), icon: Mail, color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
    { label: "Open Rate", value: `${openRate}%`, icon: Eye, color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
    { label: "Reply Rate", value: `${replyRate}%`, icon: Reply, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { label: "Active Leads", value: totalLeads.toLocaleString(), icon: Users, color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
    { label: "Bounce Rate", value: `${bounceRate}%`, icon: AlertCircle, color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
    { label: "Active Campaigns", value: `${activeCampaigns.length} / ${campaigns.length}`, icon: Flame, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  ];

  // Build a simple chart from campaign data (sent/opened/replied per campaign)
  const chartData = campaigns.slice(0, 7).map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    sent: c.sent,
    opens: c.opened,
    replies: c.replied,
  }));

  const isEmpty = campaigns.length === 0;

  return (
    <DashboardLayout title="Dashboard" subtitle="Your outreach performance at a glance">
      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="metric-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, background: m.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={18} style={{ color: m.color }} />
                </div>
              </div>
              <div style={{ color: "#f1f5f9", fontSize: "1.6rem", fontWeight: 700, lineHeight: 1, marginBottom: 4 }}>
                {m.value}
              </div>
              <div style={{ color: "#64748b", fontSize: "0.78rem" }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {isEmpty ? (
        /* Empty state */
        <div className="metric-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "rgba(99,102,241,0.1)", margin: "0 auto 16px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Mail size={28} style={{ color: "#6366f1" }} />
          </div>
          <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "1rem", marginBottom: 6 }}>
            No data yet
          </div>
          <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: 20 }}>
            Create your first campaign to start tracking performance.
          </div>
          <button className="btn-primary" onClick={() => router.push("/campaigns")} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 8, fontSize: "0.85rem",
            fontWeight: 600, cursor: "pointer", border: "none",
          }}>
            <Plus size={14} />
            Create Campaign
          </button>
        </div>
      ) : (
        <>
          {/* Chart + Campaigns */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 24 }}>
            {/* Bar chart per campaign */}
            <div className="metric-card" style={{ padding: "20px 22px" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>Campaign Performance</div>
                <div style={{ color: "#64748b", fontSize: "0.72rem" }}>Sent · Opens · Replies per campaign</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gOpens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gReplies" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sent" name="Sent" stroke="#6366f1" fill="url(#gSent)" strokeWidth={2} />
                  <Area type="monotone" dataKey="opens" name="Opens" stroke="#06b6d4" fill="url(#gOpens)" strokeWidth={2} />
                  <Area type="monotone" dataKey="replies" name="Replies" stroke="#10b981" fill="url(#gReplies)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Active Campaigns list */}
            <div className="metric-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>Active Campaigns</div>
                <button
                  onClick={() => router.push("/campaigns")}
                  style={{ color: "#6366f1", fontSize: "0.72rem", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                >
                  View all →
                </button>
              </div>
              {activeCampaigns.length === 0 ? (
                <div style={{ color: "#64748b", fontSize: "0.8rem", textAlign: "center", padding: "20px 0" }}>
                  No active campaigns
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {activeCampaigns.slice(0, 5).map((c, i) => (
                    <div key={c.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      paddingBottom: 10,
                      borderBottom: i < activeCampaigns.slice(0, 5).length - 1 ? "1px solid #1e1e35" : "none",
                    }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: "#10b981", flexShrink: 0,
                        boxShadow: "0 0 6px rgba(16,185,129,0.6)",
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#e2e8f0", fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                        <div style={{ color: "#64748b", fontSize: "0.68rem" }}>{c.leads.length} leads · {c.sent} sent</div>
                      </div>
                      {c.sent > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 3, color: "#10b981", fontSize: "0.72rem", fontWeight: 600 }}>
                          <ArrowUpRight size={10} />
                          {Math.round(c.replied / c.sent * 100)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All campaigns table */}
          <div className="metric-card" style={{ padding: "20px 0 0" }}>
            <div style={{ padding: "0 22px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.9rem" }}>All Campaigns</div>
              <button className="btn-primary" onClick={() => router.push("/campaigns")} style={{
                padding: "6px 14px", borderRadius: 6, fontSize: "0.75rem",
                fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
                cursor: "pointer", border: "none",
              }}>
                <Plus size={12} />
                New Campaign
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Leads</th>
                  <th>Sent</th>
                  <th>Open %</th>
                  <th>Reply %</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const openRate = c.sent > 0 ? Math.round(c.opened / c.sent * 100) : 0;
                  const replyRate = c.sent > 0 ? Math.round(c.replied / c.sent * 100) : 0;
                  return (
                    <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => router.push("/campaigns")}>
                      <td>
                        <div style={{ color: "#e2e8f0", fontWeight: 500, fontSize: "0.82rem" }}>{c.name}</div>
                      </td>
                      <td>
                        <span className={`badge ${c.status === "active" ? "badge-green" : c.status === "paused" ? "badge-amber" : "badge-brand"}`}>
                          {c.status === "active" && <span className="health-dot health-dot-green" style={{ display: "inline-block" }} />}
                          {c.status}
                        </span>
                      </td>
                      <td style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.leads.length.toLocaleString()}</td>
                      <td style={{ color: "#94a3b8" }}>{c.sent.toLocaleString()}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ background: "#252540", borderRadius: 999, height: 5, width: 50, overflow: "hidden" }}>
                            <div className="progress-bar" style={{ width: `${openRate}%`, height: "100%" }} />
                          </div>
                          <span style={{ fontSize: "0.78rem" }}>{openRate}%</span>
                        </div>
                      </td>
                      <td style={{ color: "#6ee7b7", fontWeight: 600 }}>{replyRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer status */}
      {!isEmpty && (
        <div style={{
          background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)",
          borderRadius: 10, padding: "12px 16px", marginTop: 16,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Activity size={16} style={{ color: "#6366f1" }} />
          <div>
            <div style={{ color: "#a5b4fc", fontSize: "0.78rem", fontWeight: 600 }}>
              {totalSent.toLocaleString()} emails sent across {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
            </div>
            <div style={{ color: "#64748b", fontSize: "0.68rem" }}>
              {openRate}% open rate · {replyRate}% reply rate
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
