import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import nodemailer from "nodemailer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegistrationBody {
  fullName: string;
  profession: string;
  organisation: string;
  email: string;
  phone: string;
}

// ─── Google Sheets ────────────────────────────────────────────────────────────

function getGoogleAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function appendToSheet(data: RegistrationBody): Promise<void> {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const timestamp = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai" });

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID!,
    range: "Sheet1!A:G",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        data.fullName,
        data.profession,
        data.organisation,
        data.email,
        data.phone,
        "pending",   // owner changes this to "accepted" → Apps Script fires acceptance email
        timestamp,
      ]],
    },
  });
}

// ─── Microsoft 365 SMTP transporter ──────────────────────────────────────────
//
//  Uses smtp.office365.com:587 with STARTTLS (secure: false).
//  Your IT admin must enable "Authenticated SMTP" for your @frc.ae account:
//    Microsoft 365 Admin Center → Users → [your user] → Mail → Manage email apps
//    → tick "Authenticated SMTP" → Save.
//
//  If MFA is active on your account, generate an App Password at:
//    https://mysignins.microsoft.com/security-info → Add method → App password

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,          // STARTTLS — required by Office 365, NOT SSL on 465
    requireTLS: true,       // force upgrade to TLS even if server advertises it as optional
    tls: {
      ciphers: "SSLv3",     // Office 365 compatibility
    },
    auth: {
      user: process.env.MICROSOFT_EMAIL,   // e.g.  yourname@frc.ae
      pass: process.env.MICROSOFT_PASS,    // your password or App Password if MFA is on
    },
  });
}

// ─── Confirmation email (sent to user on submission) ─────────────────────────

async function sendConfirmationEmail(to: string, fullName: string): Promise<void> {
  const transporter = createTransporter();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0ede6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:10px;overflow:hidden;border:1px solid #ddd8ce;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#2d6a4f;padding:36px 40px 28px;text-align:center;">
            <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;margin-bottom:6px;">UAE Pollen Atlas</div>
            <div style="font-size:13px;color:rgba(255,255,255,.7);letter-spacing:.06em;text-transform:uppercase;">Registration received</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 14px;font-size:16px;color:#1a2e22;">Dear <strong>${fullName}</strong>,</p>
            <p style="margin:0 0 14px;font-size:15px;color:#3a4a40;line-height:1.7;">
              Thank you for submitting your registration to the UAE Pollen Atlas. We have received your details and your application is now <strong>under review</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#3a4a40;line-height:1.7;">
              Our team will carefully review your information. You will receive a further email once a decision has been made — please allow a few business days.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ef;border:1px solid #e8e4db;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
              <tr>
                <td style="font-size:12px;color:#6a8a72;font-weight:600;text-transform:uppercase;letter-spacing:.06em;padding-bottom:8px;">Application status</td>
              </tr>
              <tr>
                <td>
                  <span style="display:inline-block;background:#fff8e6;color:#92400e;border:1px solid #f0d580;font-size:13px;font-weight:600;padding:4px 14px;border-radius:999px;">⏳ Pending review</span>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#9aa89f;line-height:1.6;">
              If you have any questions, please reply to this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f7f4ef;border-top:1px solid #e8e4db;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9aa89f;">UAE Pollen Atlas · Decision-support system · United Arab Emirates</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"${process.env.FROM_NAME || "UAE Pollen Atlas"}" <${process.env.MICROSOFT_EMAIL}>`,
    to,
    subject: "Registration received — UAE Pollen Atlas",
    html,
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: RegistrationBody = await req.json();
    const { fullName, profession, organisation, email, phone } = body;

    if (!fullName || !profession || !organisation || !email || !phone) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // 1. Save to Google Sheets (status: pending)
    await appendToSheet({ fullName, profession, organisation, email, phone });

    // 2. Send confirmation email via Microsoft 365
    await sendConfirmationEmail(email, fullName);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (err) {
    console.error("[/api/register] Error:", err);
    return NextResponse.json(
      { error: "An internal server error occurred. Please try again." },
      { status: 500 }
    );
  }
}