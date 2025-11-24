const { sword, getWorld, getMap } = require("./state");
const { NPC, Demon } = require("./npc");
const { spawnDungeonEnemies, spawnDungeonBoss, spawnPortal } = require("./dungeonManager");
const { players } = require("./state");

//Spawn different amounts of monsters per level
function Spawner(level, position, dungeonId = 'overworld', mapInstance = null){
	console.log(`Spawning level ${level} in dungeon: ${dungeonId}`);

	// Spawn enemies from dungeon config
	spawnDungeonEnemies(dungeonId, level, mapInstance);

	// Spawn boss
	console.log(`About to spawn boss for dungeon ${dungeonId}, level ${level}`);
	const boss = spawnDungeonBoss(dungeonId, level, mapInstance, (defeatedBoss) => {
		console.log(`Boss defeat callback triggered! Boss HP: ${defeatedBoss.hp}`);

		if (defeatedBoss.hp <= 0) {
			console.log(`Boss confirmed defeated in ${dungeonId}!`);

			// Get dungeon info to find next dungeon
			const { DUNGEONS } = require("./dungeonMaps");
			const currentDungeon = DUNGEONS[dungeonId];

			console.log(`Current dungeon: ${currentDungeon.name}, Next dungeon: ${currentDungeon.nextDungeon || 'none'}`);

			setTimeout(() => {
				console.log(`Spawning portal after 2 second delay...`);
				// Spawn portal to next dungeon
				const portal = spawnPortal(defeatedBoss.pos, currentDungeon.nextDungeon, players, mapInstance);

				if(portal) {
					console.log(`Portal spawned successfully!`);
				} else {
					console.log(`Portal is null - might be final dungeon`);
				}

				// If final dungeon, spawn next level in same dungeon
				if (!currentDungeon.nextDungeon) {
					console.log(`Final dungeon - spawning next level in 5 seconds`);
					setTimeout(() => {
						Spawner(level + 1, defeatedBoss.pos, dungeonId, mapInstance);
					}, 5000);
				}
			}, 2000);
		}
	});

	if(boss) {
		console.log(`Boss spawned successfully in ${dungeonId}`);
	} else {
		console.log(`Failed to spawn boss in ${dungeonId}!`);
	}
}
function clearMap(){
	const world = getWorld();
	const map = getMap();
	while(world && world._collisionItems && world._collisionItems.length){
		world._collisionItems[0].emit('remove');
	}
	if (world) {
		world._velocityItems=[];
		world._collisionItems=[];
	}
	if (map && map.quadTree) {
		map.quadTree.clear();
	}
}
function loadMap(file, mapInstance){
	// Allow passing in a specific map instance, otherwise use global
	const map = mapInstance || getMap();
	const world = getWorld();
	/*
		Overlay
		Generate tiles on layer 0
	*/
	var wall = file.layers[0].data;
	function getLoc(c, r) {
		return wall[(r) * file.width + c];
	}
	
	for (var c = 0; c < file.width; c++) {
		for (var r = 0; r < file.height; r++) {
			if (wall[r * file.width + c] != 0) {
				let tile = new sword.Entity(32, 32);
				tile.sprite = wall[r * file.width + c] - 1;
				tile.setPosition(c * 32, r * 32);
				tile.z = 16;
				map.insert(tile);
			}
		}
	}

	/*
		Wall
		Generate tiles on layer 1
	*/
	wall = file.layers[1].data;
	for (var c = 0; c < file.width; c++) {
		for (var r = 0; r < file.height; r++) {
			if (wall[r * file.width + c] != 0) {
				let tile = new sword.Entity(32, 32);
				tile.sprite = wall[r * file.width + c] - 1;
				tile.setPosition(c * 32, r * 32);
				tile.z = 15;
				map.insert(tile);
			}
		}
	}
	
	/*
		Decorative Floor
		Generate tiles on layer 1
	*/
	wall = file.layers[3].data;
	for (var c = 0; c < file.width; c++) {
		for (var r = 0; r < file.height; r++) {
			if (wall[r * file.width + c] != 0) {
				let tile = new sword.Entity(32, 32);
				tile.sprite = wall[r * file.width + c] - 1;
				tile.setPosition(c * 32, r * 32);
				tile.z = 1;
				map.insert(tile);
			}
		}
	}

	/*
		Generate solid maps on layer 0
	*/
	var createSolid = (x, y) => {
		var solid = new sword.Entity(32, 32);
		solid.type.push('solid');
		//Static type is not removed from client when out of players view
		solid.type.push('static');
		solid.setPosition(x, y);
		map.insert(solid);
	};

	var wall = file.layers[4].data;
	
	for (var c = 0; c < file.width; c++) {
		for (var r = 0; r < file.height; r++) {
			if (getLoc(c, r) != 0) {
				// Create the tile
				var tile = new sword.Entity(32, 32);
				tile.sprite = getLoc(c, r) - 1;
				tile.setPosition(c * 32, r * 32);
				map.insert(tile);
				//Top solid
				if (!getLoc(c, r - 1))
					createSolid(c * 32, (r - 1) * 32);
				//Bottom solid
				if (!getLoc(c, r + 1))
					createSolid(c * 32, (r + 1.5) * 32);
				//Left solid
				if (!getLoc(c - 1, r) && !getLoc(c - 1, r - 1))
					createSolid((c - 1) * 32, r * 32);
				//Right solid
				if (!getLoc(c + 1, r) && !getLoc(c + 1, r - 1))
					createSolid((c + 1) * 32, r * 32);
			}
		}
	}
	
	
	/*
	 Initialize dungeon system - NOTE: This is for the OLD global map only
	 New system uses dungeonMapManager which creates maps per dungeon
	*/
	world.setMaxListeners(1000);

	// For the new system, spawning happens when first player enters via dungeonMapManager
	// Mark overworld as needing spawning when first player joins
	console.log("Map tiles loaded for overworld template");

	/*
	OLD Monsters layer - DISABLED
	Now using dungeon system instead of map layer spawning
	*/
	// var mon = file.layers[2].data;
	// for (var c = 0; c < file.width; c++) {
	// 	for (var r = 0; r < file.height; r++) {
	// 		if (mon[r * file.width + c] != 0) {
	// 			let enemy;
	// 			switch(mon[r * file.width + c]-1){
	// 				case 183:
	// 					enemy = new NPC("skeleton");
	// 					enemy.attackFirst();
	// 				break;
	// 				case 695:
	// 					enemy = new NPC("minion");
	// 					enemy.attackFirst();
	// 				break;
	// 				case 631:
	// 					enemy = new NPC("TallMinion");
	// 					enemy.attackSpawn();
	// 				break;
	// 				case 119:
	// 					enemy = new NPC("TinyMinion");
	// 					enemy.attackFirst();
	// 				break;
	// 			}
	// 			if(enemy)
	// 				enemy.setPosition(c * 32, r * 32);
	// 		}
	// 	}
	// }

}

module.exports = {
	Spawner,
	clearMap,
	loadMap
};
