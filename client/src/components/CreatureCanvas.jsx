import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

// Bölge dilimlerine (CREATURE_TIERS ile aynı sıra) uyan gövde renkleri
const TIER_COLORS = ['#8a7f72', '#6f8095', '#69a15c', '#cfc8b4', '#5f8f6a', '#8a63b8', '#9a948c', '#c05548'];

function disposeGroup(group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
  });
}

// Düşmandan prosedürel low-poly canavar üret
function buildCreature(enemy, stage) {
  const rand = mulberry32(enemy.id * 9301 + 49297);
  const tier = Math.floor((stage - 1) / 10) % TIER_COLORS.length;
  const baseColor = new THREE.Color(TIER_COLORS[tier]);
  const isBoss = enemy.kind === 'boss';
  const isBig = isBoss && enemy.big;
  if (isBig) baseColor.lerp(new THREE.Color('#c23a2e'), 0.45);
  else if (isBoss) baseColor.lerp(new THREE.Color('#3a2e52'), 0.3);

  const group = new THREE.Group();
  const mats = [];

  const bodyMat = new THREE.MeshStandardMaterial({
    color: baseColor,
    flatShading: true,
    roughness: 0.65,
    emissive: new THREE.Color('#f0a83c'),
    emissiveIntensity: 0,
  });
  mats.push(bodyMat);
  const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), bodyMat);
  body.scale.y = 0.85 + rand() * 0.35;
  group.add(body);

  // Gözler
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
  mats.push(eyeMat, pupilMat);
  const eyeR = 0.16 + rand() * 0.09;
  const eyeY = 0.1 + rand() * 0.25;
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 12, 12), eyeMat);
    eye.position.set(sx * (0.34 + rand() * 0.08), eyeY, 0.82);
    group.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.45, 8, 8), pupilMat);
    pupil.position.set(eye.position.x, eyeY, 0.82 + eyeR * 0.75);
    group.add(pupil);
  }

  // Boynuzlar (boss'larda hep çift)
  const hornMat = new THREE.MeshStandardMaterial({
    color: baseColor.clone().multiplyScalar(0.5),
    flatShading: true,
    roughness: 0.5,
  });
  mats.push(hornMat);
  const hornCount = isBoss ? 2 : Math.floor(rand() * 3);
  for (let i = 0; i < hornCount; i++) {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.14 + rand() * 0.08, 0.5 + rand() * 0.4, 6),
      hornMat
    );
    const sx = hornCount === 1 ? 0 : i === 0 ? -1 : 1;
    horn.position.set(sx * 0.4, 0.95, 0);
    horn.rotation.z = -sx * (0.35 + rand() * 0.25);
    group.add(horn);
  }

  // Büyük boss: diken halkası + altın taç
  if (isBig) {
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x2c1f1a, flatShading: true });
    mats.push(spikeMat);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.42, 5), spikeMat);
      spike.position.set(Math.cos(ang) * 1.08, Math.sin(ang) * 1.08 * body.scale.y, 0);
      spike.rotation.z = ang - Math.PI / 2;
      group.add(spike);
    }
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf0a83c,
      roughness: 0.25,
      metalness: 0.7,
    });
    mats.push(goldMat);
    for (let i = -1; i <= 1; i++) {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 4), goldMat);
      tip.position.set(i * 0.28, 1.15 + (i === 0 ? 0.12 : 0), 0);
      group.add(tip);
    }
  }

  const scale = isBig ? 1.5 : isBoss ? 1.25 : 1;
  group.scale.setScalar(scale);
  group.userData = { bodyMat, body, baseScale: scale };
  return { group, mats };
}

export default function CreatureCanvas({ enemy, stage, hitId }) {
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
        const { baseScale, bodyMat, body } = g.userData;
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
        if (!reduce) {
          const breathe = Math.sin(st.t * 2.6) * 0.025;
          body.scale.x = 1 + breathe;
          body.scale.z = 1 + breathe;
        }
        st.shadow.scale.setScalar((1 - (bob + 1) * 0.09) * baseScale);
        st.shadowMat.opacity = 0.38 - (bob + 1) * 0.07;
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
    const { group, mats } = buildCreature(enemy, stage);
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
