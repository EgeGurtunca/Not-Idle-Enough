import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { ARTIFACTS, RARITIES, ARTIFACT_MAX_LEVEL } from '../game/constants.js';
import { pullCost, rarityOdds, artifactUpgradeCost } from '../game/formulas.js';
import { fmt } from '../utils/format.js';

const EFFECT_LABELS = {
  click: 'Klik hasarı',
  dps: 'NPC hasarı',
  gold: 'Altın kazancı',
  critChance: 'Kritik şansı',
  critMult: 'Kritik hasarı',
  bossTime: 'Boss süresi',
  offline: 'Çevrimdışı kazanç',
  crystal: 'Kristal kazancı',
};

// Rulet ayarları
const CARD_PITCH = 96; // kart genişliği 88 + 8 boşluk
const CARD_W = 88;
const REEL_LEN = 48;
const TARGET_INDEX = 40;
const SPIN_MS = 3800;

function rarityOf(art) {
  return RARITIES.find((r) => r.id === art.rarity);
}

function effectText(art, level) {
  const lv = Math.max(1, level);
  if (art.effect === 'bossTime') return `${EFFECT_LABELS[art.effect]} +${art.value * lv}sn`;
  return `${EFFECT_LABELS[art.effect]} +%${Math.round(art.value * lv * 100)}`;
}

// Rulet dolgu kartları: kalan havuza normalize edilmiş gerçek oranlarla
function weightedRandomArtifact(artifacts) {
  const odds = rarityOdds(artifacts);
  if (odds.length === 0) return ARTIFACTS[0];
  let roll = Math.random() * 100;
  let rarityId = odds[odds.length - 1].id;
  for (const o of odds) {
    if (roll < o.chance) {
      rarityId = o.id;
      break;
    }
    roll -= o.chance;
  }
  const pool = ARTIFACTS.filter(
    (a) => a.rarity === rarityId && (artifacts[a.id] ?? 0) < ARTIFACT_MAX_LEVEL
  );
  return pool[Math.floor(Math.random() * pool.length)];
}

function CaseOpening({ opening, nextCost, crystals, allMaxed, onAgain, onClose }) {
  const { reel, result, seq } = opening;
  const wrapRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const won = ARTIFACTS.find((a) => a.id === result.id);
  const wonRarity = rarityOf(won);

  useEffect(() => {
    setRevealed(false);
    setOffset(0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      return;
    }
    const wrapW = wrapRef.current?.clientWidth ?? 520;
    const jitter = (Math.random() - 0.5) * CARD_W * 0.6;
    const target = TARGET_INDEX * CARD_PITCH + CARD_W / 2 - wrapW / 2 + jitter;
    // İki rAF: önce transform 0 render edilsin, sonra hedefe geçiş başlasın
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setOffset(target));
    });
    const timer = setTimeout(() => setRevealed(true), SPIN_MS + 150);
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      clearTimeout(timer);
    };
  }, [seq]);

  return (
    <div className="modal-backdrop" onClick={revealed ? onClose : undefined}>
      <div className="case-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="case-title">Kadim Sandık</h2>
        <div className="case-reel-wrap" ref={wrapRef}>
          <div className="case-marker" />
          <div
            className="case-reel"
            style={{
              transform: `translateX(${-offset}px)`,
              transition: offset
                ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.15, 1)`
                : 'none',
            }}
          >
            {reel.map((art, i) => (
              <div
                key={i}
                className={`case-card ${i === TARGET_INDEX && revealed ? 'winner' : ''}`}
                style={{ '--rarity': rarityOf(art).color }}
              >
                {art.emoji}
              </div>
            ))}
          </div>
        </div>

        <div className={`case-result ${revealed ? 'show' : ''}`}>
          {revealed ? (
            <>
              <div className="pull-name" style={{ color: wonRarity.color }}>
                {won.emoji} {won.name}
              </div>
              <div className="pull-rarity" style={{ color: wonRarity.color }}>
                {wonRarity.name} {result.isNew ? '· YENİ!' : `· Seviye ${result.level}`}
              </div>
              <div className="pull-effect">{effectText(won, result.level)}</div>
              <div className="confirm-buttons case-buttons">
                <button
                  type="button"
                  className="pull-btn small"
                  disabled={crystals < nextCost || allMaxed}
                  onClick={onAgain}
                >
                  🗝️ Tekrar Aç
                  <span className="buy-cost">💎 {fmt(nextCost)}</span>
                </button>
                <button type="button" className="ghost" onClick={onClose}>
                  Kapat
                </button>
              </div>
            </>
          ) : (
            <div className="case-spinning">Sandık açılıyor…</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtifactPanel() {
  const crystals = useGameStore((s) => s.crystals);
  const artifacts = useGameStore((s) => s.artifacts);
  const totalPulls = useGameStore((s) => s.totalPulls);
  const [selectedId, setSelectedId] = useState(null);
  const [opening, setOpening] = useState(null); // { reel, result, seq }

  const cost = pullCost(totalPulls);
  const ownedCount = ARTIFACTS.filter((a) => (artifacts[a.id] ?? 0) > 0).length;
  const allMaxed = ARTIFACTS.every((a) => (artifacts[a.id] ?? 0) >= ARTIFACT_MAX_LEVEL);
  const selected = selectedId ? ARTIFACTS.find((a) => a.id === selectedId) : null;

  function startPull() {
    const st = useGameStore.getState();
    const before = st.totalPulls;
    st.pullArtifact();
    const after = useGameStore.getState();
    if (after.totalPulls === before) return; // kristal yetmedi veya koleksiyon tamam
    const won = ARTIFACTS.find((a) => a.id === after.lastPull.id);
    const reel = Array.from({ length: REEL_LEN }, () => weightedRandomArtifact(st.artifacts));
    reel[TARGET_INDEX] = won;
    setOpening((prev) => ({ reel, result: after.lastPull, seq: (prev?.seq ?? 0) + 1 }));
  }

  return (
    <div className="panel-content">
      <div className="panel-note">
        Kristallerle kadim sandıklar aç; içinden {ARTIFACTS.length} artifact'lik havuzdan rastgele
        biri çıkar. Her açılışta sandığın fiyatı biraz artar. Kopyalar artifact'i güçlendirir
        (maks sv {ARTIFACT_MAX_LEVEL}). Artifact'ler prestijde <strong>kaybolmaz</strong>.
      </div>

      <div className="odds-row">
        {rarityOdds(artifacts).map((r) => (
          <span key={r.id} className="odds" style={{ color: r.color }}>
            %{Number.isInteger(r.chance) ? r.chance : r.chance.toFixed(1)} {r.name}
            <span className="odds-remaining"> ({r.remaining})</span>
          </span>
        ))}
      </div>

      <button
        type="button"
        className="pull-btn"
        disabled={crystals < cost || allMaxed}
        onClick={startPull}
      >
        🗝️ Sandık Aç
        <span className="buy-cost">💎 {fmt(cost)}</span>
      </button>
      {allMaxed && (
        <div className="panel-note subtle">Koleksiyon tamamlandı — hepsi maks seviyede!</div>
      )}

      <div className="collection-head">
        Koleksiyon: {ownedCount}/{ARTIFACTS.length} · {fmt(totalPulls)} çekiliş
      </div>

      <div className="artifact-grid">
        {ARTIFACTS.map((art) => {
          const level = artifacts[art.id] ?? 0;
          const owned = level > 0;
          const r = rarityOf(art);
          return (
            <button
              key={art.id}
              type="button"
              className={`artifact-cell ${owned ? 'owned' : ''} ${selectedId === art.id ? 'selected' : ''}`}
              style={{ '--rarity': r.color }}
              onClick={() => setSelectedId(selectedId === art.id ? null : art.id)}
              title={owned ? `${art.name} — ${effectText(art, level)}` : `Bilinmeyen ${r.name} artifact`}
            >
              <span className="artifact-emoji">{owned ? art.emoji : '❔'}</span>
              {owned && <span className="artifact-lv">{level}</span>}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="artifact-detail" style={{ '--rarity': rarityOf(selected).color }}>
          {(artifacts[selected.id] ?? 0) > 0 ? (
            <div className="artifact-detail-owned">
              <div className="artifact-detail-info">
                <div className="row-name">
                  {selected.emoji} {selected.name}{' '}
                  <span className="row-level">
                    sv {artifacts[selected.id]}/{ARTIFACT_MAX_LEVEL}
                  </span>
                </div>
                <div className="pull-rarity" style={{ color: rarityOf(selected).color }}>
                  {rarityOf(selected).name}
                </div>
                <div className="row-sub">{effectText(selected, artifacts[selected.id])}</div>
              </div>
              {artifacts[selected.id] < ARTIFACT_MAX_LEVEL ? (
                <button
                  type="button"
                  className="buy crystal"
                  disabled={crystals < artifactUpgradeCost(selected, artifacts[selected.id])}
                  onClick={() => useGameStore.getState().upgradeArtifact(selected.id)}
                >
                  Geliştir
                  <span className="buy-cost">
                    💎 {fmt(artifactUpgradeCost(selected, artifacts[selected.id]))}
                  </span>
                </button>
              ) : (
                <span className="maxed">Maks</span>
              )}
            </div>
          ) : (
            <>
              <div className="row-name">❔ Bilinmeyen Artifact</div>
              <div className="pull-rarity" style={{ color: rarityOf(selected).color }}>
                {rarityOf(selected).name}
              </div>
              <div className="row-sub">Sandıklardan çıkarsa ne olduğunu öğrenirsin.</div>
            </>
          )}
        </div>
      )}

      {opening && (
        <CaseOpening
          opening={opening}
          nextCost={pullCost(totalPulls)}
          crystals={crystals}
          allMaxed={allMaxed}
          onAgain={startPull}
          onClose={() => setOpening(null)}
        />
      )}
    </div>
  );
}
