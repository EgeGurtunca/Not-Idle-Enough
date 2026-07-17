// ---- Temel denge sabitleri ----
export const TICK_MS = 100;
export const KILLS_PER_STAGE = 10; // boss gelmeden önce kesilecek yaratık sayısı
export const BOSS_TIME_BASE = 30; // saniye
export const PRESTIGE_STAGE = 100; // prestijin açıldığı stage
export const MAX_STAGE = 500; // son bölge
export const OFFLINE_CAP_HOURS = 10;
export const AUTOSAVE_MS = 20000;

// Yaratık
export const CREATURE_BASE_HP = 10;
export const HP_GROWTH = 1.5; // her stage HP çarpanı
export const GOLD_DIVISOR = 6; // altın = HP / 6
export const MINIBOSS_HP_MULT = 10;
export const MINIBOSS_GOLD_MULT = 13;
export const BOSS_HP_MULT = 24;
export const BOSS_GOLD_MULT = 34;

// Kahraman (klik)
export const HERO_BASE_COST = 4;
export const HERO_COST_GROWTH = 1.14;
export const MILESTONE_EVERY = 20; // her 20 seviyede hasar x2
export const MILESTONE_MULT = 2;

// NPC seviye maliyeti: unlockCost * NPC_LEVEL_COST_FACTOR * NPC_COST_GROWTH^seviye
export const NPC_LEVEL_COST_FACTOR = 0.075;
export const NPC_COST_GROWTH = 1.12;

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

// ---- NPC'ler (Yoldaşlar) ----
export const NPCS = [
  { id: 'okcu',      name: 'Okçu',            emoji: '🏹', unlockCost: 50,      baseDps: 4 },
  { id: 'sovalye',   name: 'Şövalye',         emoji: '🛡️', unlockCost: 1.2e3,   baseDps: 90 },
  { id: 'buyucu',    name: 'Büyücü',          emoji: '🧙', unlockCost: 3e4,     baseDps: 2e3 },
  { id: 'haydut',    name: 'Haydut',          emoji: '🗡️', unlockCost: 7.5e5,   baseDps: 4.5e4 },
  { id: 'rahip',     name: 'Savaş Rahibi',    emoji: '⚒️', unlockCost: 2e7,     baseDps: 1e6 },
  { id: 'ejderavci', name: 'Ejderha Avcısı',  emoji: '⚔️', unlockCost: 5e8,     baseDps: 2.2e7 },
  { id: 'suikastci', name: 'Gölge Suikastçı', emoji: '🥷', unlockCost: 1.2e10,  baseDps: 5e8 },
  { id: 'firtina',   name: 'Fırtına Çağırıcı',emoji: '🌩️', unlockCost: 3e11,    baseDps: 1.1e10 },
  { id: 'ates',      name: 'Ateş Dansçısı',   emoji: '🔥', unlockCost: 8e12,    baseDps: 2.6e11 },
  { id: 'buz',       name: 'Buz Kraliçesi',   emoji: '❄️', unlockCost: 2e14,    baseDps: 6e12 },
  { id: 'ent',       name: 'Kadim Ent',       emoji: '🌳', unlockCost: 5e15,    baseDps: 1.4e14 },
  { id: 'zaman',     name: 'Zaman Bekçisi',   emoji: '⏳', unlockCost: 1.2e17,  baseDps: 3.2e15 },
];

// ---- Prestij (kristal) upgrade'leri ----
export const PRESTIGE_UPGRADES = [
  {
    id: 'keskinVurus', name: 'Keskin Vuruş', emoji: '💥',
    desc: 'Klik hasarı +%25 (seviye başına)',
    baseCost: 10, costGrowth: 2, maxLevel: Infinity,
  },
  {
    id: 'komutanlik', name: 'Komutanlık', emoji: '🚩',
    desc: 'NPC hasarı +%25 (seviye başına)',
    baseCost: 10, costGrowth: 2, maxLevel: Infinity,
  },
  {
    id: 'altinDokunus', name: 'Altın Dokunuş', emoji: '🪙',
    desc: 'Altın kazancı +%20 (seviye başına)',
    baseCost: 15, costGrowth: 2, maxLevel: Infinity,
  },
  {
    id: 'zamanBukucu', name: 'Zaman Bükücü', emoji: '⏱️',
    desc: 'Boss süresi +2 saniye (seviye başına)',
    baseCost: 25, costGrowth: 3, maxLevel: 5,
  },
  {
    id: 'hazirBaslangic', name: 'Hazır Başlangıç', emoji: '🎒',
    desc: 'Her yeni maceraya altınla başla (1000 × 10^(sv−1))',
    baseCost: 10, costGrowth: 2, maxLevel: 10,
  },
];

// ---- Artifact sistemi ----
export const PULL_COST_BASE = 20; // ilk sandık fiyatı (kristal)
export const PULL_COST_GROWTH = 1.02; // her çekilişte fiyat çarpanı
export const ARTIFACT_MAX_LEVEL = 10; // kopyalar seviye atlatır

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
  { id: 'pasliKilic',    name: 'Paslı Kılıç',          emoji: '🗡️', rarity: 'siradan', effect: 'click',      value: 0.10 },
  { id: 'tahtaKalkan',   name: 'Tahta Kalkan',         emoji: '🛡️', rarity: 'siradan', effect: 'dps',        value: 0.10 },
  { id: 'bakirYuzuk',    name: 'Bakır Yüzük',          emoji: '💍', rarity: 'siradan', effect: 'gold',       value: 0.08 },
  { id: 'sansliZar',     name: 'Şanslı Zar',           emoji: '🎲', rarity: 'siradan', effect: 'critChance', value: 0.01 },
  { id: 'deriEldiven',   name: 'Deri Eldiven',         emoji: '🧤', rarity: 'siradan', effect: 'click',      value: 0.12 },
  { id: 'demirTilsim',   name: 'Demir Tılsım',         emoji: '🧿', rarity: 'siradan', effect: 'dps',        value: 0.12 },
  { id: 'kirikKumSaati', name: 'Kırık Kum Saati',      emoji: '⌛', rarity: 'siradan', effect: 'bossTime',   value: 1 },
  { id: 'eskiHarita',    name: 'Yıpranmış Harita',     emoji: '🗺️', rarity: 'siradan', effect: 'gold',       value: 0.10 },
  { id: 'kemikKolye',    name: 'Kemik Kolye',          emoji: '📿', rarity: 'siradan', effect: 'critMult',   value: 0.05 },
  { id: 'camKure',       name: 'Cam Küre',             emoji: '🔮', rarity: 'siradan', effect: 'offline',    value: 0.20 },
  // --- Olağandışı (8) ---
  { id: 'gumusPala',     name: 'Gümüş Pala',           emoji: '⚔️', rarity: 'olagandisi', effect: 'click',      value: 0.25 },
  { id: 'savasBorusu',   name: 'Savaş Borusu',         emoji: '📯', rarity: 'olagandisi', effect: 'dps',        value: 0.25 },
  { id: 'altinKese',     name: 'Altın Kese',           emoji: '👛', rarity: 'olagandisi', effect: 'gold',       value: 0.20 },
  { id: 'nisanDurbunu',  name: 'Nişancı Dürbünü',      emoji: '🔭', rarity: 'olagandisi', effect: 'critChance', value: 0.02 },
  { id: 'zumrutYuzuk',   name: 'Zümrüt Yüzük',         emoji: '💚', rarity: 'olagandisi', effect: 'critMult',   value: 0.15 },
  { id: 'kumSaati',      name: 'Kum Saati',            emoji: '⏳', rarity: 'olagandisi', effect: 'bossTime',   value: 2 },
  { id: 'miknatisEld',   name: 'Mıknatıs Eldiven',     emoji: '🧲', rarity: 'olagandisi', effect: 'gold',       value: 0.25 },
  { id: 'geceFeneri',    name: 'Gece Feneri',          emoji: '🏮', rarity: 'olagandisi', effect: 'offline',    value: 0.40 },
  // --- Nadir (6) ---
  { id: 'ejderDisi',     name: 'Ejder Dişi Hançer',    emoji: '🔪', rarity: 'nadir', effect: 'click',      value: 0.60 },
  { id: 'kadimSancak',   name: 'Kadim Sancak',         emoji: '🚩', rarity: 'nadir', effect: 'dps',        value: 0.60 },
  { id: 'midasEli',      name: 'Midas Eli',            emoji: '✋', rarity: 'nadir', effect: 'gold',       value: 0.50 },
  { id: 'suikastGozu',   name: 'Suikastçı Gözü',       emoji: '👁️', rarity: 'nadir', effect: 'critChance', value: 0.04 },
  { id: 'kanliYakut',    name: 'Kanlı Yakut',          emoji: '🩸', rarity: 'nadir', effect: 'critMult',   value: 0.40 },
  { id: 'yildizPusula',  name: 'Yıldız Pusulası',      emoji: '🧭', rarity: 'nadir', effect: 'crystal',    value: 0.10 },
  // --- Epik (4) ---
  { id: 'titanYumrugu',  name: 'Titan Yumruğu',        emoji: '🥊', rarity: 'epik', effect: 'click',   value: 1.50 },
  { id: 'orduNisani',    name: 'Ordu Nişanı',          emoji: '🎖️', rarity: 'epik', effect: 'dps',     value: 1.50 },
  { id: 'ejderHazinesi', name: 'Ejderha Hazinesi',     emoji: '🐲', rarity: 'epik', effect: 'gold',    value: 1.20 },
  { id: 'zamanKristali', name: 'Zaman Kristali',       emoji: '💠', rarity: 'epik', effect: 'crystal', value: 0.20 },
  // --- Efsanevi (2) ---
  { id: 'tanriKatili',   name: 'Tanrı Katili Kılıcı',  emoji: '⚡', rarity: 'efsanevi', effect: 'click', value: 5.00 },
  { id: 'ejderKalbi',    name: 'Kadim Ejder Kalbi',    emoji: '❤️‍🔥', rarity: 'efsanevi', effect: 'dps',   value: 5.00 },
];

// ---- Görseller ----
// Her 10 stage'lik dilim için yaratık seti; dilimler biterse baştan döner.
export const CREATURE_TIERS = [
  ['🐀', '🦇', '🐍'],
  ['🐺', '🐗', '🕷️'],
  ['👺', '🧌', '🦊'],
  ['💀', '🧟', '👻'],
  ['🦂', '🦎', '🐊'],
  ['🧛', '🧜', '🧞'],
  ['👹', '🗿', '🦅'],
  ['🐉', '🐲', '🦖'],
];

export const MINIBOSS_EMOJIS = ['🐗', '🐺', '🧌', '💀', '🐊', '🧛', '🗿', '🐲'];

export const ZONE_NAMES = [
  'Çürük Lağımlar',
  'Uluyan Orman',
  'Goblin Geçidi',
  'Kemik Çukuru',
  'Zehirli Bataklık',
  'Lanetli Saray',
  'Taş Devler Yaylası',
  'Ejder İni',
];

export function zoneName(stage) {
  return ZONE_NAMES[Math.floor((stage - 1) / 10) % ZONE_NAMES.length];
}

export const BOSS_EMOJIS = ['👹', '🐉', '😈', '💀', '🐲', '🦖', '👿', '🧟', '🗿', '🧛'];

export function creatureEmoji(stage, seed) {
  const tier = CREATURE_TIERS[Math.floor((stage - 1) / 10) % CREATURE_TIERS.length];
  return tier[seed % tier.length];
}

export function minibossEmoji(stage) {
  return MINIBOSS_EMOJIS[Math.floor((stage - 1) / 10) % MINIBOSS_EMOJIS.length];
}

export function bossEmoji(stage) {
  return BOSS_EMOJIS[(Math.floor(stage / 10) - 1) % BOSS_EMOJIS.length];
}
