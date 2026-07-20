---
tags: [roadmap]
faz: 1
sira: 1
durum: tamam
---

# Aşkınlık (2. prestij katmanı)

Bölge 500'e ulaşınca açılan ikinci prestij katmanı. Kristaller **dahil** tüm koşu ilerlemesi sıfırlanır; karşılığında **Yıldız Tozu 💫** kazanılır. Artifact'ler ve başarımlar korunur. Sonsuz endgame döngüsünün temeli.

## Nasıl çalışıyor

- **Açılış:** Bölge 500 (`TRANSCEND_STAGE`, oyunun son bölgesi).
- **Kazanç formülü:** `⌊8 · √(kristal / 2000)⌋` — bankadaki kristale bağlı, yani her aşkınlık öncesi kristal biriktirmek gerekiyor. 2.000 kristal ≈ 8 💫, 8.000 kristal ≈ 16 💫 (karekök: iki katı toz için dört katı kristal).
- **Sıfırlanan:** altın, kahraman/NPC seviyeleri, kahraman upgrade'leri, kristaller, prestij upgrade'leri.
- **Korunan:** artifact'ler, başarımlar, yıldız tozu upgrade'leri.

## Yıldız Tozu upgrade'leri

| Upgrade | Etki (seviye başına) | Taban maliyet | Büyüme |
|---|---|---|---|
| 🌟 Yıldız Gücü | Tüm hasar +%40 | 3 | ×1.8 |
| 💫 Yıldız Serveti | Altın +%50 | — | — |
| ✨ Yıldız Bilgeliği | Kristal kazancı +%30 | — | — |
| 🛡️ Yıldız Kalkanı | Boss süresi +3 sn | — | — |
| 🚀 Yıldız Başlangıcı | Başlangıç kristali 50·3^(sev−1) | — | — |

## Kod

- Sabitler: `client/src/game/constants.js` → `TRANSCEND_STAGE`, `STARDUST_UPGRADES`
- Formüller: `client/src/game/formulas.js` → `transcendGain`, `stardustDamageMult/GoldMult/CrystalMult`, `startingCrystals`
- Store: `client/src/store/gameStore.js` → `transcend`, `transcendUnlocked`, `transcendGain` selector'ları
- UI: `client/src/components/TranscendPanel.jsx`

> [!warning] Teknik not
> Aşkınlık çarpanları büyüdükçe sayılar JS `~1.8e308` tavanına yaklaşabilir; gerekirse bilimsel/bignum katmanı değerlendirilecek. Bölge 500'de HP ~1e89 — şimdilik güvenli.

İlgili: [[02-boss-modifiyeleri]] (aynı fazın diğer maddesi)
