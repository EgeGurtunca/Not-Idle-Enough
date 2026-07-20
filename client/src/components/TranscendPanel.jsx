import { useState } from 'react';
import { useGameStore, selectors } from '../store/gameStore.js';
import { TRANSCEND_STAGE, STARDUST_UPGRADES } from '../game/constants.js';
import { stardustUpgradeCost, startingCrystals, bulkCost, maxAffordable } from '../game/formulas.js';
import { saveGame } from '../game/save.js';
import { fmt } from '../utils/format.js';
import AmountToggle from './AmountToggle.jsx';

function UpgradeRow({ up, amount }) {
  const stardust = useGameStore((s) => s.stardust);
  const level = useGameStore((s) => s.stardustLevels[up.id] ?? 0);
  const buyLevels = useGameStore((s) => s.buyStardustUpgradeLevels);
  const buyMax = useGameStore((s) => s.buyStardustUpgradeMax);

  const maxed = level >= up.maxLevel;
  const remaining = up.maxLevel - level;
  const costFn = (l) => stardustUpgradeCost(up, l);

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
          className="buy stardust"
          disabled={!affordable}
          onClick={() => (amount === 'max' ? buyMax(up.id) : buyLevels(up.id, amount))}
        >
          {amount === 'max' ? `Maks ×${count}` : `Al ×${count}`}
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

  if (!unlocked) {
    return (
      <div className="panel-content">
        <div className="prestige-locked">
          <div className="prestige-star transcend-star">✦</div>
          <p>
            Aşkınlık, <strong>Bölge {TRANSCEND_STAGE}</strong>'e ilk ulaştığında açılır. Kristaller
            dahil tüm koşu ilerlemeni sıfırlar; karşılığında <strong>Yıldız Tozu 💫</strong>{' '}
            kazanırsın — kalıcı ve çok güçlü çarpanlar. Artifact'ler ve başarımlar korunur.
          </p>
          <div className="progress">
            <div
              className="progress-fill transcend-fill"
              style={{ width: `${Math.min(100, (highest / TRANSCEND_STAGE) * 100)}%` }}
            />
          </div>
          <div className="progress-label">
            En yüksek: Bölge {highest} / {TRANSCEND_STAGE}
          </div>
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
      <div className="panel-note">
        Aşkınlık: bu döngüdeki altın, kahraman, yoldaşlar, <strong>kristaller</strong> ve prestij
        geliştirmeleri sıfırlanır. Yıldız Tozu bankandaki kristale göre kazanılır; Yıldız Tozu,
        aşağıdaki çarpanlar ve artifact'ler kalıcıdır.
      </div>

      <div className="prestige-box transcend-box">
        <div className="prestige-gain">
          Bankadaki 💎 {fmt(crystals)} → <strong className="stardust-text">+{fmt(gain)} 💫</strong>
        </div>
        {canTranscend ? (
          confirming ? (
            <div className="confirm-row">
              <span>Kristaller dahil tüm döngü sıfırlanacak. Emin misin?</span>
              <div className="confirm-buttons">
                <button type="button" className="prestige-btn danger" onClick={onTranscend}>
                  Evet, aşkınlaş ve +{fmt(gain)} 💫 al
                </button>
                <button type="button" className="ghost" onClick={() => setConfirming(false)}>
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="prestige-btn transcend-btn" onClick={onTranscend}>
              ✦ Aşkınlaş
            </button>
          )
        ) : (
          <div className="prestige-hint">
            Aşkınlaşmak için kristal biriktir (prestij yaparak). Şu an: 💎 {fmt(crystals)}
          </div>
        )}
      </div>

      {startingCrystals(stardustLevels) > 0 && (
        <div className="panel-note subtle">
          Aşkınlık sonrası 💎 {fmt(startingCrystals(stardustLevels))} kristalle başlarsın.
        </div>
      )}
      {transcends > 0 && (
        <div className="panel-note subtle">Toplam {transcends} kez aşkınlaştın.</div>
      )}

      <AmountToggle value={amount} onChange={setAmount} />

      {STARDUST_UPGRADES.map((up) => (
        <UpgradeRow key={up.id} up={up} amount={amount} />
      ))}
    </div>
  );
}
