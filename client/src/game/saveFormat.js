// Kayıt biçimi: sürüm, doğrulama ve göç. Tarayıcı API'si kullanmaz — saf ve test edilebilir.
// save.js (localStorage) ve Ayarlar (içe aktarma) buradan geçer.

export const SAVE_VERSION = 1;

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isFiniteNum = (v) => typeof v === 'number' && Number.isFinite(v);

// Bozuk/yabancı bir dosyanın iyi kaydın üstüne yazmasını engeller.
// Fazla katı olmamalı: eski kayıtlarda yeni alanlar yok, onlar loadSaveData'da varsayılanlanır.
export function isValidSave(data) {
  if (!isPlainObject(data)) return false;
  if (!isFiniteNum(data.gold) || data.gold < 0) return false;
  if (!isFiniteNum(data.stage) || data.stage < 1) return false;
  // highestStage eski kayıtlarda olmayabilir; varsa tutarlı olmalı
  if (data.highestStage !== undefined && (!isFiniteNum(data.highestStage) || data.highestStage < 1)) return false;
  // ilerlemenin taşıyıcısı olan haritalar nesne olmalı (dizi/JSON çöpü değil)
  for (const key of ['heroUpgrades', 'npcLevels', 'prestigeLevels', 'artifacts', 'stardustLevels', 'essenceLevels', 'achievements', 'milestones']) {
    if (data[key] !== undefined && !isPlainObject(data[key])) return false;
  }
  return true;
}

// Sürüm sürüm yükseltme. Her adım bir öncekinin çıktısını alır.
// v0 = sürüm alanı olmayan eski kayıtlar (Solo Fan Idle dönemi).
const MIGRATIONS = {
  // v0 -> v1: diyar katmanı alanları eklendi; eksikse taban değerlerle doldur.
  0: (d) => ({
    ...d,
    realm: isFiniteNum(d.realm) ? d.realm : 1,
    essence: isFiniteNum(d.essence) ? d.essence : 0,
    essenceLevels: isPlainObject(d.essenceLevels) ? d.essenceLevels : {},
    totalRealmPulls: isFiniteNum(d.totalRealmPulls) ? d.totalRealmPulls : 0,
  }),
};

// Eski kaydı güncel sürüme taşır. Bilinmeyen (daha yeni) sürüm gelirse dokunmaz —
// ileri sürümü bozmaktansa olduğu gibi bırakmak daha güvenli.
export function migrateSave(data) {
  if (!isPlainObject(data)) return data;
  let out = data;
  let v = isFiniteNum(out.version) ? out.version : 0;
  while (v < SAVE_VERSION && MIGRATIONS[v]) {
    out = MIGRATIONS[v](out);
    v += 1;
  }
  return { ...out, version: Math.max(v, isFiniteNum(out.version) ? out.version : 0) };
}
