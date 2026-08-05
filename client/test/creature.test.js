// Tüm yaratık modellerinin geometrik denetimi. Gözle bakmadan yakalanabilecek kusurlar:
// kopuk (havada duran) parçalar, NaN konum, yamuk oranlar, kadrajdan taşma.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildCreature } from '../src/game/creatureModel.js';
import { CREATURE_TIERS } from '../src/game/constants.js';

const ALL = CREATURE_TIERS.flat();

// Bir parçanın etki küresi: geometrinin sınır küresi × ölçek, dünya konumunda
function parts(group) {
  const out = [];
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    o.updateWorldMatrix(true, false);
    o.geometry.computeBoundingSphere();
    const bs = o.geometry.boundingSphere;
    if (!bs) return;
    const c = bs.center.clone().applyMatrix4(o.matrixWorld);
    const s = new THREE.Vector3();
    o.getWorldScale(s);
    out.push({ c, r: bs.radius * Math.max(s.x, s.y, s.z) });
  });
  return out;
}

// Model TEK parça hâlinde bağlı mı? Bağlı bileşen sayısını döndürür (1 = sağlam).
// "her parçanın bir komşusu var" demek yetmez: kopan bir küme (kafa + gözleri) kendi
// içinde değdiği için o kontrolü geçiyordu. Doğru soru, hepsinin tek gövdede olması.
// Tolerans: yarıçap toplamının %25 fazlası — düşük poligonlu kürelerde pay bırakır.
function componentCount(ps) {
  const n = ps.length;
  const seen = new Array(n).fill(false);
  let groups = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s]) continue;
    groups++;
    const stack = [s];
    seen[s] = true;
    while (stack.length) {
      const i = stack.pop();
      for (let j = 0; j < n; j++) {
        if (seen[j]) continue;
        if (ps[i].c.distanceTo(ps[j].c) <= (ps[i].r + ps[j].r) * 1.25) {
          seen[j] = true;
          stack.push(j);
        }
      }
    }
  }
  return groups;
}

const mkEnemy = (type, over = {}) => ({
  id: 7, kind: 'creature', typeId: type.id, name: type.name, emoji: type.emoji, ...over,
});

test('her yaratık modeli kurulur, parça üretir ve konumları geçerli', () => {
  for (const type of ALL) {
    const { group } = buildCreature(mkEnemy(type), 0);
    const ps = parts(group);
    assert.ok(ps.length >= 4, `${type.id}: sadece ${ps.length} parça`);
    for (const p of ps) {
      assert.ok(
        Number.isFinite(p.c.x) && Number.isFinite(p.c.y) && Number.isFinite(p.c.z) && Number.isFinite(p.r),
        `${type.id}: NaN/sonsuz parça konumu`
      );
    }
  }
});

test('KRİTİK: her yaratık tek parça — kopuk/havada duran küme yok', () => {
  const kusurlu = [];
  for (const type of ALL) {
    const { group } = buildCreature(mkEnemy(type), 0);
    const ps = parts(group);
    const gruplar = componentCount(ps);
    if (gruplar !== 1) kusurlu.push(`${type.id} (${type.look.arch}): ${gruplar} ayrı parça kümesi`);
  }
  assert.deepEqual(kusurlu, [], 'kopuk modeller:\n  ' + kusurlu.join('\n  '));
});

// NOT: Büyük boss'un diken halkası ve tacı BİLEREK gövdeden ayrı duruyor (hale efekti);
// otomatik kadrajlama hepsini birlikte ölçeklediğinden oran her yaratıkta aynı kalır.
// Bu yüzden burada "tek parça" değil, süslerin gerçekten eklendiği doğrulanır.
test('büyük boss süsleri ekleniyor ve model geçerli kalıyor', () => {
  for (const type of ALL.slice(0, 8)) {
    const sade = parts(buildCreature(mkEnemy(type), 0).group).length;
    const buyuk = buildCreature(mkEnemy(type, { kind: 'boss', big: true }), 0);
    const bp = parts(buyuk.group);
    assert.ok(bp.length > sade, `${type.id}: büyük boss süsleri eklenmemiş (${bp.length} ≤ ${sade})`);
    for (const p of bp) {
      assert.ok(Number.isFinite(p.c.x) && Number.isFinite(p.r), `${type.id}: bozuk süs parçası`);
    }
  }
});

test('oranlar makul: model ne yassı ne iğne gibi', () => {
  for (const type of ALL) {
    const { group } = buildCreature(mkEnemy(type), 0);
    const box = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    box.getSize(size);
    assert.ok(size.x > 0.05 && size.y > 0.05 && size.z > 0.05, `${type.id}: dejenere boyut ${size.toArray()}`);
    const en = Math.max(size.x, size.y, size.z);
    const boy = Math.min(size.x, size.y, size.z);
    assert.ok(en / boy < 12, `${type.id}: aşırı yamuk oran ${(en / boy).toFixed(1)}`);
  }
});

test('boss ve büyük boss varyantları da sağlam', () => {
  for (const type of ALL.slice(0, 12)) {
    for (const over of [{ kind: 'boss' }, { kind: 'boss', big: true }]) {
      const { group } = buildCreature(mkEnemy(type, over), 0);
      const ps = parts(group);
      assert.ok(ps.length >= 4, `${type.id} ${over.big ? 'büyük boss' : 'boss'}: parça yok`);
      const box = new THREE.Box3().setFromObject(group);
      assert.ok(Number.isFinite(box.min.x) && Number.isFinite(box.max.y), `${type.id}: bozuk sınır kutusu`);
    }
  }
});

test('derin turlarda (renk mutasyonu) model bozulmuyor', () => {
  for (const loop of [0, 3, 11]) {
    for (const type of ALL.slice(0, 6)) {
      const { group, mats } = buildCreature(mkEnemy(type), loop);
      assert.ok(mats.length > 0, `${type.id} tur ${loop}: materyal yok`);
      for (const m of mats) {
        const { r, g, b } = m.color;
        assert.ok(
          Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) && r >= 0 && g >= 0 && b >= 0,
          `${type.id} tur ${loop}: geçersiz renk`
        );
      }
    }
  }
});
