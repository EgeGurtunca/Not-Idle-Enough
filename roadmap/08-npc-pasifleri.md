---
tags: [roadmap]
faz: 4
sira: 8
durum: bekliyor
---

# NPC pasifleri / sinerjiler

12 yoldaşın şu an tek farkı DPS sayısı. Her birine kimlik veren küçük bir pasif, "hangisini büyüteyim" kararını ilginçleştirir.

## Mevcut NPC şeması

`constants.js:124-137` → `NPCS` dizisi. Her giriş:

```js
{ id: 'buyucu', name: 'Büyücü', emoji: '🧙', projectile: '✨', unlockCost: 3e4, baseDps: 2e3 }
```

Pasif için yeni bir opsiyonel alan eklenir, örn:

```js
{ ...,  passive: { type: 'npcDpsMult', value: 0.05 } }
```

## Pasif fikirleri (NPC başına bir tane)

| NPC (`id`) | Pasif fikri |
|---|---|
| 🏹 Okçu (`okcu`) | Kritik şansı +%2 |
| 🛡️ Şövalye (`sovalye`) | Boss süresi +2 sn |
| 🧙 Büyücü (`buyucu`) | Diğer NPC'lerin DPS'i +%5 |
| 🗡️ Haydut (`haydut`) | Altın +%10 |
| ⚒️ Savaş Rahibi (`rahip`) | Başarım çarpanı etkisi +%10 |
| ⚔️ Ejderha Avcısı (`ejderavci`) | Boss'lara +%25 hasar |
| 🥷 Gölge Suikastçı (`suikastci`) | Kritik hasarı +%20 |
| 🌩️ Fırtına Çağırıcı (`firtina`) | Yetenek bekleme süreleri −%10 |
| 🔥 Ateş Dansçısı (`ates`) | Klik hasarına DPS'in %1'i eklenir |
| ❄️ Buz Kraliçesi (`buz`) | [[02-boss-modifiyeleri\|Öfkeli]] boss'ta süre akışı normalleşir |
| 🌳 Kadim Ent (`ent`) | Offline kazanç +%20 |
| ⏳ Zaman Bekçisi (`zaman`) | [[03-altin-yaratiklar\|Altın Yaratık]] daha sık belirir |

- Pasif, NPC **seviye 1'de** açılır (satın alma nedeni); ileride seviye eşiğinde güçlenebilir.
- Sinerji setleri sonra ("Okçu+Haydut ikisi de 50+") — ilk sürümde YAGNI.

## Nereye bağlanacak

Pasifler `formulas.js`'teki mevcut çarpan fonksiyonlarına ek terim olarak girer. Örnek — Büyücü'nün "+%5 NPC DPS"i `totalDps` içine, aktif NPC seviyelerine bakarak eklenir. Çoğu pasif zaten var olan bir çarpanı besliyor (`critChance`, `goldMultiplier`, `bossTime`, `stardustDamageMult` gibi), yeni bir formül ailesi gerekmez.

## Dokunulacak dosyalar

`client/src/game/constants.js` (`NPCS`'e `passive` alanı), `client/src/game/formulas.js` (ilgili fonksiyonlara ek terim), `client/src/components/NpcPanel.jsx` (pasif rozeti/tooltip)

İlgili: [[03-altin-yaratiklar]] (Zaman Bekçisi bağı), [[02-boss-modifiyeleri]] (Buz Kraliçesi bağı), [[07-kombo-sayaci]] (Ateş Dansçısı klik pasifi)
