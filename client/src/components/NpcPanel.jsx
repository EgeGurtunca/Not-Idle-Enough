import { useGameStore } from '../store/gameStore.js';
import { NPCS, MILESTONE_EVERY, NPC_PASSIVES, NPC_PASSIVE_THRESHOLD } from '../game/constants.js';
import { npcDps, npcLevelCost, bulkCost, maxAffordable } from '../game/formulas.js';
import { fmt } from '../utils/format.js';
import AmountToggle from './AmountToggle.jsx';

function NpcRow({ npc, amount }) {
  const gold = useGameStore((s) => s.gold);
  const level = useGameStore((s) => s.npcLevels[npc.id] ?? 0);
  const prestigeLevels = useGameStore((s) => s.prestigeLevels);
  const buyNpcLevels = useGameStore((s) => s.buyNpcLevels);
  const buyNpcMax = useGameStore((s) => s.buyNpcMax);

  const unlocked = level > 0;
  const costFn = (l) => npcLevelCost(npc, l);

  // Kilitliyken de toplu alım çalışır: ilk seviyenin maliyeti işe alım ücretidir
  let count, cost;
  if (amount === 'max') {
    ({ count, cost } = maxAffordable(costFn, level, gold));
  } else {
    count = amount;
    cost = bulkCost(costFn, level, amount);
  }
  const affordable = amount === 'max' ? count > 0 : gold >= cost;
  const nextMilestone = (Math.floor(level / MILESTONE_EVERY) + 1) * MILESTONE_EVERY;

  return (
    <div className={`row ${unlocked ? '' : 'locked'}`}>
      <span className="row-emoji">{npc.emoji}</span>
      <div className="row-info">
        <div className="row-name">{npc.name}</div>
        {unlocked ? (
          <>
            <div className="row-sub">
              Seviye {level} · 🗡️ {fmt(npcDps(npc, level, prestigeLevels))}/sn
            </div>
            <div className="row-milestone">Seviye {nextMilestone}'te hasar ×2</div>
            {NPC_PASSIVES[npc.id] && (
              <div className={`row-passive ${level >= NPC_PASSIVE_THRESHOLD ? 'on' : ''}`}>
                {level >= NPC_PASSIVE_THRESHOLD ? '✦' : '🔒'} Pasif (sv {NPC_PASSIVE_THRESHOLD}):{' '}
                {NPC_PASSIVES[npc.id].label}
              </div>
            )}
          </>
        ) : (
          <div className="row-sub">İşe alınca otomatik vurur · 🗡️ {fmt(npc.baseDps)}/sn</div>
        )}
      </div>
      <button
        type="button"
        className="buy"
        disabled={!affordable}
        onClick={() => (amount === 'max' ? buyNpcMax(npc.id) : buyNpcLevels(npc.id, amount))}
      >
        {!unlocked ? `İşe Al ×${count}` : amount === 'max' ? `Maks ×${count}` : `Al ×${count}`}
        <span className="buy-cost">🪙 {fmt(cost)}</span>
      </button>
    </div>
  );
}

export default function NpcPanel() {
  const npcLevels = useGameStore((s) => s.npcLevels);
  const amount = useGameStore((s) => s.buyAmount);
  const setAmount = useGameStore((s) => s.setBuyAmount);

  const firstLockedIdx = NPCS.findIndex((n) => (npcLevels[n.id] ?? 0) <= 0);
  const visible = firstLockedIdx === -1 ? NPCS : NPCS.slice(0, firstLockedIdx + 1);
  const hiddenCount = NPCS.length - visible.length;

  return (
    <div className="panel-content">
      <div className="panel-note">
        Yoldaşlar tıklamana gerek kalmadan otomatik vurur. Altınla işe al, seviye atlat.
      </div>

      <AmountToggle value={amount} onChange={setAmount} />

      {visible.map((npc) => (
        <NpcRow key={npc.id} npc={npc} amount={amount} />
      ))}

      {hiddenCount > 0 && (
        <div className="row mystery">
          <span className="row-emoji">❔</span>
          <div className="row-info">
            <div className="row-name">???</div>
            <div className="row-sub">{hiddenCount} yoldaş daha seni bekliyor</div>
          </div>
        </div>
      )}
    </div>
  );
}
