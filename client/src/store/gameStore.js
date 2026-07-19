import { create } from 'zustand';
import {
  PRESTIGE_STAGE, MAX_STAGE, NPCS, PRESTIGE_UPGRADES, HERO_UPGRADES,
  ARTIFACTS, ARTIFACT_MAX_LEVEL, SKILLS, ACHIEVEMENTS,
  creatureType, bossName,
} from '../game/constants.js';
import {
  isBossStage, creatureHp, creatureGold, bossHp, bossGold,
  clickDamage, heroLevelCost, heroUpgradeCost, critChance, critMultiplier,
  npcLevelCost, totalDps, bulkCost, maxAffordable, goldMultiplier, bossTime,
  crystalGain, prestigeUpgradeCost, startingGold, pullCost, killsRequired,
  rarityOdds, artifactUpgradeCost,
} from '../game/formulas.js';
import { sfx, setMuted } from '../game/audio.js';

let enemySeq = 0; // doğuş animasyonu için her düşmana benzersiz kimlik
let achTimer = 0; // başarım kontrolü zamanlayıcısı (2 sn'de bir)
let toastSeq = 0;

const DEFAULT_STATS = {
  totalKills: 0,
  totalBossKills: 0,
  totalClicks: 0,
  totalCrits: 0,
  totalGoldEarned: 0,
  highestCrit: 0,
};

function makeCreature(stage) {
  const seed = Math.floor(Math.random() * 1000);
  const type = creatureType(stage, seed);
  return {
    id: ++enemySeq,
    kind: 'creature',
    typeId: type.id,
    name: type.name,
    emoji: type.emoji,
    hp: creatureHp(stage),
    maxHp: creatureHp(stage),
  };
}

function makeBoss(stage) {
  const big = isBossStage(stage);
  const seed = Math.floor(Math.random() * 1000);
  const type = creatureType(stage, seed);
  return {
    id: ++enemySeq,
    kind: 'boss',
    big,
    typeId: type.id,
    name: big ? bossName(stage) : `Elit ${type.name}`,
    emoji: type.emoji,
    hp: bossHp(stage),
    maxHp: bossHp(stage),
  };
}

// Başarım koşullarında kullanılan değerler
function statValue(s, stat) {
  switch (stat) {
    case 'highestStage':
      return s.highestStage;
    case 'totalPrestiges':
      return s.totalPrestiges;
    case 'totalPulls':
      return s.totalPulls;
    case 'ownedArtifacts':
      return ARTIFACTS.filter((a) => (s.artifacts[a.id] ?? 0) > 0).length;
    default:
      return s.stats[stat] ?? 0;
  }
}

const achCount = (s) => Object.keys(s.achievements).length;
const skillActive = (s, id) => (s.skillState[id]?.active ?? 0) > 0;

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
  artifacts: {}, // id -> seviye; prestijde KORUNUR
  totalPulls: 0,
  totalPrestiges: 0,
  stats: { ...DEFAULT_STATS },
  achievements: {}, // id -> true
  skillState: {}, // id -> { active, cd } (saniye)
  muted: false,
  buyAmount: 1, // 1 | 10 | 'max' — tüm panellerde ortak, kayda yazılır

  // --- geçici state ---
  loaded: false,
  offlineReport: null, // { gold, seconds }
  lastPull: null, // { id, level, isNew }
  toast: null, // { id, text }
  opMode: false, // test modu: klik hasarı 1Qi (kayda yazılmaz)

  setBuyAmount(amount) {
    set({ buyAmount: amount });
  },

  toggleOp() {
    set({ opMode: !get().opMode });
  },

  toggleMuted() {
    const muted = !get().muted;
    setMuted(muted);
    set({ muted });
  },

  _showToast(text) {
    const id = ++toastSeq;
    set({ toast: { id, text } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 3500);
  },

  // ---- Savaş ----
  // Dönüş: { dmg, crit } — floater gösterimi için
  clickAttack() {
    const s = get();
    if (!s.enemy || !s.loaded) return null;
    let dmg = s.opMode ? 1e18 : clickDamage(s.heroLevel, s.prestigeLevels, s.artifacts, achCount(s));
    if (skillActive(s, 'ofke')) dmg *= 5;
    const crit = Math.random() < critChance(s.heroUpgrades, s.artifacts);
    if (crit) dmg *= critMultiplier(s.heroUpgrades, s.artifacts);
    const stats = {
      ...s.stats,
      totalClicks: s.stats.totalClicks + 1,
      totalCrits: s.stats.totalCrits + (crit ? 1 : 0),
      highestCrit: crit ? Math.max(s.stats.highestCrit, dmg) : s.stats.highestCrit,
    };
    set({ stats });
    get()._applyDamage(dmg);
    return { dmg, crit };
  },

  tick(dtSec) {
    const s = get();
    if (!s.loaded) return;

    // Yetenek zamanlayıcıları
    let skillsChanged = false;
    const skillState = { ...s.skillState };
    for (const sk of SKILLS) {
      const st = skillState[sk.id];
      if (!st) continue;
      if (st.active > 0 || st.cd > 0) {
        skillState[sk.id] = {
          active: Math.max(0, st.active - dtSec),
          cd: Math.max(0, st.cd - dtSec),
        };
        skillsChanged = true;
      }
    }
    if (skillsChanged) set({ skillState });

    if (s.mode === 'boss') {
      // Zaman Donması aktifken boss süresi akmaz
      if (!skillActive(s, 'zamanDonmasi')) {
        const left = s.bossTimeLeft - dtSec;
        if (left <= 0) {
          sfx.bossFail();
          set({ mode: 'farm', bossTimeLeft: 0, enemy: makeCreature(s.stage) });
          return;
        }
        set({ bossTimeLeft: left });
      }
    }

    let dps = totalDps(s.npcLevels, s.prestigeLevels, s.artifacts, achCount(s));
    if (skillActive(s, 'savasEmri')) dps *= 3;
    if (dps > 0) get()._applyDamage(dps * dtSec);

    // Başarım kontrolü (2 sn'de bir)
    achTimer += dtSec;
    if (achTimer >= 2) {
      achTimer = 0;
      get()._checkAchievements();
    }
  },

  _checkAchievements() {
    const s = get();
    const unlocked = {};
    for (const a of ACHIEVEMENTS) {
      if (!s.achievements[a.id] && statValue(s, a.stat) >= a.threshold) {
        unlocked[a.id] = true;
      }
    }
    const ids = Object.keys(unlocked);
    if (ids.length === 0) return;
    set({ achievements: { ...s.achievements, ...unlocked } });
    const first = ACHIEVEMENTS.find((a) => a.id === ids[0]);
    const extra = ids.length > 1 ? ` (+${ids.length - 1} daha)` : '';
    get()._showToast(`🏆 Başarım: ${first.emoji} ${first.name}${extra}`);
    sfx.achievement();
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
    let gmult = goldMultiplier(s.prestigeLevels, s.heroUpgrades, s.artifacts, achCount(s));
    if (skillActive(s, 'altinYagmuru')) gmult *= 3;
    if (s.opMode) gmult *= 1000;
    if (s.enemy.kind === 'boss') {
      const reward = bossGold(s.stage) * gmult;
      const nextStage = Math.min(s.stage + 1, MAX_STAGE);
      sfx.bossWin();
      set({
        gold: s.gold + reward,
        stats: {
          ...s.stats,
          totalBossKills: s.stats.totalBossKills + 1,
          totalGoldEarned: s.stats.totalGoldEarned + reward,
        },
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
      const reward = creatureGold(s.stage) * gmult;
      const stats = {
        ...s.stats,
        totalKills: s.stats.totalKills + 1,
        totalGoldEarned: s.stats.totalGoldEarned + reward,
      };
      sfx.kill();
      if (justFilled) {
        sfx.boss();
        set({
          gold: s.gold + reward,
          stats,
          kills,
          mode: 'boss',
          enemy: makeBoss(s.stage),
          bossTimeLeft: bossTime(s.prestigeLevels, s.artifacts),
        });
      } else {
        set({ gold: s.gold + reward, stats, kills, enemy: makeCreature(s.stage) });
      }
    }
  },

  // Kill sayacı doluyken (başarısız denemeden sonra) tekrar boss'a gir
  challengeBoss() {
    const s = get();
    if (s.mode !== 'farm' || s.kills < killsRequired(s.prestigeLevels)) return;
    sfx.boss();
    set({
      mode: 'boss',
      enemy: makeBoss(s.stage),
      bossTimeLeft: bossTime(s.prestigeLevels, s.artifacts),
    });
  },

  // ---- Aktif yetenekler ----
  useSkill(skillId) {
    const s = get();
    const sk = SKILLS.find((x) => x.id === skillId);
    if (!sk) return;
    if (s.highestStage < sk.unlockStage) return;
    const st = s.skillState[skillId] ?? { active: 0, cd: 0 };
    if (st.cd > 0) return;
    sfx.skill();
    set({
      skillState: {
        ...s.skillState,
        [skillId]: { active: sk.duration, cd: sk.cooldown },
      },
    });
  },

  // ---- Satın almalar ----
  buyHeroLevels(count) {
    const s = get();
    const cost = bulkCost(heroLevelCost, s.heroLevel, count);
    if (s.gold < cost) return;
    sfx.buy();
    set({ gold: s.gold - cost, heroLevel: s.heroLevel + count });
  },

  buyHeroMax() {
    const s = get();
    const { count, cost } = maxAffordable(heroLevelCost, s.heroLevel, s.gold);
    if (count <= 0) return;
    sfx.buy();
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
    sfx.buy();
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
    sfx.buy();
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
    sfx.buy();
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
    sfx.buy();
    set({
      gold: s.gold - cost,
      npcLevels: { ...s.npcLevels, [npcId]: level + count },
    });
  },

  // ---- Artifact çekilişi ----
  // Sahip olunan artifact'ler loot havuzundan tamamen düşer; rarity şansları
  // kalan havuza göre yeniden normalize edilir. Seviye atlatma kristalledir.
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
      (a) => a.rarity === rarityId && (s.artifacts[a.id] ?? 0) === 0
    );
    const pick = pool[Math.floor(Math.random() * pool.length)];
    sfx.chest();
    set({
      crystals: s.crystals - cost,
      artifacts: { ...s.artifacts, [pick.id]: 1 },
      totalPulls: s.totalPulls + 1,
      lastPull: { id: pick.id, level: 1, isNew: true },
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
    sfx.buy();
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
    sfx.prestige();
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
    sfx.buy();
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
    sfx.buy();
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
      stats: s.stats,
      achievements: s.achievements,
      skillState: s.skillState,
      muted: s.muted,
      buyAmount: s.buyAmount,
    };
  },

  loadSaveData(data, offlineReport) {
    const stage = Math.min(MAX_STAGE, Math.max(1, data.stage ?? 1));
    setMuted(data.muted ?? false);
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
      stats: { ...DEFAULT_STATS, ...(data.stats ?? {}) },
      achievements: data.achievements ?? {},
      skillState: data.skillState ?? {},
      muted: data.muted ?? false,
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
  clickDamage: (s) => clickDamage(s.heroLevel, s.prestigeLevels, s.artifacts, achCount(s)),
  totalDps: (s) => totalDps(s.npcLevels, s.prestigeLevels, s.artifacts, achCount(s)),
  critChance: (s) => critChance(s.heroUpgrades, s.artifacts),
  critMultiplier: (s) => critMultiplier(s.heroUpgrades, s.artifacts),
  crystalGain: (s) => crystalGain(s.runHighestStage, s.artifacts) * (s.opMode ? 1000 : 1),
  prestigeUnlocked: (s) => s.highestStage >= PRESTIGE_STAGE,
  canPrestige: (s) => s.runHighestStage >= PRESTIGE_STAGE,
  achievementCount: (s) => achCount(s),
};
