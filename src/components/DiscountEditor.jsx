/**
 * DiscountEditor
 * Renders a list of discount rules the seller can add / remove.
 * value: Array<{ type, minQty, value }>
 * onChange: (newRules) => void
 */

const TYPE_OPTIONS = [
  { value: 'percentage', label: '% Percentage off' },
  { value: 'fixed',      label: '₦ Fixed amount off' },
  { value: 'free_unit',  label: 'Free units' },
];

const PLACEHOLDER = {
  percentage: 'e.g. 10 (= 10% off)',
  fixed:      'e.g. 10000 (= ₦10,000 off)',
  free_unit:  'e.g. 1 (= 1 free unit)',
};

const VALUE_LABEL = {
  percentage: '% off',
  fixed:      '₦ off total',
  free_unit:  'free unit(s)',
};

function emptyRule() {
  return { type: 'percentage', minQty: '', value: '' };
}

export default function DiscountEditor({ value = [], onChange }) {
  const rules = Array.isArray(value) ? value : [];

  function update(idx, patch) {
    const next = rules.map((r, i) => i === idx ? { ...r, ...patch } : r);
    onChange(next);
  }

  function add() {
    onChange([...rules, emptyRule()]);
  }

  function remove(idx) {
    onChange(rules.filter((_, i) => i !== idx));
  }

  return (
    <div className="bg-solar-surface border border-solar-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-heading text-xs font-semibold text-solar-text uppercase tracking-widest">Volume Discounts</div>
          <div className="text-[11px] text-solar-dim mt-0.5">Incentivise bulk purchases — rules stack, best deal wins</div>
        </div>
        <button
          type="button"
          onClick={add}
          className="text-xs text-solar-accent border border-solar-accent/30 rounded-lg px-3 py-1.5 hover:bg-solar-accent/10 transition-all flex items-center gap-1.5"
        >
          + Add Rule
        </button>
      </div>

      {rules.length === 0 && (
        <div className="text-[11px] text-solar-dim text-center py-3 border border-dashed border-solar-border rounded-lg">
          No discount rules yet — click "Add Rule" to create one
        </div>
      )}

      {rules.map((rule, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end">
          {/* Min qty */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-solar-dim font-medium">Min. Qty</label>
            <input
              type="number"
              min="1"
              className="solar-input text-sm"
              placeholder="e.g. 10"
              value={rule.minQty}
              onChange={e => update(idx, { minQty: e.target.value === '' ? '' : +e.target.value })}
            />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-solar-dim font-medium">Discount Type</label>
            <select
              className="solar-input text-sm"
              value={rule.type}
              onChange={e => update(idx, { type: e.target.value, value: '' })}
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Value */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-solar-dim font-medium">{VALUE_LABEL[rule.type]}</label>
            <input
              type="number"
              min="0"
              step={rule.type === 'percentage' ? '0.1' : '1'}
              className="solar-input text-sm"
              placeholder={PLACEHOLDER[rule.type]}
              value={rule.value}
              onChange={e => update(idx, { value: e.target.value === '' ? '' : +e.target.value })}
            />
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={() => remove(idx)}
            className="w-8 h-[38px] flex items-center justify-center rounded-lg border border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all text-base"
          >✕</button>
        </div>
      ))}

      {rules.length > 0 && (
        <div className="text-[10px] text-solar-dim border-t border-solar-border pt-2">
          Examples: <span className="text-solar-accent">Buy 10+ → 10% off</span> · <span className="text-solar-accent">Buy 50+ → ₦5,000 off</span> · <span className="text-solar-accent">Buy 100+ → 1 unit free</span>
        </div>
      )}
    </div>
  );
}
