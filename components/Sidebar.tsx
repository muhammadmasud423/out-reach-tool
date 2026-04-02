"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Mail, Zap, Flame, Inbox, BarChart3,
  Settings, ChevronRight, Plus, Users,
  TrendingUp, Shield, Sparkles, LogOut
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Mail },
  { href: "/sequences", label: "Sequences", icon: Zap },
  { href: "/warmup", label: "Email Warmup", icon: Flame },
  { href: "/inbox", label: "Unified Inbox", icon: Inbox },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/deliverability", label: "Deliverability", icon: Shield },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside style={{
      width: 240,
      minWidth: 240,
      background: "#081a2d",
      borderRight: "1px solid #153353",
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: "1px solid #153353",
      }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* ScaleSynq-style mark */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(34,211,238,0.06)",
              border: "1px solid rgba(34,211,238,0.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(34,211,238,0.12)",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M7.2 9.1c1.7-2.9 5.3-3.9 8.2-2.2 1 .6 1.7 1.4 2.2 2.2m-.8 5.8c-1.7 2.9-5.3 3.9-8.2 2.2-1-.6-1.7-1.4-2.2-2.2"
                  stroke="#22d3ee"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M9.2 12a2.8 2.8 0 0 1 5.6 0 2.8 2.8 0 0 1-5.6 0Z"
                  stroke="#06b6d4"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <div style={{ lineHeight: 1 }}>
              <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em" }}>
                SCALE
              </div>
              <div style={{ color: "#e2e8f0", fontWeight: 800, fontSize: "0.78rem", letterSpacing: "0.14em", marginTop: 2 }}>
                SYNQ
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Action */}
      <div style={{ padding: "14px 16px 10px" }}>
        <button className="btn-primary" style={{
          width: "100%",
          padding: "9px 14px",
          borderRadius: 8,
          fontSize: "0.8rem",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: "pointer",
          border: "none",
        }}>
          <Plus size={14} />
          New Campaign
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
        <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#2a4a6b", letterSpacing: "0.1em", padding: "8px 8px 6px", textTransform: "uppercase" }}>
          Main Menu
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div className={`sidebar-item ${active ? "active" : ""}`} style={{
                marginBottom: 2,
                borderLeft: active ? "2px solid #06b6d4" : "2px solid transparent",
                paddingLeft: active ? 10 : 12,
              }}>
                <Icon size={16} style={{ flexShrink: 0, color: active ? "#67e8f9" : "#64748b" }} />
                <span style={{ color: active ? "#e2e8f0" : "#94a3b8" }}>{label}</span>
                {active && <ChevronRight size={12} style={{ marginLeft: "auto", color: "#06b6d4" }} />}
              </div>
            </Link>
          );
        })}

        <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#2a4a6b", letterSpacing: "0.1em", padding: "12px 8px 6px", textTransform: "uppercase", marginTop: 4 }}>
          AI Features
        </div>
        <Link href="/ai-writer" style={{ textDecoration: "none" }}>
          <div className={`sidebar-item ${pathname === "/ai-writer" ? "active" : ""}`} style={{ marginBottom: 2 }}>
            <Sparkles size={16} style={{ color: "#22d3ee" }} />
            <span>AI Writer</span>
            <span style={{
              marginLeft: "auto",
              background: "linear-gradient(135deg,#22d3ee,#06b6d4,#0ea5e9)",
              color: "white",
              fontSize: "0.6rem",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: 4,
            }}>NEW</span>
          </div>
        </Link>
      </nav>

      {/* Bottom */}
      <div style={{ padding: "10px", borderTop: "1px solid #153353" }}>
        {/* Health status */}
        <div style={{
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.22)",
          borderRadius: 8,
          padding: "10px 12px",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div className="health-dot health-dot-green" />
          <div>
            <div style={{ color: "#6ee7b7", fontSize: "0.72rem", fontWeight: 600 }}>All Systems Healthy</div>
            <div style={{ color: "#64748b", fontSize: "0.65rem" }}>3 inboxes active</div>
          </div>
        </div>

        {bottomItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div className={`sidebar-item ${pathname === href ? "active" : ""}`}>
              <Icon size={16} />
              <span>{label}</span>
            </div>
          </Link>
        ))}

        {/* User */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 10px 0",
          borderTop: "1px solid #153353",
          marginTop: 8,
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#22d3ee,#06b6d4,#0ea5e9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "white",
            flexShrink: 0,
          }}>SS</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#f1f5f9", fontSize: "0.78rem", fontWeight: 600 }}>ScaleSynq</div>
            <div style={{ color: "#64748b", fontSize: "0.65rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>admin@scalesynq.com</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 2, flexShrink: 0 }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
