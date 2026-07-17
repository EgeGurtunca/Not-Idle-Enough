import {
  CREATURE_BASE_HP, HP_GROWTH, GOLD_DIVISOR,
  MINIBOSS_HP_MULT, MINIBOSS_GOLD_MULT, BOSS_HP_MULT, BOSS_GOLD_MULT,
  HERO_BASE_COST, HERO_COST_GROWTH, MILESTONE_EVERY, MILESTONE_MULT,
  NPC_LEVEL_COST_FACTOR, NPC_COST_GROWTH,
  BOSS_TIME_BASE, PRESTIGE_STAGE, NPCS, PRESTIGE_UPGRADES, HERO_UPGRADES,
  ARTIFACTS, PULL_COST_BASE, PULL_COST_GROWTH,
} from './constants.js';

export const isBossStage = (stage) => stage % 10 === 0;

// ---- Artifact bonusları ----
// { click, dps, gold, critChance, critMult, bossTime, offline, crystal }
export function artifactBonuses(artifacts = {}) {
  const b = { click: 0, dps: 0, gold: 0, critChance: 0, critMult: 0, bossTime: 0, offline: 0, crystal: 0 };
  for (const a of ARTIFACTS) {
    const lv = artifacts[a.id] ?? 0;
    if (lv > 0) b[a.effect] += a.value * lv;
  }
  return b;
}

// ---- Düşman ----
export const creatureHp = (stage) => CREATURE_BASE_HP * Math.pow(HP_GROWTH, stage - 1);
export const creatureGold = (stage) => Math.max(1, creatureHp(stage) / GOLD_DIVISOR);
export const bossHp = (stage) =>
  creatureHp(stage) * (isBossStage(stage) ? BOSS_HP_MULT : MINIBOSS_HP_MULT);
export const bossGold = (stage) =>
  creatureGold(stage) * (isBossStage(stage) ? BOSS_GOLD_MULT : MINIBOSS_GOLD_MULT);

const milestoneMult = (level) => Math.pow(MILESTONE_MULT, Math.floor(level / MILESTONE_EVERY));

// ---- Kahraman ----
export function clickDamage(heroLevel, prestigeLevels = {}, artifacts = {}) {
  const keskin = prestigeLevels?.keskinVurus ?? 0;
  const art = artifactBonuses(artifacts);
  return (1 + heroLevel) * milestoneMult(heroLevel) * (1 + 0.25 * keskin) * (1 + art.click);
}

export const heroLevelCost = (level) => HERO_BASE_COST * Math.pow(HERO_COST_GROWTH, level);

// ---- Kritik ----
export function critChance(heroUpgrades = {}, artifacts = {}) {
  const art = artifactBonuses(artifacts);
  return Math.min(0.75, 0.01 * (heroUpgrades?.kritSans ?? 0) + art.critChance);
}

export function critMultiplier(heroUpgrades = {}, artifacts = {}) {
  const art = artifactBonuses(artifacts);
  return 2 + 0.1 * (heroUpgrades?.kritHasar ?? 0) + art.critMult;
}

export function heroUpgradeCost(upgrade, level) {
  return upgrade.baseCost * Math.pow(upgrade.costGrowth, level);
}

// ---- NPC ----
export function npcDps(npc, level, prestigeLevels = {}, artifacts = {}) {
  if (level <= 0) return 0;
  const komutan = prestigeLevels?.komutanlik ?? 0;
  const art = artifactBonuses(artifacts);
  return npc.baseDps * level * milestoneMult(level) * (1 + 0.25 * komutan) * (1 + art.dps);
}

export function totalDps(npcLevels = {}, prestigeLevels = {}, artifacts = {}) {
  let sum = 0;
  for (const npc of NPCS) sum += npcDps(npc, npcLevels[npc.id] ?? 0, prestigeLevels, artifacts);
  return sum;
}

// level -> level+1 maliyeti (level 0 = henüz alınmamış, maliyeti unlockCost)
export function npcLevelCost(npc, level) {
  if (level <= 0) return npc.unlockCost;
  return npc.unlockCost * NPC_LEVEL_COST_FACTOR * Math.pow(NPC_COST_GROWTH, level);
}

// ---- Toplu satın alma ----
// costFn(level) -> o seviyeden bir sonrakine geçiş maliyeti
export function bulkCost(costFn, fromLevel, count) {
  let total = 0;
  for (let i = 0; i < count; i++) total += costFn(fromLevel + i);
  return total;
}

export function maxAffordable(costFn, fromLevel, gold, cap = 1000) {
  let total = 0;
  let n = 0;
  while (n < cap) {
    const c = costFn(fromLevel + n);
    if (total + c > gold) break;
    total += c;
    n++;
  }
  return { count: n, cost: total };
}

// ---- Altın çarpanı ----
export function goldMultiplier(prestigeLevels = {}, heroUpgrades = {}, artifacts = {}) {
  const altinP = prestigeLevels?.altinDokunus ?? 0;
  const bereket = heroUpgrades?.altinBereketi ?? 0;
  const art = artifactBonuses(artifacts);
  return (1 + 0.2 * altinP) * (1 + 0.05 * bereket) * (1 + art.gold);
}

// ---- Boss süresi ----
export function bossTime(prestigeLevels = {}, artifacts = {}) {
  const zaman = prestigeLevels?.zamanBukucu ?? 0;
  const art = artifactBonuses(artifacts);
  return BOSS_TIME_BASE + 2 * zaman + art.bossTime;
}

// ---- Prestij ----
export function crystalGain(runHighestStage, artifacts = {}) {
  if (runHighestStage < PRESTIGE_STAGE) return 0;
  const art = artifactBonuses(artifacts);
  return Math.floor(10 * Math.pow((runHighestStage - 90) / 10, 1.8) * (1 + art.crystal));
}

export function prestigeUpgradeCost(upgrade, level) {
  return upgrade.baseCost * Math.pow(upgrade.costGrowth, level);
}

// ---- Sandık fiyatı: her çekilişte artar ----
export function pullCost(totalPulls) {
  return Math.floor(PULL_COST_BASE * Math.pow(PULL_COST_GROWTH, totalPulls));
}

export function startingGold(prestigeLevels = {}) {
  const lv = prestigeLevels?.hazirBaslangic ?? 0;
  return lv > 0 ? 1000 * Math.pow(10, lv - 1) : 0;
}

export { PRESTIGE_UPGRADES, HERO_UPGRADES };
