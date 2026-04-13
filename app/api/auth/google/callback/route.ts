import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=gmail_denied`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  // Exchange authorization code for tokens
  let tokenData: any;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokenData = await tokenRes.json();
  } catch {
    return NextResponse.redirect(`${baseUrl}/login?error=gmail_token_failed`);
  }

  if (!tokenData.access_token) {
    return NextResponse.redirect(`${baseUrl}/login?error=gmail_token_failed`);
  }

  // Get Gmail user info
  let email = "";
  try {
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    email = userData.email || "";
  } catch {
    return NextResponse.redirect(`${baseUrl}/login?error=gmail_userinfo_failed`);
  }

  if (!email) {
    return NextResponse.redirect(`${baseUrl}/login?error=gmail_no_email`);
  }

  const response = NextResponse.redirect(`${baseUrl}/setup-gmail`);

  // Set auth cookie (marks user as logged in)
  response.cookies.set("ss_auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  // Store OAuth tokens securely (httpOnly)
  response.cookies.set("gmail_access_token", tokenData.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 3600, // 1 hour — refreshed automatically
  });

  if (tokenData.refresh_token) {
    response.cookies.set("gmail_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Store email in a readable cookie so the browser can use it
  response.cookies.set("gmail_user", email, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
