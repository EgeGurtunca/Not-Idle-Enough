import { create } from 'zustand';
import {
  PRESTIGE_STAGE, MAX_STAGE, NPCS, PRESTIGE_UPGRADES, HERO_UPGRADES,
  ARTIFACTS, ARTIFACT_MAX_LEVEL,
  creatureEmoji, minibossEmoji, bossEmoji,
} from '../game/constants.js';
import {
  isBossStage, creatureHp, creatureGold, bossHp, bossGold,
  clickDamage, heroLevelCost, heroUpgradeCost, critChance, critMultiplier,
  npcLevelCost, totalDps, bulkCost, maxAffordable, goldMultiplier, bossTime,
  crystalGain, prestigeUpgradeCost, startingGold, pullCost, killsRequired,
  rarityOdds, artifactUpgradeCost,
} from '../game/formulas.js';

let enemySeq = 0; // doğuş animasyonu için her düşmana benzersiz kimlik

function makeCreature(stage) {
  const seed = Math.floor(Math.random() * 1000);
  return {
    id: ++enemySeq,
    kind: 'creature',
    name: 'Yaratık',
    emoji: creatureEmoji(stage, seed),
    hp: creatureHp(stage),
    maxHp: creatureHp(stage),
  };
}

function makeBoss(stage) {
  const big = isBossStage(stage);
  return {
    id: ++enemySeq,
    kind: 'boss',
    name: big ? 'BÜYÜK BOSS' : 'Mini Boss',
    big,
    emoji: big ? bossEmoji(stage) : minibossEmoji(stage),
    hp: bossHp(stage),
    maxHp: bossHp(stage),
  };
}

const freshRunState = (prestigeLevels) => ({
  gold: startingGold(prestigeLevels),
  stage: 1,
  runHighestStage: 1,
  kills: 0,
  mode: 'farm', // 'farm' | 'boss'
  enemy: makeCreature(1),
  bossTimeLeft: 0,
  heroLevel: 0,
  heroUpgrades: {},
  npcLevels: {},
});

export const useGameStore = create((set, get) => ({
  // --- kalıcı state ---
  ...freshRunState({}),
  crystals: 0,
  highestStage: 1,
  prestigeLevels: {},
  artifacts: {}, // id -> seviye (kopyalar seviye atlatır); prestijde KORUNUR
  totalPulls: 0,
  totalPrestiges: 0,

  // --- geçici state ---
  loaded: false,
  offlineReport: null, // { gold, seconds }
  lastPull: null, // { id, level, isNew }
  buyAmount: 1, // 1 | 10 | 'max' — tüm panellerde ortak, kayda yazılır
  opMode: false, // test modu: klik hasarı 1Qi (kayda yazılmaz)

  setBuyAmount(amount) {
    set({ buyAmount: amount });
  },

  toggleOp() {
    set({ opMode: !get().opMode });
  },

  // ---- Savaş ----
  // Dönüş: { dmg, crit } — floater gösterimi için
  clickAttack() {
    const s = get();
    if (!s.enemy || !s.loaded) return null;
    let dmg = s.opMode ? 1e18 : clickDamage(s.heroLevel, s.prestigeLevels, s.artifacts);
    const crit = Math.random() < critChance(s.heroUpgrades, s.artifacts);
    if (crit) dmg *= critMultiplier(s.heroUpgrades, s.artifacts);
    get()._applyDamage(dmg);
    return { dmg, crit };
  },

  tick(dtSec) {
    const s = get();
    if (!s.loaded) return;
    if (s.mode === 'boss') {
      const left = s.bossTimeLeft - dtSec;
      if (left <= 0) {
        // Süre doldu: boss kaçtı, farm moduna dön (kill sayacı dolu kalır)
        set({ mode: 'farm', bossTimeLeft: 0, enemy: makeCreature(s.stage) });
        return;
      }
      set({ bossTimeLeft: left });
    }
    const dps = totalDps(s.npcLevels, s.prestigeLevels, s.artifacts);
    if (dps > 0) get()._applyDamage(dps * dtSec);
  },

  _applyDamage(amount) {
    const s = get();
    if (!s.enemy) return;
    const hp = s.enemy.hp - amount;
    if (hp > 0) {
      set({ enemy: { ...s.enemy, hp } });
      return;
    }
    // Düşman öldü
    const gmult =
      goldMultiplier(s.prestigeLevels, s.heroUpgrades, s.artifacts) * (s.opMode ? 1000 : 1);
    if (s.enemy.kind === 'boss') {
      const nextStage = Math.min(s.stage + 1, MAX_STAGE);
      set({
        gold: s.gold + bossGold(s.stage) * gmult,
        stage: nextStage,
        runHighestStage: Math.max(s.runHighestStage, nextStage),
        highestStage: Math.max(s.highestStage, nextStage),
        kills: 0,
        mode: 'farm',
        bossTimeLeft: 0,
        enemy: makeCreature(nextStage),
      });
    } else {
      const required = killsRequired(s.prestigeLevels);
      const kills = Math.min(s.kills + 1, required);
      const justFilled = s.kills === required - 1; // sayacın dolduğu an
      const gold = s.gold + creatureGold(s.stage) * gmult;
      if (justFilled) {
        // İlk kez 10'a ulaşıldı: boss otomatik gelir
        set({
          gold, kills,
          mode: 'boss',
          enemy: makeBoss(s.stage),
          bossTimeLeft: bossTime(s.prestigeLevels, s.artifacts),
        });
      } else {
        set({ gold, kills, enemy: makeCreature(s.stage) });
      }
    }
  },

  // Kill sayacı doluyken (başarısız denemeden sonra) tekrar boss'a gir
  challengeBoss() {
    const s = get();
    if (s.mode !== 'farm' || s.kills < killsRequired(s.prestigeLevels)) return;
    set({
      mode: 'boss',
      enemy: makeBoss(s.stage),
      bossTimeLeft: bossTime(s.prestigeLevels, s.artifacts),
    });
  },

  // ---- Satın almalar ----
  buyHeroLevels(count) {
    const s = get();
    const cost = bulkCost(heroLevelCost, s.heroLevel, count);
    if (s.gold < cost) return;
    set({ gold: s.gold - cost, heroLevel: s.heroLevel + count });
  },

  buyHeroMax() {
    const s = get();
    const { count, cost } = maxAffordable(heroLevelCost, s.heroLevel, s.gold);
    if (count <= 0) return;
    set({ gold: s.gold - cost, heroLevel: s.heroLevel + count });
  },

  buyHeroUpgradeLevels(upgradeId, count) {
    const s = get();
    const up = HERO_UPGRADES.find((u) => u.id === upgradeId);
    if (!up) return;
    const level = s.heroUpgrades[upgradeId] ?? 0;
    const capped = Math.min(count, up.maxLevel - level);
    if (capped <= 0) return;
    const cost = bulkCost((l) => heroUpgradeCost(up, l), level, capped);
    if (s.gold < cost) return;
    set({
      gold: s.gold - cost,
      heroUpgrades: { ...s.heroUpgrades, [upgradeId]: level + capped },
    });
  },

  buyHeroUpgradeMax(upgradeId) {
    const s = get();
    const up = HERO_UPGRADES.find((u) => u.id === upgradeId);
    if (!up) return;
    const level = s.heroUpgrades[upgradeId] ?? 0;
    const cap = Math.min(1000, up.maxLevel - level);
    const { count, cost } = maxAffordable((l) => heroUpgradeCost(up, l), level, s.gold, cap);
    if (count <= 0) return;
    set({
      gold: s.gold - cost,
      heroUpgrades: { ...s.heroUpgrades, [upgradeId]: level + count },
    });
  },

  buyNpcLevels(npcId, count) {
    const s = get();
    const npc = NPCS.find((n) => n.id === npcId);
    if (!npc) return;
    const level = s.npcLevels[npcId] ?? 0;
    const cost = bulkCost((l) => npcLevelCost(npc, l), level, count);
    if (s.gold < cost) return;
    set({
      gold: s.gold - cost,
      npcLevels: { ...s.npcLevels, [npcId]: level + count },
    });
  },

  buyNpcMax(npcId) {
    const s = get();
    const npc = NPCS.find((n) => n.id === npcId);
    if (!npc) return;
    const level = s.npcLevels[npcId] ?? 0;
    const { count, cost } = maxAffordable((l) => npcLevelCost(npc, l), level, s.gold);
    if (count <= 0) return;
    set({
      gold: s.gold - cost,
      npcLevels: { ...s.npcLevels, [npcId]: level + count },
    });
  },

  // ---- Artifact çekilişi ----
  // Rarity şansları kalan havuza göre yeniden normalize edilir: maks seviyeye
  // ulaşan artifact'ler havuzdan düşer, tükenen rarity'nin şansı diğerlerine dağılır.
  pullArtifact() {
    const s = get();
    const cost = pullCost(s.totalPulls);
    if (s.crystals < cost) return;
    const odds = rarityOdds(s.artifacts);
    if (odds.length === 0) return; // koleksiyon tamam
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
      (a) => a.rarity === rarityId && (s.artifacts[a.id] ?? 0) < ARTIFACT_MAX_LEVEL
    );
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const newLevel = (s.artifacts[pick.id] ?? 0) + 1;
    set({
      crystals: s.crystals - cost,
      artifacts: { ...s.artifacts, [pick.id]: newLevel },
      totalPulls: s.totalPulls + 1,
      lastPull: { id: pick.id, level: newLevel, isNew: newLevel === 1 },
    });
  },

  // Kristalle doğrudan geliştirme (sahip olunan, maks olmayan artifact)
  upgradeArtifact(artifactId) {
    const s = get();
    const art = ARTIFACTS.find((a) => a.id === artifactId);
    if (!art) return;
    const level = s.artifacts[artifactId] ?? 0;
    if (level < 1 || level >= ARTIFACT_MAX_LEVEL) return;
    const cost = artifactUpgradeCost(art, level);
    if (s.crystals < cost) return;
    set({
      crystals: s.crystals - cost,
      artifacts: { ...s.artifacts, [artifactId]: level + 1 },
    });
  },

  // ---- Prestij ----
  doPrestige() {
    const s = get();
    const gain = crystalGain(s.runHighestStage, s.artifacts) * (s.opMode ? 1000 : 1);
    if (gain <= 0) return;
    set({
      ...freshRunState(s.prestigeLevels),
      crystals: s.crystals + gain,
      totalPrestiges: s.totalPrestiges + 1,
    });
  },

  buyPrestigeUpgradeLevels(upgradeId, count) {
    const s = get();
    const up = PRESTIGE_UPGRADES.find((u) => u.id === upgradeId);
    if (!up) return;
    const level = s.prestigeLevels[upgradeId] ?? 0;
    const capped = Math.min(count, up.maxLevel - level);
    if (capped <= 0) return;
    const cost = bulkCost((l) => prestigeUpgradeCost(up, l), level, capped);
    if (s.crystals < cost) return;
    set({
      crystals: s.crystals - cost,
      prestigeLevels: { ...s.prestigeLevels, [upgradeId]: level + capped },
    });
  },

  buyPrestigeUpgradeMax(upgradeId) {
    const s = get();
    const up = PRESTIGE_UPGRADES.find((u) => u.id === upgradeId);
    if (!up) return;
    const level = s.prestigeLevels[upgradeId] ?? 0;
    const cap = Math.min(1000, up.maxLevel - level);
    const { count, cost } = maxAffordable((l) => prestigeUpgradeCost(up, l), level, s.crystals, cap);
    if (count <= 0) return;
    set({
      crystals: s.crystals - cost,
      prestigeLevels: { ...s.prestigeLevels, [upgradeId]: level + count },
    });
  },

  // ---- Kayıt ----
  getSaveData() {
    const s = get();
    return {
      gold: s.gold,
      crystals: s.crystals,
      stage: s.stage,
      highestStage: s.highestStage,
      runHighestStage: s.runHighestStage,
      kills: s.kills,
      heroLevel: s.heroLevel,
      heroUpgrades: s.heroUpgrades,
      npcLevels: s.npcLevels,
      prestigeLevels: s.prestigeLevels,
      artifacts: s.artifacts,
      totalPulls: s.totalPulls,
      totalPrestiges: s.totalPrestiges,
      buyAmount: s.buyAmount,
    };
  },

  loadSaveData(data, offlineReport) {
    const stage = Math.min(MAX_STAGE, Math.max(1, data.stage ?? 1));
    set({
      gold: (data.gold ?? 0) + (offlineReport?.gold ?? 0),
      crystals: data.crystals ?? 0,
      stage,
      highestStage: data.highestStage ?? stage,
      runHighestStage: data.runHighestStage ?? stage,
      kills: data.kills ?? 0,
      heroLevel: data.heroLevel ?? 0,
      heroUpgrades: data.heroUpgrades ?? {},
      npcLevels: data.npcLevels ?? {},
      prestigeLevels: data.prestigeLevels ?? {},
      artifacts: data.artifacts ?? {},
      totalPulls: data.totalPulls ?? 0,
      totalPrestiges: data.totalPrestiges ?? 0,
      buyAmount: data.buyAmount ?? 1,
      mode: 'farm',
      bossTimeLeft: 0,
      enemy: makeCreature(stage),
      offlineReport: offlineReport ?? null,
      loaded: true,
    });
  },

  startFresh() {
    set({ ...freshRunState({}), loaded: true });
  },

  dismissOfflineReport() {
    set({ offlineReport: null });
  },
}));

// Bileşenlerin kullandığı türetilmiş değerler
export const selectors = {
  clickDamage: (s) => clickDamage(s.heroLevel, s.prestigeLevels, s.artifacts),
  totalDps: (s) => totalDps(s.npcLevels, s.prestigeLevels, s.artifacts),
  critChance: (s) => critChance(s.heroUpgrades, s.artifacts),
  critMultiplier: (s) => critMultiplier(s.heroUpgrades, s.artifacts),
  crystalGain: (s) => crystalGain(s.runHighestStage, s.artifacts) * (s.opMode ? 1000 : 1),
  prestigeUnlocked: (s) => s.highestStage >= PRESTIGE_STAGE,
  canPrestige: (s) => s.runHighestStage >= PRESTIGE_STAGE,
};
