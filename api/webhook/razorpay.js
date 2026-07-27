const crypto = require('crypto');
const { supabase } = require('../../lib/supabase');
const { PLANS } = require('../../lib/plans');
const { generateLicenseKey } = require('../../lib/license');
const { sendLicenseNotificationEmails } = require('../../lib/mailer');

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed.');

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['x-razorpay-signature'];
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expected) return res.status(400).send('Invalid signature.');

    const event = JSON.parse(rawBody);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', payment.order_id)
        .single();

      if (order && order.status !== 'license_issued') {
        const plan = PLANS[order.plan_id];
        const { licenseKey, expiresAt } = await generateLicenseKey(
          order.request_code, plan.durationDays, process.env.LICENSE_PRIVATE_KEY_B64
        );
        await supabase
          .from('orders')
          .update({
            status: 'license_issued',
            razorpay_payment_id: payment.id,
            license_key: licenseKey,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', payment.order_id);

        try {
          await sendLicenseNotificationEmails({
            customer: { fullName: order.full_name, email: order.email, mobile: order.mobile },
            planName: plan.name,
            licenseKey,
            expiresAt,
            requestCode: order.request_code,
          });
        } catch (emailErr) {
          console.error('Notification emails failed (license was still issued):', emailErr);
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook handling failed:', err);
    res.status(500).send('Webhook error.');
  }
}

// Vercel needs the raw, unparsed body to verify Razorpay's signature —
// this disables Vercel's automatic JSON body parsing for this function only.
handler.config = { api: { bodyParser: false } };

module.exports = handler;
