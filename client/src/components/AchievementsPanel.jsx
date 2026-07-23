import { useGameStore, selectors } from '../store/gameStore.js';
import { ACHIEVEMENTS, ACHIEVEMENT_BONUS, ARTIFACTS } from '../game/constants.js';
import { useT } from '../game/i18n.js';
import { fmt } from '../utils/format.js';
import StatsGraph from './StatsGraph.jsx';

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
  const claimable = useGameStore(selectors.claimableAchievements);
  const { stats } = state;
  const bonusPct = Math.round(count * ACHIEVEMENT_BONUS * 100);
  const { t, dnd } = useT();

  return (
    <div className="panel-content">
      <div className="prestige-box">
        <div className="prestige-gain">
          {t('ach_summary', { c: count, t: ACHIEVEMENTS.length })}
          <strong>{t('ach_bonus', { p: bonusPct })}</strong>
        </div>
        {claimable > 0 && (
          <button type="button" className="buy" onClick={state.claimAllAchievements}>
            {t('ach_claim_all', { n: claimable })}
          </button>
        )}
        <div className="stats-grid">
          <span>{t('st_kills', { n: fmt(stats.totalKills) })}</span>
          <span>{t('st_boss', { n: fmt(stats.totalBossKills) })}</span>
          <span>{t('st_clicks', { n: fmt(stats.totalClicks) })}</span>
          <span>{t('st_crits', { n: fmt(stats.totalCrits) })}</span>
          <span>{t('st_gold', { n: fmt(stats.totalGoldEarned) })}</span>
          <span>{t('st_maxcrit', { n: fmt(stats.highestCrit) })}</span>
        </div>
        <StatsGraph />
      </div>

      {ACHIEVEMENTS.map((a) => {
        const unlocked = !!state.achievements[a.id];
        const value = statValue(state, a.stat);
        const claimable = !unlocked && value >= a.threshold;
        const pct = Math.min(100, (value / a.threshold) * 100);
        const loc = dnd('ach', a.id, a.name, a.desc);
        return (
          <div className={`row ach-row ${unlocked ? 'unlocked' : ''}`} key={a.id}>
            <span className="row-emoji">{unlocked || claimable ? a.emoji : '🔒'}</span>
            <div className="row-info">
              <div className="row-name">{loc.name}</div>
              <div className="row-sub">{loc.desc}</div>
              {!unlocked && !claimable && (
                <div className="ach-progress">
                  <div className="ach-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
            {unlocked ? (
              <span className="maxed">✓</span>
            ) : claimable ? (
              <button type="button" className="buy" onClick={() => state.claimAchievement(a.id)}>
                {t('ach_claim')}
              </button>
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
