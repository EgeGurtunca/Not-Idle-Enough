import { useGameStore } from '../store/gameStore.js';
import { fmt, fmtTime } from '../utils/format.js';

export default function OfflineModal() {
  const report = useGameStore((s) => s.offlineReport);
  const dismiss = useGameStore((s) => s.dismissOfflineReport);

  if (!report) return null;

  return (
    <div className="modal-backdrop" onClick={dismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Sen yokken…</h2>
        <p>
          Yoldaşların {fmtTime(report.seconds)} boyunca avlanmaya devam etti.
        </p>
        <div className="offline-gold">🪙 +{fmt(report.gold)}</div>
        <button type="button" className="buy" onClick={dismiss}>
          Topla ve devam et
        </button>
      </div>
    </div>
  );
}
