const OPTIONS = [
  { id: 1, label: '×1' },
  { id: 10, label: '×10' },
  { id: 'max', label: 'Maks' },
];

export default function AmountToggle({ value, onChange }) {
  return (
    <div className="amount-toggle" role="group" aria-label="Satın alma miktarı">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`amount-btn ${value === o.id ? 'active' : ''}`}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
