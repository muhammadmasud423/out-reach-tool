import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (!clientId || clientId === "your_google_client_id_here") {
    return new Response(
      `<html><body style="font-family:sans-serif;background:#071526;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
        <div style="text-align:center;max-width:480px;padding:32px">
          <div style="font-size:2rem;margin-bottom:16px">⚙️</div>
          <h2 style="margin:0 0 12px">Google OAuth Not Configured</h2>
          <p style="color:#94a3b8;margin:0 0 24px">Add your Google Client ID and Secret to <code style="background:#0f2842;padding:2px 6px;border-radius:4px">.env.local</code> to enable Gmail login.</p>
          <a href="/login" style="color:#22d3ee;text-decoration:none">← Back to Login</a>
        </div>
      </body></html>`,
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }

  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const scopes = [
    "https://mail.google.com/",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent select_account");

  return NextResponse.redirect(authUrl.toString());
}
