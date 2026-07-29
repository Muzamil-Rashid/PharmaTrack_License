const Razorpay = require('razorpay');
const { supabase } = require('../../lib/supabase');
const { PLANS } = require('../../lib/plans');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  try {
    const { planId, requestCode, customer } = req.body || {};
    const plan = PLANS[planId];

    if (!plan) return res.status(400).json({ error: 'Unknown plan.' });
    if (!requestCode) return res.status(400).json({ error: 'Request code is required.' });
    if (typeof plan.amount !== 'number' || plan.amount <= 0) {
      return res.status(400).json({ error: `Price for "${plan.name}" hasn't been configured yet.` });
    }

    const { data: existingTrial } = await supabase
      .from('trial_activations')
      .select('is_blocked')
      .eq('request_code', requestCode)
      .maybeSingle();

    if (existingTrial && existingTrial.is_blocked) {
      return res.status(403).json({ error: 'You are blocked. Please contact PharmaTrack.' });
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('is_blocked')
      .eq('request_code', requestCode)
      .eq('is_blocked', true)
      .maybeSingle();

    if (existingOrder) {
      return res.status(403).json({ error: 'You are blocked. Please contact PharmaTrack.' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: 'INR',
      notes: { requestCode, planId },
    });

    const { error } = await supabase.from('orders').insert({
      request_code: requestCode,
      plan_id: planId,
      full_name: customer?.fullName || '',
      mobile: customer?.mobile || '',
      email: customer?.email || '',
      address: customer?.address || '',
      business_name: customer?.businessName || '',
      agreed_terms: customer?.agreed_terms || '',
      razorpay_order_id: order.id,
      amount_paise: plan.amount,
      status: 'created',
    });

    if (error) throw error;

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('create-order failed:', err);
    res.status(500).json({ error: 'Could not create order.' });
  }
};
