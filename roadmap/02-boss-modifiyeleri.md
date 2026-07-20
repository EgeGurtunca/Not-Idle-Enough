---
tags: [roadmap]
faz: 1
sira: 2
durum: tamam
---

# Boss çeşitliliği / modifiye'ler

Boss savaşlarına taktik katan rastgele modifiyeler. Mini boss'larda **%35**, büyük boss'larda **%60** ihtimalle bir modifiye çıkar; hiçbiri çıkmazsa normal savaş.

## Modifiyeler

| Modifiye | Etki | HP | Ödül | Süre | Özel |
|---|---|---|---|---|---|
| 🛡️ Zırhlı | NPC hasarına dirençli — tıklama önemli | ×1 | ×1.3 | ×1 | NPC hasarının sadece %35'i geçer |
| 💨 Aceleci | Kısa süre ama az can | ×0.5 | ×1 | ×0.55 | — |
| 💰 Hazineci | Çok canlı ama beş kat ödül | ×2.2 | ×5 | ×1.15 | — |
| 🔥 Öfkeli | Süre daha hızlı akar | ×1 | ×1.6 | ×1 | Süre ×1.5 hızda tükenir |

## Taktik etkisi

- **Zırhlı** aktif tıklamayı ödüllendirir (idle build'i cezalandırır) — Öfke yeteneğiyle (klik ×5) sinerjik.
- **Aceleci** düşük DPS'le bile alınabilir; risk düşük, ödül standart.
- **Hazineci** "dene-kaçın" kararı: HP ×2.2'yi kesemiyorsan süre boşa gider, kesebiliyorsan en iyi altın/dakika.
- **Öfkeli** Zaman Donması yeteneğinin (boss süresi donar) ana kullanım alanı.

## Kod

- Tanımlar + zar: `client/src/game/constants.js` → `BOSS_MODIFIERS`, `rollBossModifier(big)`
- Uygulama: `client/src/store/gameStore.js` → boss spawn'da `rollBossModifier`, `modifier` alanı; `dpsMult`/`drainMult` savaş döngüsünde
- Görsel: boss kartında modifiye rozeti (emoji + renk + açıklama)

İlgili: [[01-askinlik]], [[05-boss-giris-karti]] (modifiye rozetini giriş kartına taşıma fırsatı)
