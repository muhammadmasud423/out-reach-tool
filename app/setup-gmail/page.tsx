"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupGmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function setup() {
      try {
        const res = await fetch("/api/gmail-account");
        const data = await res.json();

        if (!data.connected || !data.email) {
          setErrorMsg("Could not retrieve Gmail account. Please try again.");
          setStatus("error");
          return;
        }

        const email: string = data.email;

        // Load existing inboxes
        const existing = JSON.parse(
          localStorage.getItem("scalesynq_inboxes") || "[]"
        ) as any[];

        // Remove any previous OAuth2 inbox for this exact email
        const filtered = existing.filter(
          (i: any) => !(i.authType === "oauth2" && i.smtpUser === email)
        );

        const inboxId = `gmail-oauth-${Date.now()}`;

        // Match the exact shape settings/campaigns pages expect
        const newInbox = {
          id: inboxId,
          email,
          fromName: email.split("@")[0],
          provider: "Gmail",
          smtpHost: "smtp.gmail.com",
          smtpPort: 465,
          smtpUser: email,
          dailyLimit: 500,
          warmup: false,
          status: "connected",
          connected: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          // Extra flag so we know this inbox uses OAuth2 (not an App Password)
          authType: "oauth2",
        };

        filtered.push(newInbox);
        localStorage.setItem("scalesynq_inboxes", JSON.stringify(filtered));

        // Store the sentinel so the campaigns page can find the "password"
        // and pass it to the send-email API, which treats "__OAUTH2__" specially
        localStorage.setItem(`smtp_pass_${inboxId}`, "__OAUTH2__");

        router.replace("/settings?tab=inboxes&gmail=connected");
      } catch {
        setErrorMsg("Something went wrong while connecting Gmail.");
        setStatus("error");
      }
    }

    setup();
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#071526",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ textAlign: "center" }}>
        {status === "loading" ? (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "3px solid #0f2842",
                borderTop: "3px solid #22d3ee",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: "1rem" }}>
              Connecting your Gmail…
            </div>
            <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: 6 }}>
              Setting up your outreach inbox
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>⚠️</div>
            <div style={{ color: "#fca5a5", fontWeight: 600, marginBottom: 8 }}>
              {errorMsg}
            </div>
            <button
              onClick={() => router.push("/login")}
              style={{
                background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 20px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.88rem",
              }}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
