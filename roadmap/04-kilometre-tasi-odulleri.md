---
tags: [roadmap]
faz: 2
sira: 4
durum: tamam
---

# Kilometre taşı ödülleri

Belirli bölgelere **ilk kez** ulaşınca verilen **tek seferlik kristal** ödülleri. İlerlemeye "hedef çizgileri" koyar; erken kristaller ilk prestije kadar birikip head start sağlar. **Kodda mevcut ve çalışıyor.**

## Ödül tablosu

Elle ayarlanmış, bölgeyle üstel büyüyen kristal ödülleri (`constants.js` → `MILESTONES`):

| Bölge | Kristal | Bölge | Kristal |
|---|---|---|---|
| 25 | 5 | 200 | 1.200 |
| 50 | 15 | 250 | 3.500 |
| 75 | 40 | 300 | 9.000 |
| 100 | 120 | 400 | 30.000 |
| 150 | 400 | 500 | 100.000 |

10 taş (her 25/50 değil — seyrekleşen eşikler). Ödül **kristal**, altın değil — prestij ekonomisine erken tat verir.

## Nasıl çalışıyor

- **Tetik:** `highestStage` her artışta değil, tick döngüsünde **2 sn'de bir** kontrol edilir (`_checkMilestones`, achievement kontrolüyle aynı zamanlayıcı).
- **Kalıcılık:** `s.milestones` bir bitmap (`{ [stage]: true }`), save'e yazılır ve geri yüklenir. Bir taş ödülü yalnızca bir kez verilir.
- **Bildirim:** `🏁 Bölge N! +X 💎` toast'ı + `sfx.achievement()`.

## Başarımlarla ilişki

Başarım dizisinde de bölge eşikleri var ama **farklı ödül**:

| Başarım | Bölge | Kilometre taşı farkı |
|---|---|---|
| `stage1` Yolcu | 25 | Taş: 5 kristal (tek sefer) |
| `stage2` Kaşif | 50 | Taş: 15 kristal |
| `stage3` Fatih | 100 | Taş: 120 kristal |
| `stage4` Derinlere | 250 | Taş: 3.500 kristal |
| `stage5` Zirvenin Sahibi | 500 | Taş: 100.000 kristal |

Başarım kalıcı **%2 hasar çarpanı** verir (koşular arası korunur); taş **tek seferlik kristal** verir. İkisi aynı bölgede birlikte tetiklenir, çakışmaz.

## Kod

- Sabitler: `client/src/game/constants.js` → `MILESTONES` (~109-120)
- Mantık: `client/src/store/gameStore.js` → `_checkMilestones` (~235-254), tick içinde çağrı (~231)
- Kalıcılık: `gameStore.js` → `milestones` state (~116), `getSaveData`/`loadSaveData` içinde `milestones` alanı (`data.milestones ?? {}`)

> [!note] Kalıcılık deseni
> `save.js`'te ayrı bir migrate fonksiyonu **yok**. Geriye dönük uyum satır içi varsayılanlarla sağlanıyor: `loadSaveData` her alanı `data.alan ?? varsayılan` ile okuyor. Yeni save alanı eklerken bu deseni izle.

İlgili: [[03-altin-yaratiklar]] (aynı faz), [[01-askinlik]] (500 taşı aşkınlık anıyla çakışıyor)
