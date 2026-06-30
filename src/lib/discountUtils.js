/**
 * Discount rule shape: { type: 'percentage'|'fixed'|'free_unit', minQty: number, value: number }
 *
 * - percentage : buy >= minQty, get value% off the whole order for that product
 * - fixed      : buy >= minQty, get ₦value off the total
 * - free_unit  : buy >= minQty, get `value` units free (worth price*value)
 */

/** Returns the best (highest-saving) discount that applies for a given qty */
export function getBestDiscount(price, qty, discounts) {
  if (!Array.isArray(discounts) || !discounts.length) return null;
  let best = null;
  let bestSaving = 0;

  for (const rule of discounts) {
    if (!rule || qty < rule.minQty) continue;
    let saving = 0;
    if (rule.type === 'percentage') {
      saving = price * qty * (rule.value / 100);
    } else if (rule.type === 'fixed') {
      saving = rule.value;
    } else if (rule.type === 'free_unit') {
      saving = price * rule.value;
    }
    if (saving > bestSaving) {
      bestSaving = saving;
      best = { ...rule, saving };
    }
  }
  return best;
}

/** Human-readable label for a rule (for card badges / cart) */
export function discountLabel(rule, currency = '₦') {
  if (!rule) return '';
  if (rule.type === 'percentage') return `${rule.value}% off`;
  if (rule.type === 'fixed')      return `${currency}${Number(rule.value).toLocaleString()} off`;
  if (rule.type === 'free_unit')  return `${rule.value} unit${rule.value > 1 ? 's' : ''} free`;
  return '';
}

/** Short promo label shown on the card bubble */
export function discountPromo(rule, currency = '₦') {
  if (!rule) return '';
  const what = discountLabel(rule, currency);
  return `Buy ${rule.minQty}+ → ${what}`;
}

/**
 * Calculate total price for qty units after applying best discount.
 * Returns { total, saving, unitPrice, appliedRule }
 */
export function calcWithDiscount(price, qty, discounts) {
  const rule = getBestDiscount(price, qty, discounts);
  const gross = price * qty;
  const saving = rule ? rule.saving : 0;
  return {
    total: Math.max(0, gross - saving),
    saving,
    unitPrice: price,
    appliedRule: rule || null,
  };
}

/** Returns the cheapest applicable promo string for display on the card (lowest minQty) */
export function cardPromoLabel(discounts, currency = '₦') {
  if (!Array.isArray(discounts) || !discounts.length) return null;
  const sorted = [...discounts].sort((a, b) => a.minQty - b.minQty);
  return discountPromo(sorted[0], currency);
}
