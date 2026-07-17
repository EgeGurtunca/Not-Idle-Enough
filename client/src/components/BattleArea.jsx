import { useRef, useState } from 'react';
import { useGameStore, selectors } from '../store/gameStore.js';
import { KILLS_PER_STAGE, zoneName } from '../game/constants.js';
import { isBossStage, bossTime } from '../game/formulas.js';
import { fmt } from '../utils/format.js';

export default function BattleArea() {
  const stage = useGameStore((s) => s.stage);
  const kills = useGameStore((s) => s.kills);
  const mode = useGameStore((s) => s.mode);
  const enemy = useGameStore((s) => s.enemy);
  const bossTimeLeft = useGameStore((s) => s.bossTimeLeft);
  const prestigeLevels = useGameStore((s) => s.prestigeLevels);
  const clickAttack = useGameStore((s) => s.clickAttack);
  const challengeBoss = useGameStore((s) => s.challengeBoss);
  const clickDmg = useGameStore(selectors.clickDamage);
  const dps = useGameStore(selectors.totalDps);

  const arenaRef = useRef(null);
  const floaterId = useRef(0);
  const [floaters, setFloaters] = useState([]);
  const [hitId, setHitId] = useState(0);

  const inBoss = mode === 'boss';
  const bossReady = mode === 'farm' && kills >= KILLS_PER_STAGE;
  const totalBossTime = bossTime(prestigeLevels);
  const frac = inBoss ? Math.max(0, bossTimeLeft / totalBossTime) : 1;
  const urgent = inBoss && bossTimeLeft <= 5;

  function onHit(e) {
    const hit = clickAttack();
    if (!hit) return;
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

      <div className="pips" aria-label={`Avlanan yaratık: ${kills}/${KILLS_PER_STAGE}`}>
        {Array.from({ length: KILLS_PER_STAGE }, (_, i) => (
          <span key={i} className={`pip ${i < kills ? 'filled' : ''}`} />
        ))}
      </div>

      <div className="enemy-name-row">
        <span className={`enemy-name ${enemy.kind === 'boss' ? (enemy.big ? 'big-boss' : 'mini-boss') : ''}`}>
          {enemy.kind === 'boss' ? enemy.name : 'Yaratık'}
        </span>
      </div>

      <button
        type="button"
        className={`sigil ${inBoss ? 'boss' : ''} ${urgent ? 'urgent' : ''}`}
        style={{ '--frac': frac }}
        onPointerDown={onHit}
        aria-label="Saldır"
      >
        <span key={hitId} className="enemy-emoji">
          {enemy.emoji}
        </span>
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
            Avlanan: {kills}/{KILLS_PER_STAGE} — boss için yaratıkları kes
          </div>
        )}
      </div>

      <div className="battle-stats">
        <span title="Klik hasarı">👆 {fmt(clickDmg)}</span>
        <span title="Yoldaş hasarı (saniyede)">🗡️ {fmt(dps)}/sn</span>
      </div>

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
