---
tags: [roadmap]
faz: 3
sira: 7
durum: bekliyor
---

# Kombo sayacı (hızlı tıklama çarpanı)

Hızlı ardışık tıklamayı anlık hasar çarpanıyla ödüllendiren sayaç. Aktif oyuna "akış" hissi katar; [[03-altin-yaratiklar|Altın Coşkusu]] buff'ıyla birleşince tıklama anları zirve yapar.

## Tasarım

- Tıklamalar arası süre < ~1 sn ise kombo artar; boşluk uzarsa sıfırlanır.
- Çarpan eğrisi mütevazı: her 10 komboda +%5, tavan **+%50** (100 kombo).
- Sayaç yaratığın üstünde küçük rozet: `×1.25 🔥 25 kombo` — büyüdükçe renk ısınır.
- Kritik vuruşlar komboyu bozmaz; boss geçişleri sıfırlamaz (akış kesilmesin).

## Nereye eklenecek

Klik hasarı `gameStore.js` içindeki **`clickCreature`** action'ında hesaplanıyor (~157). Mevcut çarpan zinciri:

```js
let dmg = s.opMode ? 1e18 : clickDamage(...);   // taban
if (skillActive(s, 'ofke')) dmg *= 5;           // Öfke yeteneği
if (s.goldenBuffLeft > 0) dmg *= 7;             // Altın Coşkusu
// kritik: dmg *= critMultiplier(...)
```

Kombo çarpanı bu zincire **çarpımsal ve en sona** eklenir: `dmg *= comboMult(s.combo)`. Kombo state'i (`combo`, `lastClickAt`) `clickCreature` başında güncellenir.

## Denge notu

`goldenBuffLeft` zaten klik ×7 yapıyor. Kombo tavanı +%50 ile birlikte en kötü durum ×7·1.5 = ×10.5 — Öfke (×5) ve kritiklerle çarpınca büyük ama idle DPS'i etkilemez (yalnızca klik). Kabul edilebilir; kombo tavanı düşük tutulduğu için idle dengesi bozulmaz.

## Dokunulacak dosyalar

`client/src/store/gameStore.js` (kombo state + `clickCreature` çarpanı; save'e yazmaya gerek yok, koşu içi geçici), `client/src/components/BattleArea.jsx` (rozet), `client/src/styles.css`

İlgili: [[03-altin-yaratiklar]] (Coşku sinerjisi), [[02-boss-modifiyeleri]] (Zırhlı boss'ta aktif tıklama değerlenir)
