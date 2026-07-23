const { supabase } = require('../../lib/supabase');
const { generateLicenseKey } = require('../../lib/license');
const { TRIAL_DURATION_DAYS } = require('../../lib/plans');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const { requestCode, customer } = req.body || {};
    if (!requestCode) return res.status(400).json({ success: false, message: 'Request code is required.' });

    const { data: existing } = await supabase
      .from('trial_activations')
      .select('request_code')
      .eq('request_code', requestCode)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, message: 'This device has already used a free trial.' });
    }

    const { licenseKey, expiresAt } = await generateLicenseKey(
      requestCode, TRIAL_DURATION_DAYS, process.env.LICENSE_PRIVATE_KEY_B64
    );

    const { error: trialError } = await supabase.from('trial_activations').insert({ request_code: requestCode });
    if (trialError) throw trialError;

    const { error: orderError } = await supabase.from('orders').insert({
      request_code: requestCode,
      plan_id: 'trial',
      full_name: customer?.fullName || '',
      mobile: customer?.mobile || '',
      email: customer?.email || '',
      address: customer?.address || '',
      business_name: customer?.businessName || '',
      status: 'license_issued',
      license_key: licenseKey,
      expires_at: expiresAt,
    });
    if (orderError) throw orderError;

    res.status(200).json({ success: true, licenseKey, expiresAt });
  } catch (err) {
    console.error('trial activation failed:', err);
    res.status(500).json({ success: false, message: 'Could not activate trial.' });
  }
};
