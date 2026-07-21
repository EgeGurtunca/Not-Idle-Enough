import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { ARTIFACTS, RARITIES, ARTIFACT_MAX_LEVEL } from '../game/constants.js';
import { pullCost, rarityOdds, artifactUpgradeCost } from '../game/formulas.js';
import { useT } from '../game/i18n.js';
import { fmt } from '../utils/format.js';

// Rulet ayarları
const CARD_PITCH = 96;
const CARD_W = 88;
const REEL_LEN = 48;
const TARGET_INDEX = 40;
const SPIN_MS = 3800;

function rarityOf(art) {
  return RARITIES.find((r) => r.id === art.rarity);
}

// Dile duyarlı yardımcılar (tr = useT sonucu)
function effectText(tr, art, level) {
  const lv = Math.max(1, level);
  const label = tr.t('eff_' + art.effect);
  if (art.effect === 'bossTime') return tr.t('eff_val_sec', { label, v: art.value * lv });
  return tr.t('eff_val_pct', { label, v: Math.round(art.value * lv * 100) });
}
const artName = (tr, art) => tr.dn('artifact', art.id, art.name);
const rarityName = (tr, r) => tr.dn('rarity', r.id, r.name);

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
  const pool = ARTIFACTS.filter((a) => a.rarity === rarityId && (artifacts[a.id] ?? 0) === 0);
  return pool[Math.floor(Math.random() * pool.length)];
}

function CaseOpening({ opening, nextCost, crystals, allOwned, onAgain, onClose }) {
  const { reel, result, seq } = opening;
  const tr = useT();
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
        <h2 className="case-title">{tr.t('ancient_chest')}</h2>
        <div className="case-reel-wrap" ref={wrapRef}>
          <div className="case-marker" />
          <div
            className="case-reel"
            style={{
              transform: `translateX(${-offset}px)`,
              transition: offset ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.15, 1)` : 'none',
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
                {won.emoji} {artName(tr, won)}
              </div>
              <div className="pull-rarity" style={{ color: wonRarity.color }}>
                {rarityName(tr, wonRarity)}{' '}
                {result.isNew ? tr.t('is_new') : tr.t('lvl_dot', { n: result.level })}
              </div>
              <div className="pull-effect">{effectText(tr, won, result.level)}</div>
              <div className="confirm-buttons case-buttons">
                <button
                  type="button"
                  className="pull-btn small"
                  disabled={crystals < nextCost || allOwned}
                  onClick={onAgain}
                >
                  {tr.t('chest_again')}
                  <span className="buy-cost">💎 {fmt(nextCost)}</span>
                </button>
                <button type="button" className="ghost" onClick={onClose}>
                  {tr.t('close')}
                </button>
              </div>
            </>
          ) : (
            <div className="case-spinning">{tr.t('opening_chest')}</div>
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
  const tr = useT();
  const { t } = tr;
  const [selectedId, setSelectedId] = useState(null);
  const [opening, setOpening] = useState(null);

  const cost = pullCost(totalPulls);
  const ownedCount = ARTIFACTS.filter((a) => (artifacts[a.id] ?? 0) > 0).length;
  const allOwned = ownedCount === ARTIFACTS.length;
  const selected = selectedId ? ARTIFACTS.find((a) => a.id === selectedId) : null;

  function startPull() {
    const st = useGameStore.getState();
    const before = st.totalPulls;
    st.pullArtifact();
    const after = useGameStore.getState();
    if (after.totalPulls === before) return;
    const won = ARTIFACTS.find((a) => a.id === after.lastPull.id);
    const reel = Array.from({ length: REEL_LEN }, () => weightedRandomArtifact(st.artifacts));
    reel[TARGET_INDEX] = won;
    setOpening((prev) => ({ reel, result: after.lastPull, seq: (prev?.seq ?? 0) + 1 }));
  }

  return (
    <div className="panel-content">
      <div
        className="panel-note"
        dangerouslySetInnerHTML={{ __html: t('artifact_note', { n: ARTIFACT_MAX_LEVEL }) }}
      />

      <div className="odds-row">
        {rarityOdds(artifacts).map((r) => (
          <span key={r.id} className="odds" style={{ color: r.color }}>
            %{Number.isInteger(r.chance) ? r.chance : r.chance.toFixed(1)} {rarityName(tr, r)}
            <span className="odds-remaining">{t('odds_remaining', { n: r.remaining })}</span>
          </span>
        ))}
      </div>

      <button type="button" className="pull-btn" disabled={crystals < cost || allOwned} onClick={startPull}>
        {t('open_chest')}
        <span className="buy-cost">💎 {fmt(cost)}</span>
      </button>
      {allOwned && (
        <div className="panel-note subtle">{t('collection_full', { a: ARTIFACTS.length })}</div>
      )}

      <div className="collection-head">
        {t('collection', { o: ownedCount, t: ARTIFACTS.length, p: fmt(totalPulls) })}
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
              title={owned ? `${artName(tr, art)} — ${effectText(tr, art, level)}` : `${rarityName(tr, r)} ?`}
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
                  {selected.emoji} {artName(tr, selected)}{' '}
                  <span className="row-level">
                    {t('lv')} {artifacts[selected.id]}/{ARTIFACT_MAX_LEVEL}
                  </span>
                </div>
                <div className="pull-rarity" style={{ color: rarityOf(selected).color }}>
                  {rarityName(tr, rarityOf(selected))}
                </div>
                <div className="row-sub">{effectText(tr, selected, artifacts[selected.id])}</div>
              </div>
              {artifacts[selected.id] < ARTIFACT_MAX_LEVEL ? (
                <button
                  type="button"
                  className="buy crystal"
                  disabled={crystals < artifactUpgradeCost(selected, artifacts[selected.id])}
                  onClick={() => useGameStore.getState().upgradeArtifact(selected.id)}
                >
                  {t('upgrade')}
                  <span className="buy-cost">
                    💎 {fmt(artifactUpgradeCost(selected, artifacts[selected.id]))}
                  </span>
                </button>
              ) : (
                <span className="maxed">{t('maxi')}</span>
              )}
            </div>
          ) : (
            <>
              <div className="row-name">{t('unknown_artifact')}</div>
              <div className="pull-rarity" style={{ color: rarityOf(selected).color }}>
                {rarityName(tr, rarityOf(selected))}
              </div>
              <div className="row-sub">{t('unknown_hint')}</div>
            </>
          )}
        </div>
      )}

      {opening && (
        <CaseOpening
          opening={opening}
          nextCost={pullCost(totalPulls)}
          crystals={crystals}
          allOwned={allOwned}
          onAgain={startPull}
          onClose={() => setOpening(null)}
        />
      )}
    </div>
  );
}
