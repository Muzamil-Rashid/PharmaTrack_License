const nodemailer = require('nodemailer');

// ==========================================================
// EMAIL NOTIFICATIONS — sent automatically right after a license is
// generated (both free trial and paid plans).
//
// Uses Gmail SMTP with an "App Password" (not your regular Gmail
// password). One-time setup:
//   1. On the Gmail account you want to send FROM, enable 2-Step
//      Verification: https://myaccount.google.com/security
//   2. Create an App Password: https://myaccount.google.com/apppasswords
//      (choose "Mail" as the app type)
//   3. Set GMAIL_USER to that Gmail address, and GMAIL_APP_PASSWORD to
//      the 16-character App Password it gives you (no spaces).
//
// ADMIN_NOTIFICATION_EMAIL is where the internal "new license issued"
// copy is sent — this can be the same address as GMAIL_USER, or a
// different inbox (e.g. the email your Supabase project is registered
// under).
// ==========================================================

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

function formatDate(msEpoch) {
  return new Date(msEpoch).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(msEpoch) {
  return new Date(msEpoch).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ---------- Customer email ----------
function buildCustomerEmail({ fullName, planName, licenseKey, expiresAt, requestCode, supportEmail }) {
  const safeName = fullName || 'there';
  const expiryDate = formatDate(expiresAt);

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #10231F;">
    <div style="background: linear-gradient(135deg, #0A5C4C, #0E7C66); padding: 26px 32px; border-radius: 14px 14px 0 0;">
      <span style="color: #ffffff; font-size: 20px; font-weight: bold;">PharmaTrack</span>
    </div>
    <div style="background: #ffffff; border: 1px solid #DCE6E1; border-top: none; padding: 32px; border-radius: 0 0 14px 14px;">
      <h2 style="margin-top: 0; font-size: 21px;">🎉 Congratulations, ${safeName}!</h2>
      <p style="font-size: 14.5px; line-height: 1.6;">Thank you for choosing PharmaTrack. Your license has been generated and is ready to use.</p>

      <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #52645F; margin: 20px 0 4px;">Plan</div>
      <div style="font-size: 15px; font-weight: 600;">${planName}</div>

      <div style="background: #F2F6F3; border: 1.5px dashed #0E7C66; border-radius: 10px; padding: 18px 20px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #52645F; margin-bottom: 6px;">License Key</div>
        <div style="font-family: 'Courier New', monospace; font-size: 13.5px; font-weight: 600; color: #0A5C4C; word-break: break-all; line-height: 1.7;">${licenseKey}</div>
      </div>

      <table style="width: 100%; border-collapse: separate; border-spacing: 8px 0; margin: 4px 0 20px;">
        <tr>
          <td style="background: #F2F6F3; border-radius: 8px; padding: 10px 12px; width: 50%;">
            <div style="color: #52645F; font-size: 10.5px; text-transform: uppercase; font-weight: 700;">Valid Until</div>
            <div style="font-weight: 600; margin-top: 3px; font-size: 13px;">${expiryDate}</div>
          </td>
          <td style="background: #F2F6F3; border-radius: 8px; padding: 10px 12px; width: 50%;">
            <div style="color: #52645F; font-size: 10.5px; text-transform: uppercase; font-weight: 700;">Request Code</div>
            <div style="font-weight: 600; margin-top: 3px; font-family: monospace; font-size: 10.5px; word-break: break-all;">${requestCode}</div>
          </td>
        </tr>
      </table>

      <p style="font-size: 13.5px; color: #52645F; line-height: 1.6;">💡 Keep this email somewhere safe — if you ever lose your license key, you can always come back here to copy it again.</p>
      <p style="font-size: 14px; line-height: 1.6;">To activate: open PharmaTrack, paste the License Key above into the "Enter License Key" field, and click <strong>Activate Software</strong>.</p>

      <p style="margin-top: 26px; font-size: 14px;">Thank you for trusting PharmaTrack with your pharmacy!</p>

      <hr style="border: none; border-top: 1px solid #DCE6E1; margin: 24px 0 16px;">
      <p style="font-size: 12px; color: #52645F; line-height: 1.6;">
        Need help? Contact us at <a href="mailto:${supportEmail}" style="color: #0A5C4C;">${supportEmail}</a><br>
        PharmaTrack by ePine Business Solutions
      </p>
    </div>
  </div>`;

  const text =
`Congratulations, ${safeName}!

Thank you for choosing PharmaTrack. Your license has been generated and is ready to use.

Plan: ${planName}
License Key: ${licenseKey}
Valid Until: ${expiryDate}
Request Code: ${requestCode}

To activate: open PharmaTrack, paste the License Key above into the "Enter License Key" field, and click Activate Software.

Keep this email somewhere safe -- if you ever lose your license key, you can always come back here to copy it again.

Thank you for trusting PharmaTrack with your pharmacy!

Need help? Contact ${supportEmail}
PharmaTrack by ePine Business Solutions`;

  return { html, text };
}

// ---------- Admin notification email ----------
function buildAdminEmail({ fullName, email, mobile, planName, licenseKey, expiresAt, requestCode, issuedAt }) {
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #10231F;">
    <h2 style="color: #0A5C4C; font-size: 19px;">New License Issued</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
      <tr><td style="padding: 7px 0; color: #52645F; width: 170px;">Customer Name</td><td style="padding: 7px 0; font-weight: 600;">${fullName || '—'}</td></tr>
      <tr><td style="padding: 7px 0; color: #52645F;">Email</td><td style="padding: 7px 0; font-weight: 600;">${email || '—'}</td></tr>
      <tr><td style="padding: 7px 0; color: #52645F;">Mobile</td><td style="padding: 7px 0; font-weight: 600;">${mobile || '—'}</td></tr>
      <tr><td style="padding: 7px 0; color: #52645F;">Plan</td><td style="padding: 7px 0; font-weight: 600;">${planName}</td></tr>
      <tr><td style="padding: 7px 0; color: #52645F; vertical-align: top;">License Key</td><td style="padding: 7px 0; font-family: monospace; font-size: 11.5px; word-break: break-all;">${licenseKey}</td></tr>
      <tr><td style="padding: 7px 0; color: #52645F;">Issued At</td><td style="padding: 7px 0; font-weight: 600;">${formatDateTime(issuedAt)}</td></tr>
      <tr><td style="padding: 7px 0; color: #52645F;">Expires</td><td style="padding: 7px 0; font-weight: 600;">${formatDate(expiresAt)}</td></tr>
      <tr><td style="padding: 7px 0; color: #52645F; vertical-align: top;">Machine ID (Request Code)</td><td style="padding: 7px 0; font-family: monospace; font-size: 10.5px; word-break: break-all;">${requestCode}</td></tr>
    </table>
  </div>`;

  const text =
`New License Issued

Customer Name: ${fullName || '—'}
Email: ${email || '—'}
Mobile: ${mobile || '—'}
Plan: ${planName}
License Key: ${licenseKey}
Issued At: ${formatDateTime(issuedAt)}
Expires: ${formatDate(expiresAt)}
Machine ID (Request Code): ${requestCode}`;

  return { html, text };
}

/**
 * Sends both notification emails (customer + admin) for a freshly-issued
 * license. Safe to call without awaiting critically -- callers should
 * still wrap this in try/catch so an email failure never blocks the
 * license response, since the license itself is already saved by the
 * time this runs.
 */
async function sendLicenseNotificationEmails({ customer, planName, licenseKey, expiresAt, requestCode }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Email not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing) — skipping notification emails.');
    return;
  }

  const mailer = getTransporter();
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.GMAIL_USER;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER;
  const issuedAt = Date.now();

  const customerMsg = buildCustomerEmail({
    fullName: customer.fullName, planName, licenseKey, expiresAt, requestCode, supportEmail,
  });
  const adminMsg = buildAdminEmail({
    fullName: customer.fullName, email: customer.email, mobile: customer.mobile,
    planName, licenseKey, expiresAt, requestCode, issuedAt,
  });

  // Promise.allSettled so a bad customer email address (say) doesn't
  // prevent the admin copy from going out, and vice versa.
  const results = await Promise.allSettled([
    customer.email
      ? mailer.sendMail({
          from: `"PharmaTrack" <${process.env.GMAIL_USER}>`,
          to: customer.email,
          subject: 'Your PharmaTrack License is Ready 🎉',
          html: customerMsg.html,
          text: customerMsg.text,
        })
      : Promise.reject(new Error('No customer email address on file.')),
    mailer.sendMail({
      from: `"PharmaTrack Notifications" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `New License Issued — ${planName} (${customer.fullName || 'Unknown'})`,
      html: adminMsg.html,
      text: adminMsg.text,
    }),
  ]);

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`${i === 0 ? 'Customer' : 'Admin'} notification email failed:`, result.reason);
    }
  });
}

module.exports = { sendLicenseNotificationEmails };
