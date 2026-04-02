"use client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search, Reply, Archive, Trash2, Star, Mail,
  CheckCheck, Inbox, Send, Paperclip
} from "lucide-react";
import { useState, useEffect } from "react";

interface Message { from: "me" | "them"; text: string; time: string; }
interface Thread {
  id: string;
  name: string;
  email: string;
  subject: string;
  preview: string;
  time: string;
  read: boolean;
  starred: boolean;
  tag: string;
  campaign: string;
  messages: Message[];
}

const INBOX_KEY = "scalesynq_inbox";
function load(): Thread[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(INBOX_KEY) || "[]"); } catch { return []; }
}
function save(d: Thread[]) { localStorage.setItem(INBOX_KEY, JSON.stringify(d)); }

const tagColors: Record<string, { bg: string; color: string; label: string }> = {
  interested: { bg: "#10b98120", color: "#10b981", label: "Interested" },
  "not-interested": { bg: "#ef444420", color: "#ef4444", label: "Not Interested" },
  "follow-up": { bg: "#f59e0b20", color: "#f59e0b", label: "Follow Up" },
  ooo: { bg: "#6366f120", color: "#818cf8", label: "Out of Office" },
};

const avatarColors = ["#6366f1", "#a855f7", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];

export default function InboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("all");
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const loaded = load();
    setThreads(loaded);
    if (loaded.length > 0) setSelected(loaded[0]);
  }, []);

  function selectThread(t: Thread) {
    // Mark as read
    const updated = threads.map(x => x.id === t.id ? { ...x, read: true } : x);
    setThreads(updated); save(updated);
    setSelected({ ...t, read: true });
  }

  function toggleStar(id: string) {
    const updated = threads.map(t => t.id === id ? { ...t, starred: !t.starred } : t);
    setThreads(updated); save(updated);
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, starred: !prev.starred } : prev);
  }

  function archiveThread(id: string) {
    const updated = threads.filter(t => t.id !== id);
    setThreads(updated); save(updated);
    setSelected(updated[0] ?? null);
  }

  function sendReply() {
    if (!replyText.trim() || !selected) return;
    const newMsg: Message = { from: "me", text: replyText.trim(), time: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) };
    const updated = threads.map(t => t.id === selected.id
      ? { ...t, messages: [...t.messages, newMsg] }
      : t
    );
    setThreads(updated); save(updated);
    const updatedThread = updated.find(t => t.id === selected.id)!;
    setSelected(updatedThread);
    setReplyText("");
  }

  function setTag(id: string, tag: string) {
    const updated = threads.map(t => t.id === id ? { ...t, tag } : t);
    setThreads(updated); save(updated);
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, tag } : prev);
  }

  const filtered = threads.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchTag = filterTag === "all" || t.tag === filterTag;
    return matchSearch && matchTag;
  });

  const unread = threads.filter(t => !t.read).length;

  return (
    <DashboardLayout title="Unified Inbox" subtitle="All replies from every campaign, in one place">
      <div style={{ display: "flex", height: "calc(100vh - 160px)", background: "#1a1a2e", border: "1px solid #252540", borderRadius: 12, overflow: "hidden" }}>

        {/* Left: thread list */}
        <div style={{ width: 300, borderRight: "1px solid #252540", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #252540" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Inbox size={14} style={{ color: "#6366f1" }} />
                <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.85rem" }}>Inbox</span>
                {unread > 0 && <span style={{ background: "#6366f1", color: "#fff", fontSize: "0.6rem", fontWeight: 700, borderRadius: 999, padding: "1px 6px" }}>{unread}</span>}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#13131f", border: "1px solid #252540", borderRadius: 8, padding: "7px 10px", marginBottom: 10 }}>
              <Search size={13} style={{ color: "#64748b" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search replies..." style={{ background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontSize: "0.78rem", width: "100%" }} />
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {["all", "interested", "follow-up", "not-interested"].map(tag => (
                <button key={tag} onClick={() => setFilterTag(tag)} style={{
                  padding: "3px 8px", borderRadius: 5, fontSize: "0.63rem", fontWeight: 600,
                  border: "1px solid", cursor: "pointer",
                  background: filterTag === tag ? "rgba(99,102,241,0.15)" : "transparent",
                  borderColor: filterTag === tag ? "#6366f1" : "#252540",
                  color: filterTag === tag ? "#a5b4fc" : "#64748b",
                }}>{tag === "all" ? `All (${threads.length})` : tagColors[tag]?.label}</button>
              ))}
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "50px 20px", textAlign: "center" }}>
                <Mail size={28} style={{ color: "#3b3b6b", marginBottom: 12 }} />
                <div style={{ color: "#64748b", fontSize: "0.8rem", lineHeight: 1.6 }}>
                  {threads.length === 0 ? "No replies yet.\nReplies from your campaigns\nwill appear here." : "No threads match your filter."}
                </div>
              </div>
            ) : filtered.map((t, i) => (
              <div key={t.id} onClick={() => selectThread(t)} style={{
                padding: "12px 14px", borderBottom: "1px solid #252540", cursor: "pointer",
                background: selected?.id === t.id ? "rgba(99,102,241,0.08)" : "transparent",
                borderLeft: selected?.id === t.id ? "2px solid #6366f1" : "2px solid transparent",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: avatarColors[i % avatarColors.length] + "30",
                    color: avatarColors[i % avatarColors.length],
                    fontSize: "0.65rem", fontWeight: 700, flexShrink: 0,
                  }}>{t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ color: t.read ? "#94a3b8" : "#f1f5f9", fontWeight: t.read ? 500 : 700, fontSize: "0.8rem" }}>{t.name}</span>
                      <span style={{ color: "#64748b", fontSize: "0.65rem" }}>{t.time}</span>
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.subject}</div>
                    <div style={{ color: "#64748b", fontSize: "0.68rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.preview}</div>
                    <div style={{ marginTop: 5, display: "flex", gap: 4, alignItems: "center" }}>
                      {t.tag && tagColors[t.tag] && (
                        <span style={{ fontSize: "0.58rem", fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: tagColors[t.tag].bg, color: tagColors[t.tag].color }}>{tagColors[t.tag].label}</span>
                      )}
                      {!t.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", marginLeft: "auto" }} />}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: conversation */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
              <Mail size={36} style={{ color: "#3b3b6b" }} />
              <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Select a conversation</div>
            </div>
          ) : (
            <>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #252540", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>{selected.name}</div>
                  <div style={{ color: "#64748b", fontSize: "0.72rem" }}>{selected.email} · {selected.campaign}</div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={() => toggleStar(selected.id)} style={{ background: "none", border: "none", cursor: "pointer", color: selected.starred ? "#f59e0b" : "#64748b", padding: 4 }}><Star size={14} /></button>
                  <button onClick={() => archiveThread(selected.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}><Archive size={14} /></button>
                  <button onClick={() => archiveThread(selected.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}><Trash2 size={14} /></button>
                  <select
                    value={selected.tag}
                    onChange={e => setTag(selected.id, e.target.value)}
                    style={{ background: "#1a1a2e", border: "1px solid #252540", borderRadius: 6, color: "#94a3b8", fontSize: "0.72rem", padding: "4px 8px", cursor: "pointer", outline: "none" }}
                  >
                    <option value="">Tag…</option>
                    {Object.entries(tagColors).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                {selected.messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: msg.from === "me" ? "row-reverse" : "row", gap: 12 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: msg.from === "me" ? "#6366f130" : "#a855f730",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.65rem", fontWeight: 700,
                      color: msg.from === "me" ? "#6366f1" : "#a855f7",
                    }}>
                      {msg.from === "me" ? "ME" : selected.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div style={{ maxWidth: "70%" }}>
                      <div style={{
                        background: msg.from === "me" ? "rgba(99,102,241,0.12)" : "#13131f",
                        border: `1px solid ${msg.from === "me" ? "#6366f130" : "#252540"}`,
                        borderRadius: msg.from === "me" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                        padding: "10px 14px",
                      }}>
                        <p style={{ color: "#e2e8f0", fontSize: "0.82rem", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{msg.text}</p>
                      </div>
                      <div style={{ color: "#64748b", fontSize: "0.67rem", marginTop: 4, textAlign: msg.from === "me" ? "right" : "left" }}>
                        {msg.time} {msg.from === "me" && <CheckCheck size={11} style={{ display: "inline", color: "#6366f1", marginLeft: 3 }} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #252540", padding: "14px 20px" }}>
                <div style={{ background: "#13131f", border: "1px solid #252540", borderRadius: 10, overflow: "hidden" }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) sendReply(); }}
                    placeholder={`Reply to ${selected.name}… (Ctrl+Enter to send)`}
                    style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: "0.82rem", padding: "12px 14px", resize: "none", height: 80, lineHeight: 1.6, boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", padding: "8px 12px", borderTop: "1px solid #252540" }}>
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 2 }}><Paperclip size={14} /></button>
                    <div style={{ flex: 1 }} />
                    <button onClick={sendReply} disabled={!replyText.trim()} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
                      borderRadius: 7, border: "none", cursor: replyText.trim() ? "pointer" : "not-allowed",
                      background: replyText.trim() ? "linear-gradient(135deg, #6366f1, #a855f7)" : "#252540",
                      color: replyText.trim() ? "#fff" : "#3b3b6b", fontSize: "0.78rem", fontWeight: 600,
                    }}>
                      <Send size={12} /> Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
