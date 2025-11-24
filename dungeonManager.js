const { DUNGEONS } = require("./dungeonMaps");
const { NPC, Demon } = require("./npc");
const { Portal } = require("./portal");
const { getMap, players } = require("./state");

/**
 * Dungeon Manager
 * Handles dungeon loading, enemy spawning, boss management, and player transitions
 */

// Track active dungeons per player
const playerDungeons = new Map(); // playerId -> dungeonId

/**
 * Get dungeon info by ID
 */
function getDungeonInfo(dungeonId) {
    return DUNGEONS[dungeonId];
}

/**
 * Get player's current dungeon
 */
function getPlayerDungeon(player) {
    return playerDungeons.get(player.id) || 'overworld';
}

/**
 * Set player's current dungeon
 */
function setPlayerDungeon(player, dungeonId) {
    playerDungeons.set(player.id, dungeonId);
    player.currentDungeon = dungeonId;

    // Send dungeon info to client
    try {
        player.socket.send(JSON.stringify({
            dungeonChange: true,
            dungeonName: DUNGEONS[dungeonId].name,
            dungeonId: dungeonId
        }));
    } catch (e) {
        console.log("Error sending dungeon change:", e);
    }
}

/**
 * Spawn enemies for a dungeon level
 */
function spawnDungeonEnemies(dungeonId, level, mapInstance = null) {
    const dungeon = DUNGEONS[dungeonId];
    if (!dungeon) return;

    const position = dungeon.spawnPosition || { x: 25 * 32, y: 15 * 32 };

    dungeon.enemies.forEach((enemyConfig) => {
        const count = enemyConfig.count * (level || 1); // Ensure at least level 1 spawning
        for (let i = 0; i < count; i++) {
            const enemy = new NPC(enemyConfig.type, mapInstance);
            enemy.attackFirst();

            // Tag enemy with dungeon ID
            enemy.dungeonId = dungeonId;
            enemy.type.push(`dungeon_${dungeonId}`);

            // Random spawn around position
            const offsetX = Math.floor(Math.random() * 400) - 200;
            const offsetY = Math.floor(Math.random() * 400) - 200;
            enemy.setPosition(position.x + offsetX, position.y + offsetY);
        }
    });
}

/**
 * Spawn boss for a dungeon
 */
function spawnDungeonBoss(dungeonId, level, mapInstance, onDefeat) {
    const dungeon = DUNGEONS[dungeonId];
    if (!dungeon || !dungeon.boss) {
        console.log(`No dungeon or boss config found for ${dungeonId}`);
        return null;
    }

    const bossConfig = dungeon.boss;
    console.log(`Creating boss: ${bossConfig.type} at position (${bossConfig.position.x}, ${bossConfig.position.y})`);
    const boss = new Demon(bossConfig.type, mapInstance);
    console.log(`Boss created, current HP: ${boss.hp}, sprite: ${boss.sprite}`);
    console.log(`Boss box size: width=${boss.width}, height=${boss.height}`);
    console.log(`Boss spriteScale: ${boss.spriteScale}`);

    // Tag boss with dungeon ID for visibility filtering
    boss.dungeonId = dungeonId;
    boss.type.push(`dungeon_${dungeonId}`);
    boss.type.push('boss');

    // Scale boss HP
    boss.stat.hp = Math.floor((1 + level * 0.5) * 30 * bossConfig.levelMultiplier);
    boss.hp = boss.stat.hp;
    console.log(`Boss HP scaled to: ${boss.hp}`);

    boss.attackSpawn();
    boss.setPosition(bossConfig.position.x, bossConfig.position.y);
    console.log(`Boss positioned at: (${boss.pos.x}, ${boss.pos.y})`);
    console.log(`Boss has collision enabled: ${boss.polygon !== undefined}`);
    console.log(`Boss z-index: ${boss.z}`);
    console.log(`Boss removed flag: ${boss.removed}`);
    console.log(`Boss in map: ${boss.map !== undefined}`);

    // Verify the boss is accessible
    setTimeout(() => {
        console.log(`[1 second later] Boss still exists: ${boss.removed === undefined}, HP: ${boss.hp}`);
    }, 1000);

    console.log(`Boss spawned: ${bossConfig.type} with ${boss.hp} HP at dungeon ${dungeonId}`);

    // Track if boss has been defeated (prevent multiple portal spawns)
    let defeated = false;

    // Handle boss defeat
    boss.on('damage', (amt, obj) => {
        console.log(`Boss damage event fired! HP before: ${boss.hp + amt}, damage: ${amt}, HP after: ${boss.hp}, defeated flag: ${defeated}`);
        if (boss.hp <= 0 && !defeated && onDefeat) {
            defeated = true;
            console.log(`Boss defeated in ${dungeonId}! Calling onDefeat callback...`);
            onDefeat(boss);
        } else if (defeated) {
            console.log(`Boss already marked as defeated, skipping portal spawn`);
        } else {
            console.log(`Boss still alive with ${boss.hp} HP`);
        }
    });

    return boss;
}

/**
 * Spawn portal to next dungeon
 */
function spawnPortal(position, nextDungeonId, players, mapInstance) {
    console.log(`spawnPortal called: position=(${position.x}, ${position.y}), nextDungeon=${nextDungeonId}`);

    if (!nextDungeonId) {
        // Final dungeon - no portal
        console.log("Final dungeon completed! No portal to spawn.");
        return null;
    }

    const portal = new Portal(nextDungeonId, mapInstance);
    portal.setPosition(position.x, position.y);

    // Tag portal with current dungeon ID (where it spawned)
    // Portal should only be visible to players in this dungeon
    if (players.length > 0) {
        const playerDungeon = getPlayerDungeon(players[0]);
        portal.dungeonId = playerDungeon;
        portal.type.push(`dungeon_${playerDungeon}`);
    }

    console.log(`Portal spawned successfully at (${position.x}, ${position.y}) leading to ${nextDungeonId}`);

    // Send victory message to all players
    players.forEach((player) => {
        try {
            player.socket.send(JSON.stringify({
                victory: true,
                message: "Boss Defeated! Portal appeared!"
            }));
            console.log(`Victory message sent to ${player.playerName}`);
        } catch (e) {
            console.log("Error sending victory message:", e);
        }
    });

    return portal;
}

// Track which dungeons have been spawned
const spawnedDungeons = new Set();

/**
 * Transition player to new dungeon
 */
function transitionToDungeon(player, dungeonId) {
    const dungeon = DUNGEONS[dungeonId];
    if (!dungeon) {
        console.log(`Dungeon ${dungeonId} not found`);
        return;
    }

    // Get or create the map for this dungeon (automatically spawns content)
    const { getDungeonMap, movePlayerToMap } = require('./dungeonMapManager');
    getDungeonMap(dungeonId); // This creates map + spawns enemies/boss if first time

    // Move player to the new map instance
    movePlayerToMap(player, dungeonId);

    // Update player's dungeon
    setPlayerDungeon(player, dungeonId);

    // Teleport player to spawn position
    const spawn = dungeon.spawnPosition;
    player.setPosition(spawn.x, spawn.y);

    console.log(`Player ${player.playerName} entered ${dungeon.name}`);
}

/**
 * Initialize dungeon system for a player
 */
function initializePlayer(player) {
    setPlayerDungeon(player, 'overworld');

    // Listen for portal entry
    player.on('enterPortal', (destinationDungeon) => {
        transitionToDungeon(player, destinationDungeon);
    });
}

/**
 * Clean up player data on disconnect
 */
function cleanupPlayer(player) {
    playerDungeons.delete(player.id);
}

/**
 * Mark a dungeon as already spawned (called from level.js for overworld)
 */
function markDungeonSpawned(dungeonId) {
    spawnedDungeons.add(dungeonId);
}

module.exports = {
    getDungeonInfo,
    getPlayerDungeon,
    setPlayerDungeon,
    spawnDungeonEnemies,
    spawnDungeonBoss,
    spawnPortal,
    transitionToDungeon,
    initializePlayer,
    cleanupPlayer,
    markDungeonSpawned
};
