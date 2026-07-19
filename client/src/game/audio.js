// Sentetik ses efektleri: dosya yok, Web Audio osilatörleri.
// İlk kullanıcı jestinde resume edilir; setMuted ile susturulur.
let ctx = null;
let master = null;
let muted = false;
let lastHit = 0;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return true;
}

export function setMuted(m) {
  muted = m;
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
  hit() {
    const now = performance.now();
    if (now - lastHit < 45) return; // hızlı tıklamada ses spam'ini kıs
    lastHit = now;
    tone(150 + Math.random() * 70, { type: 'square', dur: 0.06, vol: 0.45, slide: -80 });
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
