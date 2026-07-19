import { useEffect, useRef, useState } from 'react';
import { useGameStore, selectors } from '../store/gameStore.js';
import { zoneName, NPCS, SKILLS } from '../game/constants.js';
import { isBossStage, bossTime, killsRequired } from '../game/formulas.js';
import { fmt } from '../utils/format.js';
import { sfx } from '../game/audio.js';
import CreatureCanvas from './CreatureCanvas.jsx';

function SkillBar() {
  const skillState = useGameStore((s) => s.skillState);
  const highest = useGameStore((s) => s.highestStage);
  const useSkill = useGameStore((s) => s.useSkill);

  return (
    <div className="skill-bar">
      {SKILLS.map((sk) => {
        const st = skillState[sk.id] ?? { active: 0, cd: 0 };
        const locked = highest < sk.unlockStage;
        const onCooldown = st.cd > 0 && st.active <= 0;
        const cdFrac = st.cd > 0 ? st.cd / sk.cooldown : 0;
        return (
          <button
            key={sk.id}
            type="button"
            className={`skill ${st.active > 0 ? 'active' : ''} ${locked ? 'locked' : ''}`}
            style={{ '--cd': cdFrac }}
            disabled={locked || st.cd > 0}
            title={
              locked
                ? `${sk.name} — Bölge ${sk.unlockStage}'de açılır`
                : `${sk.name} — ${sk.desc} (${sk.duration}sn, bekleme ${sk.cooldown}sn)`
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

  const arenaRef = useRef(null);
  const sigilRef = useRef(null);
  const npcRefs = useRef(new Map());
  const floaterId = useRef(0);
  const projectileId = useRef(0);
  const [floaters, setFloaters] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [hitId, setHitId] = useState(0);

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
    <section className="arena" ref={arenaRef}>
      <div className="stage-head">
        <span className="stage-zone">{zoneName(stage)}</span>
        <span className="stage-no">
          Bölge {stage} {isBossStage(stage) && <span title="Boss bölgesi">👑</span>}
        </span>
      </div>

      <div className="pips" aria-label={`Avlanan yaratık: ${kills}/${required}`}>
        {Array.from({ length: required }, (_, i) => (
          <span key={i} className={`pip ${i < kills ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="enemy-name-row">
        <span className={`enemy-name ${enemy.kind === 'boss' ? (enemy.big ? 'big-boss' : 'mini-boss') : ''}`}>
          {enemy.name}
        </span>
        {enemy.kind === 'boss' && (
          <span className={`enemy-badge ${enemy.big ? 'big' : 'mini'}`}>
            {enemy.big ? 'BÜYÜK BOSS' : 'MİNİ BOSS'}
          </span>
        )}
      </div>

      <button
        type="button"
        ref={sigilRef}
        className={`sigil ${inBoss ? 'boss' : ''} ${urgent ? 'urgent' : ''}`}
        style={{ '--frac': frac }}
        onPointerDown={onHit}
        aria-label="Saldır"
      >
        <CreatureCanvas enemy={enemy} hitId={hitId} />
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
            ⏱ {bossTimeLeft.toFixed(1)}sn — boss kaçmadan yetiş!
          </div>
        )}
        {bossReady && (
          <button type="button" className="challenge" onClick={challengeBoss}>
            ⚔️ Boss'a Meydan Oku
          </button>
        )}
        {!inBoss && !bossReady && (
          <div className="hunt-hint">
            Avlanan: {kills}/{required} — boss için yaratıkları kes
          </div>
        )}
      </div>

      <div className="battle-stats">
        <span title="Klik hasarı">👆 {fmt(clickDmg)}</span>
        <span title="Yoldaş hasarı (saniyede)">🗡️ {fmt(dps)}/sn</span>
      </div>

      <SkillBar />

      <div className="npc-side left">
        {leftSide.map((n, i) => (
          <span
            key={n.id}
            ref={setNpcRef(n.id)}
            className="npc-figure"
            style={{ animationDelay: `${i * 0.4}s` }}
            title={`${n.name} — sv ${npcLevels[n.id]}`}
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
            title={`${n.name} — sv ${npcLevels[n.id]}`}
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

      {floaters.map((f) => (
        <span
          key={f.id}
          className={`floater ${f.crit ? 'crit' : ''}`}
          style={{ left: f.x, top: f.y }}
        >
          {f.text}
        </span>
      ))}
    </section>
  );
}
