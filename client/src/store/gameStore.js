import { create } from 'zustand';
import {
  PRESTIGE_STAGE, TRANSCEND_STAGE, MAX_STAGE, NPCS, PRESTIGE_UPGRADES, HERO_UPGRADES,
  STARDUST_UPGRADES, ARTIFACTS, ARTIFACT_MAX_LEVEL, SKILLS, ACHIEVEMENTS, MILESTONES,
  creatureType, bossName, rollBossModifier, npcPassiveBonus,
} from '../game/constants.js';
import {
  isBossStage, creatureHp, creatureGold, bossHp, bossGold,
  clickDamage, heroLevelCost, heroUpgradeCost, critChance, critMultiplier,
  npcLevelCost, totalDps, bulkCost, maxAffordable, goldMultiplier, bossTime,
  crystalGain, prestigeUpgradeCost, startingGold, pullCost, killsRequired,
  rarityOdds, artifactUpgradeCost,
  transcendGain, stardustUpgradeCost, startingCrystals,
} from '../game/formulas.js';
import { sfx, setMuted } from '../game/audio.js';
import { fmt } from '../utils/format.js';

let enemySeq = 0; // doğuş animasyonu için her düşmana benzersiz kimlik
let achTimer = 0; // başarım kontrolü zamanlayıcısı (2 sn'de bir)
let toastSeq = 0;
let goldenTimer = 45 + Math.random() * 60; // ilk altın yaratık için geri sayım (sn)
const GOLDEN_TTL = 12; // ekranda kalma süresi (sn)
let autoTimer = 0; // Oto-Seviye throttle
let stuckTimer = 0; // Oto-Prestij: ilerleme yoksa geçen süre
let lastStageSeen = 1;
let lastClickAt = 0; // kombo penceresi için son klik zamanı
const COMBO_WINDOW = 1200; // ms
const COMBO_MAX = 50;

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
  const mod = rollBossModifier(big);
  const hp = bossHp(stage) * (mod?.hpMult ?? 1);
  return {
    id: ++enemySeq,
    kind: 'boss',
    big,
    typeId: type.id,
    name: big ? bossName(stage) : `Elit ${type.name}`,
    emoji: type.emoji,
    modifier: mod ? { id: mod.id, name: mod.name, emoji: mod.emoji, color: mod.color, desc: mod.desc } : null,
    goldMult: mod?.goldMult ?? 1,
    timeMult: mod?.timeMult ?? 1,
    drainMult: mod?.drainMult ?? 1,
    dpsMult: mod?.dpsMult ?? 1,
    hp,
    maxHp: hp,
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
  stardust: 0, // Yıldız Tozu (aşkınlıkta bile korunur)
  stardustLevels: {}, // kalıcı aşkınlık upgrade'leri
  totalPulls: 0,
  totalPrestiges: 0,
  totalTranscends: 0,
  stats: { ...DEFAULT_STATS },
  achievements: {}, // id -> true
  milestones: {}, // stage -> true (kilometre taşı ödülleri alındı mı)
  skillState: {}, // id -> { active, cd } (saniye)
  muted: false,
  buyAmount: 1, // 1 | 10 | 'max' — tüm panellerde ortak, kayda yazılır

  // --- geçici state ---
  loaded: false,
  offlineReport: null, // { gold, seconds }
  lastPull: null, // { id, level, isNew }
  toast: null, // { id, text }
  golden: null, // aktif altın yaratık { id, reward, ttl, x, y } (kayda yazılmaz)
  goldenBuffLeft: 0, // Altın Coşkusu buff süresi (sn)
  combo: 0, // ardışık hızlı klik sayacı (geçici)
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
    let dmg = s.opMode ? 1e18 : clickDamage(s.heroLevel, s.prestigeLevels, s.artifacts, achCount(s), s.stardustLevels);
    if (skillActive(s, 'ofke')) dmg *= 5;
    if (s.goldenBuffLeft > 0) dmg *= 7;
    // Kombo: 1.2sn içinde ardışık klik çarpanı büyütür (maks +%100)
    const now = performance.now();
    const combo = now - lastClickAt < COMBO_WINDOW ? Math.min(s.combo + 1, COMBO_MAX) : 1;
    lastClickAt = now;
    dmg *= 1 + Math.min(combo, COMBO_MAX) * 0.02;
    const pb = npcPassiveBonus(s.npcLevels);
    dmg *= pb.dmgMult;
    const crit = Math.random() < critChance(s.heroUpgrades, s.artifacts) + pb.critChance;
    if (crit) dmg *= critMultiplier(s.heroUpgrades, s.artifacts) + pb.critMult;
    const stats = {
      ...s.stats,
      totalClicks: s.stats.totalClicks + 1,
      totalCrits: s.stats.totalCrits + (crit ? 1 : 0),
      highestCrit: crit ? Math.max(s.stats.highestCrit, dmg) : s.stats.highestCrit,
    };
    set({ stats, combo });
    get()._applyDamage(dmg, true);
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
      // Zaman Donması aktifken boss süresi akmaz; Öfkeli boss'ta hızlı akar
      if (!skillActive(s, 'zamanDonmasi')) {
        const left = s.bossTimeLeft - dtSec * (s.enemy?.drainMult ?? 1);
        if (left <= 0) {
          sfx.bossFail();
          set({ mode: 'farm', bossTimeLeft: 0, enemy: makeCreature(s.stage) });
          return;
        }
        set({ bossTimeLeft: left });
      }
    }

    let dps = totalDps(s.npcLevels, s.prestigeLevels, s.artifacts, achCount(s), s.stardustLevels);
    dps *= npcPassiveBonus(s.npcLevels).dmgMult;
    if (skillActive(s, 'savasEmri')) dps *= 3;
    if (dps > 0) get()._applyDamage(dps * dtSec, false);

    // Altın Yaratık: yoksa geri sayım işler, süre dolunca belirir; varsa ttl azalır
    if (!s.golden) {
      goldenTimer -= dtSec;
      if (goldenTimer <= 0) {
        goldenTimer = 60 + Math.random() * 100;
        const reward = Math.random() < 0.6 ? 'gold' : 'frenzy';
        set({ golden: { id: Date.now(), reward, ttl: GOLDEN_TTL, x: 14 + Math.random() * 68, y: 22 + Math.random() * 50 } });
        sfx.reveal();
      }
    } else {
      const ttl = s.golden.ttl - dtSec;
      if (ttl <= 0) set({ golden: null });
      else set({ golden: { ...s.golden, ttl } });
    }
    if (s.goldenBuffLeft > 0) set({ goldenBuffLeft: Math.max(0, s.goldenBuffLeft - dtSec) });
    if (s.combo > 0 && performance.now() - lastClickAt > COMBO_WINDOW) set({ combo: 0 });

    // Otomasyon (Yıldız Tozu ile açılır)
    const sd = s.stardustLevels;
    if ((sd.otoMeydan ?? 0) > 0 && s.mode === 'farm' && s.kills >= killsRequired(s.prestigeLevels)) {
      get().challengeBoss();
    }
    if ((sd.otoSeviye ?? 0) > 0) {
      autoTimer += dtSec;
      if (autoTimer >= 0.5) { autoTimer = 0; get()._autoLevel(); }
    }
    if ((sd.otoPrestij ?? 0) > 0) {
      if (s.stage !== lastStageSeen) { lastStageSeen = s.stage; stuckTimer = 0; }
      else stuckTimer += dtSec;
      if (stuckTimer >= 30 && s.runHighestStage >= PRESTIGE_STAGE) { stuckTimer = 0; get().doPrestige(); }
    }

    // Başarım + kilometre taşı kontrolü (2 sn'de bir)
    achTimer += dtSec;
    if (achTimer >= 2) {
      achTimer = 0;
      get()._checkAchievements();
      get()._checkMilestones();
    }
  },

  _checkMilestones() {
    const s = get();
    const claimed = {};
    let crystals = 0;
    let last = null;
    for (const m of MILESTONES) {
      if (!s.milestones[m.stage] && s.highestStage >= m.stage) {
        claimed[m.stage] = true;
        crystals += m.crystals;
        last = m;
      }
    }
    if (!last) return;
    set({
      milestones: { ...s.milestones, ...claimed },
      crystals: s.crystals + crystals,
    });
    get()._showToast(`🏁 Bölge ${last.stage}! +${fmt(crystals)} 💎`);
    sfx.achievement();
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

  _applyDamage(amount, isClick = false) {
    const s = get();
    if (!s.enemy) return;
    // Zırhlı boss: NPC (klik dışı) hasarına dirençli
    if (s.enemy.kind === 'boss' && !isClick) amount *= s.enemy.dpsMult ?? 1;
    const hp = s.enemy.hp - amount;
    if (hp > 0) {
      set({ enemy: { ...s.enemy, hp } });
      return;
    }
    // Düşman öldü
    let gmult = goldMultiplier(s.prestigeLevels, s.heroUpgrades, s.artifacts, achCount(s), s.stardustLevels);
    gmult *= npcPassiveBonus(s.npcLevels).goldMult;
    if (skillActive(s, 'altinYagmuru')) gmult *= 3;
    if (s.goldenBuffLeft > 0) gmult *= 3;
    if (s.opMode) gmult *= 1000;
    if (s.enemy.kind === 'boss') {
      const reward = bossGold(s.stage) * gmult * (s.enemy.goldMult ?? 1);
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
        const boss = makeBoss(s.stage);
        set({
          gold: s.gold + reward,
          stats,
          kills,
          mode: 'boss',
          enemy: boss,
          bossTimeLeft: bossTime(s.prestigeLevels, s.artifacts, s.stardustLevels) * boss.timeMult,
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
    const boss = makeBoss(s.stage);
    set({
      mode: 'boss',
      enemy: boss,
      bossTimeLeft: bossTime(s.prestigeLevels, s.artifacts, s.stardustLevels) * boss.timeMult,
    });
  },

  // Oto-Seviye: en ucuz geliştirmeyi tekrar tekrar al (sessiz, ses yok)
  // ponytail: cheapest-first, ROI optimizasyonu yok — yeterince ilerletir
  _autoLevel() {
    for (let i = 0; i < 40; i++) {
      const s = get();
      let best = { kind: 'hero' };
      let bestCost = heroLevelCost(s.heroLevel);
      for (const npc of NPCS) {
        const c = npcLevelCost(npc, s.npcLevels[npc.id] ?? 0);
        if (c < bestCost) { bestCost = c; best = { kind: 'npc', id: npc.id }; }
      }
      if (bestCost > s.gold) break;
      if (best.kind === 'hero') set({ gold: s.gold - bestCost, heroLevel: s.heroLevel + 1 });
      else set({ gold: s.gold - bestCost, npcLevels: { ...s.npcLevels, [best.id]: (s.npcLevels[best.id] ?? 0) + 1 } });
    }
  },

  // ---- Altın Yaratık ----
  clickGolden() {
    const s = get();
    if (!s.golden) return;
    sfx.bossWin();
    if (s.golden.reward === 'gold') {
      const gmult = goldMultiplier(s.prestigeLevels, s.heroUpgrades, s.artifacts, achCount(s), s.stardustLevels);
      const dps = totalDps(s.npcLevels, s.prestigeLevels, s.artifacts, achCount(s), s.stardustLevels);
      const goldPerSec = (creatureGold(s.stage) / creatureHp(s.stage)) * dps;
      // 120 sn üretim; erken oyun için tek yaratık altınının katıyla taban
      const burst = Math.max(goldPerSec * 120, creatureGold(s.stage) * gmult * 60);
      set({ gold: s.gold + burst, golden: null });
      get()._showToast(`💰 Altın Yaratık! +${fmt(burst)} altın`);
    } else {
      set({ goldenBuffLeft: 20, golden: null });
      get()._showToast('✨ Altın Coşkusu! 20sn ×7 klik ve ×3 altın');
    }
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
    const gain = crystalGain(s.runHighestStage, s.artifacts, s.stardustLevels) * (s.opMode ? 1000 : 1);
    if (gain <= 0) return;
    sfx.prestige();
    set({
      ...freshRunState(s.prestigeLevels),
      crystals: s.crystals + gain,
      totalPrestiges: s.totalPrestiges + 1,
    });
  },

  // ---- Aşkınlık ----
  doTranscend() {
    const s = get();
    if (s.highestStage < TRANSCEND_STAGE) return;
    const gain = transcendGain(s.crystals) * (s.opMode ? 1000 : 1);
    if (gain <= 0) return;
    sfx.prestige();
    // Koşu + kristal + prestij upgrade'leri sıfırlanır; artifact/başarım/stardust korunur
    set({
      ...freshRunState({}),
      crystals: startingCrystals(s.stardustLevels),
      prestigeLevels: {},
      stardust: s.stardust + gain,
      totalTranscends: s.totalTranscends + 1,
    });
    get()._showToast(`✦ Aşkınlık! +${gain} 💫 Yıldız Tozu`);
  },

  buyStardustUpgradeLevels(upgradeId, count) {
    const s = get();
    const up = STARDUST_UPGRADES.find((u) => u.id === upgradeId);
    if (!up) return;
    const level = s.stardustLevels[upgradeId] ?? 0;
    const capped = Math.min(count, up.maxLevel - level);
    if (capped <= 0) return;
    const cost = bulkCost((l) => stardustUpgradeCost(up, l), level, capped);
    if (s.stardust < cost) return;
    sfx.buy();
    set({
      stardust: s.stardust - cost,
      stardustLevels: { ...s.stardustLevels, [upgradeId]: level + capped },
    });
  },

  buyStardustUpgradeMax(upgradeId) {
    const s = get();
    const up = STARDUST_UPGRADES.find((u) => u.id === upgradeId);
    if (!up) return;
    const level = s.stardustLevels[upgradeId] ?? 0;
    const cap = Math.min(1000, up.maxLevel - level);
    const { count, cost } = maxAffordable((l) => stardustUpgradeCost(up, l), level, s.stardust, cap);
    if (count <= 0) return;
    sfx.buy();
    set({
      stardust: s.stardust - cost,
      stardustLevels: { ...s.stardustLevels, [upgradeId]: level + count },
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
      stardust: s.stardust,
      stardustLevels: s.stardustLevels,
      totalPulls: s.totalPulls,
      totalPrestiges: s.totalPrestiges,
      totalTranscends: s.totalTranscends,
      stats: s.stats,
      achievements: s.achievements,
      milestones: s.milestones,
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
      stardust: data.stardust ?? 0,
      stardustLevels: data.stardustLevels ?? {},
      totalPulls: data.totalPulls ?? 0,
      totalPrestiges: data.totalPrestiges ?? 0,
      totalTranscends: data.totalTranscends ?? 0,
      stats: { ...DEFAULT_STATS, ...(data.stats ?? {}) },
      achievements: data.achievements ?? {},
      milestones: data.milestones ?? {},
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
  clickDamage: (s) => clickDamage(s.heroLevel, s.prestigeLevels, s.artifacts, achCount(s), s.stardustLevels) * npcPassiveBonus(s.npcLevels).dmgMult,
  totalDps: (s) => totalDps(s.npcLevels, s.prestigeLevels, s.artifacts, achCount(s), s.stardustLevels) * npcPassiveBonus(s.npcLevels).dmgMult,
  critChance: (s) => critChance(s.heroUpgrades, s.artifacts) + npcPassiveBonus(s.npcLevels).critChance,
  critMultiplier: (s) => critMultiplier(s.heroUpgrades, s.artifacts) + npcPassiveBonus(s.npcLevels).critMult,
  crystalGain: (s) => crystalGain(s.runHighestStage, s.artifacts, s.stardustLevels) * (s.opMode ? 1000 : 1),
  prestigeUnlocked: (s) => s.highestStage >= PRESTIGE_STAGE,
  canPrestige: (s) => s.runHighestStage >= PRESTIGE_STAGE,
  transcendUnlocked: (s) => s.highestStage >= TRANSCEND_STAGE,
  transcendGain: (s) => transcendGain(s.crystals) * (s.opMode ? 1000 : 1),
  achievementCount: (s) => achCount(s),
};
