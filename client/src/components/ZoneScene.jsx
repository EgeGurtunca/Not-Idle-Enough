// Bölgeye göre arka plan manzarası — arenayı dolduran, atmosferik SVG sahneleri (resim yok).
// Her 10 bölgede değişir. Yaratığın arkasında; ortada karartıcı vinyet ile yaratık öne çıkar.
const tierOf = (stage) => Math.floor((stage - 1) / 10) % 8;

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
    default:
      return null;
  }
}

export default function ZoneScene({ stage }) {
  const tier = tierOf(stage);
  const z = ZONES[tier];
  const sky = z.sky;
  return (
    <div className="zone-scene" key={tier}>
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
