import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { zoneTheme, loopIndex } from '../game/constants.js';
import { buildCreature } from '../game/creatureModel.js';


function disposeGroup(group) {
  if (!group) return;
  group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
  });
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
