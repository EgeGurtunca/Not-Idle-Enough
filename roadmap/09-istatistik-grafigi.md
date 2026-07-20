---
tags: [roadmap]
faz: 4
sira: 9
durum: bekliyor
---

# İstatistik grafiği

Oyun zaten sayaçları tutuyor (`totalKills`, `totalGoldEarned`, `totalClicks`, `totalCrits`, `totalBossKills`, `totalPrestiges`, `highestStage`…) — başarımlar bunlardan besleniyor. Eksik olan: görselleştirme.

## Kilit içgörü: zaman serisi altyapısı zaten var

Sıfırdan client-side ring buffer kurmaya **gerek yok**. Sunucu zaten saatlik anlık görüntü tutuyor:

- `server/db.js` → `saves_history` tablosu
- `server/index.js:44-57` → her kayıtta, son 1 saatte yedek yoksa yeni anlık görüntü alınır; en yeni **48** kayıt tutulur (≈48 saat)
- `server/index.js:65-82` → `GET /api/backups` zaten JSON'dan `stage`, `highestStage`, `gold`, `crystals`, `totalPrestiges` alanlarını + `created_at` dönüyor

Yani saatlik bölge/altın/kristal/prestij eğrisi **hazır veriden** çizilebilir.

## Tasarım

- **Anlık istatistik tablosu** (kolay kısım): mevcut `stats` objesinden DPS, klik hasarı, altın/dk, koşu süresi, toplam çarpanlar. Yeni veri gerekmez.
- **Zaman serisi grafiği:** `StatsPanel.jsx` `GET /api/backups`'i çeker, tek `<svg>` polyline ile saatlik eğriyi çizer. Sayılar üstel büyüdüğü için **log ölçek** şart. Bağımlılık eklenmez.
- Prestij/aşkınlık sıçramaları grafikte görünür (backup'taki `totalPrestiges` değişimi işaretlenebilir).

## Faz 2 (opsiyonel, sonra)

Dakikalık çözünürlük gerçekten istenirse ayrı iş: `loop.js` tick'inde dakikada bir örnek → küçük ring buffer → save'e yaz. Ama **varsayılan öneri saatlik `saves_history`'yi yeniden kullanmak** — ekstra save alanı, migrate, boyut yönetimi yok.

## Dokunulacak dosyalar

Yeni `client/src/components/StatsPanel.jsx` (fetch + SVG grafik), `client/src/utils/format.js` (eksen etiketleri — mevcut `fmt` yeniden kullanılır), `client/src/App.jsx` (panel/sekme kaydı)

İlgili: [[10-mobil-cila]] (aynı faz)
