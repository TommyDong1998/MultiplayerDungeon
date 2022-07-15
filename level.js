function loadMap(file){
	world._collisionItems.forEach(element => {
		element.emit('remove');
	});
	world._velocityItems=[];
	world._collisionItems=[];
	map.quadTree.clear();
	var wall = file.layers[1].data;
	function getLoc(c, r) {
		return wall[(r) * file.width + c];
	}
	for (var c = 0; c < file.width; c++) {
		for (var r = 0; r < file.height; r++) {
			if (wall[r * file.width + c] != 0) {
				var solid = new sword.Entity(32, 32);
				solid.sprite = wall[r * file.width + c] - 1;
				solid.setPosition(c * 32, r * 32);
				solid.z = 15;
				map.insert(solid);
			}
		}
	}
	var createSolid = (x, y) => {
		var solid = new sword.Entity(32, 32);
		solid.type.push('solid');
		//Static type is not removed from client when out of players view
		solid.type.push('static');
		solid.setPosition(x, y);
		map.insert(solid);
	};

	var wall = file.layers[0].data;
	for (var c = 0; c < file.width; c++) {
		for (var r = 0; r < file.height; r++) {
			if (getLoc(c, r) != 0) {
				// Create the tile
				var tile = new sword.Entity(32, 32);
				tile.sprite = getLoc(c, r) - 1;
				tile.setPosition(c * 32, r * 32);
				map.insert(tile);
				// Solid a little bit on tile
				if (!getLoc(c, r - 1))
					createSolid(c * 32, (r - 1) * 32);
				if (!getLoc(c, r + 1))
					createSolid(c * 32, (r + 1.5) * 32);
				if (!getLoc(c - 1, r) && !getLoc(c - 1, r - 1))
					createSolid((c - 1) * 32, r * 32);
				if (!getLoc(c + 1, r) && !getLoc(c + 1, r - 1))
					createSolid((c + 1) * 32, r * 32);
			}
		}
	}
	
	//Generate monsters
	var mon = file.layers[2].data;
	for (var c = 0; c < file.width; c++) {
		for (var r = 0; r < file.height; r++) {
			if (mon[r * file.width + c] != 0) {
				switch(mon[r * file.width + c]-1){
					case 183:
						var enemy = new NPC("skeleton");
						enemy.setPosition(c * 32, r * 32);
						enemy.attackFirst();
					break;
					case 737:
						var enemy = new Demon();
						enemy.setPosition(c * 32, r * 32);
						enemy.attackSpawn();
					break;
					case 695:
						var enemy = new NPC("minion");
						enemy.setPosition(c * 32, r * 32);
						enemy.attackFirst();
					break;
					case 631:
						var enemy = new NPC("TallMinion");
						enemy.setPosition(c * 32, r * 32);
						enemy.attackSpawn();
					break;
					case 119:
						var enemy = new NPC("TinyMinion");
						enemy.setPosition(c * 32, r * 32);
						enemy.attackFirst();
					break;
				}
			}
		}
	}
}