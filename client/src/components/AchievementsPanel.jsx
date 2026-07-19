import { useGameStore, selectors } from '../store/gameStore.js';
import { ACHIEVEMENTS, ACHIEVEMENT_BONUS, ARTIFACTS } from '../game/constants.js';
import { fmt } from '../utils/format.js';

function statValue(s, stat) {
  switch (stat) {
    case 'highestStage':
      return s.highestStage;
    case 'totalPrestiges':
      return s.totalPrestiges;
    case 'totalPulls':
      return s.totalPulls;
    case 'ownedArtifacts':
      return ARTIFACTS.filter((a) => (s.artifacts[a.id] ?? 0) > 0).length;
    default:
      return s.stats[stat] ?? 0;
  }
}

export default function AchievementsPanel() {
  const state = useGameStore();
  const count = useGameStore(selectors.achievementCount);
  const { stats } = state;
  const bonusPct = Math.round(count * ACHIEVEMENT_BONUS * 100);

  return (
    <div className="panel-content">
      <div className="prestige-box">
        <div className="prestige-gain">
          🏆 {count}/{ACHIEVEMENTS.length} başarım ·{' '}
          <strong>+%{bonusPct} hasar ve +%{bonusPct} altın</strong>
        </div>
        <div className="stats-grid">
          <span>🗡️ Kesilen yaratık: {fmt(stats.totalKills)}</span>
          <span>👹 Kesilen boss: {fmt(stats.totalBossKills)}</span>
          <span>👆 Toplam klik: {fmt(stats.totalClicks)}</span>
          <span>💢 Toplam kritik: {fmt(stats.totalCrits)}</span>
          <span>🪙 Kazanılan altın: {fmt(stats.totalGoldEarned)}</span>
          <span>⚡ En büyük kritik: {fmt(stats.highestCrit)}</span>
        </div>
      </div>

      {ACHIEVEMENTS.map((a) => {
        const unlocked = !!state.achievements[a.id];
        const value = statValue(state, a.stat);
        const pct = Math.min(100, (value / a.threshold) * 100);
        return (
          <div className={`row ach-row ${unlocked ? 'unlocked' : ''}`} key={a.id}>
            <span className="row-emoji">{unlocked ? a.emoji : '🔒'}</span>
            <div className="row-info">
              <div className="row-name">{a.name}</div>
              <div className="row-sub">{a.desc}</div>
              {!unlocked && (
                <div className="ach-progress">
                  <div className="ach-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
            {unlocked ? (
              <span className="maxed">✓</span>
            ) : (
              <span className="ach-count">
                {fmt(Math.min(value, a.threshold))}/{fmt(a.threshold)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
