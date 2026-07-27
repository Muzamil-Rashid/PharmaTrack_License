const crypto = require('crypto');
const { supabase } = require('../../lib/supabase');
const { PLANS } = require('../../lib/plans');
const { generateLicenseKey } = require('../../lib/license');
const { sendLicenseNotificationEmails } = require('../../lib/mailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    // This HMAC check is the actual "proper detection" — it can't be
    // faked from the browser because it needs the Key Secret, which
    // never leaves this server.
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Signature mismatch — payment could not be verified.' });
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (fetchError || !order) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    if (order.status === 'license_issued') {
      // Already handled — most likely the webhook got there first (and
      // already sent the notification emails then). Just return the same key.
      return res.status(200).json({ success: true, licenseKey: order.license_key, expiresAt: order.expires_at });
    }

    const plan = PLANS[order.plan_id];
    const { licenseKey, expiresAt } = await generateLicenseKey(
      order.request_code, plan.durationDays, process.env.LICENSE_PRIVATE_KEY_B64
    );

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'license_issued',
        razorpay_payment_id,
        license_key: licenseKey,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', razorpay_order_id);

    if (updateError) throw updateError;

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

    res.status(200).json({ success: true, licenseKey, expiresAt });
  } catch (err) {
    console.error('verify failed:', err);
    res.status(500).json({ success: false, error: 'Verification failed.' });
  }
};
