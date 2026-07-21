import { useState } from 'react';
import { useGameStore, selectors } from '../store/gameStore.js';
import { TRANSCEND_STAGE, STARDUST_UPGRADES } from '../game/constants.js';
import { stardustUpgradeCost, startingCrystals, bulkCost, maxAffordable } from '../game/formulas.js';
import { saveGame } from '../game/save.js';
import { useT } from '../game/i18n.js';
import { fmt } from '../utils/format.js';
import AmountToggle from './AmountToggle.jsx';

function UpgradeRow({ up, amount }) {
  const stardust = useGameStore((s) => s.stardust);
  const level = useGameStore((s) => s.stardustLevels[up.id] ?? 0);
  const buyLevels = useGameStore((s) => s.buyStardustUpgradeLevels);
  const buyMax = useGameStore((s) => s.buyStardustUpgradeMax);
  const { t, dnd } = useT();

  const maxed = level >= up.maxLevel;
  const remaining = up.maxLevel - level;
  const costFn = (l) => stardustUpgradeCost(up, l);
  const loc = dnd('starUp', up.id, up.name, up.desc);

  let count = 0;
  let cost = 0;
  if (!maxed) {
    if (amount === 'max') {
      ({ count, cost } = maxAffordable(costFn, level, stardust, Math.min(1000, remaining)));
    } else {
      count = Math.min(amount, remaining);
      cost = bulkCost(costFn, level, count);
    }
  }
  const affordable = amount === 'max' ? count > 0 : count > 0 && stardust >= cost;

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
          className="buy stardust"
          disabled={!affordable}
          onClick={() => (amount === 'max' ? buyMax(up.id) : buyLevels(up.id, amount))}
        >
          {amount === 'max' ? t('max_buy', { n: count }) : t('buy', { n: count })}
          <span className="buy-cost">💫 {fmt(cost)}</span>
        </button>
      )}
    </div>
  );
}

export default function TranscendPanel() {
  const highest = useGameStore((s) => s.highestStage);
  const crystals = useGameStore((s) => s.crystals);
  const stardustLevels = useGameStore((s) => s.stardustLevels);
  const transcends = useGameStore((s) => s.totalTranscends);
  const gain = useGameStore(selectors.transcendGain);
  const unlocked = useGameStore(selectors.transcendUnlocked);
  const doTranscend = useGameStore((s) => s.doTranscend);
  const [confirming, setConfirming] = useState(false);
  const [amount, setAmount] = useState(1);
  const { t } = useT();

  if (!unlocked) {
    return (
      <div className="panel-content">
        <div className="prestige-locked">
          <div className="prestige-star transcend-star">✦</div>
          <p dangerouslySetInnerHTML={{ __html: t('transcend_locked', { n: TRANSCEND_STAGE }) }} />
          <div className="progress">
            <div
              className="progress-fill transcend-fill"
              style={{ width: `${Math.min(100, (highest / TRANSCEND_STAGE) * 100)}%` }}
            />
          </div>
          <div className="progress-label">{t('highest', { h: highest, n: TRANSCEND_STAGE })}</div>
        </div>
      </div>
    );
  }

  function onTranscend() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    doTranscend();
    setConfirming(false);
    saveGame();
  }

  const canTranscend = gain > 0;

  return (
    <div className="panel-content">
      <div className="panel-note" dangerouslySetInnerHTML={{ __html: t('transcend_note') }} />

      <div className="prestige-box transcend-box">
        <div className="prestige-gain">
          {t('transcend_gain', { n: fmt(crystals) })}
          <strong className="stardust-text">+{fmt(gain)} 💫</strong>
        </div>
        {canTranscend ? (
          confirming ? (
            <div className="confirm-row">
              <span>{t('transcend_confirm')}</span>
              <div className="confirm-buttons">
                <button type="button" className="prestige-btn danger" onClick={onTranscend}>
                  {t('transcend_yes', { n: fmt(gain) })}
                </button>
                <button type="button" className="ghost" onClick={() => setConfirming(false)}>
                  {t('cancel')}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="prestige-btn transcend-btn" onClick={onTranscend}>
              {t('transcend_btn')}
            </button>
          )
        ) : (
          <div className="prestige-hint">{t('transcend_hint', { n: fmt(crystals) })}</div>
        )}
      </div>

      {startingCrystals(stardustLevels) > 0 && (
        <div className="panel-note subtle">
          {t('starting_crystals_note', { n: fmt(startingCrystals(stardustLevels)) })}
        </div>
      )}
      {transcends > 0 && (
        <div className="panel-note subtle">{t('transcend_count', { n: transcends })}</div>
      )}

      <AmountToggle value={amount} onChange={setAmount} />

      {STARDUST_UPGRADES.map((up) => (
        <UpgradeRow key={up.id} up={up} amount={amount} />
      ))}
    </div>
  );
}
