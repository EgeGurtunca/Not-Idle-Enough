import { useGameStore } from '../store/gameStore.js';
import { NPCS, NPC_PASSIVES, NPC_PASSIVE_THRESHOLD } from '../game/constants.js';
import { npcDps, npcLevelCost, bulkCost, maxAffordable, milestoneEvery } from '../game/formulas.js';
import { useT } from '../game/i18n.js';
import { fmt } from '../utils/format.js';
import AmountToggle from './AmountToggle.jsx';

function NpcRow({ npc, amount }) {
  const gold = useGameStore((s) => s.gold);
  const level = useGameStore((s) => s.npcLevels[npc.id] ?? 0);
  const prestigeLevels = useGameStore((s) => s.prestigeLevels);
  const buyNpcLevels = useGameStore((s) => s.buyNpcLevels);
  const buyNpcMax = useGameStore((s) => s.buyNpcMax);
  const { t, dn } = useT();

  const unlocked = level > 0;
  const name = dn('npc', npc.id, npc.name);
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
  const mEvery = milestoneEvery(useGameStore((s) => s.stardustLevels));
  const nextMilestone = (Math.floor(level / mEvery) + 1) * mEvery;

  return (
    <div className={`row ${unlocked ? '' : 'locked'}`}>
      <span className="row-emoji">{npc.emoji}</span>
      <div className="row-info">
        <div className="row-name">{name}</div>
        {unlocked ? (
          <>
            <div className="row-sub">
              {t('lvl_dps', { lv: level, d: fmt(npcDps(npc, level, prestigeLevels)) })}
            </div>
            <div className="row-milestone">{t('milestone_note', { n: nextMilestone })}</div>
            {NPC_PASSIVES[npc.id] && (
              <div className={`row-passive ${level >= NPC_PASSIVE_THRESHOLD ? 'on' : ''}`}>
                {t(level >= NPC_PASSIVE_THRESHOLD ? 'passive_on' : 'passive_off', {
                  n: NPC_PASSIVE_THRESHOLD,
                  label: dn('npcPassive', npc.id, NPC_PASSIVES[npc.id].label),
                })}
              </div>
            )}
          </>
        ) : (
          <div className="row-sub">{t('npc_locked', { d: fmt(npc.baseDps) })}</div>
        )}
      </div>
      <button
        type="button"
        className="buy"
        disabled={!affordable}
        onClick={() => (amount === 'max' ? buyNpcMax(npc.id) : buyNpcLevels(npc.id, amount))}
      >
        {!unlocked ? t('hire', { n: count }) : amount === 'max' ? t('max_buy', { n: count }) : t('buy', { n: count })}
        <span className="buy-cost">🪙 {fmt(cost)}</span>
      </button>
    </div>
  );
}

export default function NpcPanel() {
  const npcLevels = useGameStore((s) => s.npcLevels);
  const amount = useGameStore((s) => s.buyAmount);
  const setAmount = useGameStore((s) => s.setBuyAmount);
  const { t } = useT();

  const firstLockedIdx = NPCS.findIndex((n) => (npcLevels[n.id] ?? 0) <= 0);
  const visible = firstLockedIdx === -1 ? NPCS : NPCS.slice(0, firstLockedIdx + 1);
  const hiddenCount = NPCS.length - visible.length;

  return (
    <div className="panel-content">
      <div className="panel-note">{t('npc_note')}</div>

      <AmountToggle value={amount} onChange={setAmount} />

      {visible.map((npc) => (
        <NpcRow key={npc.id} npc={npc} amount={amount} />
      ))}

      {hiddenCount > 0 && (
        <div className="row mystery">
          <span className="row-emoji">❔</span>
          <div className="row-info">
            <div className="row-name">???</div>
            <div className="row-sub">{t('mystery_npc', { n: hiddenCount })}</div>
          </div>
        </div>
      )}
    </div>
  );
}
