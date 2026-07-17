import { TICK_MS } from './constants.js';
import { useGameStore } from '../store/gameStore.js';

let intervalId = null;
let last = 0;

export function startLoop() {
  if (intervalId) return;
  last = performance.now();
  intervalId = setInterval(() => {
    const now = performance.now();
    // Sekme arka plandayken interval ~1sn'e düşer; dt'yi sınırlayıp gerçek
    // zamanı adım adım işleriz (uzun aralar çevrimdışı kazançla telafi edilir).
    const dt = Math.min((now - last) / 1000, 2);
    last = now;
    useGameStore.getState().tick(dt);
  }, TICK_MS);
}

export function stopLoop() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
