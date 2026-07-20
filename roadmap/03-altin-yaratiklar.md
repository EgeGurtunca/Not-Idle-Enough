---
tags: [roadmap]
faz: 2
sira: 3
durum: tamam
---

# Altın Yaratıklar

Ara sıra beliren, tıklanınca ödül patlatan nadir yaratık. Cookie Clicker'ın "golden cookie" kancası: ekrana dönmeyi ve aktif oynamayı ödüllendirir. **Kodda mevcut ve çalışıyor.**

## Nasıl çalışıyor

- **Belirme:** aktif yaratık yokken geri sayım işler; süre dolunca savaş alanında rastgele konumda (`x: %14–82`, `y: %22–72`) süzülen bir figür belirir. Aralık **60–160 sn** rastgele (`goldenTimer = 60 + rand·100`).
- **Ömür:** **12 sn** (`GOLDEN_TTL`) — tıklanmazsa kaybolur, kaçırma hissi kancanın kendisi.
- **Görsel/ses:** belirince `sfx.reveal()` arp'ı çalar; figür ödül türüne göre 🪙 (altın) ya da ✨ (buff). TTL'e bağlı sönümlenme (`--ttl` CSS değişkeni).

## Ödüller (%60 / %40)

| Ödül | Şans | Etki |
|---|---|---|
| 🪙 Altın Patlaması | %60 | `max(saniyelik üretim · 120, mevcut yaratık altını · gmult · 60)` — yani ~2 dk'lık üretim ya da erken oyun için tek yaratık altınının katı, hangisi büyükse |
| ✨ Altın Coşkusu | %40 | 20 sn boyunca klik ×7 **ve** altın ×3 (ikisi birlikte, `goldenBuffLeft` sayacı) |

Tıklayınca `sfx.bossWin()` çalar ve toast çıkar.

## Kod

- State + döngü: `client/src/store/gameStore.js` — `goldenTimer`/`GOLDEN_TTL` (modül üstü, satır ~21-22), `golden`/`goldenBuffLeft` state (~126-127), spawn/TTL döngüsü `tick` içinde (~211-224), `clickGolden` action (~349-364)
- Buff uygulaması: `gameStore.js` → klik hasarı `if (s.goldenBuffLeft > 0) dmg *= 7` (~159), altın çarpanı `gmult *= 3` (~286)
- UI: `client/src/components/BattleArea.jsx` → `GoldenCreature` bileşeni (~45-57), `.golden` CSS sınıfı

> [!note] Not: sabitler `constants.js`'te değil
> `goldenTimer` ve `GOLDEN_TTL` doğrudan `gameStore.js` modül kapsamında tanımlı. İleride ayarlanabilirlik istenirse `constants.js`'e taşınabilir.

## Olası geliştirmeler

- **Boss savaşında da beliriyor** — spawn döngüsü modu kontrol etmiyor (`if (!s.golden)` yeterli koşul). İstenirse boss sırasında bastırılabilir; şu hâliyle boss'ta ekstra ödül fırsatı.
- **Offline birikme yok** — tick sadece açık sekmede işler (`loop.js`), arka planda dt 2 sn'e sınırlı, uzun aralar çevrimdışı kazançla telafi ediliyor. Yani spawn birikmiyor, istismar yok. ✔

İlgili: [[04-kilometre-tasi-odulleri]] (aynı faz), [[07-kombo-sayaci]] (aktif oyun sinerjisi), [[08-npc-pasifleri]] (Zaman Bekçisi pasifi altın yaratık sıklığına bağlanabilir)
