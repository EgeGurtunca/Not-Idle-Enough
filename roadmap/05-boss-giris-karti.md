---
tags: [roadmap]
faz: 3
sira: 5
durum: bekliyor
---

# Boss giriş kartı + ölümde altın patlaması

Boss savaşlarının "an" hissini büyüten iki görsel dokunuş. Mekanik değişiklik yok, saf his. Şu an `BattleArea.jsx`'te ne giriş kartı ne de ölüm patlaması var.

## Giriş kartı

- Boss belirdiğinde (`makeBoss` çağrısıyla, `gameStore.js` boss geçiş noktaları ~320) ~1.5 sn'lik overlay kart: boss adı, emoji, HP, ve varsa [[02-boss-modifiyeleri|modifiye]] rozeti + rengi.
- **Savaş duraklamaz** — kart overlay olarak akar (idle oyunda bekletme cezadır). Saf CSS: `styles.css`'e keyframe + `.boss-intro` sınıfı, `BattleArea.jsx` boss modu değişince kısa süreli render.
- Büyük boss (her 10. bölge) ile mini boss ayrışsın: büyükte ekran kenarı vinyet/titreme.

## Ölümde altın patlaması

- Boss ölünce (`gameStore.js` ~288-308, boss dalında `gold += reward`) HP çubuğundan altın parçacıkları fışkırır, altın rakamı kısa "pop" animasyonu yapar.
- Partikül: DOM/CSS parçacık yeter; Three.js sahnesine (`CreatureCanvas`) karıştırmaya gerek yok.
- [[02-boss-modifiyeleri|Hazineci]] (×5 ödül) ölümünde patlama gözle görülür büyük olsun — ödülün büyüklüğü görselden okunmalı.

## Ses kararı

`audio.js` dosya kullanmaz — `tone(freq, opts)` ve `arp(freqs, opts)` osilatör yardımcıları var. Mevcut durum:

- Boss belirince zaten `sfx.boss()` çalıyor (`audio.js:59-62`, düşük sawtooth). **Bunu giriş kartıyla senkron bırak**, ayrı sting ekleme.
- Boss ölünce zaten `sfx.bossWin()` çalıyor (`audio.js:63-65`, yükselen arp). **Ölüm patlaması salt görsel olsun**, üstüne ses ekleme — ses zaten var.

Yani bu madde **ses eklemez**, sadece görsel: `BattleArea.jsx` + `styles.css`.

## Dokunulacak dosyalar

`client/src/components/BattleArea.jsx` (kart + patlama), `client/src/styles.css` (keyframe'ler)

İlgili: [[02-boss-modifiyeleri]] (rozeti karta taşıma), [[06-bolgeye-gore-3d-sahne]] (aynı faz, his paketi)
