// Oyun matematiği ve içerik değişmezleri. Bağımlılık yok: node --test ile çalışır.
// Buradaki testler elle yakalanmış gerçek hataların nöbetçisi:
//  - tier dizilerinin desenkronu (isim/tema/yaratık kayması)
//  - Bölge ~1690'da sayıların Infinity'ye taşması
//  - artifact id çakışması
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  TIER_COUNT, STAGES_PER_TIER, tierIndex, loopIndex, loopPrefix, withPrefix,
  CREATURE_TIERS, ZONE_NAMES, BOSS_NAMES, ZONE_THEMES,
  ARTIFACTS, REALM_ARTIFACTS, ALL_ARTIFACTS,
  REALM_CEILING, REALM_STAGE, TRANSCEND_STAGE, PRESTIGE_STAGE,
  ESSENCE_THRESHOLD, rollCreatureAffix, CREATURE_AFFIXES,
} from '../src/game/constants.js';
import {
  creatureHp, creatureGold, bossHp, bossGold, crystalGain, transcendGain,
  essenceGain, stageLeap, keptStardust, rarityOdds, milestoneEvery,
} from '../src/game/formulas.js';
import { SAVE_VERSION, isValidSave, migrateSave } from '../src/game/saveFormat.js';

test('içerik dizileri aynı uzunlukta (tier desenkronu olmasın)', () => {
  for (const [name, arr] of Object.entries({ CREATURE_TIERS, ZONE_NAMES, BOSS_NAMES, ZONE_THEMES })) {
    assert.equal(arr.length, TIER_COUNT, `${name} uzunluğu TIER_COUNT olmalı`);
  }
});

test('her dilimde yaratık var ve tüm id\'ler benzersiz', () => {
  const all = CREATURE_TIERS.flat();
  for (const tier of CREATURE_TIERS) assert.ok(tier.length > 0);
  assert.equal(new Set(all.map((c) => c.id)).size, all.length, 'yaratık id çakışması');
  for (const c of all) assert.ok(c.look?.arch, `${c.id} için look.arch eksik`);
});

test('artifact id\'leri iki havuz arasında çakışmıyor', () => {
  assert.equal(ALL_ARTIFACTS.length, ARTIFACTS.length + REALM_ARTIFACTS.length);
  assert.equal(new Set(ALL_ARTIFACTS.map((a) => a.id)).size, ALL_ARTIFACTS.length);
});

test('tierIndex / loopIndex sınırları', () => {
  const perLoop = STAGES_PER_TIER * TIER_COUNT;
  assert.equal(tierIndex(1), 0);
  assert.equal(tierIndex(STAGES_PER_TIER), 0);
  assert.equal(tierIndex(STAGES_PER_TIER + 1), 1);
  assert.equal(tierIndex(perLoop), TIER_COUNT - 1);
  assert.equal(tierIndex(perLoop + 1), 0, 'tur başına sarmalı');
  assert.equal(loopIndex(1), 0);
  assert.equal(loopIndex(perLoop), 0);
  assert.equal(loopIndex(perLoop + 1), 1);
});

test('tur öneki: ilk tur öneksiz, sonrası önekli ve iki dilde de dolu', () => {
  const perLoop = STAGES_PER_TIER * TIER_COUNT;
  assert.equal(loopPrefix('tr', 1), '');
  assert.equal(loopPrefix('en', perLoop), '');
  for (const lang of ['tr', 'en']) {
    const p = loopPrefix(lang, perLoop + 1);
    assert.ok(p.length > 0, `${lang} 1. turda önek olmalı`);
    assert.equal(withPrefix(p, 'X'), `${p} X`);
  }
  assert.equal(withPrefix('', 'X'), 'X');
});

test('KRİTİK: diyar tavanında sayılar taşmıyor (Bölge ~1690 Infinity oluyordu)', () => {
  for (const fn of [creatureHp, creatureGold, bossHp, bossGold]) {
    const v = fn(REALM_CEILING);
    assert.ok(Number.isFinite(v), `${fn.name}(${REALM_CEILING}) sonlu olmalı, ${v} geldi`);
    assert.ok(v > 0);
  }
  // tavanın hemen üstü zaten oynanamaz; asıl garanti tavanda emniyet payı olması
  assert.ok(REALM_CEILING < 1690, 'tavan taşma noktasının altında kalmalı');
});

test('HP ve altın bölgeyle birlikte kesintisiz artar', () => {
  let prevHp = 0;
  for (const s of [1, 50, 99, 100, 101, 250, 500, 1000, REALM_CEILING]) {
    const hp = creatureHp(s);
    assert.ok(Number.isFinite(hp) && hp > prevHp, `Bölge ${s} HP artmalı`);
    assert.ok(creatureGold(s) > 0);
    prevHp = hp;
  }
});

test('katman kazançları eşiklerin altında sıfır', () => {
  assert.equal(crystalGain(PRESTIGE_STAGE - 1, {}, {}), 0);
  assert.ok(crystalGain(PRESTIGE_STAGE, {}, {}) > 0);
  assert.equal(transcendGain(0), 0);
  assert.equal(essenceGain(ESSENCE_THRESHOLD - 1), 0);
  assert.ok(essenceGain(ESSENCE_THRESHOLD) > 0);
  assert.ok(REALM_STAGE > TRANSCEND_STAGE && TRANSCEND_STAGE > PRESTIGE_STAGE, 'katman sırası');
});

test('Bölge Sıçraması eşikleri ve seviye sınırı', () => {
  assert.equal(stageLeap(1e5, 5), 0, '10^10 altında atlama yok');
  assert.equal(stageLeap(1e10, 5), 1);
  assert.equal(stageLeap(1e15, 5), 2);
  assert.equal(stageLeap(1e20, 2), 2, 'seviye üst sınırı');
  assert.equal(stageLeap(1e20, 0), 0, 'upgrade alınmadıysa atlama yok');
});

test('Öz Hafızası korunan tozu doğru hesaplar', () => {
  assert.equal(keptStardust(1000, {}), 0);
  assert.equal(keptStardust(1000, { ozHafizasi: 3 }), 300);
  assert.equal(keptStardust(1000, { ozHafizasi: 5 }), 500);
});

test('Yıldız Yarığı kilometre taşı aralığını daraltır', () => {
  const base = milestoneEvery({});
  assert.ok(base > milestoneEvery({ yildizYarigi: 3 }), 'yarık aralığı düşürmeli');
});

test('çekiliş oranları %100\'e normalize olur, sahip olunanlar havuzdan düşer', () => {
  const odds = rarityOdds({}, ARTIFACTS);
  const total = odds.reduce((n, o) => n + o.chance, 0);
  assert.ok(Math.abs(total - 100) < 1e-9, `toplam %100 olmalı, ${total} geldi`);
  // tüm sıradanlar alınınca o rarity havuzdan çıkar
  const owned = {};
  for (const a of ARTIFACTS.filter((x) => x.rarity === 'siradan')) owned[a.id] = 1;
  const odds2 = rarityOdds(owned, ARTIFACTS);
  assert.ok(!odds2.some((o) => o.id === 'siradan'), 'biten rarity listede kalmamalı');
  assert.ok(Math.abs(odds2.reduce((n, o) => n + o.chance, 0) - 100) < 1e-9);
});

const iyiKayit = { gold: 100, stage: 5, highestStage: 12, npcLevels: { okcu: 3 }, artifacts: {} };

test('kayıt doğrulama: bozuk/yabancı dosyalar reddedilir', () => {
  assert.ok(isValidSave(iyiKayit));
  assert.ok(isValidSave({ gold: 0, stage: 1 }), 'asgari alanlar yeterli');
  for (const kotu of [
    null, undefined, 42, 'kayit', [], [iyiKayit],
    { gold: 'x', stage: 1 },
    { gold: 1 },                                  // stage yok
    { gold: -5, stage: 1 },                       // negatif altın
    { gold: 1, stage: 0 },                        // geçersiz bölge
    { gold: 1, stage: 1, npcLevels: [] },         // harita yerine dizi
    { gold: 1, stage: 1, highestStage: 'çok' },
    { gold: NaN, stage: 1 },
  ]) {
    assert.equal(isValidSave(kotu), false, `reddedilmeliydi: ${JSON.stringify(kotu)}`);
  }
});

test('göç: sürümsüz eski kayıt güncel şemaya taşınır, ilerleme korunur', () => {
  const eski = { gold: 999, stage: 40, highestStage: 120, npcLevels: { okcu: 7 }, artifacts: { pasliKilic: 2 } };
  const yeni = migrateSave(eski);
  assert.equal(yeni.version, SAVE_VERSION);
  assert.equal(yeni.gold, 999, 'ilerleme kaybolmamalı');
  assert.equal(yeni.npcLevels.okcu, 7);
  assert.equal(yeni.artifacts.pasliKilic, 2);
  // diyar katmanı alanları taban değerlerle doldurulmalı
  assert.equal(yeni.realm, 1);
  assert.equal(yeni.essence, 0);
  assert.deepEqual(yeni.essenceLevels, {});
  assert.equal(yeni.totalRealmPulls, 0);
  assert.ok(isValidSave(yeni));
});

test('göç: güncel kayıt değişmez, ileri sürüm bozulmaz', () => {
  const guncel = { ...iyiKayit, version: SAVE_VERSION, realm: 3, essence: 250 };
  const g = migrateSave(guncel);
  assert.equal(g.realm, 3);
  assert.equal(g.essence, 250);
  assert.equal(g.version, SAVE_VERSION);
  // gelecekten gelen kayıt: dokunma, düşürme
  const ileri = { ...iyiKayit, version: SAVE_VERSION + 5, realm: 9 };
  assert.equal(migrateSave(ileri).version, SAVE_VERSION + 5);
  assert.equal(migrateSave(ileri).realm, 9);
});

test('yaratık sıfatları ilk turda çıkmaz, derinlikte tavanlanır', () => {
  const perLoop = STAGES_PER_TIER * TIER_COUNT;
  for (let i = 0; i < 500; i++) {
    assert.equal(rollCreatureAffix(1), null);
    assert.equal(rollCreatureAffix(perLoop), null, 'ilk tur bitene kadar sıfat yok');
  }
  const n = 4000;
  let hit = 0;
  for (let i = 0; i < n; i++) if (rollCreatureAffix(perLoop * 8)) hit++;
  const rate = hit / n;
  assert.ok(rate > 0.15 && rate <= 0.30, `derin turda oran ~%25 olmalı, %${(rate * 100).toFixed(1)} geldi`);
  for (const a of CREATURE_AFFIXES) {
    assert.ok(a.goldMult > 0 && a.hpMult > 0 && a.dpsMult > 0, `${a.id} çarpanları pozitif olmalı`);
  }
});
