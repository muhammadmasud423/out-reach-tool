import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPass } = await request.json();

    if (!smtpHost || !smtpUser || !smtpPass) {
      return Response.json({ ok: false, error: "Missing credentials." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
    });

    await transporter.verify();
    return Response.json({ ok: true });
  } catch (err: any) {
    const msg = err?.message ?? "Connection failed.";
    // Surface friendly errors for common mistakes
    const friendly =
      msg.includes("Invalid login") || msg.includes("Username and Password")
        ? "Invalid credentials. For Gmail, use an App Password (not your Google password)."
        : msg.includes("ECONNREFUSED") || msg.includes("ETIMEDOUT")
        ? `Cannot reach ${(await request.clone().json().catch(() => ({})) as any)?.smtpHost ?? "SMTP host"}. Check the host/port.`
        : msg;
    return Response.json({ ok: false, error: friendly }, { status: 400 });
  }
}
