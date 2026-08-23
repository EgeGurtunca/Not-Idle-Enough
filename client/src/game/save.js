import { AUTOSAVE_MS } from './constants.js';
import { computeOffline } from './offline.js';
import { useGameStore } from '../store/gameStore.js';
import { migrateSave, isValidSave } from './saveFormat.js';

// Kayıt tamamen tarayıcıda (localStorage) tutulur — statik hosting (GitHub Pages) için sunucu yok.
const SAVE_KEY = 'incrementaloth-save';
const LEGACY_SAVE_KEY = 'solo-fan-idle-save'; // eski isimdeki kaydı otomatik taşı
const PREV_KEY = 'incrementaloth-save-prev'; // içe aktarma/sıfırlama öncesi tek adımlık geri alma

// Üzerine yazmadan önce mevcut kaydı sakla — yanlış dosya içe aktarınca ilerleme uçmasın.
export function stashCurrentSave() {
  try {
    const cur = localStorage.getItem(SAVE_KEY);
    if (cur) localStorage.setItem(PREV_KEY, cur);
  } catch {
    /* localStorage kapalıysa geri alma da yok, oyun yine çalışır */
  }
}

export function hasPrevSave() {
  try {
    return !!localStorage.getItem(PREV_KEY);
  } catch {
    return false;
  }
}

// Saklanan kaydı geri yükler. Başarılıysa veriyi döndürür, yoksa null.
export function restorePrevSave() {
  try {
    const raw = localStorage.getItem(PREV_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const data = migrateSave(parsed?.data ?? parsed);
    if (!isValidSave(data)) return null;
    localStorage.removeItem(PREV_KEY);
    useGameStore.getState().loadSaveData(data, null);
    saveGame();
    return data;
  } catch {
    return null;
  }
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
    const data = migrateSave(parsed.data); // eski sürüm kayıtları güncel şemaya taşınır
    const offline = computeOffline(data, parsed.savedAt ?? Date.now());
    store.loadSaveData(data, offline);
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
