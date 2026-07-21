import { useGameStore } from '../store/gameStore.js';
import { useT } from '../game/i18n.js';
import { fmt, fmtTime } from '../utils/format.js';

export default function OfflineModal() {
  const report = useGameStore((s) => s.offlineReport);
  const dismiss = useGameStore((s) => s.dismissOfflineReport);
  const { t, lang } = useT();

  if (!report) return null;

  return (
    <div className="modal-backdrop" onClick={dismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('offline_title')}</h2>
        <p>{t('offline_body', { t: fmtTime(report.seconds, lang) })}</p>
        <div className="offline-gold">🪙 +{fmt(report.gold)}</div>
        <button type="button" className="buy" onClick={dismiss}>
          {t('offline_collect')}
        </button>
      </div>
    </div>
  );
}
