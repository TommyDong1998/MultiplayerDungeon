const { sword, getWorld, getMap } = require("./state");
const { NPC, Demon } = require("./npc");

//Spawn different amounts of monsters per level
function Spawner(level,position){
	let numOfMinions=5 + 1 * level;
	let numOfTinyMinions=3 * level;
	let numOfTallMinions=level;

	for(let i=0;i<numOfMinions;i+=1){
		var enemy = new NPC("minion");
		enemy.attackFirst();
		enemy.growTo("TinyMinion",5000);
		enemy.setPosition(position.x+Math.floor(Math.random()*100),position.y+Math.floor(Math.random()*100));
	}

	for(let i=0;i<numOfTinyMinions;i+=1){
		var enemy = new NPC("TinyMinion");
		enemy.attackFirst();
		enemy.growTo("TallMinion",10000);
		enemy.setPosition(position.x+Math.floor(Math.random()*100),position.y+Math.floor(Math.random()*100));
	}

	for(let i=0;i<numOfTallMinions;i+=1){
		var enemy = new NPC("TallMinion");
		enemy.attackSpawn();
		enemy.setPosition(position.x+Math.floor(Math.random()*100),position.y+Math.floor(Math.random()*100));
	}

	////////////////////////////////////////
	//Generate new demon which spawns next level
	///////////////////////////////////////
	var enemy = new Demon();
	enemy.stat.hp = Math.floor((1+level*0.5) * 30);
	enemy.hp = enemy.stat.hp;
	enemy.attackSpawn();
	enemy.setPosition(position.x,position.y);
	enemy.on('damage',()=>{
		if (enemy.hp <= 0) {
			setTimeout(()=>{
				Spawner(level+1,enemy.pos);
			},5000);
		}
	});
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
function loadMap(file){
	const map = getMap();
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
	 Generate monsters for testing 
	*/
	world.setMaxListeners(1000);
	for(let i=0;i<30;i++){
		var enemy2 = new NPC("minion");
		enemy2.attackFirst();
		enemy2.setPosition(10* 32+Math.floor(Math.random()*100), 34 * 32+Math.floor(Math.random()*100));
	}

	/*
	Monsters
	Generate monsters on layer 2
	*/
	var mon = file.layers[2].data;
	for (var c = 0; c < file.width; c++) {
		for (var r = 0; r < file.height; r++) {
			if (mon[r * file.width + c] != 0) {
				let enemy;
				switch(mon[r * file.width + c]-1){
					case 183:
						enemy = new NPC("skeleton");
						enemy.attackFirst();
					break;
					case 737:
						enemy = new Demon();
						enemy.attackSpawn();
						enemy.on('damage',function(){
							if (enemy.hp <= 0) {
								setTimeout(()=>{
									Spawner(0,enemy.pos);
								},5000);
							}
						});
					break;
					case 695:
						enemy = new NPC("minion");
						enemy.attackFirst();
					break;
					case 631:
						enemy = new NPC("TallMinion");
						enemy.attackSpawn();
					break;
					case 119:
						enemy = new NPC("TinyMinion");
						enemy.attackFirst();
					break;
				}
				if(enemy)
					enemy.setPosition(c * 32, r * 32);
			}
		}
	}

}

module.exports = {
	Spawner,
	clearMap,
	loadMap
};
