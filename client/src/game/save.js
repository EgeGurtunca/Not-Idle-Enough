import { AUTOSAVE_MS, OFFLINE_CAP_HOURS } from './constants.js';
import {
  creatureHp, creatureGold, totalDps, goldMultiplier, artifactBonuses, setRealmBoost,
} from './formulas.js';
import { useGameStore } from '../store/gameStore.js';

// Kayıt tamamen tarayıcıda (localStorage) tutulur — statik hosting (GitHub Pages) için sunucu yok.
const SAVE_KEY = 'incrementaloth-save';
const LEGACY_SAVE_KEY = 'solo-fan-idle-save'; // eski isimdeki kaydı otomatik taşı

// Çevrimdışı kazanç: mevcut stage yaratıklarını DPS ile kesme hızına göre altın
function computeOffline(data, savedAt) {
  const elapsed = Math.min(
    Math.max(0, (Date.now() - savedAt) / 1000),
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

export function loadGame() {
  const store = useGameStore.getState();
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY) ?? localStorage.getItem(LEGACY_SAVE_KEY);
  } catch {
    raw = null; // gizli mod / localStorage kapalı
  }
  if (!raw) {
    store.startFresh();
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) throw new Error('empty save');
    const offline = computeOffline(parsed.data, parsed.savedAt ?? Date.now());
    store.loadSaveData(parsed.data, offline);
  } catch (err) {
    console.error('[save] Kayıt okunamadı, taze başlanıyor:', err);
    store.startFresh();
  }
}

export function saveGame() {
  const data = useGameStore.getState().getSaveData();
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ data, savedAt: Date.now() }));
  } catch (err) {
    console.error('[save] Kayıt yazılamadı:', err);
  }
}

let autosaveId = null;

export function setupAutosave() {
  if (autosaveId) return;
  autosaveId = setInterval(saveGame, AUTOSAVE_MS);
  // Sekme kapanır/gizlenirse anında yaz (localStorage senkron olduğundan beacon gerekmez)
  const flush = () => {
    if (document.visibilityState === 'hidden') saveGame();
  };
  document.addEventListener('visibilitychange', flush);
  window.addEventListener('pagehide', saveGame);
}
