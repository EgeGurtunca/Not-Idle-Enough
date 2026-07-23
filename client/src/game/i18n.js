// Basit i18n: kütüphane yok. Türkçe metinler kodda olduğu gibi kalır (fallback),
// İngilizce burada. Varsayılan dil 'en'. lang gameStore'da tutulur, kayda yazılır.
import { useGameStore } from '../store/gameStore.js';

// ---- Arayüz metinleri (en + tr). {x} = interpolasyon. ----
export const STR = {
  en: {
    // Tabs
    tab_hero: 'Hero', tab_npc: 'Companions', tab_artifact: 'Chest', tab_prestige: 'Prestige',
    tab_transcend: 'Ascension', tab_realm: 'Realm', tab_achievements: 'Achievements', tab_settings: 'Settings',
    loading: 'Opening the dungeon gates…',
    // TopBar
    record: 'Record · Region {n}', record_run: ' · run {n}',
    tip_gold: 'Gold', tip_crystal: 'Crystals', tip_stardust: 'Stardust',
    tip_essence: 'Essence — permanent multiplier earned by Realm Shift (Region 1000+)',
    realm_label: ' · Realm {r}',
    // BattleArea
    region: 'Region {n}', boss_region: 'Boss region',
    big_boss: 'BIG BOSS', mini_boss: 'MINI BOSS', boss_short: 'BOSS',
    attack: 'Attack', challenge_boss: "⚔️ Challenge the Boss",
    boss_timer: '⏱ {s}s — beat it before it flees!',
    hunt_hint: 'Hunted: {k}/{r} — kill creatures to summon the boss',
    tip_click_dmg: 'Click damage', tip_dps: 'Companion damage (per second)',
    combo: '🔥 {n}x combo (×{m})', tip_combo: 'Rapid-click multiplier',
    golden_gold: 'Gold burst!', golden_frenzy: 'Gold Frenzy buff!',
    // skills
    skill_locked: '{name} — unlocks at Region {n}',
    skill_tip: '{name} — {desc} ({dur}s, cooldown {cd}s)',
    // Hero panel
    hero_note: 'The hero only strikes when you click. Leveling raises click damage; every {n} levels the damage doubles.',
    hero: 'Hero', level: 'Level', lv: 'lv', dmg_short: 'dmg',
    crit_line: '🎯 {c}% crit · 💢 ×{m} crit damage',
    milestone_note: "Level {n}: damage ×2",
    hero_up_note: 'Training is per-run; reset on prestige.',
    done: 'Completed', upgrade: 'Upgrade', buy: 'Buy ×{n}', max_buy: 'Max ×{n}',
    // Npc panel
    npc_note: 'Companions strike automatically — no clicking needed. Hire and level them with gold.',
    npc_locked: 'Auto-strikes once hired · 🗡️ {d}/s',
    hire: 'Hire ×{n}', mystery_npc: '{n} more companions await you',
    passive_on: '✦ Passive (lv {n}): {label}', passive_off: '🔒 Passive (lv {n}): {label}',
    lvl_dps: 'Level {lv} · 🗡️ {d}/s',
    // Artifact panel
    artifact_note: "Open ancient chests with crystals; each chest yields an artifact you don't own yet, and owned ones leave the loot pool. Each opening raises the price a bit. To level artifacts up, tap one and upgrade with crystals (max lv {n}). Artifacts survive prestige.",
    open_chest: '🗝️ Open Chest', chest_again: '🗝️ Open Again',
    collection_full: 'Collection complete — {a}/{a}! Upgrades are now done with crystals.',
    collection: 'Collection: {o}/{t} · {p} openings',
    ancient_chest: 'Ancient Chest', opening_chest: 'Opening the chest…',
    oz_chest: 'Essence Chest', open_oz_chest: '🌀 Open Essence Chest',
    oz_collection: 'Essence artifacts: {o}/{t} · chests opened: {p}',
    is_new: '· NEW!', lvl_dot: '· Level {n}', maxi: 'Max', close: 'Close',
    unknown_artifact: '❔ Unknown Artifact', unknown_hint: 'Open chests to find out what it is.',
    odds_remaining: ' ({n})',
    // effect labels
    eff_click: 'Click damage', eff_dps: 'NPC damage', eff_gold: 'Gold gain',
    eff_critChance: 'Crit chance', eff_critMult: 'Crit damage', eff_bossTime: 'Boss time',
    eff_offline: 'Offline gain', eff_crystal: 'Crystal gain',
    eff_val_pct: '{label} +{v}%', eff_val_sec: '{label} +{v}s',
    // Prestige panel
    prestige_locked: "Prestige unlocks when you first reach <b>Region {n}</b>. It resets your progress and grants <b>crystals 💎</b> — crystals buy permanent power.",
    highest: 'Highest: Region {h} / {n}',
    prestige_note: 'Prestige: this run\'s gold, hero, training and companions reset; you earn crystals based on the region reached. Crystals, these upgrades and artifacts are permanent.',
    prestige_gain: 'This run: Region {n} → ',
    reset_confirm: 'All progress will reset. Are you sure?',
    prestige_yes: 'Yes, reset and take +{n} 💎', cancel: 'Cancel',
    prestige_btn: '✦ Prestige',
    prestige_again_hint: 'To prestige again, reach Region {n} this run ({r}/{n})',
    starting_gold_note: 'New runs start with 🪙 {n}.',
    // Transcend panel
    transcend_locked: "Ascension unlocks when you first reach <b>Region {n}</b>. It resets your entire run, crystals included; in return you gain <b>Stardust 💫</b> — permanent, very powerful multipliers. Artifacts and achievements are kept.",
    transcend_note: "Ascension: this cycle's gold, hero, companions, <b>crystals</b> and prestige upgrades reset. Stardust is earned from your banked crystals; Stardust, the multipliers below and artifacts are permanent.",
    transcend_gain: 'Banked 💎 {n} → ',
    transcend_confirm: 'The whole cycle including crystals will reset. Are you sure?',
    transcend_yes: 'Yes, ascend and take +{n} 💫',
    transcend_btn: '✦ Ascend',
    transcend_hint: 'Bank crystals (by prestiging) to ascend. Now: 💎 {n}',
    starting_crystals_note: 'After ascension you start with 💎 {n}.',
    transcend_count: 'You have ascended {n} times.',
    realm_locked: "Realm Shift unlocks when you first reach <b>Region {n}</b>. You step into a brand-new realm from Region 1: the whole run, crystals, <b>Stardust and its upgrades</b> all reset. In return you earn <b>Essence 🌀</b>, and every realm permanently doubles all damage & gold. Artifacts and achievements are kept.",
    realm_note: "Realm Shift: everything below this layer resets — run, crystals, <b>Stardust + Stardust upgrades</b>. Essence is earned from banked Stardust; Essence and realm bonuses are permanent and never reset.",
    realm_gain: 'Banked 💫 {n} → ',
    realm_confirm: 'Stardust and everything below it will reset. Are you sure?',
    realm_yes: 'Yes, shift realms and take +{n} 🌀',
    realm_btn: '🌀 Shift Realm',
    realm_hint: 'Bank at least 💫 20K Stardust (by ascending) to shift realms. Now: 💫 {n}',
    realm_effect: 'Realm {r} — permanent realm bonus: all damage & gold ×{b}',
    toast_leap: '🐇 Colossal blow! Leaped {n} extra region(s) → Region {s}',
    // Achievements panel
    ach_summary: '🏆 {c}/{t} achievements · ',
    ach_bonus: '+{p}% damage and +{p}% gold',
    st_kills: '🗡️ Creatures killed: {n}', st_boss: '👹 Bosses killed: {n}',
    st_clicks: '👆 Total clicks: {n}', st_crits: '💢 Total crits: {n}',
    st_gold: '🪙 Gold earned: {n}', st_maxcrit: '⚡ Biggest crit: {n}',
    spark_collecting: '📈 Gold/s graph collecting…', spark_head: '📈 Gold/s · now {n}',
    // Settings
    set_sound: 'Sound Effects', set_sound_sub: 'Hit, crit, boss and chest sounds',
    on: 'On', off: 'Off',
    set_io: 'Export / Import Save', set_io_sub: 'Download as JSON or restore',
    download: 'Download', upload: 'Upload',
    set_reset: 'Reset Game', set_reset_sub: 'Wipes all progress — export a backup first if unsure',
    reset_yes: 'Yes, reset', reset: 'Reset',
    set_lang: 'Language', set_lang_sub: 'Interface language',
    backups_head: 'Auto backups (hourly, last 48) · ', refresh: 'refresh',
    backups_loading: 'Loading…', backups_none: 'No backups yet — one is taken automatically each hour as the game saves.',
    backup_row: 'Region {s} · record {h} · 🪙 {g} · 💎 {c}',
    restore: 'Restore', yes: 'Yes',
    msg_downloaded: 'Save downloaded.',
    msg_imported: 'Save imported.',
    msg_import_fail: "Could not read file: not a valid save JSON.",
    msg_reset: 'Game reset.',
    save_local_note: 'Your progress is saved in this browser. Export a backup before clearing site data or switching devices.',
    // Offline modal
    offline_title: 'While you were away…',
    offline_body: 'Your companions kept hunting for {t}.',
    offline_collect: 'Collect and continue',
    // AmountToggle
    amount_label: 'Purchase amount',
    // toasts (store)
    toast_ach: '🏆 Achievement ready to claim: {emoji} {name}{extra}',
    toast_ach_extra: ' (+{n} more)',
    ach_claim: 'Claim',
    ach_claim_all: 'Claim all ({n})',
    toast_milestone: '🏁 Region {s}! +{c} 💎',
    toast_transcend: '✦ Ascension! +{n} 💫 Stardust',
    toast_realm: '🌀 Welcome to Realm {r}! +{n} Essence',
    toast_golden_gold: '💰 Gold Creature! +{n} gold',
    toast_golden_frenzy: '✨ Gold Frenzy! 20s ×7 click and ×3 gold',
    elite: 'Elite', creature: 'Creature',
  },
  tr: {
    tab_hero: 'Kahraman', tab_npc: 'Yoldaşlar', tab_artifact: 'Sandık', tab_prestige: 'Prestij',
    tab_transcend: 'Aşkınlık', tab_realm: 'Diyar', tab_achievements: 'Başarım', tab_settings: 'Ayarlar',
    loading: 'Zindan kapıları açılıyor…',
    record: 'Rekor · Bölge {n}', record_run: ' · {n}. macera',
    tip_gold: 'Altın', tip_crystal: 'Kristal', tip_stardust: 'Yıldız Tozu',
    tip_essence: 'Öz — Diyar Geçişi ile kazanılan kalıcı çarpan (Bölge 1000+)',
    realm_label: ' · Diyar {r}',
    region: 'Bölge {n}', boss_region: 'Boss bölgesi',
    big_boss: 'BÜYÜK BOSS', mini_boss: 'MİNİ BOSS', boss_short: 'BOSS',
    attack: 'Saldır', challenge_boss: "⚔️ Boss'a Meydan Oku",
    boss_timer: '⏱ {s}sn — boss kaçmadan yetiş!',
    hunt_hint: 'Avlanan: {k}/{r} — boss için yaratıkları kes',
    tip_click_dmg: 'Klik hasarı', tip_dps: 'Yoldaş hasarı (saniyede)',
    combo: '🔥 {n}x kombo (×{m})', tip_combo: 'Hızlı klik çarpanı',
    golden_gold: 'Altın patlaması!', golden_frenzy: 'Altın Coşkusu buff!',
    skill_locked: "{name} — Bölge {n}'de açılır",
    skill_tip: '{name} — {desc} ({dur}sn, bekleme {cd}sn)',
    hero_note: 'Kahraman yalnızca sen tıklayınca vurur. Seviye aldıkça klik hasarı artar; her {n}. seviyede hasar ikiye katlanır.',
    hero: 'Kahraman', level: 'Seviye', lv: 'sv', dmg_short: 'hasar',
    crit_line: '🎯 %{c} kritik · 💢 ×{m} kritik hasarı',
    milestone_note: "Seviye {n}'te hasar ×2",
    hero_up_note: 'Eğitimler bu maceraya özeldir; prestijde sıfırlanır.',
    done: 'Tamamlandı', upgrade: 'Geliştir', buy: 'Al ×{n}', max_buy: 'Maks ×{n}',
    npc_note: 'Yoldaşlar tıklamana gerek kalmadan otomatik vurur. Altınla işe al, seviye atlat.',
    npc_locked: 'İşe alınca otomatik vurur · 🗡️ {d}/sn',
    hire: 'İşe Al ×{n}', mystery_npc: '{n} yoldaş daha seni bekliyor',
    passive_on: '✦ Pasif (sv {n}): {label}', passive_off: '🔒 Pasif (sv {n}): {label}',
    lvl_dps: 'Seviye {lv} · 🗡️ {d}/sn',
    artifact_note: "Kristallerle kadim sandıklar aç; her sandıktan koleksiyonunda olmayan bir artifact çıkar ve sahip oldukların loot havuzundan düşer. Her açılışta sandığın fiyatı biraz artar. Seviye atlatmak için artifact'e tıklayıp kristalle geliştir (maks sv {n}). Artifact'ler prestijde kaybolmaz.",
    open_chest: '🗝️ Sandık Aç', chest_again: '🗝️ Tekrar Aç',
    collection_full: 'Koleksiyon tamamlandı — {a}/{a}! Artık geliştirmeler kristalle yapılır.',
    collection: 'Koleksiyon: {o}/{t} · {p} çekiliş',
    ancient_chest: 'Kadim Sandık', opening_chest: 'Sandık açılıyor…',
    oz_chest: 'Öz Sandığı', open_oz_chest: '🌀 Öz Sandığı Aç',
    oz_collection: 'Öz artifact\'leri: {o}/{t} · açılan sandık: {p}',
    is_new: '· YENİ!', lvl_dot: '· Seviye {n}', maxi: 'Maks', close: 'Kapat',
    unknown_artifact: '❔ Bilinmeyen Artifact', unknown_hint: 'Sandıklardan çıkarsa ne olduğunu öğrenirsin.',
    odds_remaining: ' ({n})',
    eff_click: 'Klik hasarı', eff_dps: 'NPC hasarı', eff_gold: 'Altın kazancı',
    eff_critChance: 'Kritik şansı', eff_critMult: 'Kritik hasarı', eff_bossTime: 'Boss süresi',
    eff_offline: 'Çevrimdışı kazanç', eff_crystal: 'Kristal kazancı',
    eff_val_pct: '{label} +%{v}', eff_val_sec: '{label} +{v}sn',
    prestige_locked: "Prestij, <b>Bölge {n}</b>'e ilk ulaştığında açılır. İlerlemeni sıfırlayıp karşılığında <b>kristal 💎</b> kazanırsın — kristaller kalıcı güç satın alır.",
    highest: 'En yüksek: Bölge {h} / {n}',
    prestige_note: 'Prestij: bu maceradaki altın, kahraman, eğitimler ve yoldaşlar sıfırlanır; ulaştığın bölgeye göre kristal kazanırsın. Kristaller, buradaki geliştirmeler ve artifact\'ler kalıcıdır.',
    prestige_gain: 'Bu macera: Bölge {n} → ',
    reset_confirm: 'Tüm ilerleme sıfırlanacak. Emin misin?',
    prestige_yes: 'Evet, sıfırla ve +{n} 💎 al', cancel: 'Vazgeç',
    prestige_btn: '✦ Prestij Yap',
    prestige_again_hint: "Tekrar prestij için bu macerada Bölge {n}'e ulaş ({r}/{n})",
    starting_gold_note: 'Yeni maceralar 🪙 {n} ile başlar.',
    transcend_locked: "Aşkınlık, <b>Bölge {n}</b>'e ilk ulaştığında açılır. Kristaller dahil tüm koşu ilerlemeni sıfırlar; karşılığında <b>Yıldız Tozu 💫</b> kazanırsın — kalıcı ve çok güçlü çarpanlar. Artifact'ler ve başarımlar korunur.",
    transcend_note: "Aşkınlık: bu döngüdeki altın, kahraman, yoldaşlar, <b>kristaller</b> ve prestij geliştirmeleri sıfırlanır. Yıldız Tozu bankandaki kristale göre kazanılır; Yıldız Tozu, aşağıdaki çarpanlar ve artifact'ler kalıcıdır.",
    transcend_gain: 'Bankadaki 💎 {n} → ',
    transcend_confirm: 'Kristaller dahil tüm döngü sıfırlanacak. Emin misin?',
    transcend_yes: 'Evet, aşkınlaş ve +{n} 💫 al',
    transcend_btn: '✦ Aşkınlaş',
    transcend_hint: 'Aşkınlaşmak için kristal biriktir (prestij yaparak). Şu an: 💎 {n}',
    starting_crystals_note: 'Aşkınlık sonrası 💎 {n} kristalle başlarsın.',
    transcend_count: 'Toplam {n} kez aşkınlaştın.',
    realm_locked: "Diyar Geçişi, <b>Bölge {n}</b>'e ilk ulaştığında açılır. Yepyeni bir diyara Bölge 1'den adım atarsın: tüm koşu, kristaller, <b>Yıldız Tozu ve geliştirmeleri</b> sıfırlanır. Karşılığında <b>Öz 🌀</b> kazanırsın ve her diyar tüm hasar ile altını kalıcı olarak ikiye katlar. Artifact'ler ve başarımlar korunur.",
    realm_note: "Diyar Geçişi: bu katmanın altındaki her şey sıfırlanır — koşu, kristaller, <b>Yıldız Tozu + geliştirmeleri</b>. Öz bankadaki Yıldız Tozu'na göre kazanılır; Öz ve diyar bonusları kalıcıdır, asla sıfırlanmaz.",
    realm_gain: 'Bankadaki 💫 {n} → ',
    realm_confirm: 'Yıldız Tozu ve altındaki her şey sıfırlanacak. Emin misin?',
    realm_yes: 'Evet, diyar değiştir ve +{n} 🌀 al',
    realm_btn: '🌀 Diyar Değiştir',
    realm_hint: 'Diyar değiştirmek için en az 💫 20K Yıldız Tozu biriktir (aşkınlaşarak). Şu an: 💫 {n}',
    realm_effect: 'Diyar {r} — kalıcı diyar bonusu: tüm hasar ve altın ×{b}',
    toast_leap: '🐇 Muazzam darbe! {n} ekstra bölge atlandı → Bölge {s}',
    ach_summary: '🏆 {c}/{t} başarım · ',
    ach_bonus: '+%{p} hasar ve +%{p} altın',
    st_kills: '🗡️ Kesilen yaratık: {n}', st_boss: '👹 Kesilen boss: {n}',
    st_clicks: '👆 Toplam klik: {n}', st_crits: '💢 Toplam kritik: {n}',
    st_gold: '🪙 Kazanılan altın: {n}', st_maxcrit: '⚡ En büyük kritik: {n}',
    spark_collecting: '📈 Altın/sn grafiği toplanıyor…', spark_head: '📈 Altın/sn · şu an {n}',
    set_sound: 'Ses Efektleri', set_sound_sub: 'Vuruş, kritik, boss ve sandık sesleri',
    on: 'Aç', off: 'Kapat',
    set_io: 'Kaydı Dışa / İçe Aktar', set_io_sub: 'JSON dosyası olarak indir veya geri yükle',
    download: 'İndir', upload: 'Yükle',
    set_reset: 'Oyunu Sıfırla', set_reset_sub: 'Tüm ilerleme silinir — emin değilsen önce dışa aktarıp yedek al',
    reset_yes: 'Evet, sıfırla', reset: 'Sıfırla',
    set_lang: 'Dil', set_lang_sub: 'Arayüz dili',
    backups_head: 'Otomatik yedekler (saatlik, son 48) · ', refresh: 'yenile',
    backups_loading: 'Yükleniyor…', backups_none: 'Henüz yedek yok — oyun kaydettikçe saatte bir otomatik alınır.',
    backup_row: 'Bölge {s} · rekor {h} · 🪙 {g} · 💎 {c}',
    restore: 'Geri Yükle', yes: 'Evet',
    msg_downloaded: 'Kayıt indirildi.',
    msg_imported: 'Kayıt içe aktarıldı.',
    msg_import_fail: "Dosya okunamadı: geçerli bir kayıt JSON'u değil.",
    msg_reset: 'Oyun sıfırlandı.',
    save_local_note: 'İlerlemen bu tarayıcıda saklanıyor. Site verilerini temizlemeden ya da cihaz değiştirmeden önce dışa aktarıp yedek al.',
    offline_title: 'Sen yokken…',
    offline_body: 'Yoldaşların {t} boyunca avlanmaya devam etti.',
    offline_collect: 'Topla ve devam et',
    amount_label: 'Satın alma miktarı',
    toast_ach: '🏆 Başarım almaya hazır: {emoji} {name}{extra}',
    toast_ach_extra: ' (+{n} daha)',
    ach_claim: 'Al',
    ach_claim_all: 'Hepsini al ({n})',
    toast_milestone: '🏁 Bölge {s}! +{c} 💎',
    toast_transcend: '✦ Aşkınlık! +{n} 💫 Yıldız Tozu',
    toast_realm: "🌀 Diyar {r}'e hoş geldin! +{n} Öz",
    toast_golden_gold: '💰 Altın Yaratık! +{n} altın',
    toast_golden_frenzy: '✨ Altın Coşkusu! 20sn ×7 klik ve ×3 altın',
    elite: 'Elit', creature: 'Yaratık',
  },
};

// ---- Veri çevirileri (yalnızca İngilizce; TR constants'tan gelir) ----
export const EN = {
  npc: { okcu: 'Archer', sovalye: 'Knight', buyucu: 'Wizard', haydut: 'Rogue', rahip: 'War Priest', ejderavci: 'Dragon Hunter', suikastci: 'Shadow Assassin', firtina: 'Storm Caller', ates: 'Fire Dancer', buz: 'Ice Queen', ent: 'Ancient Ent', zaman: 'Time Keeper' },
  npcPassive: { okcu: '+8% crit chance', sovalye: '+15% all damage', buyucu: '+20% gold', haydut: '+50% crit damage', rahip: '+20% all damage', ejderavci: '+30% gold', suikastci: '+10% crit chance', firtina: '+30% all damage', ates: '+75% crit damage', buz: '+40% gold', ent: '+40% all damage', zaman: '+50% gold' },
  creature: { fare: 'Sewer Rat', yarasa: 'Vampire Bat', yilan: 'Venom Snake', kurt: 'Hungry Wolf', domuz: 'Wild Boar', orumcek: 'Giant Spider', goblin: 'Goblin', trol: 'Cave Troll', tilki: 'Trickster Fox', iskelet: 'Skeleton Warrior', zombi: 'Zombie', hortlak: 'Wraith', akrep: 'Giant Scorpion', kertenkele: 'Lizard Warrior', timsah: 'Swamp Croc', vampir: 'Vampire Count', kurtadam: 'Werewolf', cadi: 'Dark Witch', dev: 'Mountain Giant', golem: 'Stone Golem', sahin: 'Crimson Hawk', wyvern: 'Young Wyvern', kadimejder: 'Ancient Dragon', rex: 'Bony Rex' },
  zone: ['Rotten Sewers', 'Howling Forest', 'Goblin Pass', 'Bone Pit', 'Toxic Swamp', 'Cursed Palace', 'Stone Giants Plateau', 'Dragon Lair'],
  boss: ['Sewer Overlord', 'Alpha Wolf', 'Goblin King', 'Bone Lord', 'Swamp Horror', 'Dark Count', 'Stone King', 'Ancient Dragon'],
  mod: { zirhli: ['Armored', 'Resists NPC damage — your clicks matter!'], aceleci: ['Hasty', 'Short timer but low HP'], hazineci: ['Treasure', 'Very tanky but five times the reward'], ofkeli: ['Enraged', 'Timer drains faster'] },
  skill: { ofke: ['Rage', 'Click damage ×5'], altinYagmuru: ['Gold Rain', 'Gold gain ×3'], zamanDonmasi: ['Time Freeze', 'Boss timer freezes'], savasEmri: ['War Cry', 'NPC damage ×3'] },
  heroUp: { kritSans: ['Crit Chance', 'Crit chance on clicks +1% (per level)'], kritHasar: ['Crit Damage', 'Crit multiplier +10% (base ×2)'], altinBereketi: ['Golden Bounty', 'All gold gain +5% (per level)'] },
  presUp: { keskinVurus: ['Sharp Strike', 'Click damage +50% (per level)'], komutanlik: ['Command', 'NPC damage +50% (per level)'], altinDokunus: ['Golden Touch', 'Gold gain +35% (per level)'], zamanBukucu: ['Time Bender', 'Boss timer +2 seconds (per level)'], surekAvi: ['Drive Hunt', 'Creatures needed for boss −1 (per level)'], hazirBaslangic: ['Head Start', 'Start each new run with gold (1000 × 10^(lv−1))'] },
  starUp: { yildizGucu: ['Star Power', 'All damage (click + NPC) +40% (per level)'], yildizServeti: ['Star Wealth', 'Gold gain +50% (per level)'], yildizBilgeligi: ['Star Wisdom', 'Crystal gain +30% (per level)'], yildizKalkani: ['Star Shield', 'Boss timer +3 seconds (per level)'], yildizBaslangici: ['Star Start', 'Start each ascension with crystals (50 × 3^(lv−1))'], otoSeviye: ['Auto-Level', 'Automatically spends gold on the cheapest upgrade'], otoMeydan: ['Auto-Challenge', 'Automatically re-challenges a missed boss'], otoPrestij: ['Auto-Prestige', 'Auto-prestiges when stuck (no progress for 30s)'], yildizYarigi: ['Star Rift', 'Milestone interval −1 (damage ×2 comes more often)'] },
  essUp: { ozGucu: ['Essence Power', 'All damage (click + NPC) +60% (per level)'], ozBilgeligi: ['Essence Wisdom', 'Crystal gain +50% (per level)'], ozHafizasi: ['Essence Memory', 'Keep 10% of your Stardust per level on Realm Shift'], bolgeSicramasi: ['Region Leap', 'Overkill a boss to skip extra regions: 10^10× damage = +1, each extra 10^5× = +1 (max = level)'] },
  ach: {
    kill1: ['Rookie Hunter', 'Kill 100 creatures'], kill2: ['Seasoned Hunter', 'Kill 2,500 creatures'], kill3: ['Veteran Hunter', 'Kill 25,000 creatures'], kill4: ['Legendary Hunter', 'Kill 250,000 creatures'],
    boss1: ['Boss Bane', 'Kill 10 bosses'], boss2: ['Boss Nightmare', 'Kill 100 bosses'], boss3: ['Boss Executioner', 'Kill 1,000 bosses'],
    click1: ['Finger Warmup', 'Click 500 times'], click2: ['Click Master', 'Click 5,000 times'], click3: ['Steel Finger', 'Click 50,000 times'],
    crit1: ['Lucky Hit', 'Land 100 crits'], crit2: ['Crit Machine', 'Land 2,500 crits'],
    stage1: ['Wayfarer', 'Reach Region 25'], stage2: ['Explorer', 'Reach Region 50'], stage3: ['Conqueror', 'Reach Region 100'], stage4: ['Deep Diver', 'Reach Region 250'], stage5: ['Summit Holder', 'Reach Region 500'],
    prest1: ['Rebirth', 'Prestige for the first time'], prest2: ['Loop Master', 'Prestige 5 times'], prest3: ['Eternal Loop', 'Prestige 15 times'],
    art1: ['Collector Apprentice', 'Collect 5 artifacts'], art2: ['Collector', 'Collect 15 artifacts'], art3: ['Ancient Collection', 'Collect 30 artifacts'],
    pull1: ['Chest Curious', 'Open 10 chests'], pull2: ['Chest Addict', 'Open 30 chests'],
    gold1: ['Billionaire', 'Earn 1B gold total'], gold2: ['Quintillionaire', 'Earn 1Qi gold total'], gold3: ['Gold God', 'Earn 1e30 gold total'],
    stage6: ['Transcendent', 'Reach Region 750'], stage7: ['Realm Walker', 'Reach Region 1000'],
    trans1: ['Star Born', 'Ascend for the first time'], trans2: ['Constellation', 'Ascend 10 times'],
    realm1: ['Dimension Scout', 'Perform your first Realm Shift'], realm2: ['Multiversal', 'Reach Realm 5'],
    ozart1: ['Essence Gatherer', 'Collect 6 Essence artifacts'], ozart2: ['Vault of Infinity', 'Collect 12 Essence artifacts'],
  },
  artifact: {
    pasliKilic: 'Rusty Sword', tahtaKalkan: 'Wooden Shield', bakirYuzuk: 'Copper Ring', sansliZar: 'Lucky Die', deriEldiven: 'Leather Glove', demirTilsim: 'Iron Charm', kirikKumSaati: 'Broken Hourglass', eskiHarita: 'Worn Map', kemikKolye: 'Bone Necklace', camKure: 'Glass Orb',
    gumusPala: 'Silver Saber', savasBorusu: 'War Horn', altinKese: 'Gold Pouch', nisanDurbunu: 'Marksman Scope', zumrutYuzuk: 'Emerald Ring', kumSaati: 'Hourglass', miknatisEld: 'Magnet Glove', geceFeneri: 'Night Lantern',
    ejderDisi: 'Dragon Fang Dagger', kadimSancak: 'Ancient Banner', midasEli: 'Hand of Midas', suikastGozu: "Assassin's Eye", kanliYakut: 'Blood Ruby', yildizPusula: 'Star Compass',
    titanYumrugu: 'Titan Fist', orduNisani: 'Army Medal', ejderHazinesi: 'Dragon Hoard', zamanKristali: 'Time Crystal',
    tanriKatili: 'Godslayer Sword', ejderKalbi: 'Ancient Dragon Heart',
    ozKilic: 'Essence Blade', ozZirh: 'Essence Aegis', ozSikke: 'Essence Coin',
    kaosPencesi: 'Chaos Claw', boyutPusulasi: 'Dimension Compass', gecitAnahtari: 'Gate Key',
    yildizYutan: 'Star Devourer', alevCekirdegi: 'Comet Core', zamanMotoru: 'Time Engine',
    diyarKirici: 'Realmbreaker', sonsuzlukGozu: 'Eye of Infinity', ilkOz: 'Primordial Essence',
  },
  rarity: { siradan: 'Common', olagandisi: 'Uncommon', nadir: 'Rare', epik: 'Epic', efsanevi: 'Legendary' },
};

// ---- Yardımcılar ----
export function t(lang, key, vars) {
  let s = (STR[lang] && STR[lang][key]) ?? STR.en[key] ?? key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

// Veri ismi: en'de EN sözlüğünden, tr'de fallback (constants değeri)
export function dn(lang, kind, id, trVal) {
  if (lang === 'en') {
    const v = EN[kind]?.[id];
    return (Array.isArray(v) ? v[0] : v) ?? trVal;
  }
  return trVal;
}
// [name, desc] taşıyan veriler
export function dnd(lang, kind, id, trName, trDesc) {
  if (lang === 'en') {
    const v = EN[kind]?.[id];
    if (v) return { name: v[0], desc: v[1] };
  }
  return { name: trName, desc: trDesc };
}
// dizi (zone/boss) tier'e göre
const tier = (stage) => Math.floor((stage - 1) / 10) % 8;
export function zoneNameL(lang, stage, trVal) {
  return lang === 'en' ? EN.zone[tier(stage)] : trVal;
}
export function bossNameL(lang, stage, trVal) {
  return lang === 'en' ? EN.boss[Math.floor((stage - 1) / 10) % 8] : trVal;
}

// React hook: lang'e abone olur, bağlı yardımcılar döndürür
export function useT() {
  const lang = useGameStore((s) => s.lang);
  return {
    lang,
    t: (key, vars) => t(lang, key, vars),
    dn: (kind, id, trVal) => dn(lang, kind, id, trVal),
    dnd: (kind, id, trName, trDesc) => dnd(lang, kind, id, trName, trDesc),
  };
}
