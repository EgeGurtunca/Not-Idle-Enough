import { useGameStore, selectors } from '../store/gameStore.js';
import { MILESTONE_EVERY, HERO_UPGRADES } from '../game/constants.js';
import { heroLevelCost, heroUpgradeCost, bulkCost, maxAffordable } from '../game/formulas.js';
import { fmt } from '../utils/format.js';
import AmountToggle from './AmountToggle.jsx';

function UpgradeRow({ up, amount }) {
  const gold = useGameStore((s) => s.gold);
  const level = useGameStore((s) => s.heroUpgrades[up.id] ?? 0);
  const buyLevels = useGameStore((s) => s.buyHeroUpgradeLevels);
  const buyMax = useGameStore((s) => s.buyHeroUpgradeMax);

  const maxed = level >= up.maxLevel;
  const remaining = up.maxLevel - level;
  const costFn = (l) => heroUpgradeCost(up, l);

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
          {up.name}{' '}
          <span className="row-level">
            sv {level}
            {Number.isFinite(up.maxLevel) ? `/${up.maxLevel}` : ''}
          </span>
        </div>
        <div className="row-sub">{up.desc}</div>
      </div>
      {maxed ? (
        <span className="maxed">Tamamlandı</span>
      ) : (
        <button
          type="button"
          className="buy"
          disabled={!affordable}
          onClick={() => (amount === 'max' ? buyMax(up.id) : buyLevels(up.id, amount))}
        >
          {amount === 'max' ? `Maks ×${count}` : `Al ×${count}`}
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
      <div className="panel-note">
        Kahraman yalnızca sen tıklayınca vurur. Seviye aldıkça klik hasarı artar; her{' '}
        {MILESTONE_EVERY}. seviyede hasar ikiye katlanır.
      </div>

      <AmountToggle value={amount} onChange={setAmount} />

      <div className="row hero-row">
        <span className="row-emoji">🦸</span>
        <div className="row-info">
          <div className="row-name">Kahraman</div>
          <div className="row-sub">
            Seviye {heroLevel} · 👆 {fmt(clickDmg)} hasar
          </div>
          <div className="row-sub">
            🎯 %{(critCh * 100).toFixed(0)} kritik · 💢 ×{critMult.toFixed(1)} kritik hasarı
          </div>
          <div className="row-milestone">Seviye {nextMilestone}'te hasar ×2</div>
        </div>
        <button
          type="button"
          className="buy"
          disabled={!affordable}
          onClick={() => (amount === 'max' ? buyHeroMax() : buyHeroLevels(amount))}
        >
          {amount === 'max' ? `Maks ×${count}` : `Al ×${count}`}
          <span className="buy-cost">🪙 {fmt(cost)}</span>
        </button>
      </div>

      <div className="panel-note subtle">
        Eğitimler bu maceraya özeldir; prestijde sıfırlanır.
      </div>

      {HERO_UPGRADES.map((up) => (
        <UpgradeRow key={up.id} up={up} amount={amount} />
      ))}
    </div>
  );
}
