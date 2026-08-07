// Sentetik ses efektleri: dosya yok, Web Audio osilatörleri.
// İlk kullanıcı jestinde resume edilir; setMuted ile susturulur.
let ctx = null;
let master = null;
let muted = false;
let lastHit = 0;
let volume = 1; // kullanıcı seviyesi 0..1; BASE_GAIN ile çarpılır

const BASE_GAIN = 0.22; // referans yükseklik (volume = 1 iken)

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = BASE_GAIN * volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

export function setMuted(m) {
  muted = m;
}

// 0..1 arası; kayda yazılır. Kısa bir rampa ile uygulanır ki tık sesi çıkmasın.
export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (master && ctx) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(BASE_GAIN * volume, ctx.currentTime, 0.02);
  }
}

function tone(freq, { type = 'square', dur = 0.08, vol = 1, slide = 0, delay = 0 } = {}) {
  if (muted || !ensure()) return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function arp(freqs, { type = 'triangle', dur = 0.15, vol = 0.5, step = 0.1 } = {}) {
  freqs.forEach((f, i) => tone(f, { type, dur, vol, delay: i * step }));
}

export const sfx = {
  // Kombo yükseldikçe perde de yükselir: hızlı tıklama duyulur hâle gelir.
  // Yarım oktava kadar (maks komboda ×1.5) çıkar, sonra sabitlenir.
  hit(combo = 0) {
    const now = performance.now();
    if (now - lastHit < 45) return; // hızlı tıklamada ses spam'ini kıs
    lastHit = now;
    const step = Math.min(combo, 50) / 50;
    const base = (150 + Math.random() * 70) * (1 + step * 0.5);
    tone(base, { type: 'square', dur: 0.06, vol: 0.45, slide: -80 });
  },
  crit() {
    tone(300, { type: 'sawtooth', dur: 0.13, vol: 0.6, slide: -170 });
    tone(520, { type: 'square', dur: 0.09, vol: 0.35 });
  },
  kill() {
    tone(620, { type: 'triangle', dur: 0.08, vol: 0.3, slide: 200 });
  },
  boss() {
    tone(85, { type: 'sawtooth', dur: 0.55, vol: 0.75, slide: -35 });
    tone(140, { type: 'square', dur: 0.4, vol: 0.35, slide: -60 });
  },
  bossWin() {
    arp([440, 554, 659], { dur: 0.15, vol: 0.45, step: 0.09 });
  },
  bossFail() {
    tone(220, { type: 'sawtooth', dur: 0.45, vol: 0.5, slide: -160 });
  },
  chest() {
    arp([300, 380, 460, 540], { type: 'square', dur: 0.07, vol: 0.3, step: 0.07 });
  },
  reveal() {
    arp([523, 659, 784], { dur: 0.16, vol: 0.5, step: 0.1 });
  },
  skill() {
    tone(480, { type: 'square', dur: 0.16, vol: 0.5, slide: 320 });
  },
  buy() {
    tone(700, { type: 'triangle', dur: 0.06, vol: 0.25, slide: 150 });
  },
  achievement() {
    arp([392, 523, 659, 784], { dur: 0.18, vol: 0.5, step: 0.11 });
  },
  prestige() {
    arp([262, 330, 392, 523, 659], { dur: 0.2, vol: 0.5, step: 0.12 });
  },
};
