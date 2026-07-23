import { AUTOSAVE_MS, OFFLINE_CAP_HOURS } from './constants.js';
import {
  creatureHp, creatureGold, totalDps, goldMultiplier, artifactBonuses, setRealmBoost,
} from './formulas.js';
import { useGameStore } from '../store/gameStore.js';

// Çevrimdışı kazanç: mevcut stage yaratıklarını DPS ile kesme hızına göre altın
function computeOffline(data, updatedAt) {
  const elapsed = Math.min(
    Math.max(0, (Date.now() - Date.parse(updatedAt)) / 1000),
    OFFLINE_CAP_HOURS * 3600
  );
  if (elapsed < 60) return null; // 1 dakikadan kısa aralar için gösterme
  setRealmBoost(data.realm ?? 1, data.essenceLevels ?? {}); // diyar çarpanı DPS/altına işlesin
  const artifacts = data.artifacts ?? {};
  const sd = data.stardustLevels ?? {};
  const achCount = Object.keys(data.achievements ?? {}).length;
  const dps = totalDps(data.npcLevels ?? {}, data.prestigeLevels ?? {}, artifacts, achCount, sd);
  if (dps <= 0) return null;
  const stage = Math.max(1, data.stage ?? 1);
  const kills = (elapsed * dps) / creatureHp(stage);
  const gold =
    kills *
    creatureGold(stage) *
    goldMultiplier(data.prestigeLevels ?? {}, data.heroUpgrades ?? {}, artifacts, achCount, sd) *
    (1 + artifactBonuses(artifacts).offline);
  if (gold < 1) return null;
  return { gold, seconds: elapsed };
}

// Yükleme başarısız olursa kaydetme tamamen kapatılır: aksi halde taze state,
// sunucudaki gerçek kaydın üzerine yazılabilir (autosave/beacon ile).
let saveDisabled = false;

export async function loadGame() {
  const store = useGameStore.getState();
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('/api/save');
      if (!res.ok) throw new Error(`GET /api/save ${res.status}`);
      const body = await res.json();
      if (!body || !body.data) {
        store.startFresh();
        return;
      }
      const offline = computeOffline(body.data, body.updatedAt);
      store.loadSaveData(body.data, offline);
      return;
    } catch (err) {
      if (attempt === 3) {
        saveDisabled = true;
        console.error(
          '[save] Kayıt 3 denemede yüklenemedi; sunucudaki kayıt korunsun diye ' +
            'kaydetme KAPATILDI. Sunucu çalışınca sayfayı yenile.',
          err
        );
        store.startFresh();
        return;
      }
      await new Promise((r) => setTimeout(r, 800));
    }
  }
}

export async function saveGame() {
  if (saveDisabled) return;
  const data = useGameStore.getState().getSaveData();
  try {
    await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error('[save] Kayıt başarısız:', err);
  }
}

let autosaveId = null;

export function setupAutosave() {
  if (autosaveId) return;
  autosaveId = setInterval(saveGame, AUTOSAVE_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && !saveDisabled) {
      const data = useGameStore.getState().getSaveData();
      navigator.sendBeacon(
        '/api/save',
        new Blob([JSON.stringify(data)], { type: 'application/json' })
      );
    }
  });
}
