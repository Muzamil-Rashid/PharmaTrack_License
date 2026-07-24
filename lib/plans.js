// ==========================================================
// SERVER-SIDE source of truth for prices. Never trust a price/amount
// sent from the browser. Keep this in sync with the PLANS object in
// index.html. `amount` is in PAISE (₹1 = 100 paise) — orders are
// rejected while a plan's amount is still `null`.
// ==========================================================
const PLANS = {
  monthly:   { id: 'monthly',   name: 'Monthly Plan',   durationDays: 30,  amount: 19900 },
  quarterly: { id: 'quarterly', name: 'Quarterly Plan', durationDays: 90,  amount: 49900 },
  yearly:    { id: 'yearly',    name: 'Yearly Plan',    durationDays: 365, amount: 199900 },
};

const TRIAL_DURATION_DAYS = 30;

module.exports = { PLANS, TRIAL_DURATION_DAYS };
