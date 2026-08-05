// ---- Temel denge sabitleri ----
export const TICK_MS = 100;
export const KILLS_PER_STAGE = 10; // boss gelmeden önce kesilecek yaratık sayısı
export const BOSS_TIME_BASE = 30; // saniye
export const PRESTIGE_STAGE = 100; // prestijin açıldığı stage
export const TRANSCEND_STAGE = 500; // aşkınlığın açıldığı stage (= son bölge)
export const REALM_STAGE = 1000; // Diyar Geçişi'nin (3. prestij katmanı) açıldığı stage
// Bir diyarın taşıyabileceği son bölge. JS sayı tavanı (1.8e308) ~1690'da aşılıyor ve
// boss canı Infinity oluyordu; buranın altında güvenli sınır. İlerlemek için diyar değiştir.
export const REALM_CEILING = 1500;
export const MAX_STAGE = 500; // (artık sert sınır değil — stage sonsuz; 500 = aşkınlık eşiği)
export const OFFLINE_CAP_HOURS = 10;
export const AUTOSAVE_MS = 20000;

// ---- Katman kazanç eğrileri (tempo ayarının ana kolları) ----
// Prestij: kristal = CRYSTAL_GAIN_BASE * ((run-90)/10)^CRYSTAL_GAIN_EXP
export const CRYSTAL_GAIN_BASE = 20;
export const CRYSTAL_GAIN_EXP = 2.0;
// Aşkınlık: yıldız tozu = STARDUST_GAIN_BASE * sqrt(kristal / STARDUST_GAIN_DIV)
export const TRANSCEND_MIN_CRYSTALS = 30;
export const STARDUST_GAIN_BASE = 40;
export const STARDUST_GAIN_DIV = 2000;
// Diyar: öz = ESSENCE_GAIN_BASE * sqrt(toz / ESSENCE_THRESHOLD), en az ESSENCE_THRESHOLD toz
export const ESSENCE_THRESHOLD = 940;
export const ESSENCE_GAIN_BASE = 3;

// Yaratık
export const CREATURE_BASE_HP = 10;
export const HP_GROWTH = 1.5; // her stage HP çarpanı (Bölge 1..HP_RAMP_STAGE)
// Zorluk rampası: ilk prestijden sonra bölgeler kademeli sertleşir; 0→100 temposu korunur,
// 100→500 uzar. (Altın da HP'ye bağlı olduğundan gelir aynı oranda artar.)
export const HP_RAMP_STAGE = 100;
export const HP_GROWTH_LATE = 1.524;
export const GOLD_DIVISOR = 700; // altın = HP / 6
// ---- Boss modifiye'leri ----
// Boss savaşlarına taktik katar. hpMult/goldMult/timeMult başta uygulanır;
// dpsMult = NPC hasarının geçen oranı (zırhlı düşük), drainMult = süre akış hızı.
export const BOSS_MODIFIERS = [
  { id: 'zirhli',   name: 'Zırhlı',   emoji: '🛡️', color: '#8ea0ff', desc: 'NPC hasarına dirençli — tıklaman önemli!', hpMult: 1,   goldMult: 1.3, timeMult: 1,    drainMult: 1,   dpsMult: 0.35 },
  { id: 'aceleci',  name: 'Aceleci',  emoji: '💨', color: '#7fbf8e', desc: 'Kısa süre ama az can',                     hpMult: 0.5, goldMult: 1,   timeMult: 0.55, drainMult: 1,   dpsMult: 1 },
  { id: 'hazineci', name: 'Hazineci', emoji: '💰', color: '#ffd86b', desc: 'Çok canlı ama beş kat ödül',               hpMult: 2.2, goldMult: 5,   timeMult: 1.15, drainMult: 1,   dpsMult: 1 },
  { id: 'ofkeli',   name: 'Öfkeli',   emoji: '🔥', color: '#e4574b', desc: 'Süre daha hızlı akar',                     hpMult: 1,   goldMult: 1.6, timeMult: 1,    drainMult: 1.5, dpsMult: 1 },
];
// Modifiye çıkma şansı: mini boss %35, büyük boss %60
export function rollBossModifier(big) {
  const chance = big ? 0.6 : 0.35;
  if (Math.random() > chance) return null;
  return BOSS_MODIFIERS[Math.floor(Math.random() * BOSS_MODIFIERS.length)];
}

// ---- Yaratık sıfatları ----
// Boss modifiye'lerinin normal yaratık karşılığı. Yalnızca ilk tur bittikten sonra (Bölge 121+)
// çıkar — erken oyun sade kalsın, derin turlarda farm çeşitlensin. Rozet/çeviri altyapısı
// boss modifiye'leriyle ortak (enemy.modifier).
export const CREATURE_AFFIXES = [
  { id: 'afZirhli', name: 'Zırhlı',  emoji: '🛡️', color: '#8ea0ff', desc: 'NPC hasarına dirençli ama daha çok altın', hpMult: 1,   goldMult: 1.6, dpsMult: 0.45 },
  { id: 'afSiskin', name: 'Şişkin',  emoji: '🎈', color: '#b6d63a', desc: 'Üç kat canlı, dört kat altın',              hpMult: 3,   goldMult: 4,   dpsMult: 1 },
  { id: 'afCevik',  name: 'Çevik',   emoji: '💨', color: '#7fbf8e', desc: 'Yarı canlı, biraz fazla altın',             hpMult: 0.5, goldMult: 1.15, dpsMult: 1 },
  { id: 'afUgurlu', name: 'Uğurlu',  emoji: '🍀', color: '#ffd86b', desc: 'Altı kat altın',                            hpMult: 1,   goldMult: 6,   dpsMult: 1 },
];

// Sıfat çıkma şansı: ilk turda yok, sonra tur başına artar (üst sınır %25).
export function rollCreatureAffix(stage) {
  const loop = loopIndex(stage);
  if (loop < 1) return null;
  const chance = Math.min(0.25, 0.05 + loop * 0.03);
  if (Math.random() > chance) return null;
  return CREATURE_AFFIXES[Math.floor(Math.random() * CREATURE_AFFIXES.length)];
}

export const MINIBOSS_HP_MULT = 10;
export const MINIBOSS_GOLD_MULT = 13;
export const BOSS_HP_MULT = 24;
export const BOSS_GOLD_MULT = 34;

// Kahraman (klik)
export const HERO_BASE_COST = 4;
export const HERO_COST_GROWTH = 1.0525;
export const MILESTONE_EVERY = 15; // her 15 seviyede hasar x2
export const MILESTONE_MULT = 2;

// NPC seviye maliyeti: unlockCost * NPC_LEVEL_COST_FACTOR * NPC_COST_GROWTH^seviye
export const NPC_LEVEL_COST_FACTOR = 0.075;
export const NPC_COST_GROWTH = 1.0525;

// ---- Kahraman upgrade'leri (altınla, prestijde sıfırlanır) ----
export const HERO_UPGRADES = [
  {
    id: 'kritSans', name: 'Kritik Şansı', emoji: '🎯',
    desc: 'Kliklerin kritik vurma şansı +%1 (seviye başına)',
    baseCost: 100, costGrowth: 1.6, maxLevel: 40,
  },
  {
    id: 'kritHasar', name: 'Kritik Hasarı', emoji: '💢',
    desc: 'Kritik vuruş çarpanı +%10 (taban ×2)',
    baseCost: 150, costGrowth: 1.6, maxLevel: 50,
  },
  {
    id: 'altinBereketi', name: 'Altın Bereketi', emoji: '🌾',
    desc: 'Tüm altın kazancı +%5 (seviye başına)',
    baseCost: 200, costGrowth: 1.55, maxLevel: Infinity,
  },
];

// ---- Aktif yetenekler ----
export const SKILLS = [
  { id: 'ofke',         name: 'Öfke',          emoji: '😤', desc: 'Klik hasarı ×5',        duration: 10, cooldown: 120, unlockStage: 10,  mult: 5 },
  { id: 'altinYagmuru', name: 'Altın Yağmuru', emoji: '🌧️', desc: 'Altın kazancı ×3',      duration: 30, cooldown: 180, unlockStage: 25,  mult: 3 },
  { id: 'zamanDonmasi', name: 'Zaman Donması', emoji: '🧊', desc: 'Boss süresi donar',     duration: 8,  cooldown: 150, unlockStage: 40 },
  { id: 'savasEmri',    name: 'Savaş Emri',    emoji: '📣', desc: 'NPC hasarı ×3',         duration: 15, cooldown: 180, unlockStage: 60,  mult: 3 },
];

// ---- Başarımlar (her biri kalıcı +%2 hasar ve +%2 altın verir) ----
export const ACHIEVEMENT_BONUS = 0.02;
export const ACHIEVEMENTS = [
  { id: 'kill1',    name: 'Çaylak Avcı',        emoji: '🗡️', desc: '100 yaratık kes',            stat: 'totalKills',      threshold: 100 },
  { id: 'kill2',    name: 'Tecrübeli Avcı',     emoji: '⚔️', desc: '2.500 yaratık kes',          stat: 'totalKills',      threshold: 2500 },
  { id: 'kill3',    name: 'Kıdemli Avcı',       emoji: '🏹', desc: '25.000 yaratık kes',         stat: 'totalKills',      threshold: 25000 },
  { id: 'kill4',    name: 'Efsane Avcı',        emoji: '🐲', desc: '250.000 yaratık kes',        stat: 'totalKills',      threshold: 250000 },
  { id: 'boss1',    name: 'Boss Eziyeti',       emoji: '👹', desc: '10 boss kes',                stat: 'totalBossKills',  threshold: 10 },
  { id: 'boss2',    name: 'Boss Kabusu',        emoji: '😈', desc: '100 boss kes',               stat: 'totalBossKills',  threshold: 100 },
  { id: 'boss3',    name: 'Boss Celladı',       emoji: '💀', desc: '1.000 boss kes',             stat: 'totalBossKills',  threshold: 1000 },
  { id: 'click1',   name: 'Parmak Isınması',    emoji: '👆', desc: '500 kez tıkla',              stat: 'totalClicks',     threshold: 500 },
  { id: 'click2',   name: 'Klik Ustası',        emoji: '🖱️', desc: '5.000 kez tıkla',            stat: 'totalClicks',     threshold: 5000 },
  { id: 'click3',   name: 'Çelik Parmak',       emoji: '🦾', desc: '50.000 kez tıkla',           stat: 'totalClicks',     threshold: 50000 },
  { id: 'crit1',    name: 'Şanslı Vuruş',       emoji: '🎯', desc: '100 kritik vur',             stat: 'totalCrits',      threshold: 100 },
  { id: 'crit2',    name: 'Kritik Makinesi',    emoji: '💢', desc: '2.500 kritik vur',           stat: 'totalCrits',      threshold: 2500 },
  { id: 'stage1',   name: 'Yolcu',              emoji: '🥾', desc: 'Bölge 25\'e ulaş',           stat: 'highestStage',    threshold: 25 },
  { id: 'stage2',   name: 'Kaşif',              emoji: '🗺️', desc: 'Bölge 50\'ye ulaş',          stat: 'highestStage',    threshold: 50 },
  { id: 'stage3',   name: 'Fatih',              emoji: '🏰', desc: 'Bölge 100\'e ulaş',          stat: 'highestStage',    threshold: 100 },
  { id: 'stage4',   name: 'Derinlere',          emoji: '🕳️', desc: 'Bölge 250\'ye ulaş',         stat: 'highestStage',    threshold: 250 },
  { id: 'stage5',   name: 'Zirvenin Sahibi',    emoji: '⛰️', desc: 'Bölge 500\'e ulaş',          stat: 'highestStage',    threshold: 500 },
  { id: 'prest1',   name: 'Yeniden Doğuş',      emoji: '✦',  desc: 'İlk prestijini at',          stat: 'totalPrestiges',  threshold: 1 },
  { id: 'prest2',   name: 'Döngü Ustası',       emoji: '🔄', desc: '5 kez prestij at',           stat: 'totalPrestiges',  threshold: 5 },
  { id: 'prest3',   name: 'Ebedi Döngü',        emoji: '♾️', desc: '15 kez prestij at',          stat: 'totalPrestiges',  threshold: 15 },
  { id: 'art1',     name: 'Koleksiyoncu Çırağı',emoji: '🗝️', desc: '5 artifact topla',           stat: 'ownedArtifacts',  threshold: 5 },
  { id: 'art2',     name: 'Koleksiyoncu',       emoji: '🎁', desc: '15 artifact topla',          stat: 'ownedArtifacts',  threshold: 15 },
  { id: 'art3',     name: 'Kadim Koleksiyon',   emoji: '🏺', desc: '30 artifact topla',          stat: 'ownedArtifacts',  threshold: 30 },
  { id: 'pull1',    name: 'Sandık Meraklısı',   emoji: '📦', desc: '10 sandık aç',               stat: 'totalPulls',      threshold: 10 },
  { id: 'pull2',    name: 'Sandık Bağımlısı',   emoji: '🎰', desc: '30 sandık aç',               stat: 'totalPulls',      threshold: 30 },
  { id: 'gold1',    name: 'Milyarder',          emoji: '🪙', desc: 'Toplam 1B altın kazan',      stat: 'totalGoldEarned', threshold: 1e9 },
  { id: 'gold2',    name: 'Kentilyoner',        emoji: '💰', desc: 'Toplam 1Qi altın kazan',     stat: 'totalGoldEarned', threshold: 1e18 },
  { id: 'gold3',    name: 'Altın Tanrısı',      emoji: '👑', desc: 'Toplam 1e30 altın kazan',    stat: 'totalGoldEarned', threshold: 1e30 },
  // --- Aşkınlık & Diyar katmanı ---
  { id: 'stage6',   name: 'Aşkın',              emoji: '✦',  desc: 'Bölge 750\'ye ulaş',         stat: 'highestStage',    threshold: 750 },
  { id: 'stage7',   name: 'Diyar Gezgini',      emoji: '🌀', desc: 'Bölge 1000\'e ulaş',         stat: 'highestStage',    threshold: 1000 },
  { id: 'trans1',   name: 'Yıldız Doğuşu',      emoji: '💫', desc: 'İlk kez aşkınlaş',           stat: 'totalTranscends', threshold: 1 },
  { id: 'trans2',   name: 'Takımyıldız',        emoji: '🌌', desc: '10 kez aşkınlaş',            stat: 'totalTranscends', threshold: 10 },
  { id: 'realm1',   name: 'Boyut Kâşifi',       emoji: '🌠', desc: 'İlk diyar geçişini yap',     stat: 'realm',           threshold: 2 },
  { id: 'realm2',   name: 'Çok Evrenli',        emoji: '🪐', desc: 'Diyar 5\'e ulaş',            stat: 'realm',           threshold: 5 },
  { id: 'ozart1',   name: 'Öz Toplayıcı',       emoji: '🧬', desc: '6 Öz artifact\'i topla',     stat: 'ownedRealmArtifacts', threshold: 6 },
  { id: 'ozart2',   name: 'Sonsuzluk Kasası',   emoji: '👁️‍🗨️', desc: '12 Öz artifact\'i topla',    stat: 'ownedRealmArtifacts', threshold: 12 },
];

// ---- Kilometre taşı ödülleri ----
// highestStage'e ilk ulaşınca tek seferlik kristal. Erken kristaller ilk prestije
// kadar birikir (head start). id = eşik stage.
export const MILESTONES = [
  { stage: 25, crystals: 5 },
  { stage: 50, crystals: 15 },
  { stage: 75, crystals: 40 },
  { stage: 100, crystals: 120 },
  { stage: 150, crystals: 400 },
  { stage: 200, crystals: 1200 },
  { stage: 250, crystals: 3500 },
  { stage: 300, crystals: 9000 },
  { stage: 400, crystals: 30000 },
  { stage: 500, crystals: 100000 },
  { stage: 600, crystals: 300000 },
  { stage: 750, crystals: 1000000 },
  { stage: 1000, crystals: 5000000 },
];

// ---- NPC'ler (Yoldaşlar) ----
// projectile: savaş alanında fırlattıkları mermi (her NPC'ninki farklı)
export const NPCS = [
  { id: 'okcu',      name: 'Okçu',            emoji: '🏹', projectile: '➸',  unlockCost: 50,      baseDps: 4 },
  { id: 'sovalye',   name: 'Şövalye',         emoji: '🛡️', projectile: '🗡️', unlockCost: 1.2e3,   baseDps: 90 },
  { id: 'buyucu',    name: 'Büyücü',          emoji: '🧙', projectile: '✨', unlockCost: 3e4,     baseDps: 2e3 },
  { id: 'haydut',    name: 'Haydut',          emoji: '🗡️', projectile: '🔪', unlockCost: 7.5e5,   baseDps: 4.5e4 },
  { id: 'rahip',     name: 'Savaş Rahibi',    emoji: '⚒️', projectile: '🌟', unlockCost: 2e7,     baseDps: 1e6 },
  { id: 'ejderavci', name: 'Ejderha Avcısı',  emoji: '⚔️', projectile: '🎯', unlockCost: 5e8,     baseDps: 2.2e7 },
  { id: 'suikastci', name: 'Gölge Suikastçı', emoji: '🥷', projectile: '🌘', unlockCost: 1.2e10,  baseDps: 5e8 },
  { id: 'firtina',   name: 'Fırtına Çağırıcı',emoji: '🌩️', projectile: '⚡', unlockCost: 3e11,    baseDps: 1.1e10 },
  { id: 'ates',      name: 'Ateş Dansçısı',   emoji: '🔥', projectile: '🔥', unlockCost: 8e12,    baseDps: 2.6e11 },
  { id: 'buz',       name: 'Buz Kraliçesi',   emoji: '❄️', projectile: '❄️', unlockCost: 2e14,    baseDps: 6e12 },
  { id: 'ent',       name: 'Kadim Ent',       emoji: '🌳', projectile: '🍃', unlockCost: 5e15,    baseDps: 1.4e14 },
  { id: 'zaman',     name: 'Zaman Bekçisi',   emoji: '⏳', projectile: '🌀', unlockCost: 1.2e17,  baseDps: 3.2e15 },
];

// ---- NPC pasifleri ----
// Yoldaş NPC_PASSIVE_THRESHOLD seviyeye ulaşınca küresel bir pasif açar.
// type: dmg (tüm hasar ×) | gold (altın ×) | critChance (+) | critMult (+)
export const NPC_PASSIVE_THRESHOLD = 50;
export const NPC_PASSIVES = {
  okcu:      { type: 'critChance', value: 0.08, label: '+%8 kritik şansı' },
  sovalye:   { type: 'dmg',        value: 0.15, label: '+%15 tüm hasar' },
  buyucu:    { type: 'gold',       value: 0.20, label: '+%20 altın' },
  haydut:    { type: 'critMult',   value: 0.5,  label: '+%50 kritik hasarı' },
  rahip:     { type: 'dmg',        value: 0.20, label: '+%20 tüm hasar' },
  ejderavci: { type: 'gold',       value: 0.30, label: '+%30 altın' },
  suikastci: { type: 'critChance', value: 0.10, label: '+%10 kritik şansı' },
  firtina:   { type: 'dmg',        value: 0.30, label: '+%30 tüm hasar' },
  ates:      { type: 'critMult',   value: 0.75, label: '+%75 kritik hasarı' },
  buz:       { type: 'gold',       value: 0.40, label: '+%40 altın' },
  ent:       { type: 'dmg',        value: 0.40, label: '+%40 tüm hasar' },
  zaman:     { type: 'gold',       value: 0.50, label: '+%50 altın' },
};

// Sv eşiğini geçen NPC'lerin pasiflerini topla
export function npcPassiveBonus(npcLevels = {}) {
  const b = { dmg: 0, gold: 0, critChance: 0, critMult: 0 };
  for (const [id, p] of Object.entries(NPC_PASSIVES)) {
    if ((npcLevels[id] ?? 0) >= NPC_PASSIVE_THRESHOLD) b[p.type] += p.value;
  }
  return { dmgMult: 1 + b.dmg, goldMult: 1 + b.gold, critChance: b.critChance, critMult: b.critMult };
}

// ---- Prestij (kristal) upgrade'leri ----
export const PRESTIGE_UPGRADES = [
  {
    id: 'keskinVurus', name: 'Keskin Vuruş', emoji: '💥',
    desc: 'Klik hasarı +%50 (seviye başına)',
    baseCost: 10, costGrowth: 1.7, maxLevel: Infinity,
  },
  {
    id: 'komutanlik', name: 'Komutanlık', emoji: '🚩',
    desc: 'NPC hasarı +%50 (seviye başına)',
    baseCost: 10, costGrowth: 1.7, maxLevel: Infinity,
  },
  {
    id: 'altinDokunus', name: 'Altın Dokunuş', emoji: '🪙',
    desc: 'Altın kazancı +%35 (seviye başına)',
    baseCost: 15, costGrowth: 1.7, maxLevel: Infinity,
  },
  {
    id: 'zamanBukucu', name: 'Zaman Bükücü', emoji: '⏱️',
    desc: 'Boss süresi +2 saniye (seviye başına)',
    baseCost: 25, costGrowth: 3, maxLevel: 5,
  },
  {
    id: 'surekAvi', name: 'Sürek Avı', emoji: '🐾',
    desc: 'Boss için gereken yaratık sayısı −1 (seviye başına)',
    baseCost: 40, costGrowth: 3, maxLevel: 5,
  },
  {
    id: 'hazirBaslangic', name: 'Hazır Başlangıç', emoji: '🎒',
    desc: 'Her yeni maceraya altınla başla (1000 × 10^(sv−1))',
    baseCost: 10, costGrowth: 2, maxLevel: 10,
  },
];

// ---- Aşkınlık (Yıldız Tozu 💫) ----
// Bölge 500'e ilk ulaşınca açılır. Koşu + kristal + prestij sıfırlanır; artifact ve
// başarımlar korunur. Yıldız Tozu bankadaki kristale göre kazanılır; kalıcı çarpanlar verir.
export const STARDUST_UPGRADES = [
  {
    id: 'yildizGucu', name: 'Yıldız Gücü', emoji: '🌟',
    desc: 'Tüm hasar (klik + NPC) +%40 (seviye başına)',
    baseCost: 3, costGrowth: 1.8, maxLevel: Infinity,
  },
  {
    id: 'yildizServeti', name: 'Yıldız Serveti', emoji: '💫',
    desc: 'Altın kazancı +%50 (seviye başına)',
    baseCost: 3, costGrowth: 1.8, maxLevel: Infinity,
  },
  {
    id: 'yildizBilgeligi', name: 'Yıldız Bilgeliği', emoji: '✨',
    desc: 'Kristal kazancı +%30 (seviye başına)',
    baseCost: 5, costGrowth: 2, maxLevel: Infinity,
  },
  {
    id: 'yildizKalkani', name: 'Yıldız Kalkanı', emoji: '🛡️',
    desc: 'Boss süresi +3 saniye (seviye başına)',
    baseCost: 8, costGrowth: 2.5, maxLevel: 8,
  },
  {
    id: 'yildizBaslangici', name: 'Yıldız Başlangıcı', emoji: '🚀',
    desc: 'Her aşkınlıktan sonra başlangıç kristaliyle başla (50 × 3^(sv−1))',
    baseCost: 5, costGrowth: 2.2, maxLevel: 10,
  },
  {
    id: 'otoSeviye', name: 'Oto-Seviye', emoji: '🤖',
    desc: 'Altını en ucuz geliştirmeye otomatik harcar',
    baseCost: 15, costGrowth: 1, maxLevel: 1,
  },
  {
    id: 'otoMeydan', name: 'Oto-Meydan Oku', emoji: '⚔️',
    desc: 'Kaçırılan boss\'a otomatik yeniden meydan okur',
    baseCost: 25, costGrowth: 1, maxLevel: 1,
  },
  {
    id: 'otoPrestij', name: 'Oto-Prestij', emoji: '♻️',
    desc: 'Takılınca (30sn ilerleme yoksa) otomatik prestij yapar',
    baseCost: 60, costGrowth: 1, maxLevel: 1,
  },
  {
    // Duvar kıran: kilometre taşı aralığını 15→12'ye indirir; ln(1.056)·12 < ln(2)
    // olduğundan DPS büyümesi HP'yi geçer ve Bölge 1000 (Diyar) ulaşılabilir olur.
    id: 'yildizYarigi', name: 'Yıldız Yarığı', emoji: '🌠',
    desc: 'Kilometre taşı aralığı −1 (hasar ×2 daha sık gelir)',
    baseCost: 120, costGrowth: 5, maxLevel: 3,
  },
];

// ---- Diyar (Öz 🌀) geliştirmeleri ----
// Öz ile alınır; en üst katman olduğundan HİÇBİR sıfırlamada kaybolmaz.
export const ESSENCE_UPGRADES = [
  {
    id: 'ozGucu', name: 'Öz Gücü', emoji: '💥',
    desc: 'Tüm hasar (klik + NPC) +%60 (seviye başına)',
    baseCost: 2, costGrowth: 1.9, maxLevel: Infinity,
  },
  {
    id: 'ozBilgeligi', name: 'Öz Bilgeliği', emoji: '🔮',
    desc: 'Kristal kazancı +%50 (seviye başına)',
    baseCost: 3, costGrowth: 2.2, maxLevel: Infinity,
  },
  {
    id: 'ozHafizasi', name: 'Öz Hafızası', emoji: '🧠',
    desc: "Diyar geçişinde Yıldız Tozu'nun %10'u korunur (seviye başına)",
    baseCost: 3, costGrowth: 2.5, maxLevel: 5,
  },
  {
    id: 'bolgeSicramasi', name: 'Bölge Sıçraması', emoji: '🐇',
    desc: "Boss'u aşırı hasarla kesince ekstra bölge atla: 10^10 kat +1, her ek 10^5 kat +1 (maks = seviye)",
    baseCost: 2, costGrowth: 3, maxLevel: 5,
  },
];

// ---- Artifact sistemi ----
export const PULL_COST_BASE = 20; // ilk sandık fiyatı (kristal)
export const PULL_COST_GROWTH = 1.035; // her çekilişte fiyat çarpanı
export const ARTIFACT_MAX_LEVEL = 10; // kopyalar seviye atlatır

// Kristalle doğrudan artifact geliştirme: taban maliyet rarity'ye göre
export const ARTIFACT_UPGRADE_BASE = {
  siradan: 30,
  olagandisi: 60,
  nadir: 125,
  epik: 250,
  efsanevi: 600,
};
export const ARTIFACT_UPGRADE_GROWTH = 1.6; // her seviyede maliyet çarpanı

// Rarity'ler ve çekiliş şansları (%). Toplam 100.
export const RARITIES = [
  { id: 'siradan',    name: 'Sıradan',     chance: 50, color: '#9aa0a6' },
  { id: 'olagandisi', name: 'Olağandışı',  chance: 25, color: '#4caf7d' },
  { id: 'nadir',      name: 'Nadir',       chance: 15, color: '#4f8ef0' },
  { id: 'epik',       name: 'Epik',        chance: 8,  color: '#a86ae8' },
  { id: 'efsanevi',   name: 'Efsanevi',    chance: 2,  color: '#f0a83c' },
];

// Etki tipleri: click, dps, gold, critChance, critMult, bossTime, offline, crystal
// value = seviye başına etki (yüzdeler ondalık, bossTime saniye)
export const ARTIFACTS = [
  // --- Sıradan (10) ---
  { id: 'pasliKilic',    name: 'Paslı Kılıç',          emoji: '🗡️', rarity: 'siradan', effect: 'click',      value: 0.15 },
  { id: 'tahtaKalkan',   name: 'Tahta Kalkan',         emoji: '🛡️', rarity: 'siradan', effect: 'dps',        value: 0.15 },
  { id: 'bakirYuzuk',    name: 'Bakır Yüzük',          emoji: '💍', rarity: 'siradan', effect: 'gold',       value: 0.12 },
  { id: 'sansliZar',     name: 'Şanslı Zar',           emoji: '🎲', rarity: 'siradan', effect: 'critChance', value: 0.01 },
  { id: 'deriEldiven',   name: 'Deri Eldiven',         emoji: '🧤', rarity: 'siradan', effect: 'click',      value: 0.18 },
  { id: 'demirTilsim',   name: 'Demir Tılsım',         emoji: '🧿', rarity: 'siradan', effect: 'dps',        value: 0.18 },
  { id: 'kirikKumSaati', name: 'Kırık Kum Saati',      emoji: '⌛', rarity: 'siradan', effect: 'bossTime',   value: 1 },
  { id: 'eskiHarita',    name: 'Yıpranmış Harita',     emoji: '🗺️', rarity: 'siradan', effect: 'gold',       value: 0.15 },
  { id: 'kemikKolye',    name: 'Kemik Kolye',          emoji: '📿', rarity: 'siradan', effect: 'critMult',   value: 0.08 },
  { id: 'camKure',       name: 'Cam Küre',             emoji: '🔮', rarity: 'siradan', effect: 'offline',    value: 0.30 },
  // --- Olağandışı (8) ---
  { id: 'gumusPala',     name: 'Gümüş Pala',           emoji: '⚔️', rarity: 'olagandisi', effect: 'click',      value: 0.40 },
  { id: 'savasBorusu',   name: 'Savaş Borusu',         emoji: '📯', rarity: 'olagandisi', effect: 'dps',        value: 0.40 },
  { id: 'altinKese',     name: 'Altın Kese',           emoji: '👛', rarity: 'olagandisi', effect: 'gold',       value: 0.30 },
  { id: 'nisanDurbunu',  name: 'Nişancı Dürbünü',      emoji: '🔭', rarity: 'olagandisi', effect: 'critChance', value: 0.02 },
  { id: 'zumrutYuzuk',   name: 'Zümrüt Yüzük',         emoji: '💚', rarity: 'olagandisi', effect: 'critMult',   value: 0.20 },
  { id: 'kumSaati',      name: 'Kum Saati',            emoji: '⏳', rarity: 'olagandisi', effect: 'bossTime',   value: 2 },
  { id: 'miknatisEld',   name: 'Mıknatıs Eldiven',     emoji: '🧲', rarity: 'olagandisi', effect: 'gold',       value: 0.35 },
  { id: 'geceFeneri',    name: 'Gece Feneri',          emoji: '🏮', rarity: 'olagandisi', effect: 'offline',    value: 0.60 },
  // --- Nadir (6) ---
  { id: 'ejderDisi',     name: 'Ejder Dişi Hançer',    emoji: '🔪', rarity: 'nadir', effect: 'click',      value: 1.00 },
  { id: 'kadimSancak',   name: 'Kadim Sancak',         emoji: '🚩', rarity: 'nadir', effect: 'dps',        value: 1.00 },
  { id: 'midasEli',      name: 'Midas Eli',            emoji: '✋', rarity: 'nadir', effect: 'gold',       value: 0.80 },
  { id: 'suikastGozu',   name: 'Suikastçı Gözü',       emoji: '👁️', rarity: 'nadir', effect: 'critChance', value: 0.05 },
  { id: 'kanliYakut',    name: 'Kanlı Yakut',          emoji: '🩸', rarity: 'nadir', effect: 'critMult',   value: 0.50 },
  { id: 'yildizPusula',  name: 'Yıldız Pusulası',      emoji: '🧭', rarity: 'nadir', effect: 'crystal',    value: 0.15 },
  // --- Epik (4) ---
  { id: 'titanYumrugu',  name: 'Titan Yumruğu',        emoji: '🥊', rarity: 'epik', effect: 'click',   value: 2.50 },
  { id: 'orduNisani',    name: 'Ordu Nişanı',          emoji: '🎖️', rarity: 'epik', effect: 'dps',     value: 2.50 },
  { id: 'ejderHazinesi', name: 'Ejderha Hazinesi',     emoji: '🐲', rarity: 'epik', effect: 'gold',    value: 2.00 },
  { id: 'zamanKristali', name: 'Zaman Kristali',       emoji: '💠', rarity: 'epik', effect: 'crystal', value: 0.30 },
  // --- Efsanevi (2) ---
  { id: 'tanriKatili',   name: 'Tanrı Katili Kılıcı',  emoji: '⚡', rarity: 'efsanevi', effect: 'click', value: 10.00 },
  { id: 'ejderKalbi',    name: 'Kadim Ejder Kalbi',    emoji: '❤️‍🔥', rarity: 'efsanevi', effect: 'dps',   value: 10.00 },
];

// ---- Öz artifact'leri (Diyar katmanı) ----
// Öz 🌀 ile çekilir; taban havuzdan kat kat güçlüdür. `oz: true` → geliştirme
// maliyeti REALM_ARTIFACT_UPGRADE_MULT ile çarpılır. Aynı `artifacts` haritasında yaşar.
export const REALM_ARTIFACTS = [
  // --- Sıradan (3) ---
  { id: 'ozKilic',       name: 'Öz Kılıcı',        emoji: '🌌', rarity: 'siradan', effect: 'click',   value: 1.5,  oz: true },
  { id: 'ozZirh',        name: 'Öz Zırhı',         emoji: '🌫️', rarity: 'siradan', effect: 'dps',     value: 1.5,  oz: true },
  { id: 'ozSikke',       name: 'Öz Sikkesi',       emoji: '🫧', rarity: 'siradan', effect: 'gold',    value: 1.2,  oz: true },
  // --- Olağandışı (3) ---
  { id: 'kaosPencesi',   name: 'Kaos Pençesi',     emoji: '🌪️', rarity: 'olagandisi', effect: 'click',   value: 4,   oz: true },
  { id: 'boyutPusulasi', name: 'Boyut Pusulası',   emoji: '🛸', rarity: 'olagandisi', effect: 'offline', value: 3,   oz: true },
  { id: 'gecitAnahtari', name: 'Geçit Anahtarı',   emoji: '🗝️', rarity: 'olagandisi', effect: 'crystal', value: 0.8, oz: true },
  // --- Nadir (3) ---
  { id: 'yildizYutan',   name: 'Yıldız Yutan',     emoji: '🕳️', rarity: 'nadir', effect: 'click', value: 10, oz: true },
  { id: 'alevCekirdegi', name: 'Kuyruklu Yıldız Çekirdeği', emoji: '☄️', rarity: 'nadir', effect: 'dps', value: 10, oz: true },
  { id: 'zamanMotoru',   name: 'Zaman Motoru',     emoji: '⚙️', rarity: 'nadir', effect: 'gold',  value: 8,  oz: true },
  // --- Epik (2) ---
  { id: 'diyarKirici',   name: 'Diyar Kırıcı',     emoji: '🔱', rarity: 'epik', effect: 'critMult', value: 3, oz: true },
  { id: 'sonsuzlukGozu', name: 'Sonsuzluk Gözü',   emoji: '👁️‍🗨️', rarity: 'epik', effect: 'crystal',  value: 2, oz: true },
  // --- Efsanevi (1) ---
  { id: 'ilkOz',         name: 'İlk Öz',           emoji: '🧬', rarity: 'efsanevi', effect: 'dps', value: 60, oz: true },
];

export const ALL_ARTIFACTS = [...ARTIFACTS, ...REALM_ARTIFACTS];
export const REALM_PULL_COST_BASE = 5; // ilk Öz sandığı fiyatı (🌀)
export const REALM_PULL_COST_GROWTH = 1.15; // her Öz çekilişinde fiyat çarpanı
export const REALM_ARTIFACT_UPGRADE_MULT = 30; // Öz artifact'i geliştirme maliyeti çarpanı (kristal)

// ---- Yaratık kataloğu ----
// Her 10 stage'lik dilimin 3 klasik RPG yaratığı vardır; dilimler biterse baştan döner.
// look: CreatureCanvas'ın 3B modeli kurarken kullandığı özellik bayrakları.
export const CREATURE_TIERS = [
  [
    { id: 'fare',       name: 'Lağım Faresi',      emoji: '🐀', look: { arch: 'quadruped', color: '#8a8078', ears: 'round', snout: 'point', tail: 'thin' } },
    { id: 'yarasa',     name: 'Vampir Yarasa',     emoji: '🦇', look: { arch: 'flyer', color: '#5c5470', shape: 'small', ears: 'big', fangs: true } },
    { id: 'yilan',      name: 'Zehirli Yılan',     emoji: '🐍', look: { arch: 'serpent', color: '#5f9e58', fangs: true, eyes: { color: '#ffd84d' } } },
  ],
  [
    { id: 'kurt',       name: 'Aç Kurt',           emoji: '🐺', look: { arch: 'quadruped', color: '#7d8494', ears: 'point', snout: 'point', tail: 'thin', fangs: true } },
    { id: 'domuz',      name: 'Yaban Domuzu',      emoji: '🐗', look: { arch: 'quadruped', color: '#8f6b4f', stocky: true, snout: 'tusk' } },
    { id: 'orumcek',    name: 'Dev Örümcek',       emoji: '🕷️', look: { arch: 'bug', color: '#3f3a4a', shape: 'small', eyes: { count: 4, color: '#e4574b' } } },
  ],
  [
    { id: 'goblin',     name: 'Goblin',            emoji: '👺', look: { arch: 'humanoid', color: '#69a15c', ears: 'point', fangs: true } },
    { id: 'trol',       name: 'Mağara Trolü',      emoji: '🧌', look: { arch: 'humanoid', color: '#7a8f6a', shape: 'big', horns: 1, fangs: true } },
    { id: 'tilki',      name: 'Hilebaz Tilki',     emoji: '🦊', look: { arch: 'quadruped', color: '#c97f3c', ears: 'point', snout: 'point', tail: 'thin' } },
  ],
  [
    { id: 'iskelet',    name: 'İskelet Savaşçı',   emoji: '💀', look: { arch: 'humanoid', color: '#d8d2c0', eyes: { socket: true } } },
    { id: 'zombi',      name: 'Zombi',             emoji: '🧟', look: { arch: 'humanoid', color: '#8aa07a', fangs: true, glowEyes: '#b6ff8a' } },
    { id: 'hortlak',    name: 'Hortlak',           emoji: '👻', look: { arch: 'ghost', color: '#cfd4e8', translucent: true } },
  ],
  [
    { id: 'akrep',      name: 'Dev Akrep',         emoji: '🦂', look: { arch: 'bug', color: '#8f4a3c', claws: true, stinger: true } },
    { id: 'kertenkele', name: 'Kertenkele Savaşçı',emoji: '🦎', look: { arch: 'quadruped', color: '#6faf5c', longBody: true, snout: 'point', tail: 'thin' } },
    { id: 'timsah',     name: 'Bataklık Timsahı',  emoji: '🐊', look: { arch: 'quadruped', color: '#4f7f4a', longBody: true, snout: 'long', fangs: true } },
  ],
  [
    { id: 'vampir',     name: 'Vampir Kont',       emoji: '🧛', look: { arch: 'humanoid', color: '#cbb9d6', fangs: true, glowEyes: '#e4574b' } },
    { id: 'kurtadam',   name: 'Kurtadam',          emoji: '🐺', look: { arch: 'humanoid', color: '#5a5f6e', shape: 'big', ears: 'point', snout: 'point', fangs: true, claws: true, glowEyes: '#f0a83c' } },
    { id: 'cadi',       name: 'Kara Cadı',         emoji: '🧙‍♀️', look: { arch: 'humanoid', color: '#9d7be8', hat: true } },
  ],
  [
    { id: 'dev',        name: 'Dağ Devi',          emoji: '👹', look: { arch: 'humanoid', color: '#b06a4a', shape: 'big', horns: 1, fangs: true } },
    { id: 'golem',      name: 'Taş Golem',         emoji: '🗿', look: { arch: 'humanoid', color: '#8d8a84', shape: 'big', glowEyes: '#f0a83c' } },
    { id: 'sahin',      name: 'Kızıl Şahin',       emoji: '🦅', look: { arch: 'flyer', color: '#a3763f', snout: 'point' } },
  ],
  [
    { id: 'wyvern',     name: 'Genç Wyvern',       emoji: '🐉', look: { arch: 'flyer', color: '#c05548', horns: 2, tail: 'spike' } },
    { id: 'kadimejder', name: 'Kadim Ejder',       emoji: '🐲', look: { arch: 'flyer', color: '#8f3f3f', shape: 'big', horns: 2, tail: 'spike' } },
    { id: 'rex',        name: 'Kemikli Rex',       emoji: '🦖', look: { arch: 'quadruped', color: '#6f9e4f', longBody: true, shape: 'big', snout: 'long', fangs: true, tail: 'spike' } },
  ],
  [
    { id: 'kristalOrumcek', name: 'Kristal Örümceği', emoji: '💎', look: { arch: 'bug', color: '#6fd8e0', claws: true, eyes: { count: 6, color: '#b8f7f1' }, glowEyes: '#8ff2ea' } },
    { id: 'prizmaGolem',    name: 'Prizma Golemi',    emoji: '🔷', look: { arch: 'humanoid', color: '#4fb8c8', shape: 'big', glowEyes: '#b8f7f1' } },
    { id: 'yankiHortlagi',  name: 'Yankı Hortlağı',   emoji: '🫧', look: { arch: 'ghost', color: '#a8e6ec', translucent: true, glowEyes: '#6fd8e0' } },
  ],
  [
    { id: 'firtinaKartali', name: 'Fırtına Kartalı',  emoji: '🦅', look: { arch: 'flyer', color: '#9fc4ff', snout: 'point', glowEyes: '#e8f0ff' } },
    { id: 'tasBekci',       name: 'Taş Bekçi',        emoji: '🗿', look: { arch: 'humanoid', color: '#8fa3c4', shape: 'big', horns: 2, glowEyes: '#9fc4ff' } },
    { id: 'gokYilani',      name: 'Gök Yılanı',       emoji: '🐍', look: { arch: 'serpent', color: '#7fb0e8', fangs: true, eyes: { color: '#e8f0ff' } } },
  ],
  [
    { id: 'kulKurdu',   name: 'Kül Kurdu',        emoji: '🐺', look: { arch: 'quadruped', color: '#8a6250', ears: 'point', snout: 'point', tail: 'thin', fangs: true, glowEyes: '#ff7a3c' } },
    { id: 'magmaDevi',  name: 'Magma Devi',       emoji: '🌋', look: { arch: 'humanoid', color: '#b0512a', shape: 'big', horns: 2, fangs: true, claws: true, glowEyes: '#ffc25e' } },
    { id: 'korAkrep',   name: 'Kor Akrep',        emoji: '🦂', look: { arch: 'bug', color: '#d8703c', claws: true, stinger: true, glowEyes: '#ffd86b' } },
  ],
  [
    { id: 'bosluktanGelen', name: 'Boşluk Gezgini', emoji: '🌀', look: { arch: 'humanoid', color: '#7b4fd0', translucent: true, claws: true, glowEyes: '#d8b8ff' } },
    { id: 'hicYilani',      name: 'Hiç Yılanı',     emoji: '🕳️', look: { arch: 'serpent', color: '#4a2a7a', longBody: true, fangs: true, glowEyes: '#c79aff' } },
    { id: 'sonsuzGoz',      name: 'Sonsuz Göz',     emoji: '👁️', look: { arch: 'ghost', color: '#a05cf0', translucent: true, eyes: { count: 8, color: '#ffffff' }, glowEyes: '#e0c8ff' } },
  ],
];

// id -> tip (CreatureCanvas hızlı erişimi)
export const CREATURE_TYPES = Object.fromEntries(
  CREATURE_TIERS.flat().map((t) => [t.id, t])
);

export const ZONE_NAMES = [
  'Çürük Lağımlar',
  'Uluyan Orman',
  'Goblin Geçidi',
  'Kemik Çukuru',
  'Zehirli Bataklık',
  'Lanetli Saray',
  'Taş Devler Yaylası',
  'Ejder İni',
  'Kristal Mağaraları',
  'Gökyüzü Harabeleri',
  'Küller Diyarı',
  'Boşluk Eşiği',
];

// Her dilimin büyük boss adı (bölge temasıyla uyumlu)
export const BOSS_NAMES = [
  'Lağım Hükümdarı',
  'Alfa Kurt',
  'Goblin Kralı',
  'Kemik Lordu',
  'Bataklık Canavarı',
  'Karanlık Kont',
  'Taş Kral',
  'Kadim Ejderha',
  'Kristal Kraliçe',
  'Gök Bekçisi',
  'Kül Hükümdarı',
  'Boşluk Efendisi',
];

// Bölge dilimi sayısı — isim/tema/yaratık/arka plan dizilerinin HEPSİ bu uzunlukta olmalı.
// i18n ve ZoneScene de bunu kullanır; elle "% 8" yazmak desenkrona yol açar.
export const TIER_COUNT = CREATURE_TIERS.length;
export const STAGES_PER_TIER = 10;

export function tierIndex(stage) {
  return Math.floor((stage - 1) / STAGES_PER_TIER) % TIER_COUNT;
}

// Kaç tam tur döndük (her tur TIER_COUNT dilim = TIER_COUNT*10 bölge)
export function loopIndex(stage) {
  return Math.floor((stage - 1) / (STAGES_PER_TIER * TIER_COUNT));
}

// Tur önekleri: bölgeler başa sardıkça isimler derinleşir ("Goblin Geçidi" → "Küllü Goblin Geçidi").
// İlk tur öneksizdir; sonrasında liste döner. Her ikisi de sıfat olduğundan bölge/boss/yaratık
// adlarının hepsine takılabilir.
export const LOOP_PREFIXES = {
  // "Çürümüş" bilinçli olarak yok: bölge adı "Çürük Lağımlar" ile eşanlamlı çakışıyordu.
  tr: ['Solgun', 'Batık', 'Küllü', 'Donmuş', 'Perili', 'Gölgeli', 'Ergimiş', 'Kararmış'],
  en: ['Blighted', 'Sunken', 'Ashen', 'Frozen', 'Haunted', 'Shadowed', 'Molten', 'Darkened'],
};

export function loopPrefix(lang, stage) {
  const loop = loopIndex(stage);
  if (loop <= 0) return '';
  const list = LOOP_PREFIXES[lang] ?? LOOP_PREFIXES.en;
  return list[(loop - 1) % list.length];
}

export const withPrefix = (prefix, name) => (prefix ? `${prefix} ${name}` : name);

// Bölge dilimine göre atmosfer rengi (arena parıltısı + 3B rim ışığı)
export const ZONE_THEMES = [
  '#6fae5c', // Çürük Lağımlar
  '#6a8fbf', // Uluyan Orman
  '#7aa845', // Goblin Geçidi
  '#9a8fb0', // Kemik Çukuru
  '#8fbf3a', // Zehirli Bataklık
  '#b0506a', // Lanetli Saray
  '#c0964a', // Taş Devler Yaylası
  '#e4574b', // Ejder İni
  '#6fd8e0', // Kristal Mağaraları
  '#9fc4ff', // Gökyüzü Harabeleri
  '#d8703c', // Küller Diyarı
  '#a05cf0', // Boşluk Eşiği
];

export function zoneName(stage) {
  return ZONE_NAMES[tierIndex(stage)];
}

export function zoneTheme(stage) {
  return ZONE_THEMES[tierIndex(stage)];
}

export function creatureType(stage, seed) {
  const tier = CREATURE_TIERS[tierIndex(stage)];
  return tier[seed % tier.length];
}

export function bossName(stage) {
  return BOSS_NAMES[tierIndex(stage)];
}

// Dizi uzunlukları kayarsa yanlış bölge/boss adı sessizce gösterilir — dev'de erken uyar.
if (import.meta.env?.DEV) {
  const lens = { CREATURE_TIERS, ZONE_NAMES, BOSS_NAMES, ZONE_THEMES };
  for (const [name, arr] of Object.entries(lens)) {
    if (arr.length !== TIER_COUNT) {
      console.error(`[content] ${name} uzunluğu ${arr.length}, TIER_COUNT ${TIER_COUNT} olmalı`);
    }
  }
}
