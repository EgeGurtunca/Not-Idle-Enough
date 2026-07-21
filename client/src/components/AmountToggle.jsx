import { useT } from '../game/i18n.js';

const OPTIONS = [
  { id: 1, label: '×1' },
  { id: 10, label: '×10' },
  { id: 'max', label: null }, // 'Max'/'Maks' — dile göre
];

export default function AmountToggle({ value, onChange }) {
  const { t } = useT();
  return (
    <div className="amount-toggle" role="group" aria-label={t('amount_label')}>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`amount-btn ${value === o.id ? 'active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label ?? t('maxi')}
        </button>
      ))}
    </div>
  );
}
