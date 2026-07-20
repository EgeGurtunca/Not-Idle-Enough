import {
  CREATURE_BASE_HP, HP_GROWTH, GOLD_DIVISOR,
  MINIBOSS_HP_MULT, MINIBOSS_GOLD_MULT, BOSS_HP_MULT, BOSS_GOLD_MULT,
  HERO_BASE_COST, HERO_COST_GROWTH, MILESTONE_EVERY, MILESTONE_MULT,
  NPC_LEVEL_COST_FACTOR, NPC_COST_GROWTH,
  BOSS_TIME_BASE, PRESTIGE_STAGE, TRANSCEND_STAGE, KILLS_PER_STAGE, NPCS,
  PRESTIGE_UPGRADES, HERO_UPGRADES, STARDUST_UPGRADES,
  ARTIFACTS, RARITIES, ARTIFACT_MAX_LEVEL, PULL_COST_BASE, PULL_COST_GROWTH,
  ARTIFACT_UPGRADE_BASE, ARTIFACT_UPGRADE_GROWTH, ACHIEVEMENT_BONUS,
} from './constants.js';

// Başarım çarpanı: açılan her başarım hasarı ve altını %2 artırır
export const achievementMult = (achCount = 0) => 1 + ACHIEVEMENT_BONUS * achCount;

// ---- Aşkınlık (Yıldız Tozu) çarpanları ----
export const stardustDamageMult = (sd = {}) => 1 + 0.4 * (sd.yildizGucu ?? 0);
export const stardustGoldMult = (sd = {}) => 1 + 0.5 * (sd.yildizServeti ?? 0);
export const stardustCrystalMult = (sd = {}) => 1 + 0.3 * (sd.yildizBilgeligi ?? 0);

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
export function clickDamage(heroLevel, prestigeLevels = {}, artifacts = {}, achCount = 0, sd = {}) {
  const keskin = prestigeLevels?.keskinVurus ?? 0;
  const art = artifactBonuses(artifacts);
  return (
    (1 + heroLevel) * milestoneMult(heroLevel) * (1 + 0.5 * keskin) * (1 + art.click) *
    achievementMult(achCount) * stardustDamageMult(sd)
  );
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
export function npcDps(npc, level, prestigeLevels = {}, artifacts = {}, achCount = 0, sd = {}) {
  if (level <= 0) return 0;
  const komutan = prestigeLevels?.komutanlik ?? 0;
  const art = artifactBonuses(artifacts);
  return (
    npc.baseDps * level * milestoneMult(level) * (1 + 0.5 * komutan) * (1 + art.dps) *
    achievementMult(achCount) * stardustDamageMult(sd)
  );
}

export function totalDps(npcLevels = {}, prestigeLevels = {}, artifacts = {}, achCount = 0, sd = {}) {
  let sum = 0;
  for (const npc of NPCS) {
    sum += npcDps(npc, npcLevels[npc.id] ?? 0, prestigeLevels, artifacts, achCount, sd);
  }
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
export function goldMultiplier(prestigeLevels = {}, heroUpgrades = {}, artifacts = {}, achCount = 0, sd = {}) {
  const altinP = prestigeLevels?.altinDokunus ?? 0;
  const bereket = heroUpgrades?.altinBereketi ?? 0;
  const art = artifactBonuses(artifacts);
  return (
    (1 + 0.35 * altinP) * (1 + 0.05 * bereket) * (1 + art.gold) *
    achievementMult(achCount) * stardustGoldMult(sd)
  );
}

// ---- Boss süresi ----
export function bossTime(prestigeLevels = {}, artifacts = {}, sd = {}) {
  const zaman = prestigeLevels?.zamanBukucu ?? 0;
  const art = artifactBonuses(artifacts);
  return BOSS_TIME_BASE + 2 * zaman + art.bossTime + 3 * (sd.yildizKalkani ?? 0);
}

// ---- Boss için gereken yaratık sayısı (Sürek Avı ile azalır) ----
export function killsRequired(prestigeLevels = {}) {
  const surek = prestigeLevels?.surekAvi ?? 0;
  return Math.max(1, KILLS_PER_STAGE - surek);
}

// ---- Prestij ----
export function crystalGain(runHighestStage, artifacts = {}, sd = {}) {
  if (runHighestStage < PRESTIGE_STAGE) return 0;
  const art = artifactBonuses(artifacts);
  return Math.floor(
    10 * Math.pow((runHighestStage - 90) / 10, 1.8) * (1 + art.crystal) * stardustCrystalMult(sd)
  );
}

export function prestigeUpgradeCost(upgrade, level) {
  return upgrade.baseCost * Math.pow(upgrade.costGrowth, level);
}

// ---- Sandık fiyatı: her çekilişte artar ----
export function pullCost(totalPulls) {
  return Math.floor(PULL_COST_BASE * Math.pow(PULL_COST_GROWTH, totalPulls));
}

// ---- Çekiliş oranları: sahip olunan artifact'ler loot havuzundan düşer,
// kalan rarity'lerin şansları 100'e yeniden normalize edilir ----
export function rarityOdds(artifacts = {}) {
  const available = RARITIES.map((r) => ({
    ...r,
    remaining: ARTIFACTS.filter(
      (a) => a.rarity === r.id && (artifacts[a.id] ?? 0) === 0
    ).length,
  })).filter((r) => r.remaining > 0);
  const total = available.reduce((sum, r) => sum + r.chance, 0);
  if (total === 0) return [];
  return available.map((r) => ({ ...r, chance: (r.chance / total) * 100 }));
}

// ---- Kristalle artifact geliştirme (level -> level+1 maliyeti) ----
export function artifactUpgradeCost(artifact, level) {
  return Math.floor(
    ARTIFACT_UPGRADE_BASE[artifact.rarity] * Math.pow(ARTIFACT_UPGRADE_GROWTH, level - 1)
  );
}

export function startingGold(prestigeLevels = {}) {
  const lv = prestigeLevels?.hazirBaslangic ?? 0;
  return lv > 0 ? 1000 * Math.pow(10, lv - 1) : 0;
}

// ---- Aşkınlık ----
// Bankadaki kristale göre Yıldız Tozu; her aşkınlık için kristal biriktirmen gerekir.
export function transcendGain(crystals) {
  if (crystals < 30) return 0;
  return Math.floor(8 * Math.sqrt(crystals / 2000));
}

export function stardustUpgradeCost(upgrade, level) {
  return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costGrowth, level));
}

export function startingCrystals(stardustLevels = {}) {
  const lv = stardustLevels?.yildizBaslangici ?? 0;
  return lv > 0 ? 50 * Math.pow(3, lv - 1) : 0;
}

export { PRESTIGE_UPGRADES, HERO_UPGRADES, STARDUST_UPGRADES, TRANSCEND_STAGE };
