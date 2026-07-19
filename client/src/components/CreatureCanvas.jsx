import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CREATURE_TYPES } from '../game/constants.js';

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

// Tip konfigürasyonundan (constants.CREATURE_TYPES[].look) prosedürel canavar üret
function buildCreature(enemy) {
  const look = CREATURE_TYPES[enemy.typeId]?.look ?? {};
  const rand = mulberry32(enemy.id * 9301 + 49297);
  const isBoss = enemy.kind === 'boss';
  const isBig = isBoss && enemy.big;

  const baseColor = new THREE.Color(look.color ?? '#8a7f72');
  if (isBig) baseColor.lerp(new THREE.Color('#c23a2e'), 0.35);
  else if (isBoss) baseColor.lerp(new THREE.Color('#3a2e52'), 0.25);

  const group = new THREE.Group();
  const mats = [];
  const mat = (opts) => {
    const m = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.65, ...opts });
    mats.push(m);
    return m;
  };

  const translucent = !!look.translucent;
  const bodyMat = mat({
    color: baseColor,
    emissive: new THREE.Color('#f0a83c'),
    emissiveIntensity: 0,
    transparent: translucent,
    opacity: translucent ? 0.72 : 1,
  });
  const darkMat = mat({
    color: baseColor.clone().multiplyScalar(0.6),
    transparent: translucent,
    opacity: translucent ? 0.72 : 1,
  });
  const boneMat = mat({ color: 0xf2ead6, roughness: 0.45 });

  // ---- Gövde ----
  let body;
  let bodyScaleY = 1;
  let headY = 0.18;
  let headZ = 0.8;
  if (look.shape === 'serpent') {
    body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), bodyMat);
    body.position.set(0, 0.3, 0.5);
    group.add(body);
    let r = 0.46;
    for (let i = 1; i <= 3; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), bodyMat);
      seg.position.set(Math.sin(i * 1.6) * 0.35, 0.3 - i * 0.2, 0.5 - i * 0.5);
      group.add(seg);
      r *= 0.84;
    }
    headY = 0.42;
    headZ = 0.95;
  } else if (look.shape === 'boxy') {
    body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 0), bodyMat);
    group.add(body);
  } else {
    body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0, 1), bodyMat);
    bodyScaleY = look.shape === 'tall' ? 1.25 : 0.85 + rand() * 0.2;
    body.scale.y = bodyScaleY;
    if (look.shape === 'long') {
      body.scale.z = 1.35;
      body.scale.y *= 0.8;
      bodyScaleY *= 0.8;
    }
    group.add(body);
  }

  // ---- Gözler ----
  const eyeCfg = look.eyes ?? {};
  const eyeCount = eyeCfg.count ?? 2;
  const glowColor = look.glowEyes ?? null;
  const eyeMat = mat({ color: eyeCfg.color ?? 0xffffff, roughness: 0.3 });
  const pupilMat = mat({ color: 0x111111, roughness: 0.4 });
  const glowMat = glowColor
    ? mat({ color: glowColor, emissive: new THREE.Color(glowColor), emissiveIntensity: 1.0 })
    : null;
  const eyePositions = [];
  if (eyeCount === 2) {
    const ex = 0.32 + rand() * 0.08;
    eyePositions.push([-ex, headY, headZ], [ex, headY, headZ]);
  } else {
    eyePositions.push(
      [-0.3, headY + 0.14, headZ], [0.3, headY + 0.14, headZ],
      [-0.14, headY - 0.06, headZ + 0.06], [0.14, headY - 0.06, headZ + 0.06]
    );
  }
  for (const [x, y, z] of eyePositions) {
    const r = eyeCount === 2 ? 0.16 + rand() * 0.05 : 0.1;
    if (eyeCfg.socket) {
      // İskelet: boş, kapkara göz çukurları
      const e = new THREE.Mesh(new THREE.SphereGeometry(r * 1.15, 10, 10), pupilMat);
      e.position.set(x, y, z);
      group.add(e);
    } else if (glowMat) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(r * 0.85, 10, 10), glowMat);
      e.position.set(x, y, z);
      group.add(e);
    } else {
      const e = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), eyeMat);
      e.position.set(x, y, z);
      group.add(e);
      const p = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 8, 8), pupilMat);
      p.position.set(x, y, z + r * 0.75);
      group.add(p);
    }
  }

  // ---- Kulaklar ----
  if (look.ears) {
    for (const sx of [-1, 1]) {
      let ear;
      if (look.ears === 'round') {
        ear = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), darkMat);
        ear.scale.z = 0.45;
      } else {
        ear = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 6), darkMat);
        ear.rotation.z = -sx * 0.3;
      }
      ear.position.set(sx * 0.5, 0.85 * bodyScaleY + 0.15, 0);
      group.add(ear);
    }
  }

  // ---- Boynuzlar ----
  const hornCount = look.horns ?? 0;
  for (let i = 0; i < hornCount; i++) {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.13 + rand() * 0.06, 0.5 + rand() * 0.3, 6),
      boneMat
    );
    const sx = hornCount === 1 ? 0 : i === 0 ? -1 : 1;
    horn.position.set(sx * 0.38, 0.9 * bodyScaleY + 0.15, 0);
    horn.rotation.z = -sx * (0.3 + rand() * 0.2);
    group.add(horn);
  }

  // ---- Burun / çene ----
  if (look.snout === 'point') {
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 6), darkMat);
    snout.position.set(0, headY - 0.28, headZ + 0.25);
    snout.rotation.x = Math.PI / 2;
    group.add(snout);
  } else if (look.snout === 'long') {
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.85), darkMat);
    jaw.position.set(0, headY - 0.32, headZ + 0.45);
    group.add(jaw);
    for (const sx of [-0.16, 0, 0.16]) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), boneMat);
      tooth.position.set(sx, headY - 0.5, headZ + 0.72);
      group.add(tooth);
    }
  } else if (look.snout === 'tusk') {
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.3, 8), darkMat);
    nose.position.set(0, headY - 0.22, headZ + 0.25);
    nose.rotation.x = Math.PI / 2;
    group.add(nose);
    for (const sx of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.32, 5), boneMat);
      tusk.position.set(sx * 0.35, headY - 0.35, headZ + 0.2);
      tusk.rotation.z = sx * 0.5;
      group.add(tusk);
    }
  }

  // ---- Dişler ----
  if (look.fangs) {
    for (const sx of [-1, 1]) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 4), boneMat);
      fang.position.set(sx * 0.2, headY - 0.38, headZ + 0.12);
      fang.rotation.x = Math.PI;
      group.add(fang);
    }
  }

  // ---- Kanatlar ----
  if (look.wings) {
    for (const sx of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 4), darkMat);
      wing.scale.z = 0.16;
      wing.position.set(sx * 0.95, 0.35, -0.2);
      wing.rotation.z = sx * 2.1;
      group.add(wing);
    }
  }

  // ---- Kuyruk ----
  if (look.tail === 'thin') {
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 1.0, 6), darkMat);
    tail.position.set(0.15, -0.2, -1.0);
    tail.rotation.x = 1.25;
    group.add(tail);
  } else if (look.tail === 'spike') {
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.17, 1.0, 5), darkMat);
    tail.position.set(0, -0.15, -1.15);
    tail.rotation.x = 1.45;
    group.add(tail);
  }

  // ---- Akrep iğnesi ----
  if (look.stinger) {
    let y = 0.2;
    let z = -0.9;
    for (let i = 0; i < 3; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.16 - i * 0.03, 8, 8), darkMat);
      seg.position.set(0, y, z);
      group.add(seg);
      y += 0.3;
      z -= 0.12;
    }
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 5), boneMat);
    tip.position.set(0, y + 0.05, z + 0.1);
    tip.rotation.x = 2.6;
    group.add(tip);
  }

  // ---- Kıskaçlar ----
  if (look.claws) {
    for (const sx of [-1, 1]) {
      const claw = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 8), darkMat);
      claw.scale.set(1, 0.75, 1);
      claw.position.set(sx * 0.75, -0.4, 0.6);
      group.add(claw);
    }
  }

  // ---- Örümcek bacakları ----
  if (look.legs8) {
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.02, 1.1, 5), darkMat);
        leg.position.set(sx * 0.85, -0.15, 0.45 - i * 0.3);
        leg.rotation.z = sx * 1.15;
        group.add(leg);
      }
    }
  }

  // ---- Cadı şapkası ----
  if (look.hat) {
    const hatMat = mat({ color: 0x2c2440, roughness: 0.6 });
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 12), hatMat);
    brim.position.set(0, 0.85 * bodyScaleY + 0.12, 0);
    group.add(brim);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.85, 10), hatMat);
    cone.position.set(0, 0.85 * bodyScaleY + 0.55, 0);
    cone.rotation.z = 0.12;
    group.add(cone);
  }

  // ---- Boss süsleri ----
  if (isBig) {
    const spikeMat = mat({ color: 0x2c1f1a, flatShading: true });
    const n = 8;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 5), spikeMat);
      spike.position.set(Math.cos(ang) * 1.1, Math.sin(ang) * 1.1 * bodyScaleY, -0.1);
      spike.rotation.z = ang - Math.PI / 2;
      group.add(spike);
    }
    const goldMat = mat({ color: 0xf0a83c, roughness: 0.25, metalness: 0.7 });
    for (let i = -1; i <= 1; i++) {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 4), goldMat);
      tip.position.set(i * 0.28, 0.95 * bodyScaleY + 0.35 + (i === 0 ? 0.12 : 0), 0);
      group.add(tip);
    }
  }

  const sizeByShape = look.shape === 'small' ? 0.85 : look.shape === 'big' ? 1.15 : 1;
  const scale = (isBig ? 1.45 : isBoss ? 1.2 : 1) * sizeByShape;
  group.scale.setScalar(scale);
  group.userData = { bodyMat, body, baseScale: scale, translucent };
  return { group, mats };
}

export default function CreatureCanvas({ enemy, hitId }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  // Sahne kurulumu (bir kez)
  useEffect(() => {
    const st = stateRef.current;
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(300, 300, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 0.5, 5.4);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0x9a8fb8, 1.0));
    const key = new THREE.DirectionalLight(0xffd9a0, 1.9);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.PointLight(0xe4574b, 0.7, 20);
    rim.position.set(-3, -2, 2);
    scene.add(rim);

    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.15, 24), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.55;
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
        const { baseScale, bodyMat, body, translucent } = g.userData;
        const bob = reduce ? 0 : Math.sin(st.t * 1.7);
        g.position.y = bob * 0.14;
        g.rotation.y = reduce ? 0 : Math.sin(st.t * 0.6) * 0.35;
        const spawnT = Math.min((now - st.spawnAt) / 300, 1);
        const spawnScale = 0.2 + 0.8 * (1 - Math.pow(1 - spawnT, 3));
        const hitT = st.hitAt ? Math.max(0, 1 - (now - st.hitAt) / 180) : 0;
        g.scale.set(
          baseScale * spawnScale * (1 + 0.3 * hitT),
          baseScale * spawnScale * (1 - 0.3 * hitT),
          baseScale * spawnScale
        );
        bodyMat.emissiveIntensity = hitT * 1.3;
        if (!reduce && body) {
          const breathe = Math.sin(st.t * 2.6) * 0.025;
          body.scale.x = 1 + breathe;
          body.scale.z = 1 + breathe;
        }
        st.shadow.scale.setScalar((1 - (bob + 1) * 0.09) * baseScale);
        st.shadowMat.opacity = (translucent ? 0.22 : 0.38) - (bob + 1) * 0.07;
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
    const { group, mats } = buildCreature(enemy);
    st.creature = group;
    st.mats = mats;
    st.scene.add(group);
    st.spawnAt = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemy?.id]);

  // Vuruş tepkisi
  useEffect(() => {
    if (!hitId) return;
    stateRef.current.hitAt = performance.now();
  }, [hitId]);

  return <div className="creature-canvas" ref={mountRef} />;
}
