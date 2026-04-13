"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Zap, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [gmailLoading, setGmailLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err === "gmail_denied") setError("Gmail sign-in was cancelled.");
    else if (err === "gmail_token_failed") setError("Failed to connect Gmail. Please try again.");
    else if (err === "gmail_no_email" || err === "gmail_userinfo_failed") setError("Could not retrieve your Gmail address. Please try again.");
    else if (err) setError("Gmail connection failed. Please try again.");
  }, [searchParams]);

  function handleGmailLogin() {
    setGmailLoading(true);
    window.location.href = "/api/auth/google";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Incorrect password.");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#071526",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 400,
        background: "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        width: "100%",
        maxWidth: 400,
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            boxShadow: "0 4px 24px rgba(6,182,212,0.35)",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
            </svg>
          </div>
          <div style={{ color: "#f1f5f9", fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>
            ScaleSynq
          </div>
          <div style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.1em", marginTop: 2 }}>
            OUTREACH
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "#081a2d",
          border: "1px solid #0f2842",
          borderRadius: 16,
          padding: "32px 28px",
        }}>
          <div style={{ marginBottom: 24, textAlign: "center" }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "rgba(6,182,212,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <Lock size={18} style={{ color: "#22d3ee" }} />
            </div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>
              Welcome back
            </div>
            <div style={{ color: "#64748b", fontSize: "0.78rem" }}>
              Enter your password to access the dashboard
            </div>
          </div>

          {/* Gmail OAuth Button */}
          <button
            type="button"
            onClick={handleGmailLogin}
            disabled={gmailLoading || loading}
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: 8,
              border: "1px solid #1e3a5f",
              background: gmailLoading ? "#0b2036" : "#0d2540",
              color: gmailLoading ? "#1a3d64" : "#f1f5f9",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: (gmailLoading || loading) ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "all 0.2s",
              fontFamily: "Inter, sans-serif",
              marginBottom: 20,
            }}
            onMouseEnter={e => { if (!gmailLoading && !loading) (e.currentTarget as HTMLButtonElement).style.background = "#112d4e"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = gmailLoading ? "#0b2036" : "#0d2540"; }}
          >
            {gmailLoading ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                Connecting Gmail…
              </>
            ) : (
              <>
                {/* Google G icon */}
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                  <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.6 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" fill="#FFC107"/>
                  <path d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" fill="#FF3D00"/>
                  <path d="M24 44c5.2 0 9.8-2 13.2-5.2l-6.1-5.2C29.2 35.4 26.7 36 24 36c-5.2 0-9.6-3.4-11.2-8L6.1 33c3.3 6.5 10 11 17.9 11z" fill="#4CAF50"/>
                  <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l6.1 5.2C36.9 36.2 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" fill="#1976D2"/>
                </svg>
                Continue with Gmail
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          }}>
            <div style={{ flex: 1, height: 1, background: "#0f2842" }} />
            <span style={{ color: "#334155", fontSize: "0.72rem", fontWeight: 500, whiteSpace: "nowrap" }}>
              or sign in with password
            </span>
            <div style={{ flex: 1, height: 1, background: "#0f2842" }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", color: "#94a3b8", fontSize: "0.72rem",
                fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7,
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password"
                  autoFocus
                  style={{
                    width: "100%",
                    background: "#0b2036",
                    border: `1px solid ${error ? "#ef4444" : "#0f2842"}`,
                    borderRadius: 8,
                    color: "#f1f5f9",
                    padding: "11px 40px 11px 14px",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s",
                    fontFamily: "Inter, sans-serif",
                  }}
                  onFocus={e => { if (!error) e.target.style.borderColor = "#22d3ee"; }}
                  onBlur={e => { if (!error) e.target.style.borderColor = "#0f2842"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: "absolute", right: 12, top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none",
                    cursor: "pointer", color: "#64748b", padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && (
                <div style={{ color: "#fca5a5", fontSize: "0.75rem", marginTop: 7, display: "flex", alignItems: "center", gap: 5 }}>
                  <span>⚠</span> {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 8,
                border: "none",
                background: (loading || !password)
                  ? "#0f2842"
                  : "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
                color: (loading || !password) ? "#1a3d64" : "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: (loading || !password) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
                  Signing in…
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", color: "#1a3d64", fontSize: "0.7rem", marginTop: 20 }}>
          ScaleSynq Outreach Platform
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
