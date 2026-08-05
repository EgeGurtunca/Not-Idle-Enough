// Yaratık 3B modelleri — saf geometri, React/DOM yok.
// Ayrı dosyada olmasının sebebi: modeller Node üzerinden otomatik denetlenebilsin
// (kopuk parça, NaN konum, bozuk kadraj). Bkz. test/creature.test.js
import * as THREE from 'three';
import { CREATURE_TYPES } from './constants.js';
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

// Yaratık türünün "arch" bayrağı hangi gövde planını çizeceğimizi belirler.
// Her plan; gövde, kafa, uzuvlar ve türe özel eklentileri (boynuz/kanat/kuyruk…) kurar.
export function buildCreature(enemy, loop = 0) {
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
  // opts.slit: dikey yarık göz bebeği (yılan/sürüngen)
  function eyes(hx, hy, hz, spread, r, opts = {}) {
    // look.eyes.color verilmişse göz akı yerine renkli iris kullan
    const irisMat = look.eyes?.color
      ? mkMat(look.eyes.color, { roughness: 0.3, transparent: false, opacity: 1 })
      : whiteMat;
    for (const sx of [-1, 1]) {
      const ex = sx * spread;
      if (look.eyes?.socket) {
        add(sph(r * 1.1, pupilMat, 10), hx + ex, hy, hz);
      } else if (glow) {
        add(sph(r * 0.9, glow, 10), hx + ex, hy, hz);
      } else {
        add(sph(r, irisMat, 12), hx + ex, hy, hz);
        const pupil = sph(r * 0.45, pupilMat, 8);
        if (opts.slit) pupil.scale.set(0.36, 1.6, 1);
        add(pupil, hx + ex, hy + 0.01, hz + r * 0.7);
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
      // shape: 'big' hantal kütle, 'small' cılız (ekran boyutu kadrajla sabit, fark orandan okunur)
      const shapeR = look.shape === 'big' ? 1.28 : look.shape === 'small' ? 0.8 : 1;
      const bodyR = (look.stocky ? 0.6 : 0.46) * shapeR;
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
      // shape oranı değiştirir: 'big' hantal (geniş gövde, kalın uzuv, küçük kafa oranı),
      // 'small' cılız. Ekran boyutu kadrajlamayla sabit olduğundan fark oranlarda okunur.
      const big = look.shape === 'big';
      const small = look.shape === 'small';
      const bw = big ? 1.32 : small ? 0.82 : 1; // gövde genişlik çarpanı
      const hs = big ? 0.9 : small ? 1.12 : 1;  // kafa oranı (iri gövdede kafa görece küçük)

      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42 * bw, 0.52 * bw, 1.05, 8), bodyMat);
      mainBody = add(torso, 0, 0.35, 0);
      // kafa
      const head = sph(0.42 * hs, bodyMat, 12);
      add(head, 0, 1.12, 0);
      eyes(0, 1.16, 0.3, 0.16, 0.11);
      if (look.fangs) fangs(0, 0.98, 0.34, 0.1);
      if (look.snout === 'point') { const s = cone(0.14, 0.34, darkMat, 6); s.rotation.x = Math.PI / 2; add(s, 0, 1.05, 0.42); }
      if (look.ears === 'point') for (const sx of [-1, 1]) { const e = cone(0.12, 0.4, darkMat, 5); e.rotation.z = -sx * 0.5; add(e, sx * 0.4, 1.28, 0); }
      if (look.horns) horns(0, 1.5, 0, look.horns, 0.5);
      // kollar
      for (const sx of [-1, 1]) {
        const arm = cyl(0.13 * bw, 0.15 * bw, 0.85, darkMat, 6);
        arm.rotation.z = sx * 0.28;
        add(arm, sx * 0.6 * bw, 0.42, 0.05);
        add(sph(0.17 * bw, look.claws ? clawMat : darkMat, 8), sx * 0.74 * bw, -0.02, 0.1); // el/pençe
      }
      // bacaklar
      for (const sx of [-1, 1]) {
        add(cyl(0.15 * bw, 0.13 * bw, 0.7, darkMat, 6), sx * 0.24 * bw, -0.5, 0);
        add(box(0.3 * bw, 0.14, 0.4, darkMat), sx * 0.24 * bw, -0.82, 0.08);
      }
      // cadı şapkası
      if (look.hat) {
        const hatMat = mkMat(0x241c38, { transparent: false, opacity: 1 });
        add(cyl(0.6, 0.6, 0.06, hatMat, 12), 0, 1.5, 0);
        const c = cone(0.36, 0.8, hatMat, 10); c.rotation.z = 0.14; add(c, 0.03, 1.9, 0);
      }
    },

    // Uçan: küçük gövde + geniş kanatlar + kafa
    flyer() {
      // shape ile oran değişir (ekran boyutu kadrajlamayla sabitlendiği için "büyük"
      // demek daha iri değil, daha HANTAL demek): küçük = ufak gövde + kocaman kanat.
      const small = look.shape === 'small';
      const big = look.shape === 'big';
      const bodyR = small ? 0.34 : big ? 0.62 : 0.5;
      const headR = small ? 0.3 : big ? 0.38 : 0.34;
      const wingScale = small ? 1.25 : big ? 1.15 : 1; // yarasada kanat gövdeye baskın

      mainBody = add(sph(bodyR, bodyMat, 12), 0, 0.2, 0);
      const head = sph(headR, bodyMat, 12);
      add(head, 0, 0.2 + bodyR * 0.7, 0.32);
      const hy = 0.25 + bodyR * 0.7;
      eyes(0, hy, 0.32 + headR * 0.8, headR * 0.4, headR * 0.27);
      // Yarasa/tilki kulağı: dik, büyük — küçük uçucuları ayırt eden ana özellik
      if (look.ears === 'point' || look.ears === 'big') {
        const eh = look.ears === 'big' ? 0.62 : 0.38;
        for (const sx of [-1, 1]) {
          const ear = cone(headR * 0.42, eh, darkMat, 5);
          ear.rotation.z = -sx * 0.28;
          ear.rotation.x = -0.18;
          add(ear, sx * headR * 0.62, hy + headR * 0.75 + eh * 0.3, 0.26);
        }
      }
      if (look.snout === 'point') { const beak = cone(0.13, 0.36, boneMat, 5); beak.rotation.x = Math.PI / 2; add(beak, 0, hy - 0.1, 0.32 + headR + 0.16); }
      if (look.fangs) fangs(0, hy - headR * 0.55, 0.32 + headR * 0.7, 0.09);
      if (look.horns) horns(0, hy + headR * 0.7, 0.2, look.horns, 0.42);
      // Kanatlar: omuz eklemi + kemik parmaklar + aralarına gerilmiş membran.
      // Eskiden tek üçgen koniydi; gövdeye değmiyor ve düz bir levha gibi duruyordu.
      const W = wingScale;
      for (const sx of [-1, 1]) {
        add(sph(0.16, darkMat, 7), sx * (bodyR * 0.8), 0.34, -0.05); // omuz — gövdeye oturur
        const wing = new THREE.Mesh(new THREE.ConeGeometry(0.7 * W, 1.7 * W, 3), darkMat);
        wing.scale.z = 0.12;
        wing.rotation.z = sx * 1.9;
        wing.rotation.y = sx * 0.35;
        add(wing, sx * 1.0 * W, 0.35, -0.15);
        // kanat kemikleri: omuzdan uca doğru açılan üç parmak
        for (let f = 0; f < 3; f++) {
          const spread = (0.5 + f * 0.28) * W;
          const bone = cyl(0.035, 0.05, (1.15 - f * 0.16) * W, boneMat, 5);
          bone.rotation.z = sx * (1.15 - f * 0.22);
          bone.rotation.y = sx * (0.2 + f * 0.22);
          add(bone, sx * spread, 0.42 - f * 0.1, -0.1 - f * 0.16);
        }
        // membran kıvrımları: parmak uçları arasını doldurur
        for (let m = 0; m < 3; m++) {
          const u = m / 2;
          const web = sph((0.2 - m * 0.03) * W, darkMat, 6);
          web.scale.set(1, 0.35, 0.5);
          add(web, sx * (0.95 + u * 0.5) * W, 0.16 - u * 0.22, (-0.32 - u * 0.3) * W);
        }
      }
      // ayak/pençe
      for (const sx of [-1, 1]) add(cone(0.08, 0.3, clawMat, 4), sx * 0.18, -0.25, 0.1);
      if (look.tail === 'spike') { const tl = cone(0.14, 1.0, darkMat, 6); tl.rotation.x = -2.4; add(tl, 0, 0.1, -0.7); }
    },

    // Yılan: dikey S kıvrımı + kafa
    // Yılan: kuyruk yerde sarmal kıvrılır, gövde S çizerek dikelir, kafa öne bakar.
    // Segmentler bilerek üst üste biner — aralıklı dizilirse boncuk gibi görünüyor.
    serpent() {
      // Segment sayısı ve kuyruk kalınlığı sayısal olarak ayarlandı: her komşu çift
      // yarıçaplarının en fazla %83'ü kadar uzak (hepsi iç içe) — böylece boncuk değil,
      // kesintisiz bir gövde okunuyor.
      const N = 52;
      const thick = look.shape === 'big' ? 0.4 : look.longBody ? 0.36 : 0.32;
      let hx = 0, hy = 0, hz = 0; // kafanın oturacağı nokta (son segment)

      for (let i = 0; i < N; i++) {
        const t = i / (N - 1); // 0 = kuyruk ucu, 1 = boyun
        let x, y, z;
        if (t < 0.62) {
          // yerdeki sarmal: kuyruk dışarıda, içe doğru sarılır (~1.65 tur)
          const u = t / 0.62;
          const ang = Math.PI * 3.3 * (1 - u);
          const rad = 0.34 + 0.55 * (1 - u);
          x = Math.cos(ang) * rad;
          z = Math.sin(ang) * rad * 0.7;
          y = -1.06 + u * 0.2;
        } else {
          // dikelen boyun: hafif S + kameraya doğru yay
          const u = (t - 0.62) / 0.38;
          x = Math.sin(u * Math.PI * 0.9) * 0.24;
          y = -0.86 + u * 1.62;
          z = 0.12 + Math.sin(u * Math.PI * 0.55) * 0.52;
        }
        // kalınlık: kuyruk ince → gövde dolgun → boyun biraz incelir
        const taper = t < 0.75 ? 0.45 + 0.55 * (t / 0.75) : 1 - 0.3 * ((t - 0.75) / 0.25);
        const seg = add(sph(thick * taper, bodyMat, 8), x, y, z);
        if (i === Math.round(N * 0.35)) mainBody = seg; // nefes animasyonu gövdenin ortasından
        hx = x; hy = y; hz = z;
      }

      // Kama şeklinde kafa (+Z'ye bakar)
      const head = sph(thick * 0.95, bodyMat, 12);
      head.scale.set(1.05, 0.72, 1.45);
      add(head, hx, hy + 0.06, hz + 0.16);
      // kaş çıkıntıları — yılana sinsi bir ifade verir
      for (const sx of [-1, 1]) {
        const brow = box(thick * 0.42, thick * 0.16, thick * 0.5, darkMat);
        brow.rotation.z = -sx * 0.18;
        add(brow, hx + sx * thick * 0.42, hy + thick * 0.42, hz + thick * 0.35);
      }
      // alt çene
      const jaw = sph(thick * 0.6, darkMat, 8);
      jaw.scale.set(0.9, 0.4, 1.25);
      add(jaw, hx, hy - thick * 0.3, hz + thick * 0.45);

      eyes(hx, hy + thick * 0.28, hz + thick * 0.62, thick * 0.5, thick * 0.3, { slit: true });
      if (look.fangs) fangs(hx, hy - thick * 0.35, hz + thick * 1.0, thick * 0.28);

      // çatal dil: iki ince uç
      const tongueMat = mkMat(0xd23a3a, { transparent: false, opacity: 1 });
      for (const sx of [-1, 1]) {
        const tip = cone(0.035, 0.34, tongueMat, 4);
        tip.rotation.x = Math.PI / 2;
        tip.rotation.z = sx * 0.28;
        add(tip, hx + sx * 0.07, hy - thick * 0.12, hz + thick * 1.35);
      }
    },

    // Böceksi: yassı gövde + çok bacak + (varsa) kıskaç/iğne
    bug() {
      // shape: örümcek gibi 'small' böcekler daha ufak gövde + görece uzun bacak
      const bs = look.shape === 'big' ? 1.22 : look.shape === 'small' ? 0.82 : 1;
      mainBody = add((() => { const b = sph(0.6 * bs, bodyMat, 12); b.scale.set(1, 0.55, 1.25); return b; })(), -0.1, 0, 0);
      const head = sph(0.34 * bs, bodyMat, 12);
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
      // Akrep kuyruğu: arkadan yukarı kıvrılıp öne sarkan yay.
      // Segmentler iç içe geçecek sıklıkta — seyrek dizilince boncuk gibi kopuk duruyordu.
      if (look.stinger) {
        const SEG = 9;
        let tx = 0, ty = 0, tz = 0;
        for (let i = 0; i < SEG; i++) {
          const u = i / (SEG - 1); // 0 = kuyruk dibi, 1 = iğne öncesi
          const ang = -0.35 + u * 2.5; // arkadan yukarı, öne doğru kıvrım
          tz = -0.62 - Math.sin(ang) * 0.62 + u * 0.22;
          ty = 0.05 + (1 - Math.cos(ang)) * 0.62;
          add(sph(0.17 - u * 0.07, darkMat, 8), 0, ty, tz);
          tx = 0;
        }
        const tip = cone(0.1, 0.34, boneMat, 5);
        tip.rotation.x = -0.9;
        add(tip, tx, ty - 0.12, tz + 0.16);
      }
    },

    // Hayalet: konik dalgalı gövde + kafa
    // Hayalet: kukuletalı gövde + çepeçevre yırtık etek + savrulan kollar.
    // Eski hâli tek sıra 4 küreydi; yandan bakınca düz bir çizgi gibi duruyordu.
    ghost() {
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.5, 12), bodyMat);
      mainBody = add(body, 0, 0.1, 0);
      // baş + kukuleta kenarı
      add(sph(0.55, bodyMat, 14), 0, 0.6, 0);
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * 0.15 + (i / 6) * Math.PI * 1.3;
        add(sph(0.15, darkMat, 6), Math.cos(a) * 0.5, 0.78 + Math.sin(a) * 0.16, -0.12);
      }
      eyes(0, 0.68, 0.42, 0.2, 0.13);

      // yırtık etek: tam çember, dalgalı yükseklikte, uçlara doğru incelen saçaklar
      const FRINGE = 11;
      for (let i = 0; i < FRINGE; i++) {
        const a = (i / FRINGE) * Math.PI * 2;
        const rad = 0.46 + Math.sin(a * 3) * 0.06;
        const uzun = 0.22 + Math.abs(Math.sin(a * 2.5)) * 0.34; // düzensiz sarkma
        const x = Math.cos(a) * rad;
        const z = Math.sin(a) * rad;
        // saçak bir zincir: her halka bir öncekiyle iç içe geçsin (kopuk uç kalmasın)
        for (let k = 0; k < 4; k++) {
          const u = k / 3;
          add(
            sph(0.19 - u * 0.07, bodyMat, 7),
            x * (1 + u * 0.06),
            -0.42 - u * uzun,
            z * (1 + u * 0.06)
          );
        }
      }

      // savrulan iki kol
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const u = i / 3;
          add(
            sph(0.15 - u * 0.06, bodyMat, 7),
            sx * (0.42 + u * 0.42),
            0.28 - u * 0.34 + Math.sin(u * Math.PI) * 0.14,
            0.1 + u * 0.2
          );
        }
      }
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
