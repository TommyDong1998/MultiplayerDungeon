/**
 * Dungeon Configurations
 * Defines all dungeon maps, enemies, and bosses
 */

const DUNGEONS = {
    overworld: {
        id: "overworld",
        name: "Overworld",
        nextDungeon: "demon_realm",
        spawnPosition: { x: 25 * 32, y: 15 * 32 },
        enemies: [
            { type: "minion", count: 12, level: 1 },      // Goblins
            { type: "orc_warrior", count: 3, level: 1 },  // Orc warriors
            { type: "orc_shaman", count: 2, level: 1 }    // Orc shamans
        ],
        boss: {
            type: "ogre",  // Ogre boss (bigger and visible)
            position: { x: 28 * 32, y: 18 * 32 },  // Very close to spawn (896, 576)
            levelMultiplier: 1
        }
    },

    demon_realm: {
        id: "demon_realm",
        name: "Demon Realm",
        nextDungeon: "orc_stronghold",
        spawnPosition: { x: 25 * 32, y: 15 * 32 },
        enemies: [
            { type: "chort", count: 8, level: 2 },
            { type: "imp", count: 6, level: 2 },
            { type: "wogol", count: 4, level: 2 },
            { type: "demon", count: 3, level: 2 },
            { type: "necromancer", count: 2, level: 2 }
        ],
        boss: {
            type: "big_demon",
            position: { x: 30 * 32, y: 20 * 32 },  // Closer to spawn: (960, 640)
            levelMultiplier: 2
        }
    },

    orc_stronghold: {
        id: "orc_stronghold",
        name: "Orc Stronghold",
        nextDungeon: "undead_catacombs",
        spawnPosition: { x: 25 * 32, y: 15 * 32 },
        enemies: [
            { type: "orc_warrior", count: 10, level: 3 },
            { type: "orc_shaman", count: 5, level: 3 },
            { type: "masked_orc", count: 4, level: 3 },
            { type: "ogre", count: 2, level: 3 }
        ],
        boss: {
            type: "ogre_boss",
            position: { x: 32 * 32, y: 20 * 32 },  // Closer: (1024, 640)
            levelMultiplier: 3
        }
    },

    undead_catacombs: {
        id: "undead_catacombs",
        name: "Undead Catacombs",
        nextDungeon: "final_boss",
        spawnPosition: { x: 25 * 32, y: 15 * 32 },
        enemies: [
            { type: "skeleton", count: 12, level: 4 },
            { type: "zombie", count: 8, level: 4 },
            { type: "tiny_zombie", count: 6, level: 4 },
            { type: "ice_zombie", count: 5, level: 4 },
            { type: "muddy", count: 4, level: 4 },
            { type: "big_zombie", count: 2, level: 4 }
        ],
        boss: {
            type: "necromancer_boss",
            position: { x: 33 * 32, y: 22 * 32 },  // Closer: (1056, 704)
            levelMultiplier: 4
        }
    },

    final_boss: {
        id: "final_boss",
        name: "Final Challenge",
        nextDungeon: null, // No next dungeon - final map
        spawnPosition: { x: 25 * 32, y: 15 * 32 },
        enemies: [
            { type: "big_demon", count: 5, level: 5 },
            { type: "ogre", count: 4, level: 5 },
            { type: "big_zombie", count: 4, level: 5 },
            { type: "necromancer", count: 3, level: 5 }
        ],
        boss: {
            type: "mega_demon",
            position: { x: 35 * 32, y: 23 * 32 },  // Closer: (1120, 736)
            levelMultiplier: 5
        }
    }
};

module.exports = {
    DUNGEONS
};
