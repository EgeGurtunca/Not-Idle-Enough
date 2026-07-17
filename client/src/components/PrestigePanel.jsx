import { useState } from 'react';
import { useGameStore, selectors } from '../store/gameStore.js';
import { PRESTIGE_STAGE, PRESTIGE_UPGRADES } from '../game/constants.js';
import { prestigeUpgradeCost, startingGold } from '../game/formulas.js';
import { saveGame } from '../game/save.js';
import { fmt } from '../utils/format.js';

function UpgradeRow({ up }) {
  const crystals = useGameStore((s) => s.crystals);
  const level = useGameStore((s) => s.prestigeLevels[up.id] ?? 0);
  const buy = useGameStore((s) => s.buyPrestigeUpgrade);

  const maxed = level >= up.maxLevel;
  const cost = maxed ? 0 : prestigeUpgradeCost(up, level);

  return (
    <div className="row">
      <span className="row-emoji">{up.emoji}</span>
      <div className="row-info">
        <div className="row-name">
          {up.name} <span className="row-level">sv {level}{Number.isFinite(up.maxLevel) ? `/${up.maxLevel}` : ''}</span>
        </div>
        <div className="row-sub">{up.desc}</div>
      </div>
      {maxed ? (
        <span className="maxed">Tamamlandı</span>
      ) : (
        <button
          type="button"
          className="buy crystal"
          disabled={crystals < cost}
          onClick={() => buy(up.id)}
        >
          Geliştir
          <span className="buy-cost">💎 {fmt(cost)}</span>
        </button>
      )}
    </div>
  );
}

export default function PrestigePanel() {
  const highest = useGameStore((s) => s.highestStage);
  const runHighest = useGameStore((s) => s.runHighestStage);
  const crystals = useGameStore((s) => s.crystals);
  const prestigeLevels = useGameStore((s) => s.prestigeLevels);
  const gain = useGameStore(selectors.crystalGain);
  const canPrestige = useGameStore(selectors.canPrestige);
  const doPrestige = useGameStore((s) => s.doPrestige);
  const [confirming, setConfirming] = useState(false);

  if (highest < PRESTIGE_STAGE) {
    return (
      <div className="panel-content">
        <div className="prestige-locked">
          <div className="prestige-star">✦</div>
          <p>
            Prestij, <strong>Bölge {PRESTIGE_STAGE}</strong>'e ilk ulaştığında açılır. İlerlemeni
            sıfırlayıp karşılığında <strong>kristal 💎</strong> kazanırsın — kristaller kalıcı
            güç satın alır.
          </p>
          <div className="progress">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, (highest / PRESTIGE_STAGE) * 100)}%` }}
            />
          </div>
          <div className="progress-label">
            En yüksek: Bölge {highest} / {PRESTIGE_STAGE}
          </div>
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
      <div className="panel-note">
        Prestij: bu maceradaki altın, kahraman ve yoldaşlar sıfırlanır; ulaştığın bölgeye göre
        kristal kazanırsın. Kristaller ve buradaki geliştirmeler kalıcıdır.
      </div>

      <div className="prestige-box">
        <div className="prestige-gain">
          Bu macera: Bölge {runHighest} → <strong>+{fmt(gain)} 💎</strong>
        </div>
        {canPrestige ? (
          confirming ? (
            <div className="confirm-row">
              <span>Tüm ilerleme sıfırlanacak. Emin misin?</span>
              <div className="confirm-buttons">
                <button type="button" className="prestige-btn danger" onClick={onPrestige}>
                  Evet, sıfırla ve +{fmt(gain)} 💎 al
                </button>
                <button type="button" className="ghost" onClick={() => setConfirming(false)}>
                  Vazgeç
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="prestige-btn" onClick={onPrestige}>
              ✦ Prestij Yap
            </button>
          )
        ) : (
          <div className="prestige-hint">
            Tekrar prestij için bu macerada Bölge {PRESTIGE_STAGE}'e ulaş ({runHighest}/
            {PRESTIGE_STAGE})
          </div>
        )}
      </div>

      {startingGold(prestigeLevels) > 0 && (
        <div className="panel-note subtle">
          Yeni maceralar 🪙 {fmt(startingGold(prestigeLevels))} ile başlar.
        </div>
      )}

      {PRESTIGE_UPGRADES.map((up) => (
        <UpgradeRow key={up.id} up={up} />
      ))}
    </div>
  );
}
