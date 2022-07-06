var express = require("express");
var sword = require("./index.js");
var app = express();

app.use(express.static('site'));
var httpServer=app.listen(process.env.PORT || 81);
/*
ToDo
Finish xp implementation
Level Teleporting
Leader Class
Mage Class
*/

// Some common untilities that will be used.
var util = {
    normalize: (point, scale) => {
        //From stackoverflow//Modified //Creative commons
        var norm = Math.sqrt(Math.abs(point.x * point.x) + Math.abs(point.y * point.y));
        if (norm != 0) { // as3 return 0,0 for a point of zero length
            point.x = scale * point.x / norm;
            point.y = scale * point.y / norm;
        }
        //End
    },
    //Used to get difference between two objects
    diff: (object, object3) => {
        var diff = {}
        for (var obj in object3) {
            if (!object.hasOwnProperty(obj) || object3[obj] != object[obj]) {
                diff[obj] = object3[obj];
            }
        }
        return diff;
    }
};

var settings;
var players=[];
var world = new sword(function(setting, socket) {
    settings = setting;
    socket.on('connection', function connection(ws) {
        var logged;
		if(players.length==0){
			loadMap(require("./map/level1.json"));
		}
        ws.once("message", (data) => {
            try {
                data = JSON.parse(data);
                if (data.name) {
                    var player = new Player(ws, "elf", data.name);
					players.push(player);
					player.on("remove",()=>{
						if(players.indexOf(player)!=-1)
							players.splice(players.indexOf(player),1);
					});
                }
            } catch (e) {
                console.log(e);
            }
        });
    });
});
var map = new sword.GameMap(world, settings.width, settings.height);function setWarrior(entity){
	entity.entityClass="warrior";
	entity.box(30, 40);
	entity.stat.hp=8;
	entity.hp+=2;
	entity.sprite="knight";
	entity.attack=function(){
		if (!this.timeout) {
            this.timeout = true;
			var pos = {
                    x: this.mousePos.x,
                    y: this.mousePos.y
            }
			util.normalize(pos, this.stat.speed);
			this.velocity.x += pos.x;
            this.velocity.y += pos.y;
			this.damageFree = true;
            setTimeout(()=>{
				this.damageFree = false;
				this.velocity.x -= pos.x;
				this.velocity.y -= pos.y;
				setTimeout(()=>{
					this.timeout=false;
				},300);
			},500)
        }
	}
}
function setHealer(entity){
	entity.entityClass="healer";
	entity.attack=function(){
		if (this.hp&&!this.timeout) {
			var entities=map.findNear(this,30).filter(()=>{
				return entity instanceof Player&&entity!=this;
			});
			//Only activate if there are entities
			if(entities.length){
				this.timeout=true;
				this.hp--;
				entities.forEach((entity)=>{
					if(entity.hp<entity.stat.hp){
							entity.hp++;
					}
				});
				setTimeout(()=>{
					this.timeout=false;
				},5000)
			}
        }
	}
}
function setPotionHoard(entity){
	entity.entityClass="potionHoard";
	entity.healthPotions=1;
	entity.attack=function(){
		if (!this.timeout&&entity.healthPotions) {
			this.timeout=true;
			entity.healthPotions--;
			var potion = new Potion("HealthPotion");
			world.emit('rmCollision', potion);
            potion.setPosition(this.pos.x, this.pos.y);
			setTimeout(()=>{
				world.emit('collision', potion);
			},300);
			potion.velocityTimeout(this.mousePos,entity.stat.speed*2,300);
            setTimeout(()=>{
				this.timeout=false;
			},1000)
        }
	}
}
function setLeader(entity){
	entity.entityClass="leader";
	this.classAttribute={team:[]};
	entity.attack=function(){
		if (!this.timeout&&entity.healthPotions) {
            setTimeout(()=>{
				this.timeout=false;
			},1000)
        }
	}
}
function setLuckMan(entity){
	entity.entityClass="luckMan";
	entity.stat.luck=3;
}/*global sword*/
/*
This is the class that all entities inherit. NPC and Players. 
*/
class Monster extends sword.Entity {
    constructor(type) {
        switch (type) {
            case "elf":
                super(30, 38);
                this.sprite = 'elf';
                this.hp = 6;
                break;
            case "skeleton":
                super(25, 30);
                this.sprite = 'skeleton';
                this.hp = 6;
                break;
            case "demon":
                super(46, 60);
                this.sprite = 'demon';
                break;
            case "minion":
                super(11, 18);
                this.sprite = 'minion';
                this.hp = 3;
                break;
            case "TallMinion":
                super(23, 36);
                this.sprite = 'TallMinion';
                this.hp = 5;
                break;
			case "TinyMinion":
				super(20, 24);
                this.sprite = 'TinyMinion';
                this.hp = 3;
                break;
        }
        this.z = 10;
        this.stat = {
            hp: this.hp,
            speed: 100,
            strength: 1
        };
        this.status=[];
		this.facing = 1;
        map.insert(this);
        world.emit('velocity', this);
        world.emit('collision', this);
        this.on('collide', (obj) => {
            for (let o of obj) {
                if (o.type.indexOf('solid') != -1) {
                    //Undo x
                    this.setPosition(this.pos.x - this.dx, this.pos.y);
                    //Check if collide
                    if (!this.collideWith().find((entity) => {
                            return entity.type.indexOf('solid') != -1;
                        })) {
                        this.map.server.emit('undoVelocity', this, true, false);
                        this.setPosition(this.pos.x + this.dx, this.pos.y);
                    } else {
                        this.setPosition(this.pos.x + this.dx, this.pos.y - this.dy);
                        //Check if collide
                        if (!this.collideWith().find((entity) => {
                                return entity.type.indexOf('solid') != -1;
                            })) {
                            this.map.server.emit('undoVelocity', this, false, true);
                        } else {
                            this.map.server.emit('undoVelocity', this, true, true);
                        }
                        this.setPosition(this.pos.x, this.pos.y + this.dy)
                    }
                    break;
                }
            }
        });
        //When this get attacked
        this.on('damage', (amt, obj) => {
            if (this.damageFree)
                return;
            this.hp -= amt;
            if (this.hp <= 0) {
                //Spawn potion when npc dies
                if (Math.random() > 0.5) {
                    var potion = new Potion("HealthPotion");
                    potion.setPosition(this.pos.x, this.pos.y);
                }
                if (Math.random() > 0.3) {
                    if (obj.goldBoost) {
                        var coin = new Coin();
                        coin.setPosition(this.pos.x + (Math.random() * 10), this.pos.y + (Math.random() * 10));
                    }
                    var coin = new Coin();
                    coin.setPosition(this.pos.x, this.pos.y);
                }
                this.emit('remove');
            }
        });
        //When this get knockback
        this.on('knockback', (obj, amt) => {
            this.knockback(obj, amt);
        });
    }
    weild(weapon) {
        // this.attach(weapon)
        this.weapon = weapon;
        weapon.setPosition(this.polygon.pos.x + this.width / 2 - weapon.width * this.facing, this.polygon.pos.y - weapon.origin.y);
        this.once('remove', () => {
            this.weapon.emit('remove');
        });
    }
    attack() {
        if (!this.timeout) {
            this.timeout = true;
            var direction = this.facing;
			setTimeout(() => {
                this.damageFree = true;
            }, 100);
            setTimeout(() => {
                this.damageFree = false;
            }, 600);
            this.weapon.spin(6 * Math.PI, 900, () => {
                this.timeout = false;
            });
        }
    }
    //Knocked back by an obj
    knockback(obj, amt) {
        var d = {
            x: obj.pos.x - this.pos.x,
            y: obj.pos.y - this.pos.y
        };
        util.normalize(d, -1 * amt);
        if (!d.x || !d.y) {
            d.x = 0;
            d.y = 0;
        }
        this.velocity.x += d.x;
        this.velocity.y += d.y;
        setTimeout(() => {
            this.velocity.x -= d.x;
            this.velocity.y -= d.y;
        }, 300)
    }
}/*
The normal weapon for player. It contains collision testing methods.
*/
class Weapon extends sword.Entity {
    constructor(w, h) {
        super(w, h);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(6, 34);
        this.type.push('weapon');
        world.emit('collision', this);
        this.attack = true;
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        o.emit('damage', 1, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 600);
                        else
                            o.emit('knockback', this, 150);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 300);
                    }
                }
            }
        });
    }
    spin(length, speed, c) {
        var splitNum = speed / 16;
        var degree = length / splitNum;
        this.specialAttack = true;
        var x = 0,
            y = 0;
        var rotation = this.rad;
        var amp = 13;
        var stop = setInterval(() => {
            x = Math.cos(this.rad - 1) * amp + this.owner.polygon.pos.x + this.owner.width / 2 - this.width / 2;
            y = Math.sin(this.rad - 1) * amp + this.owner.polygon.pos.y + 25 - this.origin.y;
            this.setPosition(x, y);
            if (splitNum > 0) {
                this.rotate(degree);
            } else {
                if (c)
                    c();
                clearInterval(stop);
                this.specialAttack = false;
            }
            splitNum--;
        }, 16);
    }
}
/*
Extra damage
*/
class RustySword extends Weapon {
    constructor() {
        super(20, 42);
        this.z = 13;
        this.sprite = 'RustSword';
        this.setOrigin(10, 30);
        this.type.push('weapon');
        this.attack = true;
        this.removeAllListeners('collide');
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        if (Math.random() > 0.5)
                            o.emit('damage', 2, this);
                        else
                            o.emit('damage', 1, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 600);
                        else
                            o.emit('knockback', this, 150);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 300);
                    }
                }
            }
        });
    }
}
/*
Extra gold dagger
*/
class Dagger extends Weapon {
    constructor() {
        super(12, 26);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(6, 24);
        this.type.push('weapon');
        this.attack = true;
        this.goldBoost = 1;
    }
}
/*
Bullet class is for wizard particles
*/
class Bullet extends sword.Entity {
    constructor(size) {
        super(size, size);
        map.insert(this);
        world.emit('velocity', this);
    }
}class NPC extends Monster {
    constructor(type) {
        super(type);
        var attack = true;
        this.on('collide', (obj) => {
            if (attack) {
                for (let o of obj) {
                    if (o.hp && !(o instanceof NPC)) {
                        o.emit('damage', 1, this);
                    }
                    o.emit('knockback', this, 150);
                }
                attack = false;
                setTimeout(() => {
                    attack = true;
                }, 300)
            }
        });
        this.once('remove', () => {
            clearInterval(this.action);
        });
    }
    attackFirst() {
        var prev = {
            x: 0,
            y: 0
        };
        if (this.action)
            clearInterval(this.action);
        this.action = setInterval(() => {
            var nearest;
            map.findNear(this, 500, (obj) => {
                if (obj instanceof Player && obj != this) {
                    if (!nearest)
                        nearest = obj;
                    else {
                        var distance = Math.sqrt(Math.pow(obj.pos.x - this.pos.x, 2) + Math.pow(obj.pos.y - this.pos.y, 2));
                        var oldDistance = Math.sqrt(Math.pow(nearest.pos.x - this.pos.x, 2) + Math.pow(nearest.pos.y - this.pos.y, 2));
                        if (distance < oldDistance) {
                            nearest = obj;
                        }
                    }
                }
            });
            if (nearest && nearest.removed == undefined) {
                this.velocity.x -= prev.x;
                this.velocity.y -= prev.y;
                prev = this.velocityToward(nearest, this.stat.speed);
            }
            if (prev.x > 0) {
                this.facing = 1;
            } else if (this.velocity.x < 0) {
                this.facing = -1;
            }
        }, 500);
    }
    attackSpawn() {
        this.attackFirst();
        var minion = 5;
        var action = setInterval(() => {
            this.attackFirst();
            setTimeout(() => {
                clearInterval(this.action);
                if (this.hp != this.stat.hp && minion) {
					var enemy = new NPC('minion');
                    enemy.setPosition(this.pos.x, this.pos.y);
                    enemy.attackFirst();
                    enemy.on('remove', () => {
                        minion++;
                    });
                    minion--;
                }
                this.velocity.x = 0;
                this.velocity.y = 0;
            }, 4000);
        }, 5000);
        this.once("remove", () => {
            clearInterval(action);
        });
    }
    randomRun() {
        var x = 0;
        var offsetx = 0;
        var offsety = 0;
        this.on('collide', (obj) => {
            for (let o of obj) {
                if (o.type.indexOf('solid') != -1) {
                    offsetx = this.velocity.x * -10;
                    offsety = this.velocity.y * -10;
                }
            }
        });
        setInterval(() => {
            x++;
            this.velocityToward({
                pos: {
                    x: Math.sin(x / 10) * 500 + offsetx,
                    y: Math.cos(x / 10) * 500 + offsety
                }
            }, 100);
            if (this.velocity.x > 0) {
                this.facing = 1;
            } else if (this.velocity.x < 0) {
                this.facing = -1;
            }
        }, 500);
    }
}
//Main boss
//Based off normal npc
class Demon extends NPC {
    constructor() {
        super("demon");
        this.hp = 30;
        this.stat.hp = 30;
        this.stat.speed = 150;
        this.removeAllListeners("knockback");
        this.on('damage', (amt, obj) => {
            if (this.hp <= 0) {
                for (var x = 0; x < 10; x++) {
                    var coin = new Coin();
                    coin.setPosition(this.pos.x + (Math.random() * 100), this.pos.y + (Math.random() * 100));
                    if (obj.goldBoost) {
                        var coin = new Coin();
                        coin.setPosition(this.pos.x + (Math.random() * 100), this.pos.y + (Math.random() * 100));
                    }
                }
            }
        });
        this.on('knockback', (obj, amt) => {
            if (obj instanceof Weapon)
                this.knockback(obj, amt / 2);
        });
        setInterval(() => {
            if (this.hp != this.stat.hp) {
                this.hp++;
            }
        }, 5000);
    }
}
function loadMap(file){
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
				tile.type.push("map");
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
loadMap(require("./map/level2.json"))
//loadMap(require("./map/level2.json"))//Shop number
const entityClassNum=1;
/* Requires Global Variable world */
class Player extends Monster {
    constructor(socket, type, name) {
        // Create Player
        super("elf");
        this.playerName = name;
		this.boughtItem=[];
        this.stat.speed = 150;
        this.mousePos = {
            x: 0,
            y: 0
        };
        this.setPosition(25*32 + Math.random() * 30, 15*32 + Math.random() * 30);
        this.socket = socket;
		//////////////////////////////
        // Add to main velocity loop
        // Create weapon
		//////////////////////////////
        var weapon = new Weapon(12, 40);
        weapon.owner = this;
        map.insert(weapon);
        this.weild(weapon);
		
		//////////////////////////
        this.on('velocity', (x, y) => {
            if (!this.weapon.specialAttack) {
                this.weapon.facing = this.facing;
                var centerLocation = this.polygon.pos.x + this.width / 2 - this.weapon.width / 2;
                var pos = {
                    x: this.mousePos.x,
                    y: this.mousePos.y
                };
                util.normalize(pos, 10);
                this.weapon.setPosition(centerLocation + pos.x, this.polygon.pos.y + 25 - weapon.origin.y + pos.y);
            }
        });
        this.gold = 300;
        this.damageFree = true;
        setTimeout(() => {
            this.damageFree = false;
        }, 1000);
		var prevMov={x:0,y:0};
		socket.on('message', (data) => {
            try {
                data = JSON.parse(data);
                var arg = data[0];
                data = data.slice(1);
                switch (arg) {
                    case 0:
                        // Movement
                        this.velocity.x-=prevMov.x;
                        this.velocity.y-=prevMov.y;
						prevMov.x=data[0];
						prevMov.y=data[1];
						util.normalize(prevMov, this.stat.speed);
						this.velocity.x += prevMov.x;
                        this.velocity.y += prevMov.y;
                        if (this.velocity.x > 0) {
                            this.facing = 1;
                        } else if (this.velocity.x < 0) {
                            this.facing = -1;
                        }
                        break;
                        //Attack
                    case 1:
                        this.attack();
                        break;
                        //Mouse movement
                    case 2:
                        this.mousePos.x = data[0];
                        this.mousePos.y = data[1];
                        if (!this.weapon.specialAttack) {
                            var diff = Math.atan2(data[1], data[0]) - this.weapon.rad || 0;
                            this.weapon.rotate(diff + 2.5 * Math.PI);
                        }
                        break;
                        //Buy stuff
                    case 3:
                        try {
                            this.buy(data[0]);
                        } catch (e) {
                            console.log(e);
                        }
                        break;
						//Refresh shop
					case 4:
						 if(this.gold>4){
							this.gold-=5
							this.shop();
						 }
					break;
                }
            } catch (e) {
                console.log('Error:' + e);
            }
        });
		this.shop();
        //Whenever something get removed
        function removeEntity(id) {
            try {
				socket.send(JSON.stringify({
					kill: id
				}));
            } catch (e) {
                console.log(e);
            }
        }
        // Display
        var sendFrame = this.sendFrame.bind(this);
        world.on('remove', removeEntity);
        world.on('processFinish', sendFrame);
        var close = false;
        socket.on('close', () => {
            close = true;
            world.removeListener('remove', removeEntity);
            this.emit('remove');
        });
        this.once("remove", () => {
            world.removeListener('processFinish', sendFrame);
            if (!close){
				world.removeListener('remove', removeEntity);
                socket.send(JSON.stringify({
                    restart: true
                }));
			}
        });
        //this.buy(0);
    }
    sendFrame() {
        this.data = this.data || {
            item: []
        };
        var current = map.findNear(this, 500);
        let visibleItems=[];
        current = current.reduce((total, entity) => {
            if (entity.sprite || entity instanceof Bullet) {
                var info = {
                    id: entity.id,
                    x: Math.trunc(entity.pos.x),
                    y: Math.trunc(entity.pos.y),
                    w: entity.width,
                    h: entity.height,
                    sprite: entity.sprite,
                    z: entity.z
                };
                if (entity == this) {
                    info.player = true;
                    info.gold = entity.gold;
                    info.potion = entity.healthPotions;
					info.xp=entity.xp;
                }
                if (entity.hp != undefined) {
                    info.hp = entity.hp;
                    info.maxHP = entity.stat.hp;
                }
                if (entity.facing != undefined) {
                    info.facing = entity.facing;
                }
                if (entity.rad != undefined) {
                    info.origin = entity.origin;
                    info.rotate = entity.rad.toFixed(1);
                }
                if (entity instanceof Bullet) {
                    info.particle = true;
                }
                if (entity.type.indexOf("map") != -1) {
                    info.static = true;
                }
                if (entity.playerName) {
                    info.playerName = entity.playerName;
                }
                var exist = this.data.item.find((obj) => {
                    return obj.id == entity.id;
                });
                var data;
                // If player is in cache then only get the difference
                if (exist) {
                    data = util.diff(exist, info);
                    Object.assign(exist, data);
                } else {
                    data = info;
                    this.data.item.push(info);
                }
                // ///////////////////////////////////////////////////
                if (Object.keys(data).length > 0||this.visibleData.indexOf(entity.id)===-1) {
                    Object.assign(data, {
                        id: entity.id
                    });
                    total.push(data);
                }
            }
            visibleItems.push(entity.id);
            return total;
        }, []);

        this.visibleData=this.visibleData||[];
        //Things player see previously but not currently
        let nonVisible=this.visibleData.filter((data)=>{
            return visibleItems.indexOf(data)===-1;
        });
        
        this.visibleData=visibleItems;
        
        if (current.length){
            try {
                this.socket.send(JSON.stringify({
                    item: current
                }));
            } catch (e) {}
        }
        
        if(nonVisible.length){
            try {
                this.socket.send(JSON.stringify({
                    removeUpdate:nonVisible
//                    addUpdate:addUpdateData
                }));
            } catch (e) {}
        }
    }
    shop(){
		//Generate first item
		var item=Math.floor(Math.random()*10%6);
		for(var x=0;x<6;x++){
			if(this.boughtItem.indexOf(item)==-1)
				break;
			item=x;
		}
		if(this.boughtItem.indexOf(item)!=-1)
			return;
		//Generate second item
		var second=Math.floor(Math.random()*10%6);
		for(var x=0;x<6;x++){
			if(second!=item&&this.boughtItem.indexOf(second)==-1&&(second<entityClassNum||item<entityClassNum))
				break;
			second=x;
		}
		if(second==item||this.boughtItem.indexOf(second)!=-1)
			second=null;
		//Try to send
		try{
			this.socket.send(JSON.stringify({
								shop: true,
								shopItemX:item,
								shopItemY:second
			}));
		}catch(e){
			console.log(e);
		}
	}
	buy(entity) {
        //A list of all the items and their cost
        //If change must update boughtItem below
		var items = {
            RustySword: {
                cost: 10
            },
            Dagger: {
                cost: 10
            },
			Warrior:{
				cost: 15
			},
			Healer:{
				cost: 15
			},
			Leader:{
				cost: 15
			},
			PotionHoarder:{
				cost: 15
			}
        };
        //Select the current item
        var item = items[Object.keys(items)[entity]];
        //Check if enough gold
        if (this.gold >= item.cost) {
            this.gold -= item.cost;
        } else {
            //Not enough gold
            return;
        }
		//Not item
		if(entity>entityClassNum){
			this.boughtItem=this.boughtItem.concat([2,3,4,5]);
		}else
			this.boughtItem.push(entity);
		//entity
        switch (entity) {
            case 0: //Rusty sword
                this.weapon.emit("remove");
                var weapon = new RustySword();
                weapon.owner = this;
                map.insert(weapon);
                this.weild(weapon);
                break;
            case 1:
                this.weapon.emit("remove");
                var weapon = new Dagger();
                weapon.owner = this;
                map.insert(weapon);
                this.weild(weapon);
                break;
			case 2:
				setWarrior(this);
				break;
			case 3:
				setHealer(this);
				break;
			case 4:
				setLeader(this);
				break;
			case 5:
				setPotionHoard(this);
				break;
        }
    }
}/*global sword*/
class Potion extends sword.Entity {
    constructor(type) {
        super(16, 22);
        this.sprite = type;
        this.z = 10;
        map.insert(this);
        world.emit('velocity', this);
        world.emit('collision', this);
        this.on('collide', (obj) => {
            for (let o of obj) {
                if (o instanceof Player) {
                    if (o.hp < o.stat.hp)
                        o.hp += 1;
					else if(o.entityClass=="potionHoard"){
						o.healthPotions++;
					}
                    this.emit("remove");
                    break;
                }
            }
        });
    }
}
/*global sword*/
class Coin extends sword.Entity {
    constructor() {
        super(12, 15);
        this.sprite = "Gold";
        this.z = 10;
        map.insert(this);
        world.emit('velocity', this);
        world.emit('collision', this);
        this.on('collide', (obj) => {
            for (let o of obj) {
                if (o instanceof Player) {
                    o.gold++;
                    this.emit("remove");
                    break;
                }
            }
        });
    }
}
