import { useGameStore } from '../store/gameStore.js';
import { fmt } from '../utils/format.js';

export default function TopBar() {
  const gold = useGameStore((s) => s.gold);
  const crystals = useGameStore((s) => s.crystals);
  const highest = useGameStore((s) => s.highestStage);
  const prestiges = useGameStore((s) => s.totalPrestiges);
  const stardust = useGameStore((s) => s.stardust);
  const transcends = useGameStore((s) => s.totalTranscends);
  const opMode = useGameStore((s) => s.opMode);
  const toggleOp = useGameStore((s) => s.toggleOp);
  const showCrystals = crystals > 0 || prestiges > 0 || highest >= 100;
  const showStardust = stardust > 0 || transcends > 0 || highest >= 500;

  return (
    <header className="topbar">
      <h1 className="logo">Solo Fan Idle</h1>
      <div className="chips">
        <span className="chip chip-gold" title="Altın">
          🪙 {fmt(gold)}
        </span>
        {showCrystals && (
          <span className="chip chip-crystal" title="Kristal">
            💎 {fmt(crystals)}
          </span>
        )}
        {showStardust && (
          <span className="chip chip-stardust" title="Yıldız Tozu">
            💫 {fmt(stardust)}
          </span>
        )}
      </div>
      <button
        type="button"
        className={`op-btn ${opMode ? 'on' : ''}`}
        onClick={toggleOp}
        title="Test modu: klik hasarı 1Qi (1e18), altın ve kristal kazancı ×1000"
      >
        OP
      </button>
      <div className="record">
        Rekor · Bölge {highest}
        {prestiges > 0 && <span className="record-sub"> · {prestiges}. macera</span>}
      </div>
    </header>
  );
}
