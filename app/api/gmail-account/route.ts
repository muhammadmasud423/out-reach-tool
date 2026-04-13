import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const email = request.cookies.get("gmail_user")?.value;
  const hasAccess = !!request.cookies.get("gmail_access_token")?.value;
  const hasRefresh = !!request.cookies.get("gmail_refresh_token")?.value;

  if (!email || (!hasAccess && !hasRefresh)) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({ connected: true, email });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("gmail_access_token");
  response.cookies.delete("gmail_refresh_token");
  response.cookies.delete("gmail_user");
  return response;
}
