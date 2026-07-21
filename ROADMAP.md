# Solo Fan Idle — Development Roadmap

![[Roadmap.base]]

The game's core is complete (click combat, 500 regions, boss/mini-boss, 12 companions, hero
training, prestige + crystal upgrades, 30 artifacts + gacha, active skills, sound, 28
achievements, Three.js 3D creatures, save backups). What follows is depth and retention.

## Phase 1 — Endgame & tactical depth
1. ✅ **[[01-askinlik|Ascension (2nd prestige layer)]]** — Unlocks at Region 500. Resets your run
   including crystals; in return you gain **Stardust 💫** and powerful permanent multipliers.
   Artifacts and achievements are kept. Endless endgame loop.
2. ✅ **[[02-boss-modifiyeleri|Boss variety / modifiers]]** — Armored (resists NPC damage), Hasty
   (short timer / low HP), Treasure (hard but ×5 reward), Enraged (timer drains faster). Adds
   tactics to fights.

## Phase 2 — Retention hooks
3. ✅ **[[03-altin-yaratiklar|Golden Creatures]]** — A rare creature that appears now and then; click
   it for a gold burst or a buff.
4. ✅ **[[04-kilometre-tasi-odulleri|Milestone rewards]]** — One-time reward the first time you reach
   Region 25/50/75…

## Phase 3 — Feel & atmosphere
5. ✅ [[05-boss-giris-karti|Boss intro card + gold burst on kill]]
6. ✅ [[06-bolgeye-gore-3d-sahne|Zone-based 3D scene (lighting/fog/particles)]]
7. ✅ [[07-kombo-sayaci|Combo counter (rapid-click multiplier)]]

## Phase 4 — NPC identity & QoL
8. ✅ [[08-npc-pasifleri|NPC passives / synergies]]
9. ✅ [[09-istatistik-grafigi|Statistics graph]]
10. ✅ [[10-mobil-cila|Mobile / touch polish]]

## Beyond the roadmap (also shipped)
- **Automation** (Stardust-gated): Auto-Level, Auto-Challenge, Auto-Prestige.
- **Overkill chain**: hit a creature for 10× its HP to also kill 1 behind it, 100× kills 2, etc.
- **Infinite regions** past 500 (500 stays the Ascension threshold).
- **Economy overhaul** — the game used to wall around Region 117 for everyone (Region 500 was
  unreachable, so Ascension was dead content). Root cause: HP grows 1.5×/stage while affordable
  DPS grew ~1.13×/stage, so flat multipliers only shifted the wall by a fixed number of stages.
  Fixed by making cost growth gentler (1.12→1.056) and milestones more frequent (every 15),
  plus a stronger crystal-gain curve; a fully invested endgame now reaches ~580 (500 clears with
  headroom) while the 0→100 pace stays ~1.25h. Tuned with a greedy simulation.
- **i18n** — English (default) + Turkish, single-file dictionary, no library, language toggle in
  Settings.

## Technical note
As Ascension multipliers grow, numbers approach the JS `~1.8e308` ceiling; a scientific/bignum
layer can be considered if needed (with infinite regions this becomes the real cap — around
Region ~1750 raw HP overflows). Safe for all normal play for now.

---
**Status:** All 10 roadmap items **completed and working in code**, plus the post-roadmap
additions above (automation, overkill, infinite regions, economy overhaul, i18n). Remaining work
is real playtesting + balance fine-tuning and, for public hosting, moving saves client-side
(IndexedDB) since they currently depend on the local server.
