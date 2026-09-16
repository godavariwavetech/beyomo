// Money formatting for the dashboard. Deliberately identical to the partner and
// customer apps' formatAmount (beyomo/src/utils/utils.ts, beyomopartner/src/utils/utils.ts)
// so the same booking never reads as ₹3,671.85 here and ₹3,672 in the apps — amounts are
// stored with paise, but every surface shows whole rupees.
export const formatAmount = (n) =>
  Math.round(Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// Same value with the rupee sign, for the common `₹1,234` case.
export const formatRupee = (n) => `₹${formatAmount(n)}`;
