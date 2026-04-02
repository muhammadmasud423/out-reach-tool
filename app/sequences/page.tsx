"use client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus, Mail, Clock, ArrowDown, Trash2, Edit3,
  Zap, GitBranch, Sparkles, Eye, Reply, Save, Play, X
} from "lucide-react";
import { useState, useEffect } from "react";

interface EmailStep {
  id: string;
  type: "email" | "wait";
  day: number;
  subject?: string;
  body?: string;
  delay?: number;
  delayUnit?: "days" | "hours";
  condition?: string;
}

interface Sequence {
  id: string;
  name: string;
  steps: EmailStep[];
  created: string;
}

const SEQ_KEY = "scalesynq_sequences";

function loadSequences(): Sequence[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(SEQ_KEY) || "[]"); } catch { return []; }
}
function saveSequences(s: Sequence[]) { localStorage.setItem(SEQ_KEY, JSON.stringify(s)); }

const labelStyle: React.CSSProperties = {
  color: "#94a3b8", fontSize: "0.72rem", fontWeight: 600,
  textTransform: "uppercase", letterSpacing: "0.06em",
  marginBottom: 6, display: "block",
};

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const loaded = loadSequences();
    setSequences(loaded);
    if (loaded.length > 0) setActiveId(loaded[0].id);
  }, []);

  const active = sequences.find(s => s.id === activeId) ?? null;
  const activeSteps = active?.steps ?? [];

  function createSequence() {
    if (!newName.trim()) return;
    const seq: Sequence = {
      id: Date.now().toString(),
      name: newName.trim(),
      steps: [],
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    const updated = [seq, ...sequences];
    setSequences(updated);
    saveSequences(updated);
    setActiveId(seq.id);
    setShowNewModal(false);
    setNewName("");
  }

  function updateSequenceName(id: string, name: string) {
    const updated = sequences.map(s => s.id === id ? { ...s, name } : s);
    setSequences(updated);
    saveSequences(updated);
  }

  function deleteSequence(id: string) {
    const updated = sequences.filter(s => s.id !== id);
    setSequences(updated);
    saveSequences(updated);
    setActiveId(updated[0]?.id ?? null);
  }

  function addEmailStep() {
    if (!active) return;
    const lastEmail = activeSteps.filter(s => s.type === "email").at(-1);
    const day = lastEmail ? lastEmail.day + 3 : 0;
    const newStep: EmailStep = {
      id: Date.now().toString(),
      type: "email",
      day,
      subject: "",
      body: "",
    };
    const waitStep: EmailStep = {
      id: Date.now().toString() + "_w",
      type: "wait",
      day,
      delay: 3,
      delayUnit: "days",
      condition: "If no reply",
    };
    const newSteps = activeSteps.length === 0
      ? [newStep]
      : [...activeSteps, waitStep, newStep];

    const updated = sequences.map(s =>
      s.id === activeId ? { ...s, steps: newSteps } : s
    );
    setSequences(updated);
    saveSequences(updated);
    setSelectedStep(newStep.id);
  }

  function deleteStep(stepId: string) {
    if (!active) return;
    // Remove the step and the wait before it (if any)
    const idx = activeSteps.findIndex(s => s.id === stepId);
    let newSteps = [...activeSteps];
    newSteps.splice(idx, 1);
    // If the step before the removed one is a wait, remove it too
    if (idx > 0 && newSteps[idx - 1]?.type === "wait") {
      newSteps.splice(idx - 1, 1);
    }
    const updated = sequences.map(s => s.id === activeId ? { ...s, steps: newSteps } : s);
    setSequences(updated);
    saveSequences(updated);
    if (selectedStep === stepId) setSelectedStep(null);
  }

  function updateStep(stepId: string, changes: Partial<EmailStep>) {
    if (!active) return;
    const updated = sequences.map(s =>
      s.id !== activeId ? s : {
        ...s,
        steps: s.steps.map(step => step.id === stepId ? { ...step, ...changes } : step),
      }
    );
    setSequences(updated);
    saveSequences(updated);
  }

  const selectedStepObj = activeSteps.find(s => s.id === selectedStep && s.type === "email") ?? null;
  const emailSteps = activeSteps.filter(s => s.type === "email");

  return (
    <DashboardLayout title="Sequence Builder" subtitle="Build intelligent multi-step email sequences">
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", gap: 16, height: "calc(100vh - 130px)" }}>

        {/* Left: Sequence list */}
        <div className="metric-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #252540", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.85rem" }}>My Sequences</span>
            <button className="btn-primary" onClick={() => setShowNewModal(true)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", border: "none" }}>
              <Plus size={11} /> New
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: sequences.length ? 10 : 0 }}>
            {sequences.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center" }}>
                <Zap size={24} style={{ color: "#3b3b6b", marginBottom: 10 }} />
                <div style={{ color: "#64748b", fontSize: "0.78rem", lineHeight: 1.5 }}>No sequences yet.<br />Click <strong>New</strong> to create one.</div>
              </div>
            ) : sequences.map(seq => (
              <div key={seq.id} onClick={() => { setActiveId(seq.id); setSelectedStep(null); }} style={{
                padding: "12px 14px", borderRadius: 8, marginBottom: 6, cursor: "pointer",
                background: activeId === seq.id ? "rgba(99,102,241,0.12)" : "transparent",
                border: `1px solid ${activeId === seq.id ? "rgba(99,102,241,0.3)" : "transparent"}`,
                transition: "all 0.15s",
              }}>
                <div style={{ color: "#e2e8f0", fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>{seq.name}</div>
                <div style={{ display: "flex", gap: 8, fontSize: "0.7rem", color: "#64748b", alignItems: "center" }}>
                  <span>{seq.steps.filter(s => s.type === "email").length} email{seq.steps.filter(s => s.type === "email").length !== 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{seq.created}</span>
                  <button onClick={e => { e.stopPropagation(); deleteSequence(seq.id); }} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0 }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Builder */}
        <div className="metric-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {!active ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
              <Zap size={36} style={{ color: "#3b3b6b" }} />
              <div style={{ color: "#64748b", fontSize: "0.85rem" }}>Select or create a sequence to start building</div>
              <button className="btn-primary" onClick={() => setShowNewModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, border: "none", cursor: "pointer" }}>
                <Plus size={13} /> Create Sequence
              </button>
            </div>
          ) : (
            <>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #252540", display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  value={active.name}
                  onChange={e => updateSequenceName(active.id, e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem", flex: 1 }}
                />
                <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, background: "#252540", border: "none", color: "#94a3b8", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                  <Sparkles size={13} style={{ color: "#a855f7" }} /> AI Optimize
                </button>
                <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", border: "none" }}>
                  <Save size={13} /> Saved
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {emailSteps.length === 0 && (
                  <div style={{ textAlign: "center", padding: "30px 0", color: "#64748b", fontSize: "0.82rem" }}>
                    No steps yet — add your first email below.
                  </div>
                )}

                {activeSteps.map((step) => (
                  <div key={step.id}>
                    {step.type === "email" && (
                      <div onClick={() => setSelectedStep(step.id)} className="sequence-step" style={{
                        borderColor: selectedStep === step.id ? "rgba(99,102,241,0.5)" : "#252540",
                        boxShadow: selectedStep === step.id ? "0 0 16px rgba(99,102,241,0.15)" : "none",
                      }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Mail size={15} style={{ color: "#6366f1" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: "#a5b4fc", fontSize: "0.7rem", fontWeight: 700, marginBottom: 3 }}>
                              {step.day === 0 ? "DAY 0 — INITIAL EMAIL" : `DAY ${step.day} — FOLLOW-UP`}
                            </div>
                            <div style={{ color: step.subject ? "#e2e8f0" : "#64748b", fontWeight: 600, fontSize: "0.84rem", marginBottom: 3 }}>
                              {step.subject || "No subject — click to edit"}
                            </div>
                            <div style={{ color: "#64748b", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {step.body ? step.body.slice(0, 60) + "…" : "No body content"}
                            </div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); deleteStep(step.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 2 }}>
                            <Trash2 size={13} style={{ color: "#ef4444" }} />
                          </button>
                        </div>
                      </div>
                    )}
                    {step.type === "wait" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", paddingLeft: 17 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <div style={{ width: 1, height: 10, background: "#252540" }} />
                          <ArrowDown size={13} style={{ color: "#3b3b6b" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#13131f", border: "1px dashed #252540", borderRadius: 8, padding: "6px 12px", fontSize: "0.75rem" }}>
                          <Clock size={12} style={{ color: "#f59e0b" }} />
                          <span style={{ color: "#94a3b8" }}>Wait <strong style={{ color: "#fcd34d" }}>{step.delay} {step.delayUnit}</strong></span>
                          <span style={{ color: "#3b3b6b", margin: "0 4px" }}>·</span>
                          <GitBranch size={11} style={{ color: "#a855f7" }} />
                          <span style={{ color: "#94a3b8" }}>{step.condition}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button onClick={addEmailStep} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "10px", borderRadius: 8, background: "rgba(99,102,241,0.07)",
                    border: "1px dashed rgba(99,102,241,0.3)", color: "#6366f1",
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                  }}>
                    <Plus size={13} /> Add Email Step
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right: Step editor */}
        <div className="metric-card" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid #252540" }}>
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "0.85rem" }}>
              {selectedStepObj ? "Edit Step" : "Step Settings"}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
            {!selectedStepObj ? (
              <div style={{ color: "#64748b", fontSize: "0.8rem", textAlign: "center", padding: "30px 0" }}>
                Click an email step to edit it.
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Subject Line</label>
                  <input
                    className="input-field"
                    value={selectedStepObj.subject ?? ""}
                    onChange={e => updateStep(selectedStepObj.id, { subject: e.target.value })}
                    placeholder="e.g. Quick question about {{company}}"
                  />
                  <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                    {["{{first_name}}", "{{company}}", "{{title}}"].map(v => (
                      <span key={v} onClick={() => updateStep(selectedStepObj.id, { subject: (selectedStepObj.subject ?? "") + v })} style={{
                        background: "#252540", color: "#a5b4fc", fontSize: "0.65rem",
                        padding: "3px 8px", borderRadius: 4, cursor: "pointer", fontFamily: "monospace",
                      }}>{v}</span>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email Body</label>
                  <textarea
                    className="input-field"
                    rows={10}
                    value={selectedStepObj.body ?? ""}
                    onChange={e => updateStep(selectedStepObj.id, { body: e.target.value })}
                    placeholder={`Hi {{first_name}},\n\n[Your message here]\n\nBest,\n[Your name]`}
                    style={{ resize: "vertical", lineHeight: 1.6, fontSize: "0.82rem" }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Conditions</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {["Stop if replied", "Stop if bounced", "Stop if unsubscribed", "Skip weekends"].map(opt => (
                      <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.8rem", color: "#94a3b8" }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: "#6366f1" }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <button className="btn-primary" style={{ width: "100%", padding: "10px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", border: "none" }}>
                  <Sparkles size={14} /> Generate with AI
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New Sequence Modal */}
      {showNewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#13131f", border: "1px solid #252540", borderRadius: 12, padding: "24px 28px", width: 380 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem" }}>New Sequence</span>
              <button onClick={() => setShowNewModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}><X size={16} /></button>
            </div>
            <label style={labelStyle}>Sequence Name</label>
            <input
              className="input-field"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createSequence()}
              placeholder="e.g. SaaS Cold Outreach"
              autoFocus
              style={{ marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowNewModal(false)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #252540", background: "transparent", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem" }}>Cancel</button>
              <button onClick={createSequence} disabled={!newName.trim()} className={newName.trim() ? "btn-primary" : ""} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: newName.trim() ? undefined : "#252540", color: newName.trim() ? undefined : "#3b3b6b", cursor: newName.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.82rem" }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
