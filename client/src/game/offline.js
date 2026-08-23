// Çevrimdışı kazanç hesabı — saf: tarayıcı API'si yok, Node'dan test edilebilir.
// Ayrı dosyada olmasının sebebi: bu hesap save.js içinde gömülüyken canlı oyundan
// sessizce ayrışmıştı (yoldaş pasifleri uygulanmıyordu). Bkz. test/game.test.js
import { OFFLINE_CAP_HOURS, npcPassiveBonus } from './constants.js';
import { creatureHp, creatureGold, totalDps, goldMultiplier, artifactBonuses, setRealmBoost } from './formulas.js';

// Oyuncu yokken NPC'lerin mevcut bölgedeki yaratıkları kesme hızına göre altın.
// Canlı oyunla AYNI çarpan zinciri uygulanır: pasifler dahil.
export function computeOffline(data, savedAt, now = Date.now()) {
  const elapsed = Math.min(Math.max(0, (now - savedAt) / 1000), OFFLINE_CAP_HOURS * 3600);
  if (elapsed < 60) return null; // 1 dakikadan kısa aralar için gösterme
  setRealmBoost(data.realm ?? 1, data.essenceLevels ?? {}); // diyar çarpanı DPS/altına işlesin

  const npcLevels = data.npcLevels ?? {};
  const artifacts = data.artifacts ?? {};
  const sd = data.stardustLevels ?? {};
  const achCount = Object.keys(data.achievements ?? {}).length;
  const pb = npcPassiveBonus(npcLevels); // canlı oyunda da uygulanıyor — atlanırsa kazanç eksik çıkar

  const dps = totalDps(npcLevels, data.prestigeLevels ?? {}, artifacts, achCount, sd) * pb.dmgMult;
  if (dps <= 0) return null;

  const stage = Math.max(1, data.stage ?? 1);
  const kills = (elapsed * dps) / creatureHp(stage);
  const gold =
    kills *
    creatureGold(stage) *
    goldMultiplier(data.prestigeLevels ?? {}, data.heroUpgrades ?? {}, artifacts, achCount, sd) *
    pb.goldMult *
    (1 + artifactBonuses(artifacts).offline);
  if (!Number.isFinite(gold) || gold < 1) return null;
  return { gold, seconds: elapsed };
}
