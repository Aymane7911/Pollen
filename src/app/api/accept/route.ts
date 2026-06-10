import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    requireTLS: true,
    tls: { ciphers: "SSLv3" },
    auth: {
      user: process.env.MICROSOFT_EMAIL,
      pass: process.env.MICROSOFT_PASS,
    },
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, fullName } = await req.json();
    if (!email || !fullName) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const transporter = createTransporter();

    const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #ddd8ce;max-width:560px;width:100%;">
        <tr>
          <td style="background:#2d6a4f;padding:36px 40px 28px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;">
              UAE Pollen Atlas
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,.7);letter-spacing:.06em;text-transform:uppercase;">
              Registration accepted
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 14px;font-size:16px;color:#1a2e22;">
              Dear <strong>${fullName}</strong>,
            </p>
            <p style="margin:0 0 14px;font-size:15px;color:#3a4a40;line-height:1.7;">
              We are pleased to inform you that your registration to the
              <strong>UAE Pollen Atlas</strong> has been <strong>accepted</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#3a4a40;line-height:1.7;">
              You now have access to the platform. Visit the link below to get started.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}"
                style="display:inline-block;background:#2d6a4f;color:#fff;padding:12px 28px;
                       border-radius:6px;font-weight:600;font-size:15px;text-decoration:none;">
                Open UAE Pollen Atlas
              </a>
            </div>
            <p style="margin:0;font-size:13px;color:#9aa89f;">
              If you have any questions, reply to this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f7f4ef;border-top:1px solid #e8e4db;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9aa89f;">
              UAE Pollen Atlas · Decision-support system · United Arab Emirates
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || "UAE Pollen Atlas"}" <${process.env.MICROSOFT_EMAIL}>`,
      to: email,
      subject: "Your registration has been accepted — UAE Pollen Atlas",
      html,
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error("[/api/accept] Error:", err);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }
}