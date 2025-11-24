const { sword, getWorld, getSettings } = require("./state");
const { loadMap } = require("./level");
const { loadLevel } = require("./mapLoader");
const { DUNGEONS } = require("./dungeonMaps");

/**
 * Dungeon Map Manager
 * Creates and manages separate GameMap instances for each dungeon
 */

// Store map instances for each dungeon
const dungeonMaps = new Map();

// Track which players are on which map
const playerMaps = new Map(); // playerId -> mapInstance

/**
 * Get or create a map for a specific dungeon
 */
function getDungeonMap(dungeonId) {
    if (!dungeonMaps.has(dungeonId)) {
        console.log(`Creating new map instance for dungeon: ${dungeonId}`);
        const world = getWorld();
        const settings = getSettings();

        // Create new map instance for this dungeon
        const map = new sword.GameMap(world, settings.width, settings.height);

        // Load the map tiles (currently all use same tileset)
        loadMap(loadLevel(), map);

        // Spawn dungeon content (enemies + boss)
        const { Spawner } = require('./level');
        const { markDungeonSpawned } = require('./dungeonManager');
        const { DUNGEONS } = require('./dungeonMaps');

        const dungeon = DUNGEONS[dungeonId];
        if (dungeon) {
            console.log(`Spawning content for ${dungeonId}...`);
            Spawner(1, dungeon.spawnPosition, dungeonId, map);
            markDungeonSpawned(dungeonId);
        }

        dungeonMaps.set(dungeonId, map);
        console.log(`Map instance created and populated for ${dungeonId}`);
    }

    return dungeonMaps.get(dungeonId);
}

/**
 * Get the map a player is currently on
 */
function getPlayerMap(player) {
    return playerMaps.get(player.id);
}

/**
 * Move a player to a different dungeon map
 */
function movePlayerToMap(player, dungeonId) {
    const oldMap = playerMaps.get(player.id);
    const newMap = getDungeonMap(dungeonId);

    if (oldMap === newMap) {
        console.log(`Player ${player.playerName} already on ${dungeonId} map`);
        return newMap;
    }

    console.log(`Moving player ${player.playerName} from map to ${dungeonId} map`);

    // Remove from old map if exists
    if (oldMap && player._quadNode) {
        try {
            oldMap.destroy(player);
            console.log(`Removed player from old map`);
        } catch (e) {
            console.log(`Error removing from old map: ${e}`);
        }
    }

    // Remove weapon from old map
    if (player.weapon && oldMap && player.weapon._quadNode) {
        try {
            oldMap.destroy(player.weapon);
            console.log(`Removed weapon from old map`);
        } catch (e) {
            console.log(`Error removing weapon: ${e}`);
        }
    }

    // Clear the old map reference and quadNode
    player.map = null;
    player._quadNode = null;
    if (player.weapon) {
        player.weapon.map = null;
        player.weapon._quadNode = null;
    }

    // Insert into new map
    newMap.insert(player);

    // Re-insert weapon into new map
    if (player.weapon) {
        newMap.insert(player.weapon);
        // Reattach weapon
        player.weapon.setPosition(player.pos.x + player._weaponAnchor.x - player.weapon.width / 2,
                                   player.pos.y + player._weaponAnchor.y - player.weapon.origin.y / 2);
    }

    // Update tracking
    playerMaps.set(player.id, newMap);

    console.log(`Player ${player.playerName} successfully moved to ${dungeonId} map`);
    return newMap;
}

/**
 * Initialize a player on the starting map (overworld)
 */
function initializePlayerMap(player) {
    const overworldMap = getDungeonMap('overworld');
    playerMaps.set(player.id, overworldMap);
    console.log(`Player ${player.playerName} initialized on overworld map`);
    return overworldMap;
}

/**
 * Clean up player map tracking on disconnect
 */
function cleanupPlayerMap(player) {
    playerMaps.delete(player.id);
}

/**
 * Get all dungeons that have been instantiated
 */
function getActiveDungeonMaps() {
    return Array.from(dungeonMaps.keys());
}

module.exports = {
    getDungeonMap,
    getPlayerMap,
    movePlayerToMap,
    initializePlayerMap,
    cleanupPlayerMap,
    getActiveDungeonMaps
};
