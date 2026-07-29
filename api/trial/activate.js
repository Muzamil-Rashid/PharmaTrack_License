const { supabase } = require('../../lib/supabase');
const { generateLicenseKey } = require('../../lib/license');
const { TRIAL_DURATION_DAYS } = require('../../lib/plans');
const { sendLicenseNotificationEmails } = require('../../lib/mailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const { requestCode, customer } = req.body || {};
    if (!requestCode) return res.status(400).json({ success: false, message: 'Request code is required.' });

    const { data: existing } = await supabase
      .from('trial_activations')
      .select('request_code, is_blocked')
      .eq('request_code', requestCode)
      .maybeSingle();

    if (existing) {
      if (existing.is_blocked) {
        return res.status(403).json({ success: false, message: 'You are blocked. Please contact PharmaTrack.' });
      }
      return res.status(409).json({ success: false, message: 'This device has already used a free trial.' });
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('is_blocked')
      .eq('request_code', requestCode)
      .eq('is_blocked', true)
      .maybeSingle();

    if (existingOrder) {
      return res.status(403).json({ success: false, message: 'You are blocked. Please contact PharmaTrack.' });
    }

    const { licenseKey, expiresAt } = await generateLicenseKey(
      requestCode, TRIAL_DURATION_DAYS, process.env.LICENSE_PRIVATE_KEY_B64
    );

    const { error: trialError } = await supabase.from('trial_activations').insert({ 
      request_code: requestCode,
      full_name: customer?.fullName || ''
    });
    if (trialError) throw trialError;

    const { error: orderError } = await supabase.from('orders').insert({
      request_code: requestCode,
      plan_id: 'trial',
      full_name: customer?.fullName || '',
      mobile: customer?.mobile || '',
      email: customer?.email || '',
      address: customer?.address || '',
      business_name: customer?.businessName || '',
      agreed_terms: customer?.agreed_terms || '',
      status: 'license_issued',
      license_key: licenseKey,
      expires_at: expiresAt,
    });
    if (orderError) throw orderError;

    // Email failures must never block the license response -- the
    // license is already saved by this point, so notification is
    // best-effort on top of that.
    try {
      await sendLicenseNotificationEmails({
        customer: { fullName: customer?.fullName, email: customer?.email, mobile: customer?.mobile },
        planName: 'Free Trial',
        licenseKey,
        expiresAt,
        requestCode,
      });
    } catch (emailErr) {
      console.error('Notification emails failed (license was still issued):', emailErr);
    }

    res.status(200).json({ success: true, licenseKey, expiresAt });
  } catch (err) {
    console.error('trial activation failed:', err);
    res.status(500).json({ success: false, message: 'Could not activate trial.' });
  }
};
