import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CREATURE_TYPES, zoneTheme, loopIndex } from '../game/constants.js';

// Deterministik RNG: aynı düşman hep aynı görünür
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function disposeGroup(group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
  });
}

// Yaratık türünün "arch" bayrağı hangi gövde planını çizeceğimizi belirler.
// Her plan; gövde, kafa, uzuvlar ve türe özel eklentileri (boynuz/kanat/kuyruk…) kurar.
function buildCreature(enemy, loop = 0) {
  const look = CREATURE_TYPES[enemy.typeId]?.look ?? {};
  const rand = mulberry32(enemy.id * 9301 + 49297);
  const isBoss = enemy.kind === 'boss';
  const isBig = isBoss && enemy.big;

  const base = new THREE.Color(look.color ?? '#8a7f72');
  // Tur derinleştikçe aynı tür yabancılaşır: ton kayar, doygunluk düşer, karanlıklaşır.
  if (loop > 0) {
    const hsl = {};
    base.getHSL(hsl);
    base.setHSL(
      (hsl.h + loop * 0.055) % 1,
      Math.max(0.08, hsl.s * (1 - loop * 0.07)),
      Math.max(0.12, hsl.l * (1 - loop * 0.05))
    );
  }
  if (isBig) base.lerp(new THREE.Color('#c8342a'), 0.32);
  else if (isBoss) base.lerp(new THREE.Color('#3a2e52'), 0.22);
  const dark = base.clone().multiplyScalar(0.55);
  const light = base.clone().lerp(new THREE.Color('#ffffff'), 0.22);

  const group = new THREE.Group();
  const mats = [];
  const translucent = !!look.translucent;
  const mkMat = (color, opts = {}) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      roughness: 0.62,
      transparent: translucent,
      opacity: translucent ? 0.68 : 1,
      ...opts,
    });
    mats.push(m);
    return m;
  };

  const bodyMat = mkMat(base, { emissive: new THREE.Color('#f0a83c'), emissiveIntensity: 0 });
  const darkMat = mkMat(dark);
  const lightMat = mkMat(light);
  const boneMat = mkMat(0xf3ecd8, { roughness: 0.4, transparent: false, opacity: 1 });
  const clawMat = mkMat(0x20242c, { transparent: false, opacity: 1 });

  // ---- Ortak parça yardımcıları ----
  const add = (mesh, x, y, z, mat) => {
    mesh.position.set(x, y, z);
    if (mat) mesh.material = mat;
    group.add(mesh);
    return mesh;
  };
  const box = (w, h, d, mat = bodyMat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  const sph = (r, mat = bodyMat, seg = 12) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  const cyl = (rt, rb, h, mat = darkMat, seg = 7) =>
    new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  const cone = (r, h, mat = darkMat, seg = 6) => new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat);

  // Bir kafaya göz + (varsa) parlayan/boş göz çukuru yerleştir
  const glow = look.glowEyes ? mkMat(look.glowEyes, { emissive: new THREE.Color(look.glowEyes), emissiveIntensity: 1.1, transparent: false, opacity: 1 }) : null;
  const whiteMat = mkMat(0xffffff, { roughness: 0.3, transparent: false, opacity: 1 });
  const pupilMat = mkMat(0x0b0b0f, { roughness: 0.4, transparent: false, opacity: 1 });
  function eyes(hx, hy, hz, spread, r) {
    for (const sx of [-1, 1]) {
      const ex = sx * spread;
      if (look.eyes?.socket) {
        add(sph(r * 1.1, pupilMat, 10), hx + ex, hy, hz);
      } else if (glow) {
        add(sph(r * 0.9, glow, 10), hx + ex, hy, hz);
      } else {
        add(sph(r, whiteMat, 12), hx + ex, hy, hz);
        add(sph(r * 0.45, pupilMat, 8), hx + ex, hy + 0.01, hz + r * 0.7);
      }
    }
  }
  function fangs(hx, hy, hz, spread) {
    for (const sx of [-1, 1]) {
      const f = cone(0.06, 0.2, boneMat, 4);
      f.rotation.x = Math.PI;
      add(f, hx + sx * spread, hy, hz);
    }
  }
  function horns(hx, hy, hz, count, len = 0.55) {
    for (let i = 0; i < count; i++) {
      const sx = count === 1 ? 0 : i === 0 ? -1 : 1;
      const h = cone(0.13, len, boneMat, 6);
      h.rotation.z = -sx * 0.4;
      h.rotation.x = -0.3;
      add(h, hx + sx * 0.28, hy, hz);
    }
  }
  function legs(y, positions, r, len, mat = darkMat) {
    for (const [x, z] of positions) {
      add(cyl(r, r * 0.8, len, mat), x, y - len / 2, z);
      // pençe/pati
      add(sph(r * 1.15, mat, 8), x, y - len + 0.04, z + 0.04);
    }
  }

  let mainBody = null; // nefes animasyonu için ana kütle

  // ===== ARKETİPLER =====
  const A = {
    // Dört ayaklı: kafa öne (+Z) bakar; gövde Z boyunca uzanır, 4 köşede bacak, arkada kuyruk
    quadruped() {
      const bodyLen = look.longBody ? 1.9 : 1.35;
      const bodyR = look.stocky ? 0.6 : 0.46;
      const frontZ = bodyLen / 2;
      const rearZ = -bodyLen / 2;
      // gövde (Z ekseni boyunca yatık silindir + iki uç küre)
      const torso = cyl(bodyR, bodyR, bodyLen, bodyMat, 10);
      torso.rotation.x = Math.PI / 2;
      add(torso, 0, 0.2, 0);
      add(sph(bodyR * 1.0), 0, 0.2, rearZ); // arka but
      mainBody = add(sph(bodyR * 1.04), 0, 0.26, frontZ - 0.05); // göğüs
      // kafa (öne + yukarı)
      const headR = bodyR * 0.78;
      const headY = 0.52;
      const headZ = frontZ + 0.24;
      add(sph(headR, bodyMat, 12), 0, headY, headZ);
      // burun (hep +Z ileri)
      if (look.snout === 'long') {
        add(box(0.32, 0.26, 0.55, darkMat), 0, headY - 0.09, headZ + 0.34);
        for (const sx of [-0.1, 0.1]) add(cone(0.05, 0.13, boneMat, 4), sx, headY - 0.22, headZ + 0.56);
      } else if (look.snout === 'point') {
        const s = cone(0.18, 0.5, darkMat, 6);
        s.rotation.x = Math.PI / 2;
        add(s, 0, headY - 0.06, headZ + 0.32);
      } else if (look.snout === 'tusk') {
        add(sph(0.2, darkMat, 8), 0, headY - 0.1, headZ + 0.24);
        for (const sx of [-1, 1]) {
          const t = cone(0.06, 0.3, boneMat, 5);
          t.rotation.z = sx * 0.5;
          add(t, sx * 0.14, headY - 0.16, headZ + 0.28);
        }
      }
      // kulaklar (tepede, X'te simetrik)
      if (look.ears === 'round') for (const sx of [-1, 1]) { const e = sph(0.19, darkMat, 8); e.scale.z = 0.5; add(e, sx * 0.28, headY + 0.32, headZ - 0.05); }
      if (look.ears === 'point') for (const sx of [-1, 1]) { const e = cone(0.14, 0.44, darkMat, 5); e.rotation.z = -sx * 0.25; add(e, sx * 0.24, headY + 0.4, headZ - 0.05); }
      // gözler öne bakar (X'te açık = sol/sağ), burun/dişler önde
      eyes(0, headY + 0.06, headZ + headR * 0.7, 0.19, 0.11);
      if (look.fangs) fangs(0, headY - 0.24, headZ + headR * 0.55, 0.12);
      if (look.horns) horns(0, headY + 0.34, headZ, look.horns);
      // bacaklar (dört köşe: ön/arka × sol/sağ)
      const lx = bodyR * 0.82;
      legs(-0.02, [[lx, frontZ - 0.28], [-lx, frontZ - 0.28], [lx, rearZ + 0.28], [-lx, rearZ + 0.28]], 0.12, 0.62, darkMat);
      // kuyruk (arkada -Z)
      if (look.tail === 'thin') { const tl = cyl(0.05, 0.09, 1.0, darkMat, 6); tl.rotation.x = -0.8; add(tl, 0, 0.42, rearZ - 0.32); }
      else if (look.tail === 'spike') { const tl = cone(0.16, 1.1, darkMat, 6); tl.rotation.x = -2.3; add(tl, 0, 0.28, rearZ - 0.42); }
      else { const tl = cyl(0.06, 0.12, 0.7, darkMat, 6); tl.rotation.x = -1.1; add(tl, 0, 0.28, rearZ - 0.28); }
    },

    // İnsansı: dik gövde + kafa + 2 kol + 2 bacak
    humanoid() {
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 1.05, 8), bodyMat);
      mainBody = add(torso, 0, 0.35, 0);
      // kafa
      const head = sph(0.42, bodyMat, 12);
      add(head, 0, 1.12, 0);
      eyes(0, 1.16, 0.3, 0.16, 0.11);
      if (look.fangs) fangs(0, 0.98, 0.34, 0.1);
      if (look.snout === 'point') { const s = cone(0.14, 0.34, darkMat, 6); s.rotation.x = Math.PI / 2; add(s, 0, 1.05, 0.42); }
      if (look.ears === 'point') for (const sx of [-1, 1]) { const e = cone(0.12, 0.4, darkMat, 5); e.rotation.z = -sx * 0.5; add(e, sx * 0.4, 1.28, 0); }
      if (look.horns) horns(0, 1.5, 0, look.horns, 0.5);
      // kollar
      for (const sx of [-1, 1]) {
        const arm = cyl(0.13, 0.15, 0.85, darkMat, 6);
        arm.rotation.z = sx * 0.28;
        add(arm, sx * 0.6, 0.42, 0.05);
        add(sph(0.17, look.claws ? clawMat : darkMat, 8), sx * 0.74, -0.02, 0.1); // el/pençe
      }
      // bacaklar
      for (const sx of [-1, 1]) { add(cyl(0.15, 0.13, 0.7, darkMat, 6), sx * 0.24, -0.5, 0); add(box(0.3, 0.14, 0.4, darkMat), sx * 0.24, -0.82, 0.08); }
      // cadı şapkası
      if (look.hat) {
        const hatMat = mkMat(0x241c38, { transparent: false, opacity: 1 });
        add(cyl(0.6, 0.6, 0.06, hatMat, 12), 0, 1.5, 0);
        const c = cone(0.36, 0.8, hatMat, 10); c.rotation.z = 0.14; add(c, 0.03, 1.9, 0);
      }
    },

    // Uçan: küçük gövde + geniş kanatlar + kafa
    flyer() {
      mainBody = add(sph(0.5, bodyMat, 12), 0, 0.2, 0);
      const head = sph(0.34, bodyMat, 12);
      add(head, 0, 0.55, 0.32);
      eyes(0, 0.6, 0.6, 0.13, 0.09);
      if (look.snout === 'point') { const beak = cone(0.13, 0.36, boneMat, 5); beak.rotation.x = Math.PI / 2; add(beak, 0, 0.5, 0.68); }
      if (look.fangs) fangs(0, 0.44, 0.6, 0.09);
      if (look.horns) horns(0, 0.82, 0.2, look.horns, 0.42);
      // kanatlar: iki üçgen membran
      for (const sx of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.7, 3), darkMat);
        wing.scale.z = 0.12;
        wing.rotation.z = sx * 1.9;
        wing.rotation.y = sx * 0.35;
        add(wing, sx * 1.0, 0.35, -0.15);
      }
      // ayak/pençe
      for (const sx of [-1, 1]) add(cone(0.08, 0.3, clawMat, 4), sx * 0.18, -0.25, 0.1);
      if (look.tail === 'spike') { const tl = cone(0.14, 1.0, darkMat, 6); tl.rotation.x = -2.4; add(tl, 0, 0.1, -0.7); }
    },

    // Yılan: dikey S kıvrımı + kafa
    serpent() {
      let x = -0.15, y = -0.85, z = 0, r = 0.42;
      const segs = 7;
      for (let i = 0; i < segs; i++) {
        const s = add(sph(r, i === 0 ? bodyMat : bodyMat, 10), x, y, z);
        if (i === Math.floor(segs / 2)) mainBody = s;
        x = Math.sin(i * 1.15) * 0.45;
        y += 0.34;
        z = Math.cos(i * 1.15) * 0.2;
        r *= 0.9;
      }
      // kafa
      const head = sph(0.4, bodyMat, 12);
      head.scale.z = 1.3;
      add(head, x, y + 0.05, z + 0.15);
      eyes(x, y + 0.12, z + 0.4, 0.15, 0.1);
      // çatal dil
      const tongue = cone(0.03, 0.3, mkMat(0xd23a3a, { transparent: false, opacity: 1 }), 4);
      tongue.rotation.x = Math.PI / 2;
      add(tongue, x, y, z + 0.6);
      if (look.fangs) fangs(x, y - 0.1, z + 0.5, 0.1);
    },

    // Böceksi: yassı gövde + çok bacak + (varsa) kıskaç/iğne
    bug() {
      mainBody = add((() => { const b = sph(0.6, bodyMat, 12); b.scale.set(1, 0.55, 1.25); return b; })(), -0.1, 0, 0);
      const head = sph(0.34, bodyMat, 12);
      add(head, 0, 0.05, 0.7);
      // gözler (çok gözlü olabilir)
      const ec = look.eyes?.count ?? 2;
      if (ec >= 4) { eyes(0, 0.14, 0.95, 0.22, 0.07); eyes(0, 0.0, 0.98, 0.1, 0.06); }
      else eyes(0, 0.1, 0.95, 0.15, 0.09);
      // bacaklar: yanlarda açılı
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const leg = cyl(0.04, 0.03, 1.05, darkMat, 5);
          leg.rotation.z = sx * (1.15 + (i - 1.5) * 0.05);
          leg.rotation.x = (i - 1.5) * 0.35;
          add(leg, sx * 0.5, 0.0, 0.35 - i * 0.32);
        }
      }
      if (look.claws) for (const sx of [-1, 1]) { const cl = sph(0.2, darkMat, 8); cl.scale.set(1.4, 0.6, 1); add(cl, sx * 0.55, 0.02, 0.95); }
      if (look.stinger) {
        let sy = 0.1, sz = -0.7;
        for (let i = 0; i < 3; i++) { add(sph(0.15 - i * 0.03, darkMat, 8), 0, sy, sz); sy += 0.28; sz -= 0.14; }
        const tip = cone(0.09, 0.32, boneMat, 5); tip.rotation.x = 2.5; add(tip, 0, sy, sz + 0.12);
      }
    },

    // Hayalet: konik dalgalı gövde + kafa
    ghost() {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.5, 12), bodyMat);
      mainBody = add(body, 0, 0.1, 0);
      add(sph(0.55, bodyMat, 14), 0, 0.6, 0);
      eyes(0, 0.68, 0.42, 0.2, 0.13);
      // alt dalgalar
      for (let i = 0; i < 4; i++) add(sph(0.16, bodyMat, 8), -0.42 + i * 0.28, -0.62, 0.2);
    },
  };

  (A[look.arch] || A.quadruped)();

  // ---- Büyük boss süsleri ----
  if (isBig) {
    const spikeMat = mkMat(0x2a1d18, { transparent: false, opacity: 1 });
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2;
      const spike = cone(0.11, 0.5, spikeMat, 5);
      spike.position.set(Math.cos(ang) * 1.35, 0.2 + Math.sin(ang) * 1.0, -0.4);
      spike.rotation.z = ang - Math.PI / 2;
      group.add(spike);
    }
    const goldMat = mkMat(0xf0a83c, { roughness: 0.25, metalness: 0.75, transparent: false, opacity: 1 });
    for (let i = -1; i <= 1; i++) group.add(add(cone(0.1, 0.34, goldMat, 4), i * 0.3, 1.75 + (i === 0 ? 0.14 : 0), 0.1));
  }

  // Fallback: hiç mainBody atanmadıysa görünür bir kütle olsun
  if (!mainBody) mainBody = add(sph(0.5), 0, 0.2, 0);

  // ---- Otomatik çerçeveleme (kadraj garantili) ----
  // Model yalnızca Y ekseni etrafında döndüğü için: yükseklik sabit kalır, sadece
  // XZ ayak izi süpürülür. Bu yüzden ölçeği (a) dönerken en geniş hâlini veren XZ
  // yarıçapına ve (b) sabit yüksekliğe göre kadraj yarıçapının altına kilitleriz.
  // Böylece yaratık hangi açıda olursa olsun asla kadrajdan çıkmaz.
  const model = new THREE.Group();
  while (group.children.length) model.add(group.children[0]);
  const bbox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bbox.getSize(size);
  bbox.getCenter(center);
  const xzRadius = 0.5 * Math.hypot(size.x, size.z) || 0.5; // dönüşte süpürülen yatay yarıçap
  const halfH = size.y / 2 || 0.5;
  // FRAME_HALF: kamera (fov 40, ~3.57 mesafe) merkez düzleminde güvenli yarı-çerçeve.
  // margin: yaratığı biraz küçültür ve vuruş/bob paylarını bırakır (istek: daha küçük).
  const FRAME_HALF = 1.2;
  const margin = isBig ? 0.8 : isBoss ? 0.74 : 0.7;
  const fit = Math.min((FRAME_HALF * margin) / xzRadius, (FRAME_HALF * margin) / halfH);
  // sınırlayıcı kutuyu yatayda XZ merkezine, dikeyde kadraj ortasına (lookAt) hizala
  model.position.set(-center.x * fit, -center.y * fit + 0.05, -center.z * fit);
  model.scale.setScalar(fit);
  group.add(model);

  // Önden başlar, iki yana da salınır (sağ ve sol profil de görünür)
  const baseRotY = 0;
  group.rotation.y = baseRotY;
  group.userData = { bodyMat, body: mainBody, baseScale: 1, baseRotY, translucent };
  return { group, mats };
}

export default function CreatureCanvas({ enemy, hitId, stage }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  // Sahne kurulumu (bir kez)
  useEffect(() => {
    const st = stateRef.current;
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(320, 320, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0.3, 0.7, 3.5);
    camera.lookAt(0, 0.05, 0);

    scene.add(new THREE.AmbientLight(0x9a8fb8, 0.95));
    const key = new THREE.DirectionalLight(0xffe6b8, 2.1);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xe4574b, 0.9, 22);
    rim.position.set(-3.5, -1, 1.5);
    scene.add(rim);
    st.rim = rim;
    const fill = new THREE.DirectionalLight(0x8ea0ff, 0.5);
    fill.position.set(-2, 1, 3);
    scene.add(fill);

    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32 });
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.15;
    scene.add(shadow);

    Object.assign(st, {
      renderer, scene, camera, shadow, shadowMat,
      t: 0, spawnAt: performance.now(), hitAt: 0, creature: null, mats: [],
    });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      st.t += dt;
      const g = st.creature;
      if (g) {
        const { baseScale, baseRotY, bodyMat, body, translucent } = g.userData;
        const bob = reduce ? 0 : Math.sin(st.t * 1.7);
        g.position.y = bob * 0.12;
        g.rotation.y = reduce ? baseRotY : baseRotY + Math.sin(st.t * 0.5) * 0.6;
        const spawnT = Math.min((now - st.spawnAt) / 320, 1);
        const spawnScale = 0.2 + 0.8 * (1 - Math.pow(1 - spawnT, 3));
        const hitT = st.hitAt ? Math.max(0, 1 - (now - st.hitAt) / 180) : 0;
        g.scale.set(
          baseScale * spawnScale * (1 + 0.28 * hitT),
          baseScale * spawnScale * (1 - 0.28 * hitT),
          baseScale * spawnScale
        );
        bodyMat.emissiveIntensity = hitT * 1.3;
        if (!reduce && body) {
          const breathe = Math.sin(st.t * 2.6) * 0.02;
          body.scale.x = (body.userData.sx0 ?? 1) + breathe;
          body.scale.z = (body.userData.sz0 ?? 1) + breathe;
        }
        st.shadow.scale.setScalar((1 - (bob + 1) * 0.08) * baseScale);
        st.shadowMat.opacity = (translucent ? 0.2 : 0.34) - (bob + 1) * 0.06;
      }
      st.renderer.render(st.scene, st.camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (st.creature) {
        st.scene.remove(st.creature);
        disposeGroup(st.creature);
      }
      st.mats.forEach((m) => m.dispose());
      shadow.geometry.dispose();
      shadowMat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  // Düşman değişince modeli yeniden kur (doğuş animasyonuyla)
  useEffect(() => {
    const st = stateRef.current;
    if (!st.scene || !enemy) return;
    if (st.creature) {
      st.scene.remove(st.creature);
      disposeGroup(st.creature);
      st.mats.forEach((m) => m.dispose());
    }
    const { group, mats } = buildCreature(enemy, loopIndex(stage));
    // nefes animasyonu ana kütlenin başlangıç ölçeğini bozmasın
    if (group.userData.body) {
      group.userData.body.userData.sx0 = group.userData.body.scale.x;
      group.userData.body.userData.sz0 = group.userData.body.scale.z;
    }
    st.creature = group;
    st.mats = mats;
    st.scene.add(group);
    st.spawnAt = performance.now();
    if (st.rim && stage) st.rim.color.set(zoneTheme(stage));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemy?.id]);

  // Vuruş tepkisi
  useEffect(() => {
    if (!hitId) return;
    stateRef.current.hitAt = performance.now();
  }, [hitId]);

  return <div className="creature-canvas" ref={mountRef} />;
}
