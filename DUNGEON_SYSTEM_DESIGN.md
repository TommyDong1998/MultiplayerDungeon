# Dungeon System Design Document

## Overview
A multi-map dungeon system where players defeat bosses to unlock portals that lead to new themed dungeons.

---

## Features

### 1. Portal System
- **Portal Spawning**: When a boss is defeated, spawn a portal at the boss location
- **Portal Entity**: A new entity type that players can interact with
- **Visual**: Animated portal sprite (can use existing sprite or create new one)
- **Collision**: When player touches portal, teleport them to the next dungeon

### 2. Map/Dungeon Types
Five different themed dungeons, each progressively harder:

1. **Overworld** (Starting area)
   - Mixed enemies (current setup)
   - Boss: Demon

2. **Demon Realm**
   - More demons, bigger demons
   - Boss: Giant Demon Lord

3. **Orc Stronghold**
   - Orc warriors and shamans
   - Boss: Orc Chieftain

4. **Undead Catacombs**
   - Skeletons, zombies, ghosts
   - Boss: Lich King

5. **Dragon's Lair**
   - Dragons and dragonlings
   - Boss: Ancient Dragon

### 3. UI Updates
- **Map Name Display**: Top-left or top-right corner
  - Shows: "Map: [Dungeon Name]"
  - Example: "Map: Demon Realm"
- **Victory Message**: When boss defeated
  - Center screen overlay: "Congrats! Boss Defeated!"
  - "Portal has appeared!"
  - Auto-dismiss after 3 seconds

---

## Technical Implementation

### File Structure Changes

```
/dungeons/
  - dungeonManager.js    (Main dungeon logic)
  - dungeonMaps.js       (Map definitions)
  - portal.js            (Portal entity)

/client_script.js        (Add UI for map name)
/level.js                (Modify boss defeat logic)
```

### Data Structures

#### Dungeon Definition
```javascript
{
  id: "demon_realm",
  name: "Demon Realm",
  nextDungeon: "orc_stronghold",
  mapFile: "demon_map.json",
  enemies: [
    { type: "demon", count: 10 },
    { type: "big_demon", count: 5 }
  ],
  boss: {
    type: "demon_lord",
    hp: 500,
    position: { x: 400, y: 300 }
  }
}
```

#### Player State
```javascript
player.currentDungeon = "overworld";  // Track current dungeon
player.dungeonsCleared = [];          // Track completed dungeons
```

---

## Implementation Steps

### Phase 1: Portal System
1. Create `portal.js` - Portal entity class
   - Extends `sword.Entity`
   - Animated sprite
   - Collision detection
   - Teleport functionality

2. Modify boss defeat in `level.js`
   - On boss death, spawn portal
   - Show "Congrats" message to all players nearby

3. Handle portal collision
   - Detect when player touches portal
   - Teleport player to next dungeon
   - Update player's `currentDungeon`

### Phase 2: Map System
1. Create `dungeonMaps.js`
   - Define all 5 dungeon configurations
   - Enemy types, counts, boss info
   - Map layouts (can reuse existing map or create new ones)

2. Create `dungeonManager.js`
   - `loadDungeon(dungeonId, player)` - Load specific dungeon for player
   - `getDungeonInfo(dungeonId)` - Get dungeon configuration
   - `transitionToDungeon(player, dungeonId)` - Handle transition

3. Modify `level.js` spawning
   - Read from dungeon configuration
   - Spawn enemies based on current dungeon
   - Spawn boss at correct location

### Phase 3: UI Updates
1. **Map Name Display** (`client_script.js`)
   - Add HTML element for map name
   - Position in corner (top-right recommended)
   - Update when player changes dungeons

2. **Victory Message** (`client_script.js`)
   - Create victory overlay
   - Center screen, semi-transparent background
   - Show message, auto-dismiss after 3 seconds

3. **Server -> Client Communication**
   - Send current dungeon name to client
   - Send victory message when boss defeated

### Phase 4: Enemy Variety
1. Create new enemy types:
   - Orc (medium size, medium health)
   - Ghost (small, fast)
   - Dragon (large, high health)

2. Add to `monster.js` setType():
   - "orc" - new sprite, stats
   - "ghost" - new sprite, stats
   - "dragon" - new sprite, stats

3. Update `entityClass.js` if needed for new monsters

### Phase 5: Boss Improvements
1. Create distinct boss types in `npc.js`:
   - `DemonLord` class
   - `OrcChieftain` class
   - `LichKing` class
   - `AncientDragon` class

2. Unique abilities for each boss
3. Spawn portal on defeat

---

## Code Snippets

### Portal Entity (portal.js)
```javascript
class Portal extends sword.Entity {
    constructor(destinationDungeon) {
        super(32, 32);
        this.sprite = 'portal_anim';
        this.spriteScale = 2;
        this.destinationDungeon = destinationDungeon;
        this.z = 5;

        this.on('collide', (objects) => {
            for (let obj of objects) {
                if (obj.isPlayer) {
                    // Teleport player to new dungeon
                    dungeonManager.transitionToDungeon(obj, this.destinationDungeon);
                }
            }
        });
    }
}
```

### Victory Message (client_script.js)
```javascript
function showVictoryMessage() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: gold;
        padding: 40px;
        font-size: 32px;
        border: 3px solid gold;
        border-radius: 10px;
        text-align: center;
        z-index: 1000;
    `;
    overlay.innerHTML = `
        <h1>Congrats!</h1>
        <p>Boss Defeated!</p>
        <p style="font-size: 20px;">Portal has appeared!</p>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.remove();
    }, 3000);
}
```

### Map Name UI (index.html / client_script.js)
```html
<div id="mapName" style="
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 18px;
    font-family: VT323;
">
    Map: Overworld
</div>
```

### Dungeon Configuration (dungeonMaps.js)
```javascript
const DUNGEONS = {
    overworld: {
        id: "overworld",
        name: "Overworld",
        nextDungeon: "demon_realm",
        enemies: [
            { type: "minion", count: 5 },
            { type: "TinyMinion", count: 3 },
            { type: "skeleton", count: 2 }
        ],
        boss: { type: "demon", hp: 200 }
    },

    demon_realm: {
        id: "demon_realm",
        name: "Demon Realm",
        nextDungeon: "orc_stronghold",
        enemies: [
            { type: "demon", count: 8 },
            { type: "demon", count: 5 }
        ],
        boss: { type: "demon_lord", hp: 500 }
    },

    orc_stronghold: {
        id: "orc_stronghold",
        name: "Orc Stronghold",
        nextDungeon: "undead_catacombs",
        enemies: [
            { type: "orc", count: 10 },
            { type: "orc_shaman", count: 3 }
        ],
        boss: { type: "orc_chieftain", hp: 800 }
    },

    undead_catacombs: {
        id: "undead_catacombs",
        name: "Undead Catacombs",
        nextDungeon: "dragon_lair",
        enemies: [
            { type: "skeleton", count: 15 },
            { type: "TallMinion", count: 8 }
        ],
        boss: { type: "lich_king", hp: 1200 }
    },

    dragon_lair: {
        id: "dragon_lair",
        name: "Dragon's Lair",
        nextDungeon: null, // Final dungeon
        enemies: [
            { type: "dragon", count: 5 }
        ],
        boss: { type: "ancient_dragon", hp: 2000 }
    }
};
```

---

## Player Experience Flow

1. **Start**: Player spawns in Overworld
2. **Fight**: Player fights through enemies to reach boss
3. **Boss Fight**: Player defeats Demon boss
4. **Victory**: "Congrats!" message appears
5. **Portal**: Blue glowing portal spawns at boss location
6. **Enter**: Player walks into portal
7. **Transition**: Screen fades, player teleported to Demon Realm
8. **New Map**: UI updates to show "Map: Demon Realm"
9. **Repeat**: Process repeats for each dungeon

---

## Future Enhancements

1. **Difficulty Scaling**: Each dungeon progressively harder
2. **Loot System**: Better rewards in later dungeons
3. **Dungeon-Specific Visuals**: Different tilesets per dungeon
4. **Multiplayer Instances**: Separate dungeon instances per group
5. **Leaderboards**: Track fastest dungeon clears
6. **Boss Abilities**: Unique attacks for each boss
7. **Portal Cooldown**: Prevent portal spam
8. **Return Portals**: Way to go back to previous dungeons

---

## Questions to Consider

1. **Single Map or Multiple Instances?**
   - Option A: All players share same dungeon progression (simpler)
   - Option B: Each player/party has their own instance (more complex)

2. **Respawning Enemies?**
   - Should enemies respawn in dungeons?
   - Or one-time clear?

3. **Boss Respawn?**
   - Does boss respawn after some time?
   - Or portal stays permanently?

4. **Player Death?**
   - What happens if player dies in dungeon?
   - Respawn in same dungeon or back to Overworld?

5. **Party System?**
   - Can players team up for dungeons?
   - Should there be a formal party system?

---

## Recommended Implementation Order

1. ✅ **Week 1**: Portal system + basic teleportation
2. ✅ **Week 2**: Map name UI + victory message
3. ✅ **Week 3**: Dungeon manager + configuration system
4. ✅ **Week 4**: New enemy types (orc, ghost, dragon)
5. ✅ **Week 5**: Unique boss types + abilities
6. ✅ **Week 6**: Polish, testing, balancing

---

## Testing Checklist

- [ ] Portal spawns when boss defeated
- [ ] Portal collision detection works
- [ ] Player teleports to correct dungeon
- [ ] Map name UI displays correctly
- [ ] Victory message shows and dismisses
- [ ] All 5 dungeons accessible in sequence
- [ ] Enemy counts/types correct per dungeon
- [ ] Boss HP scales appropriately
- [ ] Multiple players can use same portal
- [ ] Portal doesn't spawn multiple times
- [ ] Player state persists across dungeons

---

## Notes

- Keep existing level progression system for Overworld
- Dungeons can reuse existing map layout initially
- Add new sprites gradually (can start with recolored versions)
- Consider making this a separate game mode (adventure mode vs survival mode)
