"use client";
import { Bell, Search, Zap, Menu } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function TopBar({ title, subtitle, onMenuClick, isMobile }: TopBarProps) {
  return (
    <header style={{
      height: 60,
      background: "#081a2d",
      borderBottom: "1px solid #153353",
      display: "flex",
      alignItems: "center",
      padding: isMobile ? "0 16px" : "0 24px",
      gap: 12,
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      {/* Hamburger on mobile */}
      {isMobile && (
        <button
          onClick={onMenuClick}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4, flexShrink: 0 }}
        >
          <Menu size={22} />
        </button>
      )}

      {/* Page title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: isMobile ? "0.95rem" : "1.05rem", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
        {subtitle && !isMobile && <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 1 }}>{subtitle}</p>}
      </div>

      {/* Search — hidden on mobile */}
      {!isMobile && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#0b2036", border: "1px solid #153353",
          borderRadius: 8, padding: "7px 12px", minWidth: 220,
        }}>
          <Search size={14} style={{ color: "#64748b" }} />
          <input
            placeholder="Search campaigns, leads..."
            style={{ background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: "0.8rem", width: "100%" }}
          />
        </div>
      )}

      {/* Credits — hidden on mobile */}
      {!isMobile && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.18)",
          borderRadius: 8, padding: "6px 12px",
        }}>
          <Zap size={13} style={{ color: "#a5f3fc" }} />
          <span style={{ color: "#a5f3fc", fontSize: "0.78rem", fontWeight: 600 }}>8,420 credits</span>
        </div>
      )}

      {/* Notifications */}
      <button style={{
        position: "relative", background: "#0b2036", border: "1px solid #153353",
        borderRadius: 8, padding: "8px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Bell size={16} style={{ color: "#94a3b8" }} />
        <span style={{
          position: "absolute", top: 6, right: 6, width: 7, height: 7,
          borderRadius: "50%", background: "#ef4444", border: "1.5px solid #081a2d",
        }} />
      </button>
    </header>
  );
}
