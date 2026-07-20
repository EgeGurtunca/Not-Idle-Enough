---
tags: [roadmap]
faz: 3
sira: 6
durum: bekliyor
---

# Bölgeye göre 3D sahne (ışık/sis/partikül)

500 bölgenin görsel olarak birbirinden ayrışması. Şu an Three.js sahnesi (`CreatureCanvas.jsx`) yaratığı çiziyor; ortam her bölgede aynı.

## Mevcut sahne (dokunulmayacak temel)

`CreatureCanvas.jsx:343-357` — dört sabit ışık, **sis (fog) yok**:

| Işık | Kod | Rol |
|---|---|---|
| Ambient | `AmbientLight(0x9a8fb8, 0.95)` | genel dolgu |
| Key | `DirectionalLight(0xffe6b8, 2.1)` | ana sıcak ışık |
| Rim | `PointLight(0xe4574b, 0.9, 22)` | kırmızı kenar vurgusu |
| Fill | `DirectionalLight(0x8ea0ff, 0.5)` | mavi karşı dolgu |

## Tasarım

- 500 bölgeyi **10 biyoma** böl (50'şer): çayır → orman → bataklık → çöl → buzul → volkan → gölge diyarı → gökyüzü → yıldız boşluğu → aşkın alem.
- Biyom başına değişen üç şey: **key ışığı + fog rengi** (biyom kimliğini bunlar taşısın), **fog yoğunluğu**, **ortam partikülü** (yaprak/kar/kıvılcım/yıldız tozu).
- **Ambient/rim/fill sabit kalsın** — yaratık okunabilirliği bozulmasın (renkler biyoma göre kaymasın, sadece atmosfer değişsin).
- `scene.fog = new THREE.FogExp2(renk, yoğunluk)` ekle (şu an yok). Biyom geçişinde (50'nin katı) 1–2 sn'lik renk `lerp`'i — ani atlama olmasın.

## Dikkat

> [!warning] Performans
> Kullanıcının CPU fanı bozuk — partikül sayısı düşük (≤100 sprite, tek `Points` objesi), her karede alloc yok. **Pixel ratio zaten sınırlı** (`renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`, satır 337) — o kısım hallolmuş. Kalite/partikül kapatma seçeneği `SettingsPanel`'e eklenebilir.

## Dokunulacak dosyalar

`client/src/components/CreatureCanvas.jsx` (fog + biyom tablosu + partikül katmanı), `client/src/game/constants.js` (biyom tanımları)

İlgili: [[05-boss-giris-karti]] (aynı faz, his paketi), [[10-mobil-cila]] (partikül kalite ayarı ortak)
