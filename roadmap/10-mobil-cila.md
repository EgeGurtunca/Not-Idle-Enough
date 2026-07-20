---
tags: [roadmap]
faz: 4
sira: 10
durum: bekliyor
---

# Mobil/dokunmatik cila

Oyun masaüstü tarayıcıda tasarlandı. Bir miktar duyarlılık zaten var; telefonda gerçekten oynanabilir hale getirmek için kalan boşluklar.

## Zaten yapılmış (dokunma)

- `styles.css:1458` — **920px**: `.main` tek kolona düşüyor, paneller savaş alanının altına kayıyor, topbar sarıyor.
- `styles.css:1483` — **560px**: NPC figürleri küçülüyor, kenar boşlukları daralıyor.
- `styles.css:1497` — `prefers-reduced-motion` ile ağır animasyonlar kısılıyor.
- `CreatureCanvas.jsx:337` — pixel ratio zaten `Math.min(window.devicePixelRatio, 2)` ile sınırlı. **Bu maddeyi tekrar yapma.**

## Kalan gerçek boşluklar

1. **Çift-dokunma zoom açık.** `client/index.html:5` viewport'ta `maximum-scale`/`user-scalable` yok, CSS'te `touch-action: manipulation` yok. Hızlı tıklama oyununda çift-tap zoom öldürücü ([[07-kombo-sayaci|kombo]] için de şart). → viewport meta + tıklama alanına `touch-action`.
2. **Panel yerleşimi tek kolon, gerçek sekme değil.** 920px altında paneller alt alta akıyor; NPC/Kahraman/Artifact/Prestij için sekmeli alt çubuk daha kullanışlı. → `App.jsx` dar ekranda sekme.
3. **Ses ilk-dokunma unlock kancası yok.** `audio.js` `ensure()` context'i resume ediyor ama iOS Safari ilk kullanıcı jesti şart — ilk dokunuşta bir kez tetikleyen kanca. → `audio.js` unlock, `App.jsx`/`main.jsx` ilk pointer olayına bağla.
4. **Dokunma hedefi boyutu.** Satın alma butonları / yetenek ikonları ≥44px teyit edilmeli (yaratık tıklama alanı zaten büyük). → `styles.css` mobil min-boyut.

## Opsiyonel

Kritik vuruşta `navigator.vibrate(10)` — varsa hoş, yoksa sorun değil.

## Test

Gerçek cihaz şart (DevTools emülasyonu dokunma gecikmesini göstermez). Vite dev sunucusu `--host` ile LAN'a açılıp telefondan bağlanılır.

## Dokunulacak dosyalar

`client/index.html` (viewport), `client/src/styles.css` (dokunma hedefleri), `client/src/App.jsx` (sekme + ses unlock bağlama), `client/src/game/audio.js` (unlock kancası)

İlgili: [[09-istatistik-grafigi]] (aynı faz), [[06-bolgeye-gore-3d-sahne]] (partikül kalite ayarı ortak)
