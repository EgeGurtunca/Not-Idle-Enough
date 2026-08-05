import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useGameStore, selectors } from '../store/gameStore.js';
import { zoneName, zoneTheme, NPCS, SKILLS } from '../game/constants.js';
import { isBossStage, bossTime, killsRequired } from '../game/formulas.js';
import { useT, zoneNameL, bossNameL, creatureNameL } from '../game/i18n.js';
import { fmt } from '../utils/format.js';
import { sfx } from '../game/audio.js';
import ZoneScene from './ZoneScene.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

// Three.js kendi parçasına ayrılır: arayüz anında boyanır, yaratık hemen ardından gelir.
const CreatureCanvas = lazy(() => import('./CreatureCanvas.jsx'));

function SkillBar() {
  const skillState = useGameStore((s) => s.skillState);
  const highest = useGameStore((s) => s.highestStage);
  const useSkill = useGameStore((s) => s.useSkill);
  const { t, dnd } = useT();

  return (
    <div className="skill-bar">
      {SKILLS.map((sk) => {
        const st = skillState[sk.id] ?? { active: 0, cd: 0 };
        const locked = highest < sk.unlockStage;
        const onCooldown = st.cd > 0 && st.active <= 0;
        const cdFrac = st.cd > 0 ? st.cd / sk.cooldown : 0;
        const loc = dnd('skill', sk.id, sk.name, sk.desc);
        return (
          <button
            key={sk.id}
            type="button"
            className={`skill ${st.active > 0 ? 'active' : ''} ${locked ? 'locked' : ''}`}
            style={{ '--cd': cdFrac }}
            disabled={locked || st.cd > 0}
            title={
              locked
                ? t('skill_locked', { name: loc.name, n: sk.unlockStage })
                : t('skill_tip', { name: loc.name, desc: loc.desc, dur: sk.duration, cd: sk.cooldown })
            }
            onClick={() => useSkill(sk.id)}
          >
            <span className="skill-emoji">{locked ? '🔒' : sk.emoji}</span>
            {st.active > 0 && <span className="skill-time">{Math.ceil(st.active)}</span>}
            {onCooldown && <span className="skill-time cd">{Math.ceil(st.cd)}</span>}
          </button>
        );
      })}
    </div>
  );
}

function GoldenCreature() {
  const golden = useGameStore((s) => s.golden);
  const clickGolden = useGameStore((s) => s.clickGolden);
  const { t } = useT();
  if (!golden) return null;
  return (
    <button
      type="button"
      className="golden"
      style={{ left: `${golden.x}%`, top: `${golden.y}%`, '--ttl': golden.ttl / 12 }}
      onClick={clickGolden}
      title={golden.reward === 'gold' ? t('golden_gold') : t('golden_frenzy')}
    >
      {golden.reward === 'gold' ? '🪙' : '✨'}
    </button>
  );
}

function ModifierBadge({ modifier }) {
  const { dnd } = useT();
  const loc = dnd('mod', modifier.id, modifier.name, modifier.desc);
  return (
    <span
      className="enemy-badge modifier"
      style={{ borderColor: modifier.color, color: modifier.color }}
      title={loc.desc}
    >
      {modifier.emoji} {loc.name}
    </span>
  );
}

export default function BattleArea() {
  const stage = useGameStore((s) => s.stage);
  const kills = useGameStore((s) => s.kills);
  const mode = useGameStore((s) => s.mode);
  const enemy = useGameStore((s) => s.enemy);
  const bossTimeLeft = useGameStore((s) => s.bossTimeLeft);
  const prestigeLevels = useGameStore((s) => s.prestigeLevels);
  const npcLevels = useGameStore((s) => s.npcLevels);
  const clickAttack = useGameStore((s) => s.clickAttack);
  const challengeBoss = useGameStore((s) => s.challengeBoss);
  const clickDmg = useGameStore(selectors.clickDamage);
  const dps = useGameStore(selectors.totalDps);
  const combo = useGameStore((s) => s.combo);
  const fx3d = useGameStore((s) => s.fx3d);
  const { t, dn, lang } = useT();

  // Düşman adını dile göre türet (enemy.name TR'de saklanır, fallback).
  // creatureNameL/bossNameL tur önekini de ekler: derin turlarda "Küllü Goblin".
  const enemyLabel = !enemy
    ? ''
    : enemy.kind !== 'boss'
      ? creatureNameL(lang, stage, enemy.typeId, enemy.name)
      : enemy.big
        ? bossNameL(lang, stage, enemy.name)
        : `${t('elite')} ${creatureNameL(lang, stage, enemy.typeId, enemy.name)}`;

  const arenaRef = useRef(null);
  const sigilRef = useRef(null);
  const npcRefs = useRef(new Map());
  const floaterId = useRef(0);
  const projectileId = useRef(0);
  const [floaters, setFloaters] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [hitId, setHitId] = useState(0);
  const [bossIntro, setBossIntro] = useState(null);
  const prevEnemyId = useRef(null);

  // Düşman değişimi = bir kill oldu: coin patlaması + (boss ise) giriş kartı
  useEffect(() => {
    if (!enemy) return;
    const prev = prevEnemyId.current;
    prevEnemyId.current = enemy.id;
    if (prev == null) return; // ilk mount
    const rect = arenaRef.current?.getBoundingClientRect();
    const cx = rect ? rect.width / 2 : 200;
    const cy = rect ? rect.height * 0.5 : 200;
    const coins = Array.from({ length: 5 }, () => {
      const id = ++floaterId.current;
      setTimeout(() => setFloaters((f) => f.filter((o) => o.id !== id)), 850);
      return { id, x: cx + (Math.random() * 90 - 45), y: cy + (Math.random() * 50 - 25), text: '🪙', coin: true };
    });
    setFloaters((f) => [...f.slice(-20), ...coins]);
    if (enemy.kind === 'boss') {
      setBossIntro({ id: enemy.id, big: enemy.big });
      setTimeout(() => setBossIntro((b) => (b && b.id === enemy.id ? null : b)), 1600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemy?.id]);

  const inBoss = mode === 'boss';
  const required = killsRequired(prestigeLevels);
  const bossReady = mode === 'farm' && kills >= required;
  const totalBossTime = bossTime(prestigeLevels);
  const frac = inBoss ? Math.max(0, bossTimeLeft / totalBossTime) : 1;
  const urgent = inBoss && bossTimeLeft <= 5;

  // Sahiplenilen yoldaşlar arenanın iki yanına dizilir (sırayla sol/sağ)
  const owned = NPCS.filter((n) => (npcLevels[n.id] ?? 0) > 0);
  const leftSide = owned.filter((_, i) => i % 2 === 0);
  const rightSide = owned.filter((_, i) => i % 2 === 1);

  // Mermi döngüsü: her tikte sıradaki yoldaş düşmana kendi mermisini fırlatır
  const shooterCount = owned.length;
  useEffect(() => {
    if (shooterCount === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let turn = 0;
    const iv = setInterval(() => {
      if (document.hidden) return;
      const st = useGameStore.getState();
      if (!st.enemy) return;
      const shooters = NPCS.filter((n) => (st.npcLevels[n.id] ?? 0) > 0);
      if (shooters.length === 0) return;
      const npc = shooters[turn++ % shooters.length];
      const el = npcRefs.current.get(npc.id);
      const arena = arenaRef.current;
      const sigil = sigilRef.current;
      if (!el || !arena || !sigil) return;
      const a = arena.getBoundingClientRect();
      const from = el.getBoundingClientRect();
      const to = sigil.getBoundingClientRect();
      const x0 = from.left + from.width / 2 - a.left;
      const y0 = from.top + from.height / 2 - a.top;
      const x1 = to.left + to.width / 2 - a.left + (Math.random() * 50 - 25);
      const y1 = to.top + to.height / 2 - a.top + (Math.random() * 50 - 25);
      const id = ++projectileId.current;
      setProjectiles((p) => [
        ...p.slice(-14),
        { id, x: x0, y: y0, dx: x1 - x0, dy: y1 - y0, glyph: npc.projectile },
      ]);
      setTimeout(() => {
        setProjectiles((p) => p.filter((o) => o.id !== id));
      }, 600);
    }, 380);
    return () => clearInterval(iv);
  }, [shooterCount]);

  function onHit(e) {
    const hit = clickAttack();
    if (!hit) return;
    if (hit.crit) sfx.crit();
    else sfx.hit();
    setHitId((h) => h + 1);
    const rect = arenaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const id = ++floaterId.current;
    const x = e.clientX - rect.left + (Math.random() * 36 - 18);
    const y = e.clientY - rect.top - 10;
    const text = hit.crit ? `💥 ${fmt(hit.dmg)}` : fmt(hit.dmg);
    setFloaters((f) => [...f.slice(-20), { id, x, y, text, crit: hit.crit }]);
    setTimeout(() => {
      setFloaters((f) => f.filter((o) => o.id !== id));
    }, 850);
  }

  function setNpcRef(id) {
    return (el) => {
      if (el) npcRefs.current.set(id, el);
      else npcRefs.current.delete(id);
    };
  }

  if (!enemy) return <section className="arena" ref={arenaRef} />;

  const hpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

  return (
    <section className="arena" ref={arenaRef} style={{ '--zone': zoneTheme(stage) }}>
      <ZoneScene stage={stage} />
      <div className="stage-head">
        <span className="stage-zone">{zoneNameL(lang, stage, zoneName(stage))}</span>
        <span className="stage-no">
          {t('region', { n: stage })}{' '}
          {isBossStage(stage) && <span title={t('boss_region')}>👑</span>}
        </span>
      </div>

      <div className="pips" aria-label={`${kills}/${required}`}>
        {Array.from({ length: required }, (_, i) => (
          <span key={i} className={`pip ${i < kills ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="enemy-name-row">
        <span className={`enemy-name ${enemy.kind === 'boss' ? (enemy.big ? 'big-boss' : 'mini-boss') : ''}`}>
          {enemyLabel}
        </span>
        {enemy.kind === 'boss' && (
          <span className={`enemy-badge ${enemy.big ? 'big' : 'mini'}`}>
            {enemy.big ? t('big_boss') : t('mini_boss')}
          </span>
        )}
        {enemy.modifier && (
          <ModifierBadge modifier={enemy.modifier} />
        )}
      </div>

      <button
        type="button"
        ref={sigilRef}
        className={`sigil ${inBoss ? 'boss' : ''} ${urgent ? 'urgent' : ''}`}
        style={{ '--frac': frac }}
        onPointerDown={onHit}
        aria-label={t('attack')}
      >
        {/* 3B kapalıysa (pil/CPU tasarrufu) ya da WebGL patlarsa aynı emoji yoluna düşülür */}
        {fx3d ? (
          <ErrorBoundary
            label="CreatureCanvas"
            fallback={<span className="canvas-fallback">{enemy.emoji}</span>}
          >
            <Suspense fallback={null}>
              <CreatureCanvas enemy={enemy} hitId={hitId} stage={stage} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <span className="canvas-fallback">{enemy.emoji}</span>
        )}
      </button>

      <div className="hpbar">
        <div
          className={`hpfill ${enemy.kind === 'boss' ? 'boss' : ''}`}
          style={{ width: `${hpPct}%` }}
        />
        <span className="hptext">
          {fmt(enemy.hp)} / {fmt(enemy.maxHp)}
        </span>
      </div>

      <div className="under-enemy">
        {inBoss && (
          <div className={`boss-timer ${urgent ? 'urgent' : ''}`}>
            {t('boss_timer', { s: bossTimeLeft.toFixed(1) })}
          </div>
        )}
        {bossReady && (
          <button type="button" className="challenge" onClick={challengeBoss}>
            {t('challenge_boss')}
          </button>
        )}
        {!inBoss && !bossReady && (
          <div className="hunt-hint">{t('hunt_hint', { k: kills, r: required })}</div>
        )}
      </div>

      <div className="battle-stats">
        <span title={t('tip_click_dmg')}>👆 {fmt(clickDmg)}</span>
        <span title={t('tip_dps')}>🗡️ {fmt(dps)}/{lang === 'tr' ? 'sn' : 's'}</span>
        {combo > 1 && (
          <span className="combo" title={t('tip_combo')}>
            {t('combo', { n: combo, m: (1 + Math.min(combo, 50) * 0.02).toFixed(2) })}
          </span>
        )}
      </div>

      <SkillBar />

      <div className="npc-side left">
        {leftSide.map((n, i) => (
          <span
            key={n.id}
            ref={setNpcRef(n.id)}
            className="npc-figure"
            style={{ animationDelay: `${i * 0.4}s` }}
            title={`${dn('npc', n.id, n.name)} — ${t('lv')} ${npcLevels[n.id]}`}
          >
            {n.emoji}
          </span>
        ))}
      </div>
      <div className="npc-side right">
        {rightSide.map((n, i) => (
          <span
            key={n.id}
            ref={setNpcRef(n.id)}
            className="npc-figure"
            style={{ animationDelay: `${i * 0.4 + 0.2}s` }}
            title={`${dn('npc', n.id, n.name)} — ${t('lv')} ${npcLevels[n.id]}`}
          >
            {n.emoji}
          </span>
        ))}
      </div>

      {projectiles.map((p) => (
        <span
          key={p.id}
          className="projectile"
          style={{ left: p.x, top: p.y, '--dx': `${p.dx}px`, '--dy': `${p.dy}px` }}
        >
          {p.glyph}
        </span>
      ))}

      <GoldenCreature />

      {bossIntro && (
        <div className={`boss-intro ${bossIntro.big ? 'big' : ''}`} key={bossIntro.id}>
          <span className="boss-intro-label">
            {bossIntro.big ? `👑 ${t('big_boss')}` : `⚔ ${t('boss_short')}`}
          </span>
          <span className="boss-intro-name">{enemyLabel}</span>
        </div>
      )}

      {floaters.map((f) => (
        <span
          key={f.id}
          className={`floater ${f.crit ? 'crit' : ''} ${f.coin ? 'coin' : ''}`}
          style={{ left: f.x, top: f.y }}
        >
          {f.text}
        </span>
      ))}
    </section>
  );
}
