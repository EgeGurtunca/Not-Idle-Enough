import { useState } from 'react';
import { useGameStore, selectors } from '../store/gameStore.js';
import { REALM_STAGE, ESSENCE_UPGRADES } from '../game/constants.js';
import { realmBoostValue, essenceUpgradeCost, bulkCost, maxAffordable } from '../game/formulas.js';
import { saveGame } from '../game/save.js';
import { useT } from '../game/i18n.js';
import { fmt } from '../utils/format.js';
import AmountToggle from './AmountToggle.jsx';

function UpgradeRow({ up, amount }) {
  const essence = useGameStore((s) => s.essence);
  const level = useGameStore((s) => s.essenceLevels[up.id] ?? 0);
  const buyLevels = useGameStore((s) => s.buyEssenceUpgradeLevels);
  const buyMax = useGameStore((s) => s.buyEssenceUpgradeMax);
  const { t, dnd } = useT();

  const maxed = level >= up.maxLevel;
  const remaining = up.maxLevel - level;
  const costFn = (l) => essenceUpgradeCost(up, l);
  const loc = dnd('essUp', up.id, up.name, up.desc);

  let count = 0;
  let cost = 0;
  if (!maxed) {
    if (amount === 'max') {
      ({ count, cost } = maxAffordable(costFn, level, essence, Math.min(1000, remaining)));
    } else {
      count = Math.min(amount, remaining);
      cost = bulkCost(costFn, level, count);
    }
  }
  const affordable = amount === 'max' ? count > 0 : count > 0 && essence >= cost;

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
          className="buy essence"
          disabled={!affordable}
          onClick={() => (amount === 'max' ? buyMax(up.id) : buyLevels(up.id, amount))}
        >
          {amount === 'max' ? t('max_buy', { n: count }) : t('buy', { n: count })}
          <span className="buy-cost">🌀 {fmt(cost)}</span>
        </button>
      )}
    </div>
  );
}

export default function RealmPanel() {
  const highest = useGameStore((s) => s.highestStage);
  const stardust = useGameStore((s) => s.stardust);
  const realm = useGameStore((s) => s.realm);
  const gain = useGameStore(selectors.essenceGain);
  const unlocked = useGameStore(selectors.realmUnlocked);
  const doRealmShift = useGameStore((s) => s.doRealmShift);
  const [confirming, setConfirming] = useState(false);
  const [amount, setAmount] = useState(1);
  const { t } = useT();

  if (!unlocked) {
    return (
      <div className="panel-content">
        <div className="prestige-locked">
          <div className="prestige-star realm-star">🌀</div>
          <p dangerouslySetInnerHTML={{ __html: t('realm_locked', { n: REALM_STAGE }) }} />
          <div className="progress">
            <div
              className="progress-fill realm-fill"
              style={{ width: `${Math.min(100, (highest / REALM_STAGE) * 100)}%` }}
            />
          </div>
          <div className="progress-label">{t('highest', { h: highest, n: REALM_STAGE })}</div>
        </div>
      </div>
    );
  }

  function onShift() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    doRealmShift();
    setConfirming(false);
    saveGame();
  }

  return (
    <div className="panel-content">
      <div className="panel-note" dangerouslySetInnerHTML={{ __html: t('realm_note') }} />

      <div className="prestige-box realm-box">
        <div className="prestige-gain">
          {t('realm_gain', { n: fmt(stardust) })}
          <strong className="essence-text">+{fmt(gain)} 🌀</strong>
        </div>
        {gain > 0 ? (
          confirming ? (
            <div className="confirm-row">
              <span>{t('realm_confirm')}</span>
              <div className="confirm-buttons">
                <button type="button" className="prestige-btn danger" onClick={onShift}>
                  {t('realm_yes', { n: fmt(gain) })}
                </button>
                <button type="button" className="ghost" onClick={() => setConfirming(false)}>
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="prestige-btn realm-btn" onClick={onShift}>
              {t('realm_btn')}
            </button>
          )
        ) : (
          <div className="prestige-hint">{t('realm_hint', { n: fmt(stardust) })}</div>
        )}
      </div>

      <div className="panel-note subtle">
        {t('realm_effect', { r: realm, b: fmt(realmBoostValue(realm)) })}
      </div>

      <AmountToggle value={amount} onChange={setAmount} />

      {ESSENCE_UPGRADES.map((up) => (
        <UpgradeRow key={up.id} up={up} amount={amount} />
      ))}
    </div>
  );
}
