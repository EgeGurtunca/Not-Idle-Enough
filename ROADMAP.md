# Incrementaloth — Development Roadmap

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
- **Realm Shift — a third prestige layer.** Unlocks at Region 1000: resets everything below it
  (crystals *and* Stardust) for **Essence 🌀**, and every realm permanently doubles damage & gold.
  Comes with its own Essence shop and a 12-artifact Essence chest.
- **Content depth** — 12 region tiers / 36 creatures (was 8 / 24), plus per-loop variation:
  name prefixes, palette shift and creature colour mutation, so Regions 121+ stop repeating.
  **Creature affixes** (Armored / Bloated / Swift / Lucky) appear from Region 121, up to 25%.
- **Automation** (Stardust-gated): Auto-Level, Auto-Challenge, Auto-Prestige.
- **Overkill chain**: hit a creature for 10× its HP to also kill 1 behind it, 100× kills 2, etc.
- **Realm ceiling at Region 1500** — past ~1690 boss HP overflowed to `Infinity` and progress
  died. Each realm now stops at 1500 and points you at a Realm Shift; the ladder stays endless
  through realms instead.
- **Economy overhaul** — the game used to wall around Region 117 for everyone. Root cause: HP
  grows 1.5×/stage while affordable DPS grew ~1.13×/stage, so flat multipliers only shifted the
  wall by a fixed number of stages. Fixed with gentler cost growth (1.12→1.0525), milestones
  every 15, a stronger crystal curve, and a difficulty ramp past Region 100 (HP 1.5→1.524).
- **Ships as a PWA** — installable, plays fully offline via service worker; fonts are bundled,
  so there are no third-party requests at runtime.
- **Robustness** — save versioning + migration, one-step undo for imports/resets, React error
  boundaries (a WebGL failure degrades to emoji creatures instead of a blank page), and a 3D
  toggle for battery/CPU.
- **i18n** — English (default) + Turkish, single-file dictionary, no library.

## Balance targets (greedy simulation, seeded, median of 5 runs)
| Milestone | Target | Measured |
|---|---|---|
| First prestige (Region 100) | 1.5 h | 1.4 h |
| Region 500 (Ascension) | 12 h | 11.2 h |
| First Realm Shift | 48 h | 57.4 h |

Realm Shift timing is quantised by ascension cycles (~25 h each), so no threshold lands exactly
on 48 h — 57.4 h is the closest reachable value without reshaping the ascension loop.

## Verification
`npm test` runs 22 assertions with no framework (`node --test`): content-array alignment, tier
and loop boundaries, the realm-ceiling overflow guard, layer thresholds, gacha odds, save
migration/validation, and a geometric audit that every creature model is a single connected
mesh with sane proportions. CI runs them before deploying.

---
**Status:** roadmap complete, plus everything above. Remaining work is real human playtesting
(the simulation models an optimal player, not a real one) and, if the Realm Shift pace matters,
a design decision on the ascension cycle length.
