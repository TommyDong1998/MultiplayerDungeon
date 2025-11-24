MultiplayerDungeon Server Architecture
======================================

Entry Point
-----------
- `demo.js` starts the Express static server, boots `swordengine`, and wires WebSocket connections to create `Player` instances.
- Shared singletons for `world`, `map`, `settings`, and the `players` list live in `state.js` so other modules don't rely on globals.
- Map data is loaded through `mapLoader.js`, which parses `build/map/level.tmx` into the `{ width, height, layers }` shape expected by `level.js`.

Core Gameplay Modules
---------------------
- `player.js`: Player entity built on `Monster`; handles socket messages (movement, attack, mouse, shop), maintains gold/potion state, and streams visible entities to the client each frame.
- `npc.js`: AI enemies derived from `Monster`; basic aggro/attack loops; `Demon` boss variant spawns and heals.
- `monster.js`: Base entity shared by players/NPCs; inserts into world/map, collision/knockback handling, drops, and generic attack behavior.
- `weapon.js`: Weapon hierarchy (Dagger, Sword, Barrier, etc.) plus `Bullet` particle. Weapons manage collision damage and special attacks.
- `projectiles.js`: Projectile and spell definitions (Fireball, GoldenMoon, etc.) and `shootProjectile` helper.
- `item.js`: Pickups (Potion, Coin) and their collision effects.
- `entityClass.js`: Class switchers (Warrior, Vampire, Wizard, etc.) that adjust stats and attacks.
- `attacks.js`: Shared attack routines (charge, spin, pounce, potion throw).
- `shop.js`: Shop inventory definitions and class/weapon upgrades.
- `level.js`: Loads the map layers into entities, spawns monsters, and provides `clearMap` to reset state.

Key Data Flows
--------------
- State: `state.js` exposes getters/setters for `world`, `map`, `settings`, and `players`; modules read through these instead of depending on globals.
- Networking: `player.js` consumes socket messages (movement/attack/shop) and emits per-frame entity deltas back to the client.
- Map Loading: `mapLoader.js` parses TMX CSV layers in a fixed order (`Overlay`, `Wall`, `Monster`, `Decorative Floor`, `Tile`), keeping zero tiles intact; `level.js` consumes these layers to instantiate entities and solids.
- Spawning: `level.js` seeds NPCs from map layers and uses `Spawner` to generate new waves when bosses die.

Development Notes
-----------------
- Run `npm start` to launch the server; `npm run build` only minifies the client script.
- When adding modules, import from `state.js` for shared world/map references to avoid hidden globals.
- Client assets and scripts live under `site/`; server-only code is root-level JS files.

Class Progression (Design)
--------------------------
- Core path: `Warrior` ➜ `Leader` (tankier, bigger reach) ➜ `Champion` (unlock after defeating the Demon; gains a stun wave special) ➜ `Warlord` (requires two boss kills; gets periodic rally that buffs nearby players).
- Agile path: `Vampire` ➜ `Blood Knight` (on-hit lifesteal aura) ➜ `Nightblade` (boss unlock; shadow-step dash replaces charge attack).
- Caster path: `Apprentice` (starts with a weak basic bolt) ➜ `Wizard` (random projectile archetype) ➜ `Archmage` (after killing a boss; gains spellbook to swap projectile types mid-fight) ➜ `Elementalist` (map-drop unlock; combines fireball and barrier into a cone shield burst).
- Support path: `PotionHoarder` ➜ `Alchemist` (throws buff potions) ➜ `Chemist` (boss unlock; can combine coins + potions into AoE heals).
- Minion path: `Mini_Knight` ➜ `Guardian` (mutates after surviving 3 waves; doubled knockback resist) ➜ `Titan` (boss unlock; slam attack replaces spin).
- Unlock triggers:
  - Boss kills drop class tokens that enable the next tier unlock on the shop for that player.
  - Mutation triggers (wave clears, kill counts, time survived) automatically promote in-place while preserving gold/items.
  - Shop should surface new class options only after the token is acquired (persist per-player session).
