"use client";
import { Bell, Search, ChevronDown, Zap, Sun } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header style={{
      height: 64,
      background: "#081a2d",
      borderBottom: "1px solid #153353",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      {/* Page title */}
      <div style={{ flex: 1 }}>
        <h1 style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1.05rem", lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: 1 }}>{subtitle}</p>}
      </div>

      {/* Search */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#0b2036",
        border: "1px solid #153353",
        borderRadius: 8,
        padding: "7px 12px",
        minWidth: 220,
      }}>
        <Search size={14} style={{ color: "#64748b" }} />
        <input
          placeholder="Search campaigns, leads..."
          style={{
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f1f5f9",
            fontSize: "0.8rem",
            width: "100%",
          }}
        />
        <kbd style={{
          background: "#153353",
          border: "1px solid #1a3d64",
          borderRadius: 4,
          padding: "1px 5px",
          fontSize: "0.6rem",
          color: "#64748b",
        }}>⌘K</kbd>
      </div>

      {/* Credits */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(34,211,238,0.08)",
        border: "1px solid rgba(34,211,238,0.18)",
        borderRadius: 8,
        padding: "6px 12px",
      }}>
        <Zap size={13} style={{ color: "#a5f3fc" }} />
        <span style={{ color: "#a5f3fc", fontSize: "0.78rem", fontWeight: 600 }}>8,420 credits</span>
      </div>

      {/* Notifications */}
      <button style={{
        position: "relative",
        background: "#0b2036",
        border: "1px solid #153353",
        borderRadius: 8,
        padding: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Bell size={16} style={{ color: "#94a3b8" }} />
        <span style={{
          position: "absolute",
          top: 6,
          right: 6,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#ef4444",
          border: "1.5px solid #13131f",
        }} />
      </button>

      {/* User */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "#0b2036",
        border: "1px solid #153353",
        borderRadius: 8,
        padding: "6px 10px",
        cursor: "pointer",
      }}>
        <div style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#22d3ee,#06b6d4,#0ea5e9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "white",
        }}>SS</div>
        <span style={{ color: "#e2e8f0", fontSize: "0.8rem", fontWeight: 500 }}>ScaleSynq</span>
        <ChevronDown size={12} style={{ color: "#64748b" }} />
      </div>
    </header>
  );
}
