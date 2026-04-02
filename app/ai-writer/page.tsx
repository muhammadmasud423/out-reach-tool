"use client";
import DashboardLayout from "@/components/DashboardLayout";
import { Zap, Copy, RefreshCw, ThumbsUp, ThumbsDown, Sparkles, AlertCircle, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const tones = ["Professional", "Friendly", "Direct", "Casual", "Witty", "Authoritative"];
const lengths = ["Ultra-short (1-2 lines)", "Short (3-5 lines)", "Medium (5-8 lines)", "Long (8-12 lines)"];
const industries = ["SaaS", "Agency", "E-commerce", "Legal", "HR Tech", "Finance", "Real Estate", "Healthcare"];
const goals = ["Book a Call", "Get a Reply", "Share a Resource", "Warm Introduction", "Follow-up", "Re-engagement"];

interface Variant {
  subject: string;
  body: string;
}

function extractVariables(text: string): string[] {
  const matches = text.match(/\{[a-z_]+\}/g);
  return matches ? [...new Set(matches)] : [];
}

export default function AIWriterPage() {
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium (5-8 lines)");
  const [industry, setIndustry] = useState("SaaS");
  const [goal, setGoal] = useState("Book a Call");
  const [context, setContext] = useState("");
  const [outputIdx, setOutputIdx] = useState(0);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setApiKey(localStorage.getItem("anthropic_api_key") || "");
  }, []);

  async function handleGenerate() {
    if (!apiKey) {
      setError("No API key found. Go to Settings → AI to add your Anthropic API key.");
      return;
    }
    setError("");
    setVariants([]);
    setStreaming("");
    setLoading(true);
    setOutputIdx(0);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, tone, length, industry, goal, context }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text.replace("ERROR:", "") || "Request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreaming(accumulated);

        if (accumulated.includes("ERROR:")) {
          const msg = accumulated.split("ERROR:")[1]?.trim();
          throw new Error(msg || "AI generation failed");
        }
      }

      // Parse the JSON response
      const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Invalid response format from AI");
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.variants || !Array.isArray(parsed.variants)) {
        throw new Error("Unexpected response structure");
      }
      setVariants(parsed.variants);
      setStreaming("");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!variants[outputIdx]) return;
    const v = variants[outputIdx];
    navigator.clipboard.writeText(`Subject: ${v.subject}\n\n${v.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const currentVariant = variants[outputIdx];
  const allVars = currentVariant ? extractVariables(currentVariant.subject + " " + currentVariant.body) : [];
  const generated = variants.length > 0;

  return (
    <DashboardLayout title="AI Writer" subtitle="Generate high-converting cold emails with Claude AI">
      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, height: "calc(100vh - 160px)" }}>

        {/* Left: controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

          {/* API key warning */}
          {!apiKey && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.5 }}>
                No API key found.{" "}
                <Link href="/settings" style={{ color: "#f87171", fontWeight: 700 }}>
                  Settings → AI
                </Link>{" "}
                to add your Anthropic key.
              </div>
            </div>
          )}

          {/* Context input */}
          <div className="metric-card">
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem", marginBottom: 10 }}>What are you selling?</div>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. ScaleSynq is a cold email automation tool for SaaS founders and agency owners. Key features: AI personalization, warmup, multi-inbox rotation. Competitors: Instantly, Lemlist."
              style={{
                width: "100%", background: "#13131f", border: "1px solid #252540", borderRadius: 8,
                color: "#e2e8f0", fontSize: "0.8rem", padding: "10px 12px",
                resize: "none", height: 100, outline: "none", lineHeight: 1.6, boxSizing: "border-box",
              }}
            />
          </div>

          {/* Tone */}
          <div className="metric-card">
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem", marginBottom: 10 }}>Tone</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tones.map(t => (
                <button key={t} onClick={() => setTone(t)} style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600,
                  border: "1px solid", cursor: "pointer",
                  background: tone === t ? "rgba(6,182,212,0.15)" : "transparent",
                  borderColor: tone === t ? "#06b6d4" : "#252540",
                  color: tone === t ? "#67e8f9" : "#64748b",
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="metric-card">
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem", marginBottom: 10 }}>Email Length</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {lengths.map(l => (
                <button key={l} onClick={() => setLength(l)} style={{
                  padding: "7px 12px", borderRadius: 6, fontSize: "0.76rem", fontWeight: 600,
                  border: "1px solid", cursor: "pointer", textAlign: "left",
                  background: length === l ? "rgba(6,182,212,0.15)" : "transparent",
                  borderColor: length === l ? "#06b6d4" : "#252540",
                  color: length === l ? "#67e8f9" : "#64748b",
                }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Industry */}
          <div className="metric-card">
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem", marginBottom: 10 }}>Target Industry</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {industries.map(ind => (
                <button key={ind} onClick={() => setIndustry(ind)} style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: "0.73rem", fontWeight: 600,
                  border: "1px solid", cursor: "pointer",
                  background: industry === ind ? "rgba(168,85,247,0.15)" : "transparent",
                  borderColor: industry === ind ? "#a855f7" : "#252540",
                  color: industry === ind ? "#d8b4fe" : "#64748b",
                }}>{ind}</button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div className="metric-card">
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.88rem", marginBottom: 10 }}>Email Goal</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {goals.map(g => (
                <button key={g} onClick={() => setGoal(g)} style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: "0.73rem", fontWeight: 600,
                  border: "1px solid", cursor: "pointer",
                  background: goal === g ? "rgba(6,182,212,0.15)" : "transparent",
                  borderColor: goal === g ? "#06b6d4" : "#252540",
                  color: goal === g ? "#67e8f9" : "#64748b",
                }}>{g}</button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !apiKey}
            className={!loading && apiKey ? "btn-primary" : ""}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px", borderRadius: 10, fontSize: "0.88rem", fontWeight: 700,
              border: "none", cursor: loading || !apiKey ? "not-allowed" : "pointer",
              background: loading || !apiKey ? "#1e2235" : undefined,
              color: loading || !apiKey ? "#3b4a6b" : undefined,
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                Generating…
              </>
            ) : (
              <>
                <Zap size={15} />
                Generate Email
              </>
            )}
          </button>
        </div>

        {/* Right: output */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

          {/* Error */}
          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10 }}>
              <AlertCircle size={15} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: "0.8rem", color: "#fca5a5" }}>{error}</span>
            </div>
          )}

          {/* Streaming state */}
          {loading && !generated && (
            <div className="metric-card" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#06b6d4", animation: "pulse 1.2s ease-in-out infinite" }} />
                <span style={{ color: "#67e8f9", fontSize: "0.82rem", fontWeight: 600 }}>Claude is writing your emails…</span>
              </div>
              {streaming && (
                <div style={{ background: "#0d1626", border: "1px solid #1a3050", borderRadius: 8, padding: "14px 16px", maxHeight: 300, overflowY: "auto" }}>
                  <pre style={{ color: "#4a6a8a", fontSize: "0.75rem", lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{streaming}</pre>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!loading && !generated && !error && (
            <div className="metric-card" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(6,182,212,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={28} style={{ color: "#06b6d4" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>AI Email Generator</div>
                <div style={{ color: "#64748b", fontSize: "0.8rem", maxWidth: 320 }}>Configure your options on the left, then click Generate Email to create personalized cold email variations powered by Claude.</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {["Personalization variables", "A/B ready", "Two variants", "CTA optimized"].map(tag => (
                  <span key={tag} style={{ fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: "rgba(6,182,212,0.08)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.2)" }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Generated output */}
          {generated && !loading && (
            <>
              {/* Variant tabs */}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {variants.map((_, i) => (
                  <button key={i} onClick={() => setOutputIdx(i)} style={{
                    padding: "6px 14px", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600,
                    border: "1px solid", cursor: "pointer",
                    background: outputIdx === i ? "rgba(6,182,212,0.15)" : "transparent",
                    borderColor: outputIdx === i ? "#06b6d4" : "#252540",
                    color: outputIdx === i ? "#67e8f9" : "#64748b",
                  }}>Variant {i + 1}</button>
                ))}
                <div style={{ flex: 1 }} />
                <button onClick={handleGenerate} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, background: "transparent", border: "1px solid #252540", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>

              {/* Email output */}
              {currentVariant && (
                <div className="metric-card" style={{ flex: 1 }}>
                  {/* Subject */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject Line</div>
                    <div style={{ background: "#0d1626", border: "1px solid #1a3050", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: "0.88rem", fontWeight: 600 }}>
                      {currentVariant.subject}
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Body</div>
                    <div style={{ background: "#0d1626", border: "1px solid #1a3050", borderRadius: 8, padding: "14px 16px" }}>
                      <pre style={{ color: "#e2e8f0", fontSize: "0.83rem", lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                        {currentVariant.body}
                      </pre>
                    </div>
                  </div>

                  {/* Variables used */}
                  {allVars.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Variables Used</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {allVars.map(v => (
                          <span key={v} style={{ fontSize: "0.72rem", fontWeight: 600, padding: "3px 8px", borderRadius: 5, background: "rgba(6,182,212,0.1)", color: "#67e8f9", border: "1px solid rgba(6,182,212,0.2)" }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleCopy} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                      borderRadius: 8,
                      background: copied ? "rgba(16,185,129,0.15)" : "rgba(6,182,212,0.1)",
                      border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(6,182,212,0.25)"}`,
                      color: copied ? "#10b981" : "#67e8f9", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                    }}>
                      {copied ? "✓ Copied!" : "Copy Email"}
                    </button>
                    <button
                      onClick={() => {
                        if (!currentVariant) return;
                        const text = `Subject: ${currentVariant.subject}\n\n${currentVariant.body}`;
                        const blob = new Blob([text], { type: "text/plain" });
                        const a = document.createElement("a");
                        a.href = URL.createObjectURL(blob);
                        a.download = `email-variant-${outputIdx + 1}.txt`;
                        a.click();
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)", color: "#67e8f9", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      <Zap size={13} /> Export
                    </button>
                    <div style={{ flex: 1 }} />
                    <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid #252540", color: "#64748b", fontSize: "0.78rem", cursor: "pointer" }}>
                      <ThumbsUp size={13} />
                    </button>
                    <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 8, background: "transparent", border: "1px solid #252540", color: "#64748b", fontSize: "0.78rem", cursor: "pointer" }}>
                      <ThumbsDown size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </DashboardLayout>
  );
}
