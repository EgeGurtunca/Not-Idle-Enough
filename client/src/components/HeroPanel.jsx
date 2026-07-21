import { useGameStore, selectors } from '../store/gameStore.js';
import { MILESTONE_EVERY, HERO_UPGRADES } from '../game/constants.js';
import { heroLevelCost, heroUpgradeCost, bulkCost, maxAffordable } from '../game/formulas.js';
import { useT } from '../game/i18n.js';
import { fmt } from '../utils/format.js';
import AmountToggle from './AmountToggle.jsx';

function UpgradeRow({ up, amount }) {
  const gold = useGameStore((s) => s.gold);
  const level = useGameStore((s) => s.heroUpgrades[up.id] ?? 0);
  const buyLevels = useGameStore((s) => s.buyHeroUpgradeLevels);
  const buyMax = useGameStore((s) => s.buyHeroUpgradeMax);
  const { t, dnd } = useT();

  const maxed = level >= up.maxLevel;
  const remaining = up.maxLevel - level;
  const costFn = (l) => heroUpgradeCost(up, l);
  const loc = dnd('heroUp', up.id, up.name, up.desc);

  let count = 0;
  let cost = 0;
  if (!maxed) {
    if (amount === 'max') {
      ({ count, cost } = maxAffordable(costFn, level, gold, Math.min(1000, remaining)));
    } else {
      count = Math.min(amount, remaining);
      cost = bulkCost(costFn, level, count);
    }
  }
  const affordable = amount === 'max' ? count > 0 : count > 0 && gold >= cost;

  return (
    <div className="row">
      <span className="row-emoji">{up.emoji}</span>
      <div className="row-info">
        <div className="row-name">
          {loc.name}{' '}
          <span className="row-level">
            {t('lv')} {level}
            {Number.isFinite(up.maxLevel) ? `/${up.maxLevel}` : ''}
          </span>
        </div>
        <div className="row-sub">{loc.desc}</div>
      </div>
      {maxed ? (
        <span className="maxed">{t('done')}</span>
      ) : (
        <button
          type="button"
          className="buy"
          disabled={!affordable}
          onClick={() => (amount === 'max' ? buyMax(up.id) : buyLevels(up.id, amount))}
        >
          {amount === 'max' ? t('max_buy', { n: count }) : t('buy', { n: count })}
          <span className="buy-cost">🪙 {fmt(cost)}</span>
        </button>
      )}
    </div>
  );
}

export default function HeroPanel() {
  const gold = useGameStore((s) => s.gold);
  const heroLevel = useGameStore((s) => s.heroLevel);
  const clickDmg = useGameStore(selectors.clickDamage);
  const critCh = useGameStore(selectors.critChance);
  const critMult = useGameStore(selectors.critMultiplier);
  const buyHeroLevels = useGameStore((s) => s.buyHeroLevels);
  const buyHeroMax = useGameStore((s) => s.buyHeroMax);
  const amount = useGameStore((s) => s.buyAmount);
  const setAmount = useGameStore((s) => s.setBuyAmount);
  const { t } = useT();

  const nextMilestone = (Math.floor(heroLevel / MILESTONE_EVERY) + 1) * MILESTONE_EVERY;

  let count, cost;
  if (amount === 'max') {
    ({ count, cost } = maxAffordable(heroLevelCost, heroLevel, gold));
  } else {
    count = amount;
    cost = bulkCost(heroLevelCost, heroLevel, amount);
  }
  const affordable = amount === 'max' ? count > 0 : gold >= cost;

  return (
    <div className="panel-content">
      <div className="panel-note">{t('hero_note', { n: MILESTONE_EVERY })}</div>

      <AmountToggle value={amount} onChange={setAmount} />

      <div className="row hero-row">
        <span className="row-emoji">🦸</span>
        <div className="row-info">
          <div className="row-name">{t('hero')}</div>
          <div className="row-sub">
            {t('level')} {heroLevel} · 👆 {fmt(clickDmg)} {t('dmg_short')}
          </div>
          <div className="row-sub">
            {t('crit_line', { c: (critCh * 100).toFixed(0), m: critMult.toFixed(1) })}
          </div>
          <div className="row-milestone">{t('milestone_note', { n: nextMilestone })}</div>
        </div>
        <button
          type="button"
          className="buy"
          disabled={!affordable}
          onClick={() => (amount === 'max' ? buyHeroMax() : buyHeroLevels(amount))}
        >
          {amount === 'max' ? t('max_buy', { n: count }) : t('buy', { n: count })}
          <span className="buy-cost">🪙 {fmt(cost)}</span>
        </button>
      </div>

      <div className="panel-note subtle">{t('hero_up_note')}</div>

      {HERO_UPGRADES.map((up) => (
        <UpgradeRow key={up.id} up={up} amount={amount} />
      ))}
    </div>
  );
}
