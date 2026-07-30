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
  const logoUrl = 'https://pharma-track-license.vercel.app/FT_Logo.png';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PharmaTrack License</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #F2F6F3; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #DCE6E1; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <div style="background: linear-gradient(135deg, #0A5C4C, #0E7C66); padding: 30px; text-align: center; border-bottom: 3px solid #0E7C66;">
      <img src="${logoUrl}" alt="PharmaTrack Logo" style="width: 70px; height: 70px; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: bold; letter-spacing: 0.5px;">PharmaTrack</h1>
    </div>

    <div style="padding: 35px 30px; color: #10231F;">
      <h2 style="margin-top: 0; font-size: 22px; color: #0A5C4C;">Dear ${safeName},</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #333333; margin-bottom: 24px;">Thank you for choosing PharmaTrack. Your license key has been successfully generated and is ready for activation.</p>

      <div style="background: #F8FAF9; border: 1px solid #E2E8E5; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #52645F; margin-bottom: 4px;">Plan Selected</div>
        <div style="font-size: 16px; font-weight: 600; color: #10231F; margin-bottom: 16px;">${planName}</div>

        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #52645F; margin-bottom: 4px;">License Key</div>
        <div style="background: #ffffff; border: 1.5px dashed #0E7C66; border-radius: 8px; padding: 14px; text-align: center; font-family: 'Courier New', monospace; font-size: 14px; font-weight: 600; color: #0A5C4C; word-break: break-all; margin-bottom: 4px;">${licenseKey}</div>
      </div>

      <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-left: -12px; margin-bottom: 28px;">
        <tr>
          <td style="background: #F8FAF9; border: 1px solid #E2E8E5; border-radius: 8px; padding: 12px 16px; width: 50%;">
            <div style="color: #52645F; font-size: 10.5px; text-transform: uppercase; font-weight: 700;">Valid Until</div>
            <div style="font-weight: 600; margin-top: 4px; font-size: 14px; color: #10231F;">${expiryDate}</div>
          </td>
          <td style="background: #F8FAF9; border: 1px solid #E2E8E5; border-radius: 8px; padding: 12px 16px; width: 50%;">
            <div style="color: #52645F; font-size: 10.5px; text-transform: uppercase; font-weight: 700;">Request Code</div>
            <div style="font-weight: 600; margin-top: 4px; font-family: monospace; font-size: 11.5px; word-break: break-all; color: #10231F;">${requestCode}</div>
          </td>
        </tr>
      </table>

      <h3 style="font-size: 16px; color: #0A5C4C; margin-top: 0; margin-bottom: 12px;">How to Activate:</h3>
      <ol style="font-size: 14.5px; line-height: 1.6; color: #333333; padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;">Open your PharmaTrack software.</li>
        <li style="margin-bottom: 8px;">Navigate to the License Activation screen.</li>
        <li style="margin-bottom: 8px;">Paste the <strong>License Key</strong> provided above.</li>
        <li>Click on <strong>Activate Software</strong>.</li>
      </ol>

      <p style="font-size: 14px; line-height: 1.6; color: #52645F; padding: 14px; background: #FFF9E6; border-left: 4px solid #F6C343; border-radius: 4px;"><strong>Note:</strong> Please keep this email safe. Your license key is linked exclusively to the Request Code shown above and will not work on any other device.</p>

      <p style="margin-top: 28px; font-size: 14.5px; color: #10231F; font-weight: 500;">Best Regards,<br>The PharmaTrack Team</p>
    </div>

    <div style="background-color: #F8FAF9; padding: 20px; text-align: center; border-top: 1px solid #E2E8E5;">
      <p style="font-size: 12.5px; color: #52645F; line-height: 1.6; margin: 0;">
        Need technical assistance? Contact us at <a href="mailto:${supportEmail}" style="color: #0A5C4C; text-decoration: underline; font-weight: 600;">${supportEmail}</a><br>
        &copy; ${new Date().getFullYear()} ePine Business Solutions. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

  const text =
`Dear ${safeName},

Thank you for choosing PharmaTrack. Your license key has been successfully generated and is ready for activation.

Plan Selected: ${planName}
License Key: ${licenseKey}
Valid Until: ${expiryDate}
Request Code: ${requestCode}

How to Activate:
1. Open your PharmaTrack software.
2. Navigate to the License Activation screen.
3. Paste the License Key provided above.
4. Click on Activate Software.

Note: Please keep this email safe. Your license key is linked exclusively to the Request Code shown above and will not work on any other device.

Best Regards,
The PharmaTrack Team

Need technical assistance? Contact us at ${supportEmail}
© ${new Date().getFullYear()} ePine Business Solutions. All rights reserved.`;

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
          from: `"PharmaTrack Support" <${process.env.GMAIL_USER}>`,
          replyTo: supportEmail,
          to: customer.email,
          subject: 'Your PharmaTrack License Key – Ready for Activation',
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
