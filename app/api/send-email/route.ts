import { NextRequest } from "next/server";
import nodemailer from "nodemailer";

async function getValidAccessToken(
  refreshToken: string
): Promise<string | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      smtpHost, smtpPort, smtpUser, smtpPass,
      fromEmail, fromName,
      toEmail,
      subject, body,
    } = await request.json();

    if (!toEmail || !subject || !body) {
      return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    // Gmail OAuth2 path
    if (smtpPass === "__OAUTH2__") {
      let accessToken = request.cookies.get("gmail_access_token")?.value;
      const refreshToken = request.cookies.get("gmail_refresh_token")?.value;

      // Refresh if access token is missing/expired
      if (!accessToken && refreshToken) {
        accessToken = await getValidAccessToken(refreshToken) || undefined;
      }

      if (!accessToken) {
        return Response.json(
          { ok: false, error: "Gmail session expired. Please reconnect via the login page." },
          { status: 401 }
        );
      }

      const gmailUser = smtpUser || request.cookies.get("gmail_user")?.value;
      if (!gmailUser) {
        return Response.json({ ok: false, error: "Gmail user not found." }, { status: 400 });
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          type: "OAuth2",
          user: gmailUser,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: refreshToken || "",
          accessToken,
        } as any,
      });

      await transporter.sendMail({
        from: fromName
          ? `"${fromName}" <${fromEmail || gmailUser}>`
          : fromEmail || gmailUser,
        to: toEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, "<br>"),
      });

      return Response.json({ ok: true });
    }

    // Standard SMTP path
    if (!smtpHost || !smtpUser || !smtpPass) {
      return Response.json({ ok: false, error: "Missing SMTP credentials." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
    });

    await transporter.sendMail({
      from: fromName
        ? `"${fromName}" <${fromEmail || smtpUser}>`
        : fromEmail || smtpUser,
      to: toEmail,
      subject,
      text: body,
      html: body.replace(/\n/g, "<br>"),
    });

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message ?? "Send failed." }, { status: 500 });
  }
}
