import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const {
      smtpHost, smtpPort, smtpUser, smtpPass,
      fromEmail, fromName,
      toEmail,
      subject, body,
    } = await request.json();

    if (!smtpHost || !smtpUser || !smtpPass || !toEmail || !subject || !body) {
      return Response.json({ ok: false, error: "Missing required fields." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort) || 587,
      secure: Number(smtpPort) === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 10000,
    });

    await transporter.sendMail({
      from: fromName ? `"${fromName}" <${fromEmail || smtpUser}>` : (fromEmail || smtpUser),
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
