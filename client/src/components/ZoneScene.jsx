import { useGameStore } from '../store/gameStore.js';
import { tierIndex, loopIndex } from '../game/constants.js';

// Bölgeye göre arka plan manzarası — arenayı dolduran, atmosferik SVG sahneleri (resim yok).
// Her 10 bölgede değişir. Yaratığın arkasında; ortada karartıcı vinyet ile yaratık öne çıkar.

// Her dilim: gökyüzü gradyanı (üst→alt) + uzak/yakın silüet renkleri + vurgu
const ZONES = [
  { sky: ['#2c3226', '#161810'], far: '#242a1c', near: '#12140c', accent: '#8fae5c' }, // Lağım
  { sky: ['#1c3a2f', '#0a1712'], far: '#12291f', near: '#081410', accent: '#6fbf8e' }, // Orman
  { sky: ['#4a3220', '#1a0f08', '#3a2416'], far: '#2e1c10', near: '#160c06', accent: '#e0a24a' }, // Goblin Geçidi
  { sky: ['#2c2740', '#100e18'], far: '#221d34', near: '#0e0c18', accent: '#b6a9d6' }, // Kemik Çukuru
  { sky: ['#33401a', '#12160a'], far: '#28320f', near: '#121608', accent: '#b6d63a' }, // Bataklık
  { sky: ['#331a44', '#120a1c'], far: '#281338', near: '#100a1c', accent: '#c77bea' }, // Saray
  { sky: ['#2a3556', '#0e1424'], far: '#1c2640', near: '#0c1120', accent: '#8ea6d6' }, // Dağlar
  { sky: ['#2e1512', '#0a0605', '#1e0d0a'], far: '#24100d', near: '#0e0605', accent: '#ff7a3c' }, // Ejder İni / Mağara
  { sky: ['#16323a', '#08151a'], far: '#123039', near: '#08171d', accent: '#6fd8e0' }, // Kristal Mağaraları
  { sky: ['#2a3d5e', '#101a2c'], far: '#1e2f4a', near: '#0d1524', accent: '#9fc4ff' }, // Gökyüzü Harabeleri
  { sky: ['#3a2418', '#140b06', '#2a1810'], far: '#2c1a10', near: '#140c07', accent: '#d8703c' }, // Küller Diyarı
  { sky: ['#1c1030', '#080414'], far: '#170c28', near: '#0a0616', accent: '#a05cf0' }, // Boşluk Eşiği
];

function scene(tier, z) {
  switch (tier) {
    case 0: // Lağım — tuğla tüneller
      return (
        <>
          <path fill={z.far} d="M0,80 L0,44 Q22,20 44,44 L44,80 Z M46,80 L46,50 Q66,26 86,50 L86,80 Z M88,80 L88,40 Q106,18 124,40 L124,80 Z" />
          <rect fill={z.near} x="0" y="66" width="120" height="14" />
        </>
      );
    case 1: // Orman — çamlar + sis
      return (
        <>
          <rect fill={z.accent} opacity="0.08" x="0" y="42" width="120" height="12" />
          <path fill={z.far} d="M6,66 L18,26 L30,66 Z M32,66 L48,20 L64,66 Z M66,66 L80,28 L94,66 Z M96,66 L112,22 L128,66 Z" />
          <path fill={z.near} d="M0,80 L14,40 L28,80 Z M28,80 L46,34 L64,80 Z M64,80 L82,42 L100,80 Z M100,80 L116,36 L132,80 Z" />
        </>
      );
    case 2: // Goblin Geçidi — kanyon duvarları + geçit
      return (
        <>
          <path fill={z.far} d="M0,80 L0,8 L20,30 L34,12 L44,44 L50,80 Z M70,80 L76,40 L88,10 L104,32 L120,4 L120,80 Z" />
          <path fill={z.near} d="M0,80 L0,36 L16,54 L28,42 L40,80 Z M84,80 L96,48 L110,58 L120,40 L120,80 Z" />
        </>
      );
    case 3: // Kemik Çukuru — kaburgalar + kafatası hilali
      return (
        <>
          <g fill="none" stroke={z.far} strokeWidth="4">
            <path d="M12,80 Q6,42 32,34" /><path d="M34,80 Q28,40 54,32" />
            <path d="M66,80 Q92,40 86,32" /><path d="M88,80 Q114,42 108,34" />
          </g>
          <rect fill={z.near} x="0" y="70" width="120" height="10" />
        </>
      );
    case 4: // Bataklık — sis bantları + çıplak ağaçlar
      return (
        <>
          <rect fill={z.accent} opacity="0.07" x="0" y="48" width="120" height="8" />
          <rect fill={z.accent} opacity="0.05" x="0" y="60" width="120" height="6" />
          <path fill="none" stroke={z.far} strokeWidth="3.5" d="M22,80 L20,34 M20,44 L10,36 M20,40 L32,30 M94,80 L98,32 M98,44 L110,34 M98,42 L86,32" />
          <rect fill={z.near} x="0" y="66" width="120" height="14" />
          <circle fill={z.accent} opacity="0.6" cx="54" cy="72" r="2.4" />
          <circle fill={z.accent} opacity="0.45" cx="70" cy="69" r="1.6" />
        </>
      );
    case 5: // Saray — ay + kuleler + mazgallı sur
      return (
        <>
          <circle fill={z.accent} opacity="0.32" cx="94" cy="22" r="10" />
          <g fill={z.far}>
            <rect x="8" y="24" width="20" height="56" /><path d="M6,24 L18,8 L30,24 Z" />
            <rect x="94" y="30" width="20" height="50" /><path d="M92,30 L104,14 L116,30 Z" />
          </g>
          <g fill={z.near}>
            <rect x="38" y="42" width="44" height="38" />
            <rect x="38" y="38" width="7" height="6" /><rect x="51" y="38" width="7" height="6" />
            <rect x="64" y="38" width="7" height="6" /><rect x="77" y="38" width="5" height="6" />
          </g>
        </>
      );
    case 6: // Dağlar — yıldızlar + kar tepeli zirveler
      return (
        <>
          <g fill="#ffffff" opacity="0.5">
            <circle cx="18" cy="14" r="0.8" /><circle cx="40" cy="8" r="0.6" /><circle cx="70" cy="16" r="0.9" />
            <circle cx="92" cy="10" r="0.6" /><circle cx="108" cy="20" r="0.7" /><circle cx="56" cy="12" r="0.5" />
          </g>
          <path fill={z.far} d="M0,80 L18,28 L34,54 L54,20 L74,52 L92,26 L112,54 L120,40 L120,80 Z" />
          <path fill="#eef0f6" opacity="0.55" d="M46,34 L54,20 L62,34 L57,31 L51,35 Z M84,40 L92,26 L100,40 L95,36 L88,38 Z" />
          <path fill={z.near} d="M0,80 L24,48 L46,62 L64,42 L88,62 L106,46 L120,60 L120,80 Z" />
        </>
      );
    case 7: // Mağara / Ejder İni — stalaktit + stalagmit + lav
      return (
        <>
          <path fill={z.near} d="M0,0 L0,20 L10,4 L18,24 L28,5 L38,26 L50,4 L62,24 L74,3 L86,26 L98,5 L108,22 L120,4 L120,0 Z" />
          <path fill={z.far} d="M0,80 L0,58 L12,74 L24,54 L38,74 L52,56 L66,78 L80,56 L94,74 L106,58 L120,74 L120,80 Z" />
          <ellipse fill={z.accent} opacity="0.55" cx="60" cy="80" rx="70" ry="10" />
          <ellipse fill="#ffd27a" opacity="0.4" cx="60" cy="80" rx="42" ry="5" />
        </>
      );
    case 8: // Kristal Mağaraları — tavandan ve tabandan kristal sütunlar, parıltı
      return (
        <>
          <g fill={z.far}>
            <path d="M0,0 L6,26 L14,0 Z M20,0 L28,34 L36,0 Z M48,0 L54,22 L62,0 Z M76,0 L84,30 L92,0 Z M104,0 L110,24 L118,0 Z" />
          </g>
          <g fill={z.accent} opacity="0.5">
            <path d="M10,80 L16,44 L22,80 Z M40,80 L48,38 L56,80 Z M70,80 L76,50 L82,80 Z M94,80 L102,42 L110,80 Z" />
          </g>
          <g fill={z.near}>
            <path d="M0,80 L0,66 L18,58 L38,68 L58,56 L80,66 L104,58 L120,68 L120,80 Z" />
          </g>
          <g fill="#ffffff" opacity="0.55">
            <circle cx="48" cy="40" r="1.2" /><circle cx="102" cy="45" r="1" /><circle cx="16" cy="47" r="0.9" />
          </g>
        </>
      );
    case 9: // Gökyüzü Harabeleri — bulutlar, yüzen adalar, kırık sütunlar
      return (
        <>
          <g fill={z.accent} opacity="0.16">
            <ellipse cx="24" cy="20" rx="20" ry="6" /><ellipse cx="88" cy="14" rx="24" ry="5" />
            <ellipse cx="58" cy="30" rx="16" ry="4" />
          </g>
          <g fill={z.far}>
            <path d="M8,44 L34,44 L28,54 L14,54 Z" />
            <path d="M74,38 L106,38 L100,50 L80,50 Z" />
            <rect x="14" y="30" width="4" height="14" /><rect x="24" y="26" width="4" height="18" />
            <rect x="84" y="22" width="4" height="16" /><rect x="94" y="27" width="4" height="11" />
          </g>
          <path fill={z.near} d="M0,80 L0,62 L22,56 L46,64 L70,54 L96,62 L120,56 L120,80 Z" />
        </>
      );
    case 10: // Küller Diyarı — kül tepeleri, yanan çatlaklar, düşen korlar
      return (
        <>
          <path fill={z.far} d="M0,80 L0,50 L20,40 L42,52 L64,38 L88,50 L108,42 L120,52 L120,80 Z" />
          <g stroke={z.accent} strokeWidth="1.6" opacity="0.75" fill="none">
            <path d="M12,74 L22,64 L30,70" /><path d="M52,76 L62,66 L72,72" /><path d="M88,74 L96,66 L106,71" />
          </g>
          <path fill={z.near} d="M0,80 L0,66 L26,60 L54,68 L82,60 L110,66 L120,62 L120,80 Z" />
          <g fill="#ffc25e" opacity="0.6">
            <circle cx="30" cy="28" r="1" /><circle cx="66" cy="20" r="0.8" /><circle cx="96" cy="32" r="1.1" />
            <circle cx="14" cy="36" r="0.7" /><circle cx="80" cy="40" r="0.9" />
          </g>
        </>
      );
    case 11: // Boşluk Eşiği — yarık, yüzen enkaz, yıldızsız karanlık
      return (
        <>
          <ellipse cx="60" cy="36" rx="26" ry="30" fill={z.accent} opacity="0.16" />
          <ellipse cx="60" cy="36" rx="15" ry="20" fill={z.accent} opacity="0.26" />
          <ellipse cx="60" cy="36" rx="6" ry="11" fill="#0a0616" />
          <g fill={z.far}>
            <path d="M18,30 L26,26 L30,34 L20,38 Z" /><path d="M92,22 L102,20 L104,29 L94,31 Z" />
            <path d="M34,54 L42,50 L46,58 L36,60 Z" /><path d="M84,52 L94,49 L96,57 L86,59 Z" />
          </g>
          <path fill={z.near} d="M0,80 L0,64 L24,70 L50,62 L74,70 L98,62 L120,68 L120,80 Z" />
        </>
      );
    default:
      return null;
  }
}

export default function ZoneScene({ stage }) {
  const tier = tierIndex(stage);
  const loop = loopIndex(stage);
  const realm = useGameStore((s) => s.realm);
  const z = ZONES[tier];
  const sky = z.sky;
  // Her diyar aynı manzarayı başka bir renk evreninde gösterir; her tam tur da
  // atmosferi biraz daha kaydırıp soldurur — aynı sahne derinleştikçe yabancılaşır.
  const hue = (realm - 1) * 45 + loop * 18;
  const filter =
    hue || loop
      ? `hue-rotate(${hue}deg) saturate(${Math.max(0.55, 1 - loop * 0.06)}) brightness(${Math.max(0.7, 1 - loop * 0.04)})`
      : undefined;
  return (
    <div className="zone-scene" key={`${tier}-${loop}`} style={filter ? { filter } : undefined}>
      <svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id={`sky${tier}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky[0]} />
            {sky[2] && <stop offset="60%" stopColor={sky[2]} />}
            <stop offset="100%" stopColor={sky[1]} />
          </linearGradient>
          {/* ortada karartma: yaratık ve yazılar öne çıksın */}
          <radialGradient id={`vig${tier}`} cx="50%" cy="46%" r="55%">
            <stop offset="0%" stopColor="#08060e" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#08060e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#08060e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="0" y="0" width="120" height="80" fill={`url(#sky${tier})`} />
        {scene(tier, z)}
        <rect x="0" y="0" width="120" height="80" fill={`url(#vig${tier})`} />
      </svg>
    </div>
  );
}
