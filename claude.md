# Multiplayer Dungeon Game - Claude Context

## Project Overview
This is a browser-based multiplayer dungeon crawler game with real-time multiplayer functionality. Players can fight monsters, defeat bosses, unlock new classes, and progress through different dungeons via a portal system.

**Live Demo**: http://multiplayerdungeon-env.eba-sdwfkmve.us-east-1.elasticbeanstalk.com/

## Tech Stack
- **Backend**: Node.js with Express and WebSocket (ws)
- **Game Engine**: Custom "swordengine" (from [Sword library](https://github.com/TommyDong1998/Sword))
- **Frontend**: Vanilla JavaScript with HTML5 Canvas
- **Map Format**: TMX (Tiled Map Editor format)
- **Deployment**: AWS Elastic Beanstalk

## Architecture Overview
See `docs/architecture.md` for detailed architecture documentation.

### Entry Point
- `demo.js` - Main server file that:
  - Sets up Express static file server
  - Initializes swordengine
  - Handles WebSocket connections
  - Creates Player instances for connected clients

### Shared State Management
- `state.js` - Centralized state module exposing:
  - `world` - Game world instance
  - `map` - Current map instance
  - `settings` - Game settings
  - `players` - Array of connected players
  - All modules should import from here to avoid globals

### Core Gameplay Modules

#### Entity System
- `entityClass.js` - Player class definitions (Warrior, Vampire, Wizard, etc.) with stat modifiers
- `monster.js` - Base entity class for players and NPCs; handles collision, knockback, drops, and attacks
- `player.js` - Player entity built on Monster; handles socket messages, gold/potion state, and entity streaming
- `npc.js` - AI enemies with aggro/attack loops; includes special boss variants (Demon)

#### Combat System
- `weapon.js` - Weapon hierarchy (Dagger, Sword, Barrier, etc.) and Bullet particles
- `projectiles.js` - Spell definitions (Fireball, GoldenMoon, etc.) and shooting helpers
- `attacks.js` - Shared attack routines (charge, spin, pounce, potion throw)
- `item.js` - Pickups (Potion, Coin) with collision effects

#### Dungeon System
- `dungeonManager.js` - Main dungeon logic and transitions
- `dungeonMaps.js` - Map definitions for all 5 dungeons
- `dungeonMapManager.js` - Manages multiple dungeon instances
- `portal.js` - Portal entity that teleports players between dungeons
- `level.js` - Loads map layers, spawns monsters, and provides clearMap functionality
- `mapLoader.js` - Parses TMX files into game-usable format

#### Economy & Progression
- `shop.js` - Shop inventory, class upgrades, and weapon purchases

#### Client
- `client_script.js` - Client-side rendering, input handling, and UI
- `site/` - Static assets (HTML, sprites, maps)

## Key Features

### Dungeon System
Players progress through 5 themed dungeons:
1. **Overworld** - Starting area with mixed enemies, boss: Demon
2. **Demon Realm** - More powerful demons, boss: Demon Lord
3. **Orc Stronghold** - Orc warriors and shamans, boss: Orc Chieftain
4. **Undead Catacombs** - Skeletons and undead, boss: Lich King
5. **Dragon's Lair** - Dragons, boss: Ancient Dragon (final)

When a boss is defeated:
- Portal spawns at boss location
- Victory message displays to nearby players
- Players can enter portal to progress to next dungeon

### Class System
Players can unlock and upgrade classes through the shop:
- **Warrior Path**: Warrior → Leader → Champion → Warlord
- **Agile Path**: Vampire → Blood Knight → Nightblade
- **Caster Path**: Apprentice → Wizard → Archmage → Elementalist
- **Support Path**: PotionHoarder → Alchemist → Chemist
- **Minion Path**: Mini_Knight → Guardian → Titan

Boss kills drop class tokens that unlock next-tier classes.

## Development Workflow

### Local Development
```bash
npm install
npm run start
# Open http://localhost:8080
```

### Making Changes
```bash
# Make code changes
npm run build  # Minifies client script
npm run start  # Restart server
```

### Deployment to AWS Elastic Beanstalk
1. Download repo as zip
2. Extract and re-zip contents inside MultiplayerDungeon-main
3. Upload to Elastic Beanstalk and deploy

## Code Patterns & Conventions

### Module Imports
Always import shared state from `state.js`:
```javascript
const { getWorld, getMap, getPlayers } = require('./state');
```

### Map Loading
`mapLoader.js` parses TMX layers in fixed order:
1. Overlay
2. Wall
3. Monster
4. Decorative Floor
5. Tile

Zero tiles are kept intact for proper layer handling.

### Entity Creation
Entities should:
- Extend from appropriate base class (Monster, sword.Entity)
- Register with world: `world.add(entity)`
- Register with map for collision: `map.add(entity)`
- Clean up on removal: `world.remove(entity)`, `map.remove(entity)`

### Networking
- Player uses WebSocket for bidirectional communication
- Server sends per-frame entity deltas to visible clients
- Client sends input events (movement, attack, shop actions)

### Spawning
- `level.js` handles initial NPC spawning from map layers
- `Spawner` class generates new waves when bosses die
- Dungeon-specific enemy configurations in `dungeonMaps.js`

## Important Files

### Server Core
- `demo.js` - Server entry point (183 lines)
- `state.js` - Shared state management (47 lines)
- `mapLoader.js` - TMX parser (43 lines)

### Game Logic
- `player.js` - Player entity (379 lines)
- `monster.js` - Base monster class (404 lines)
- `npc.js` - NPC AI (192 lines)
- `level.js` - Map loading & spawning (201 lines)

### Dungeon System (Recently Implemented)
- `dungeonManager.js` - Dungeon transitions (249 lines)
- `dungeonMapManager.js` - Multiple dungeon instances (139 lines)
- `dungeonMaps.js` - Dungeon configurations (113 lines)
- `portal.js` - Portal entity (53 lines)

### Combat & Items
- `weapon.js` - Weapon types (239 lines)
- `attacks.js` - Attack behaviors (76 lines)
- `projectiles.js` - Spells & projectiles (188 lines)
- `item.js` - Pickups (66 lines)

### Progression
- `entityClass.js` - Class definitions (256 lines)
- `shop.js` - Shop system (119 lines)

### Client
- `client_script.js` - Client-side game (570 lines)
- `site/` - HTML, CSS, and assets

## Documentation

All detailed documentation is located in the `docs/` folder:
- `docs/architecture.md` - Detailed architecture overview
- `docs/DUNGEON_SYSTEM_DESIGN.md` - Complete dungeon system design
- `docs/DUNGEON_IMPLEMENTATION_COMPLETE.md` - Implementation details

## Git Information
- **Main Branch**: main
- **Deployment**: main branch is deployed to AWS Elastic Beanstalk
- **Recent Work**: Dungeon system implementation, UI improvements, code modularization

## Development Notes

### When Adding Features
1. Check `state.js` for shared world/map references
2. Follow existing entity patterns (extend Monster or sword.Entity)
3. Register entities with both world and map
4. Clean up entities properly on removal
5. Update client_script.js for any UI changes

### When Modifying Dungeons
1. Update configurations in `dungeonMaps.js`
2. Ensure dungeon manager handles transitions correctly
3. Test portal spawning and teleportation
4. Verify enemy spawning matches configuration

### When Adding Classes/Weapons
1. Define class in `entityClass.js` with proper stats
2. Add to shop in `shop.js`
3. Create weapon variants in `weapon.js` if needed
4. Update class progression paths

### Security Considerations
- Validate all client inputs on server
- Sanitize socket messages
- Prevent collision exploits
- Rate limit shop purchases
- Validate dungeon transitions

## Common Tasks

### Adding a New Enemy Type
1. Add sprite definition
2. Update `monster.js` setType() method
3. Add to dungeon configuration in `dungeonMaps.js`
4. Test spawning and AI behavior

### Creating a New Dungeon
1. Add dungeon config to `dungeonMaps.js`
2. Define enemy types, counts, and boss
3. Link from previous dungeon's `nextDungeon` field
4. Create/reuse map file if needed

### Adding a New Player Class
1. Define in `entityClass.js` with stats
2. Add to shop inventory in `shop.js`
3. Create unlock requirements (boss tokens, etc.)
4. Test progression path

### Modifying UI
1. Update `client_script.js` for rendering changes
2. Modify `site/index.html` for layout changes
3. Test across different screen sizes
4. Ensure proper z-indexing

## Performance Considerations
- Entity visibility is optimized per-player (only send nearby entities)
- Map collision uses spatial partitioning
- Client receives delta updates, not full state
- Monster AI only runs when players are nearby
- Spawner throttles new enemy creation

## Known Patterns
- Entities emit 'collide' events for collision handling
- Weapons manage their own collision damage
- Monsters handle drops on death
- Players stream visible entities each frame
- Shop purchases are server-validated
- Dungeon state is per-session (no persistence between server restarts)
