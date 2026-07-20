# Solo Fan Idle — Geliştirme Yol Haritası

![[Roadmap.base]]

Oyunun çekirdeği tamam (tıklama savaşı, 500 bölge, boss/mini-boss, 12 yoldaş, kahraman
eğitimleri, prestij + kristal upgrade'leri, 30 artifact + gacha, aktif yetenekler, sesler,
28 başarım, Three.js 3D yaratıklar, kayıt yedekleri). Bundan sonrası derinlik ve tutundurma.

## Faz 1 — Endgame ve taktik derinlik
1. **[[01-askinlik|Aşkınlık (2. prestij katmanı)]]** — Bölge 500'e ulaşınca açılır. Kristaller dahil koşu
   ilerlemesi sıfırlanır; karşılığında **Yıldız Tozu 💫** ve güçlü kalıcı çarpanlar. Artifact'ler
   ve başarımlar korunur. Sonsuz endgame döngüsü.
2. **[[02-boss-modifiyeleri|Boss çeşitliliği / modifiye'ler]]** — Zırhlı (NPC hasarına dirençli), Aceleci (kısa süre/az HP),
   Hazineci (zor ama ×5 ödül), Öfkeli (süre hızlı akar). Savaşlara taktik.

## Faz 2 — Tutundurma kancaları
3. **[[03-altin-yaratiklar|Altın Yaratıklar]]** — Ara sıra beliren, tıklanınca altın patlaması/buff veren nadir yaratık.
4. **[[04-kilometre-tasi-odulleri|Kilometre taşı ödülleri]]** — Bölge 25/50/75… ilk kez ulaşınca tek seferlik ödül.

## Faz 3 — His ve atmosfer
5. [[05-boss-giris-karti|Boss giriş kartı + ölümde altın patlaması]]
6. [[06-bolgeye-gore-3d-sahne|Bölgeye göre 3D sahne (ışık/sis/partikül)]]
7. [[07-kombo-sayaci|Kombo sayacı (hızlı tıklama çarpanı)]]

## Faz 4 — NPC kimliği ve QoL
8. [[08-npc-pasifleri|NPC pasifleri / sinerjiler]]
9. [[09-istatistik-grafigi|İstatistik grafiği]]
10. [[10-mobil-cila|Mobil/dokunmatik cila]]

## Teknik not
Aşkınlık çarpanları büyüdükçe sayılar JS `~1.8e308` tavanına yaklaşabilir; gerekirse
bilimsel/bignum katmanı değerlendirilecek (Bölge 500'de HP ~1e89, şimdilik güvenli).

---
**Durum:** Faz 1–2 (ilk 4 madde: Aşkınlık, Boss modifiyeleri, Altın Yaratıklar, Kilometre
taşları) **tamamlandı ve kodda çalışıyor**. Sırada Faz 3 (his ve atmosfer: boss giriş
kartı, biyom sahneleri, kombo sayacı) ve Faz 4 (NPC pasifleri, istatistik grafiği, mobil cila).
