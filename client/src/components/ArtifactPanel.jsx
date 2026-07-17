import { useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { ARTIFACTS, RARITIES, PULL_COST, ARTIFACT_MAX_LEVEL } from '../game/constants.js';
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

function rarityOf(art) {
  return RARITIES.find((r) => r.id === art.rarity);
}

function effectText(art, level) {
  const lv = Math.max(1, level);
  if (art.effect === 'bossTime') return `${EFFECT_LABELS[art.effect]} +${art.value * lv}sn`;
  return `${EFFECT_LABELS[art.effect]} +%${Math.round(art.value * lv * 100)}`;
}

export default function ArtifactPanel() {
  const crystals = useGameStore((s) => s.crystals);
  const artifacts = useGameStore((s) => s.artifacts);
  const lastPull = useGameStore((s) => s.lastPull);
  const totalPulls = useGameStore((s) => s.totalPulls);
  const pullArtifact = useGameStore((s) => s.pullArtifact);
  const [selectedId, setSelectedId] = useState(null);

  const ownedCount = ARTIFACTS.filter((a) => (artifacts[a.id] ?? 0) > 0).length;
  const allMaxed = ARTIFACTS.every((a) => (artifacts[a.id] ?? 0) >= ARTIFACT_MAX_LEVEL);
  const lastArt = lastPull ? ARTIFACTS.find((a) => a.id === lastPull.id) : null;
  const selected = selectedId ? ARTIFACTS.find((a) => a.id === selectedId) : null;

  return (
    <div className="panel-content">
      <div className="panel-note">
        Kristallerle kadim sandıklar aç; içinden {ARTIFACTS.length} artifact'lik havuzdan rastgele
        biri çıkar. Kopyalar artifact'i güçlendirir (maks sv {ARTIFACT_MAX_LEVEL}). Artifact'ler
        prestijde <strong>kaybolmaz</strong>.
      </div>

      <div className="odds-row">
        {RARITIES.map((r) => (
          <span key={r.id} className="odds" style={{ color: r.color }}>
            %{r.chance} {r.name}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="pull-btn"
        disabled={crystals < PULL_COST || allMaxed}
        onClick={pullArtifact}
      >
        🗝️ Sandık Aç
        <span className="buy-cost">💎 {PULL_COST}</span>
      </button>
      {allMaxed && <div className="panel-note subtle">Koleksiyon tamamlandı — hepsi maks seviyede!</div>}

      {lastArt && (
        <div className="pull-result" style={{ '--rarity': rarityOf(lastArt).color }} key={totalPulls}>
          <span className="pull-emoji">{lastArt.emoji}</span>
          <div className="pull-info">
            <div className="pull-name">{lastArt.name}</div>
            <div className="pull-rarity" style={{ color: rarityOf(lastArt).color }}>
              {rarityOf(lastArt).name} {lastPull.isNew ? '· YENİ!' : `· Seviye ${lastPull.level}`}
            </div>
            <div className="pull-effect">{effectText(lastArt, lastPull.level)}</div>
          </div>
        </div>
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
            <>
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
            </>
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
    </div>
  );
}
