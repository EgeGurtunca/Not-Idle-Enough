import { useGameStore } from '../store/gameStore.js';
import { useT } from '../game/i18n.js';
import { fmt } from '../utils/format.js';

export default function TopBar() {
  const gold = useGameStore((s) => s.gold);
  const crystals = useGameStore((s) => s.crystals);
  const highest = useGameStore((s) => s.highestStage);
  const prestiges = useGameStore((s) => s.totalPrestiges);
  const stardust = useGameStore((s) => s.stardust);
  const transcends = useGameStore((s) => s.totalTranscends);
  const realm = useGameStore((s) => s.realm);
  const essence = useGameStore((s) => s.essence);
  const { t } = useT();
  const showCrystals = crystals > 0 || prestiges > 0 || highest >= 100;
  const showStardust = stardust > 0 || transcends > 0 || highest >= 500;

  return (
    <header className="topbar">
      <h1 className="logo">Incrementaloth</h1>
      <div className="chips">
        <span className="chip chip-gold" title={t('tip_gold')}>
          🪙 {fmt(gold)}
        </span>
        {showCrystals && (
          <span className="chip chip-crystal" title={t('tip_crystal')}>
            💎 {fmt(crystals)}
          </span>
        )}
        {showStardust && (
          <span className="chip chip-stardust" title={t('tip_stardust')}>
            💫 {fmt(stardust)}
          </span>
        )}
        {(essence > 0 || realm > 1) && (
          <span className="chip chip-essence" title={t('tip_essence')}>
            🌀 {fmt(essence)}
          </span>
        )}
      </div>
      <div className="record">
        {t('record', { n: highest })}
        {prestiges > 0 && <span className="record-sub">{t('record_run', { n: prestiges })}</span>}
        {realm > 1 && <span className="record-sub essence-text">{t('realm_label', { r: realm })}</span>}
      </div>
    </header>
  );
}
