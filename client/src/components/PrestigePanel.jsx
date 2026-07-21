import { useState } from 'react';
import { useGameStore, selectors } from '../store/gameStore.js';
import { PRESTIGE_STAGE, PRESTIGE_UPGRADES } from '../game/constants.js';
import { prestigeUpgradeCost, startingGold, bulkCost, maxAffordable } from '../game/formulas.js';
import { saveGame } from '../game/save.js';
import { useT } from '../game/i18n.js';
import { fmt } from '../utils/format.js';
import AmountToggle from './AmountToggle.jsx';

function UpgradeRow({ up, amount }) {
  const crystals = useGameStore((s) => s.crystals);
  const level = useGameStore((s) => s.prestigeLevels[up.id] ?? 0);
  const buyLevels = useGameStore((s) => s.buyPrestigeUpgradeLevels);
  const buyMax = useGameStore((s) => s.buyPrestigeUpgradeMax);
  const { t, dnd } = useT();

  const maxed = level >= up.maxLevel;
  const remaining = up.maxLevel - level;
  const costFn = (l) => prestigeUpgradeCost(up, l);
  const loc = dnd('presUp', up.id, up.name, up.desc);

  let count = 0;
  let cost = 0;
  if (!maxed) {
    if (amount === 'max') {
      ({ count, cost } = maxAffordable(costFn, level, crystals, Math.min(1000, remaining)));
    } else {
      count = Math.min(amount, remaining);
      cost = bulkCost(costFn, level, count);
    }
  }
  const affordable = amount === 'max' ? count > 0 : count > 0 && crystals >= cost;

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
          className="buy crystal"
          disabled={!affordable}
          onClick={() => (amount === 'max' ? buyMax(up.id) : buyLevels(up.id, amount))}
        >
          {amount === 'max' ? t('max_buy', { n: count }) : t('buy', { n: count })}
          <span className="buy-cost">💎 {fmt(cost)}</span>
        </button>
      )}
    </div>
  );
}

export default function PrestigePanel() {
  const highest = useGameStore((s) => s.highestStage);
  const runHighest = useGameStore((s) => s.runHighestStage);
  const prestigeLevels = useGameStore((s) => s.prestigeLevels);
  const gain = useGameStore(selectors.crystalGain);
  const canPrestige = useGameStore(selectors.canPrestige);
  const doPrestige = useGameStore((s) => s.doPrestige);
  const [confirming, setConfirming] = useState(false);
  const amount = useGameStore((s) => s.buyAmount);
  const setAmount = useGameStore((s) => s.setBuyAmount);
  const { t } = useT();

  if (highest < PRESTIGE_STAGE) {
    return (
      <div className="panel-content">
        <div className="prestige-locked">
          <div className="prestige-star">✦</div>
          <p dangerouslySetInnerHTML={{ __html: t('prestige_locked', { n: PRESTIGE_STAGE }) }} />
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (highest / PRESTIGE_STAGE) * 100)}%` }}
            />
          </div>
          <div className="progress-label">{t('highest', { h: highest, n: PRESTIGE_STAGE })}</div>
        </div>
      </div>
    );
  }

  function onPrestige() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    doPrestige();
    setConfirming(false);
    saveGame();
  }

  return (
    <div className="panel-content">
      <div className="panel-note">{t('prestige_note')}</div>

      <div className="prestige-box">
        <div className="prestige-gain">
          {t('prestige_gain', { n: runHighest })}
          <strong>+{fmt(gain)} 💎</strong>
        </div>
        {canPrestige ? (
          confirming ? (
            <div className="confirm-row">
              <span>{t('reset_confirm')}</span>
              <div className="confirm-buttons">
                <button type="button" className="prestige-btn danger" onClick={onPrestige}>
                  {t('prestige_yes', { n: fmt(gain) })}
                </button>
                <button type="button" className="ghost" onClick={() => setConfirming(false)}>
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="prestige-btn" onClick={onPrestige}>
              {t('prestige_btn')}
            </button>
          )
        ) : (
          <div className="prestige-hint">
            {t('prestige_again_hint', { n: PRESTIGE_STAGE, r: runHighest })}
          </div>
        )}
      </div>

      {startingGold(prestigeLevels) > 0 && (
        <div className="panel-note subtle">
          {t('starting_gold_note', { n: fmt(startingGold(prestigeLevels)) })}
        </div>
      )}

      <AmountToggle value={amount} onChange={setAmount} />

      {PRESTIGE_UPGRADES.map((up) => (
        <UpgradeRow key={up.id} up={up} amount={amount} />
      ))}
    </div>
  );
}
