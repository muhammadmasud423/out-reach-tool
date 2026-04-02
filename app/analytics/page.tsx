"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { Mail, Eye, Reply, AlertCircle, Users, Download, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

interface Campaign {
  id: string; name: string; status: string; leads: string[];
  sent: number; opened: number; replied: number; bounced: number; created: string;
  dailyLimit: number;
}

const STORAGE_KEY = "scalesynq_campaigns";
function load(): Campaign[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [range, setRange] = useState("all");

  useEffect(() => { setCampaigns(load()); }, []);

  const totalSent = campaigns.reduce((a, c) => a + c.sent, 0);
  const totalOpened = campaigns.reduce((a, c) => a + c.opened, 0);
  const totalReplied = campaigns.reduce((a, c) => a + c.replied, 0);
  const totalBounced = campaigns.reduce((a, c) => a + c.bounced, 0);
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";
  const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0.0";
  const bounceRate = totalSent > 0 ? ((totalBounced / totalSent) * 100).toFixed(1) : "0.0";

  const metrics = [
    { label: "Total Sent", value: totalSent.toLocaleString(), icon: Mail, color: "#6366f1" },
    { label: "Open Rate", value: `${openRate}%`, icon: Eye, color: "#06b6d4" },
    { label: "Reply Rate", value: `${replyRate}%`, icon: Reply, color: "#10b981" },
    { label: "Bounce Rate", value: `${bounceRate}%`, icon: AlertCircle, color: "#a855f7" },
  ];

  // Per-campaign chart data
  const campaignChart = campaigns.map(c => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
    sent: c.sent,
    opens: c.opened,
    replies: c.replied,
    bounces: c.bounced,
  }));

  // Per-campaign table data
  const isEmpty = campaigns.length === 0;

  return (
    <DashboardLayout title="Analytics" subtitle="Deep insights into your outreach performance">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["7d", "30d", "90d", "all"].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "6px 12px", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600,
              border: "1px solid", cursor: "pointer",
              background: range === r ? "rgba(99,102,241,0.15)" : "transparent",
              borderColor: range === r ? "#6366f1" : "#252540",
              color: range === r ? "#a5b4fc" : "#64748b",
            }}>{r === "all" ? "All time" : r}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #252540", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} style={{ background: "#1a1a2e", border: "1px solid #252540", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: m.color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <Icon size={14} style={{ color: m.color }} />
              </div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.3rem" }}>{m.value}</div>
              <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      {isEmpty ? (
        <div className="metric-card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <BarChart3 size={36} style={{ color: "#3b3b6b", marginBottom: 14 }} />
          <div style={{ color: "#f1f5f9", fontWeight: 600, marginBottom: 6 }}>No data yet</div>
          <div style={{ color: "#64748b", fontSize: "0.82rem" }}>Create campaigns and start sending to see analytics here.</div>
        </div>
      ) : (
        <>
          {/* Campaign performance chart */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
            <div className="metric-card">
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>Performance by Campaign</div>
                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Sent, opened, replied, bounced</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={campaignChart} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #252540", borderRadius: 8, color: "#f1f5f9", fontSize: "0.75rem" }} />
                  <Legend wrapperStyle={{ fontSize: "0.72rem", color: "#94a3b8" }} />
                  <Bar dataKey="sent" fill="#6366f1" radius={[3, 3, 0, 0]} name="Sent" />
                  <Bar dataKey="opens" fill="#06b6d4" radius={[3, 3, 0, 0]} name="Opens" />
                  <Bar dataKey="replies" fill="#10b981" radius={[3, 3, 0, 0]} name="Replies" />
                  <Bar dataKey="bounces" fill="#ef4444" radius={[3, 3, 0, 0]} name="Bounces" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="metric-card">
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>Lead Coverage</div>
                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>Sent vs total leads per campaign</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {campaigns.map(c => {
                  const pct = c.leads.length > 0 ? Math.round(c.sent / c.leads.length * 100) : 0;
                  return (
                    <div key={c.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{c.name}</span>
                        <span style={{ color: "#e2e8f0", fontSize: "0.75rem", fontWeight: 600 }}>{pct}%</span>
                      </div>
                      <div style={{ background: "#252540", borderRadius: 999, height: 5, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg,#6366f1,#a855f7)", borderRadius: 999 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Per-campaign table */}
          <div className="metric-card">
            <div style={{ padding: "16px 18px", borderBottom: "1px solid #252540" }}>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>Campaign Breakdown</div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr>
                  {["Campaign", "Leads", "Sent", "Open %", "Reply %", "Bounce %", "Status"].map(h => (
                    <th key={h} style={{ color: "#64748b", fontWeight: 600, textAlign: "left", padding: "10px 16px", fontSize: "0.7rem", borderBottom: "1px solid #252540", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => {
                  const or = c.sent > 0 ? (c.opened / c.sent * 100).toFixed(1) : "0.0";
                  const rr = c.sent > 0 ? (c.replied / c.sent * 100).toFixed(1) : "0.0";
                  const br = c.sent > 0 ? (c.bounced / c.sent * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={c.id}>
                      <td style={{ padding: "12px 16px", color: "#e2e8f0", fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{c.leads.length.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{c.sent.toLocaleString()}</td>
                      <td style={{ padding: "12px 16px", color: parseFloat(or) >= 30 ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{or}%</td>
                      <td style={{ padding: "12px 16px", color: parseFloat(rr) >= 5 ? "#10b981" : "#94a3b8", fontWeight: 600 }}>{rr}%</td>
                      <td style={{ padding: "12px 16px", color: parseFloat(br) > 3 ? "#ef4444" : "#94a3b8" }}>{br}%</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className={`badge ${c.status === "active" ? "badge-green" : c.status === "paused" ? "badge-amber" : "badge-brand"}`}>{c.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
