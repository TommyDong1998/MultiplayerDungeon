var express = require("express");
var app = express();

app.use(express.static('site'));
let port=process.env.PORT||8080

var httpServer=app.listen(port);
//allow client to get port

app.get('/api/port', (req, res) => {
    res.send('var port='+port+';');
});

var sword = require("swordengine");
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
var playersConnected=0;

//Send player information to client
function updateGoldRank(){
    let playersList= players.sort((a,b)=>{
        return b.gold - a.gold;
    })
    playersList= playersList.map((player)=>{
        return player.playerName;
    })
    players.forEach((player)=>{
        player.socket.send(JSON.stringify({
            players: playersList
        }));
    })
}

//Upgrade gold rankings every 5 seconds
setInterval(()=>{
    updateGoldRank();
},5000);

var loadedMap=false;
var world = new sword(function(setting, socket) {
    settings = setting;
    socket.on('connection', function connection(ws) {
        ws.once("message", (data) => {
            try {
                if(!loadedMap){
                    loadMap(require("./map/level1.json"));
                    loadedMap=true;
                }
                playersConnected+=1;
                
                data = JSON.parse(data);
                if (data.name) {
                    var player = new Player(ws, "elf", data.name);
					players.push(player);
                    updateGoldRank();
					player.on("remove",()=>{
						if(players.indexOf(player)!=-1){
							players.splice(players.indexOf(player),1);
                            playersConnected-=1;
                        }
                        setTimeout(()=>{
                            if(playersConnected==0){
                                clearMap();
                                loadedMap=false;
                            }
                        },5000)
					});
                }
            } catch (e) {
                console.log(e);
            }
        });
    });
},httpServer);
world.setMaxListeners(100);
var map = new sword.GameMap(world, settings.width, settings.height);class Projectile extends sword.Entity{
    constructor(entity) {
        super(16,32);     
		this.z = 13;   
		this.width = 16;
		this.height = 32;		
        this.sprite = 'Dagger';
        this.type.push('weapon');
		this.speed = 400;
		this.damage = .5;
		this.knockback = 25;
		this.rotation = 0;			//In Degrees
		this.lifetime = 500;		//In Milliseconds
		this.pierce = false;
		this.piercetime = 40;		//Time After Hit
		this.attackSpeed = 100;		//Milliseconds between attack
		this.spread = 45;			//In Degrees
		this.opacity = .5; 			//Can't Find Opacity Option/Not necessary? Doesn't Work
		this.attackPerSec = 100; 	//at most 30, Need Invulnerability Fix,Not Implemented Yet
        world.emit('collision', this);
        world.emit('velocity', this);
    }
	//TO DO:Acceleration,Curve,Sprite Change, Invulnerabilty Frame Time
    setSpeed(direction,speed){
		
		let spread = ((Math.random()-.5)*this.spread* Math.PI / 180);

		let angle = Math.atan2(direction.y, direction.x);
		angle += spread;

		direction.x = Math.cos(angle);
		direction.y = Math.sin(angle);
		util.normalize(direction, speed);
		
		this.velocity.x+=direction.x ;
		this.velocity.y+=direction.y ;
    }
	createProjectile(entity){
		this.box=(this.width,this.height);
		this.setOrigin(this.width/2,this.height/2);
		let spin=setInterval(()=>{
			this.rotate(this.rotation * Math.PI / 180)},33);
		this.on('collide', (obj) => {
			let hit=false;
			for (let o of obj) {
				if (o.hp && this.owner != o && hit == false) {
					hit = true;
					o.emit('damage', this.damage, this);
					o.emit('knockback', this, this.knockback);
				}else if(o.type.includes('solid')){
					hit=true;
					this.emit("remove");
					clearInterval(spin);
				}
			if(obj.length && hit && !this.pierce){
				if(this.piercetime != 0){
					setTimeout(() => {
						if(this){
							this.emit("remove")
							clearInterval(spin);
						};
					}, this.piercetime);
				}
				else{
					this.emit("remove")
					clearInterval(spin);
				};
			}
		}			
		});
		setTimeout(()=>{
			if(this){
				this.emit('remove');
				clearInterval(spin);
			}
		},this.lifetime)
}
}
class Fireball extends Projectile{
	constructor(entity) {
		super(24,24); 
		this.width = 24;
		this.height = 24;		
        this.sprite = 'Fireball';
		this.speed=250;
		this.damage = 3;
		this.knockback = 0;
		this.rotation = 20;
		this.lifetime = 1200;
		this.pierce = false;
		this.piercetime = 0;
		this.attackSpeed = 400;
		this.spread = 5;			//In Degrees

	}
}
class GoldenMoon extends Projectile{
	constructor(entity) {
		super(32,32); 
		this.width = 32;
		this.height = 32;		
        this.sprite = 'GoldenMoon';
		this.speed=300;	
		this.damage = .2;
		this.knockback = 0;
		this.rotation = 40;
		this.lifetime = 1500;
		this.pierce = false;
		this.piercetime = 200;
		this.attackSpeed = 200;
		this.spread = 10;			//In Degrees

	}
}
class ForceBarrier extends Projectile{
	constructor(entity) {
		super(48,24); 
		this.width = 48;
		this.height = 24;		
        this.sprite = 'HalfBarrier';
		this.speed=160;
		this.damage = 0;
		this.knockback = 100;
		this.rotation = 0;
		this.lifetime = 1600;
		this.pierce = false;
		this.piercetime = 100;
		this.attackSpeed = 100;
		this.spread = 25;			//In Degrees
	}
}
class Quintuple extends Projectile{
	constructor(entity) {
		super(32,32); 
		this.width = 32;
		this.height = 32;		
        this.sprite = 'QuintuplicateBolt';
		this.speed=200;
		this.damage = .3;
		this.knockback = 40;
		this.rotation = 0;
		this.lifetime = 800;
		this.pierce = false;
		this.piercetime = 150;
		this.attackSpeed = 175;
		this.spread = 0;			//In Degrees

	}
}
function shootProjectile(entity,direction,projectile,quantity,spread){
	if (!this.timeout) {
		this.timeout = true;
		if(quantity == undefined) quantity = 1;
		if(spread == undefined) spread = 360/quantity;

		if(quantity != 1 && spread != 0){
			let degree = (spread * (quantity+1) * Math.PI / 360);
			let angle = Math.atan2(direction.y, direction.x);
			angle -= degree;
	
			direction.x = Math.cos(angle);
			direction.y = Math.sin(angle);
		}

		for(let i = 1; i<=quantity; i++){

			if(quantity != 1 && spread != 0){
				let degree = (spread * Math.PI / 180);
				let angle = Math.atan2(direction.y, direction.x);
				angle += degree;
		
				direction.x = Math.cos(angle);
				direction.y = Math.sin(angle);
			}

			let p=new projectile(entity);
			p.createProjectile(p,entity);
			p.setSpeed(direction,p.speed);
			map.insert(p)
			p.setPosition(entity.pos.x+entity.width/4,entity.pos.y+entity.height/4);
			p.owner=entity;
			//console.log("Angle = ",Math.atan2(direction.y, direction.x));
			p.rotate((Math.atan2(direction.y, direction.x) + 2.5 * Math.PI));
			if (i==quantity){
				setTimeout(()=>{this.timeout=false;
				},p.attackSpeed);
			}
			
		}
	}
		
		
}function chargeAttack(){
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

function spinAttack(){
	if (!this.timeout) {
		this.timeout = true;
		var direction = this.facing;
		this.damageFree = true;
		setTimeout(() => {
			this.damageFree = false;
		}, 600);
		this.weapon.spin(6 * Math.PI, 900, () => {
			setTimeout(()=>{
				this.timeout = false;
			},300);
		});
	}
}

function pounceAttack(){
    if (!this.timeout) {
        this.timeout = true;
        this.vamp=1;
        this.damageFree = true;
        var pos = {
                x: this.mousePos.x,
                y: this.mousePos.y
        }
        util.normalize(pos, this.stat.speed);
        this.velocity.x += pos.x;
        this.velocity.y += pos.y;
        setTimeout(()=>{
            this.damageFree = false;
            this.vamp=0;				
            this.velocity.x -= pos.x*2;
            this.velocity.y -= pos.y*2;
            setTimeout(()=>{
                this.velocity.x += pos.x;
                this.velocity.y += pos.y;
                setTimeout(()=>{
                    this.timeout=false;
                },500)
            },200);
        },300)
    }
}

function potionAttack(){
    if (!this.timeout&&this.healthPotions) {
        this.timeout=true;
        this.healthPotions--;
        var potion = new Potion("HealthPotion");
        world.emit('rmCollision', potion);
        potion.setPosition(this.pos.x, this.pos.y);
        setTimeout(()=>{
            world.emit('collision', potion);
        },300);
        potion.velocityTimeout(this.mousePos,this.stat.speed*2,300);
        setTimeout(()=>{
            this.timeout=false;
        },1000)
    }
}
function setStat (entity){
	entity.stat.hp = entity.baseStat.hp + entity.classStat.hp;
	entity.stat.speed = entity.baseStat.speed + entity.classStat.speed;
	entity.stat.strength = entity.baseStat.strength + entity.classStat.strength;
	entity.stat.resistance = entity.baseStat.resistance + entity.classStat.resistance;
	entity.hp = entity.stat.hp;
	console.log(entity.stat.resistance);
}
function setWarrior(entity){
	entity.emit("newClass");
    entity._classSetter=setWarrior;
	entity.entityClass="warrior";
	entity.width=30;
	entity.height=40;
	entity.box(entity.width, entity.height);
	entity._weaponAnchor = {x: entity.width/2,y: entity.height/2};
	entity._weaponReach=10;
	entity.sprite="knight";
	entity.classStat = {
		hp: 6,
		speed: 10,
		strength: 1,
		resistance: 3
	};
	setStat(entity);
	entity.attack=chargeAttack;
	
}
function setVampire(entity){
	entity.emit("newClass");
    entity._classSetter=setVampire;	
	entity.entityClass="vampire";
	entity.width=30;
	entity.height=40;
	entity.box(entity.width, entity.height);
	entity._weaponAnchor = {x: entity.width / 2,y: entity.height/2};
	entity._weaponReach=10;
	entity.sprite="elf"
	entity.classStat = {
		hp: 2,
		speed: 50,
		strength: 1,
		resistance: 1
	};
	setStat(entity);
	entity.attack=pounceAttack;
}
function setPotionHoard(entity){
	entity.emit("newClass");
    entity._classSetter=setPotionHoard;
	entity.entityClass="potionHoard";
	entity.width=30;
	entity.height=40;
	entity.box(entity.width, entity.height);
	entity._weaponAnchor = {x: entity.width/2,y: entity.height/2};
	entity._weaponReach=10;
	entity.healthPotions=3;
	entity.classStat = {
		hp: 6,
		speed: 0,
		strength: 0
	};
	setStat(entity);
	entity.attack=potionAttack;
	let addPotion=setInterval(()=>{
		if(entity.healthPotions<10)
			entity.healthPotions+=1;
	},20*1000)
	entity.once('newClass',()=>{
		if(addPotion)
			clearInterval(addPotion);
		entity.healthPotions=0;
	})
	entity.once('remove',()=>{
		if(addPotion)
			clearInterval(addPotion);
	})
}
function setLeader(entity){
	entity.emit("newClass");
    entity._classSetter=setLeader;	
	entity.entityClass="leader";
	entity.width=45;
	entity.height=60;
	entity.box(entity.width, entity.height);
	entity._weaponAnchor = {x: entity.width/2,y: entity.height/2};
	entity.sprite='elf';
	entity._weaponReach=30;
	entity.classStat = {
		hp: 10,
		speed: 25,
		strength: 2,
		resistance: 50
	};
	setStat(entity);
	entity.attack=spinAttack.bind(entity);
}

function setMinie(entity){
	entity.emit("newClass");
    entity._classSetter=setMinie;	
	entity.entityClass="Mini_Knight";
	entity.width=15;
	entity.height=20;
	entity.box(entity.width, entity.height);
	entity._weaponAnchor = {x: entity.width/2,y: entity.height/2};
	entity.sprite="knight";
	entity._weaponReach=10;
	entity.classStat = {
		hp: 0,
		speed: 15,
		strength: 0,
		resistance: -1
	};
	setStat(entity);
	entity.attack=chargeAttack;
}

function setWizard(entity){
	entity.emit("newClass");
    entity._classSetter=setWizard;
	entity.entityClass="Wizard";
	entity.width=30;
	entity.height=40;
	entity.box(entity.width, entity.height);
	entity._weaponAnchor = {x: entity.width/2,y: entity.height/2};
	entity.sprite="wizard";;
	entity._weaponReach=10;
	entity.classStat = {
		hp: 2,
		speed: -25,
		strength: 0,
		resistance: 0
	};
	setStat(entity);
	entity.abilityAccuracy = 10;
	let spells = [Projectile, Fireball, GoldenMoon, ForceBarrier,Quintuple];
	entity.spell = spells[Math.floor(Math.random()*5)];
	entity.attack=()=>{
		shootProjectile(entity,{
			x: entity.mousePos.x,
			y: entity.mousePos.y
		},entity.spell,entity.stat.strength,(20-entity.stat.strength));
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
        super(1,1)
        this.setType(type);
        this.z = 10;
        this.stat = {
            hp: this.hp,
            mana: 0,
            speed: 100,
            strength: 1, //Ability Power
            resistance: 0, //Knockback and Status Effect Resistance
            defense: 0 //Blocks 1 hp of damage per 10 seconds
        };
        this.status=[];
		this.facing = 1;
		this._weaponReach=10;
        map.insert(this);
        world.emit('velocity', this);
        world.emit('collision', this);

        //Counts how many frames was stuck in wall
        this._stuckInWall=0;
        
        this.on('collide', (obj) => {
            let stuckInWall=false;
            for (let o of obj) {
                if (o.type.indexOf('solid') != -1) {
                    stuckInWall=true;
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
            if(stuckInWall){
                world.once('nextFrame',()=>{
                    //If stuck in wall after begining of next frame
                    let col=this.collideWith((ob)=>{return ob.type.indexOf('solid') != -1;}).find((entity) => {
                        return entity.type.indexOf('solid') != -1;
                    });
                    if (col){
                        //teleport user to nearest non collision area
                        let collided=this.collideWith((ob)=>{return ob.type.indexOf('solid') != -1;}).find((entity) => {
                            return entity.type.indexOf('solid') != -1;
                        });
                        
                        let response=collided._response;
                        this.setPosition(this.pos.x-response.overlapV.x,this.pos.y-response.overlapV.y);
                    }
                });
            }
        });
        this.drops=[[Potion.bind(null,"HealthPotion"),0.1], [Coin,0.7]]
        //When this get attacked
        this.on('damage', (amt, obj) => {
            if (this.damageFree)
                return;
            this.hp -= amt;
            if (this.hp <= 0) {
                this.drops.forEach((drops)=>{
                    let modifier=1;
                    if(obj.goldBoost){
                        modifier=1.5;
                    }
                    if(Math.random()/modifier<drops[1]){
                        const drop=new drops[0];
                        drop.setPosition(this.pos.x+ (Math.random() * 10), this.pos.y+ (Math.random() * 10));
                    }
                })
                this.emit('remove');
            }
            if(obj.owner && obj.owner.vamp){
                if(obj.owner.hp<obj.owner.stat.hp)
                    obj.owner.hp+=Math.round(obj.owner.vamp*amt);
            }
        });
        //When this get knockback
        this.on('knockback', (obj, amt) => {
            if(obj.owner && obj.owner.entityClass=="Mini_Knight")
                this.knockback(obj, amt/2);    
            this.knockback(obj, amt);
        });
    }
    weild(weapon) {
        // this.attach(weapon)
        this.weapon = weapon;
        weapon.owner=this;
        weapon.setPosition(this.polygon.pos.x + this._weaponAnchor.x + - this.weapon.width / 2, this.polygon.pos.y+this._weaponAnchor.y - weapon.origin.y/2);
        //weapon.setPosition(this.polygon.pos.x + this.width / 2 - weapon.width * this.facing, this.polygon.pos.y - weapon.origin.y);
        this.weapon.emit('init', this)
        this.once('remove', () => {
            this.weapon.emit('remove');
        });
    }
    attack() {
        if (!this.timeout) {
            this.timeout = true;
            //var direction = this.facing;
			setTimeout(() => {
                this.damageFree = true;
            }, 100);
            setTimeout(() => {
                this.damageFree = false;
            }, 600);
            this.weapon.spin(6 * Math.PI, 900, () => {
                setTimeout(()=>{
                    this.timeout = false;
                },300);
            });
        }
    }
    setType(type){
        switch (type) {
            case "elf":
                this.box(30, 38);
                this.sprite = 'elf';
                this.hp = 10;
                break;
            case "skeleton":
                this.box(25, 30);
                this.sprite = 'skeleton';
                this.hp = 6;
                break;
            case "demon":
                this.box(46, 60);
                this.sprite = 'demon';
                break;
            case "minion":
                this.box(11, 18);
                this.sprite = 'minion';
                this.hp = 3;
                break;
            case "TallMinion":
                this.box(23, 36);
                this.sprite = 'TallMinion';
                this.hp = 5;
                break;
			case "TinyMinion":
				this.box(20, 24);
                this.sprite = 'TinyMinion';
                this.hp = 4;
                break;
        }
    }
    //Knocked back by an obj
    knockback(obj, amt) {
        amt = amt*(5/(5+this.stat.resistance))
        this._knockbackCount=this._knockbackCount||0;
        this._knockbackCount+=1;
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
            this._knockbackCount-=1;
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
        world.emit('collision', this);           
        this.removeAllListeners('collide');
        this.type.push('weapon');        
        this.attack = true;
        this.z = 15;
        this.setOrigin(w/2, h);
        this.sprite = 'Dagger';
        this.damage = 1;        
        this.critDamage = 2;
        this.critChance = 0; 
        this.knockback = 200;
        this.attackTime = 10; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
    weaponMaker(){
        this.on('collide', (obj) => {
            if (this.attack) {
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        if (Math.random() >= (1-this.critChance))
                            o.emit('damage', this.critDamage, this);
                        else
                            o.emit('damage', this.damage, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, this.knockback*2);
                        else
                            o.emit('knockback', this, this.knockback);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, (Math.floor(1000/this.attackTime)));
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
        this.rad = this.rad||0;
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
class Sword extends Weapon {
    constructor() {
        super(20, 40);
        this.setOrigin(10, 40);
        this.sprite = 'Sword';
        this.damage = 1;
        this.critDamage = 2;
        this.critChance = .25; 
        this.knockback = 250;
        this.attackTime = 4; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}
class Longsword extends Weapon {
    constructor() {
        super(20, 44);
        this.sprite = 'Longsword';
        this.setOrigin(10, 44);
        this.damage = 1;
        this.critDamage = 2;
        this.critChance = .5; 
        this.knockback = 250;
        this.attackTime = 4; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}
class Greatsword extends Weapon {
    constructor() {
        super(24, 48);
        this.sprite = 'Greatsword';
        this.setOrigin(12, 48);
        this.damage = 1;
        this.critDamage = 2;
        this.critChance = .75; 
        this.knockback = 300;
        this.attackTime = 4; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}
class GlassSword extends Weapon {
    constructor() {
        super(22, 54);
        this.sprite = 'GlassSword';
        this.setOrigin(11, 54);
        this.damage = 2;
        this.critDamage = 2;
        this.critChance = 0; 
        this.knockback = 300;
        this.attackTime = 5; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}

class JimmysRustySword extends Weapon {
    constructor() {
        super(28, 80);
        this.sprite = 'JimmysRustySword';
        this.setOrigin(14, 80);
        this.damage = .5;
        this.critDamage = 20;
        this.critChance = .04; 
        this.knockback = 500;
        this.attackTime = 4; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}

class Barrier extends Weapon {
    constructor() {
        super(64, 64);
        this.sprite = 'Barrier';
        this.setOrigin(32, 32);
        this.damage = 0;
        this.critDamage = 1;
        this.critChance = .02; 
        this.knockback = 30;
        this.attackTime = 25; //Attacks Per Second (max 30)
        this.weaponMaker();

        this.once('init',function(player){
            player._weaponAnchor = {x: player.width / 2,y: player.height/2};
            let tempReach=player._weaponReach;
            let tempAnchor=player._weaponAnchor;
            player._weaponReach = 0;
            
            this.once('remove',function(){
                if(this.player && this.player._classSetter){
                    this.player._classSetter(this.player)
                }
                else if(this.player){
                    this.player._weaponAnchor = tempAnchor;
                    this.player._weaponReach=tempReach;
                }
            })
        })
        //Override class attack
        this._overrideAttack=function(player){
            if (!this.timeout) {
                player.timeout = true;
                player.damageFree = true;
                this.setOrigin(64, 64);
                this.box(128,128);
                setTimeout(()=>{                
                    this.box(64,64);
                    this.setOrigin(32, 32);
                    player.damageFree = false;
                    setTimeout(()=>{
                        player.timeout=false;
                    },1500);
                },1000);
            }
        }
    }
}
class HalfBarrier extends Weapon {
    constructor() {
        super(64, 32);
        this.z = 13;
        this.sprite = 'HalfBarrier';
        this.attack = true;
        this.setOrigin(32, 32);
        this.damage = 0;
        this.critDamage = 1;
        this.critChance = .3; 
        this.knockback = 40;
        this.attackTime = 25; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}
/*
Extra gold dagger
*/
class Dagger extends Weapon {
    constructor() {
        super(16, 32);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(8, 32);
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
                        o.emit('knockback', this, 150);
                    }
                    else {
                        o.emit('knockback', this, 75);
                    }

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
            players.forEach((obj) => {
                if (obj instanceof Player && obj != this) {
                    var distance = Math.sqrt(Math.pow(obj.pos.x+obj.width/2 - this.pos.x+this.width/2, 2) + Math.pow(obj.pos.y+obj.height/2 - this.pos.y+this.height/2, 2));
                    if(distance>300)
                        return
                    if (!nearest)
                        nearest = obj;
                    else {
                        var oldDistance = Math.sqrt(Math.pow(nearest.pos.x+nearest.width/2 - this.pos.x+this.width/2, 2) + Math.pow(nearest.pos.y+nearest.height/2 - this.pos.y+this.height/2, 2));
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
    growTo(minion,time){
        setTimeout(()=>{
            if(this.hp>0){
                var enemy = new NPC(minion);
                enemy.setPosition(this.pos.x, this.pos.y);
                enemy.attackFirst();
                this.emit('remove');
            }
        },time);
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
        this.hp = 20;
        this.stat.hp = 20;
        this.stat.speed = 150;
        this.stat.resistance = 15;
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
        setInterval(() => {
            if (this.hp != this.stat.hp) {
                this.hp++;
            }
        }, 5000);
    }
}
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
	while(world._collisionItems.length){
		world._collisionItems[0].emit('remove');
	}
	world._velocityItems=[];
	world._collisionItems=[];
	map.quadTree.clear();
}
function loadMap(file){
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

}//Shop number
const entityClassNum=1;

//A list of all the items and their cost
//If change must update boughtItem below

var shop_items = {
    Sword: {
        cost: 6,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Sword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Dagger: {
        cost: 5,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Dagger();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Warrior:{
        cost: 15,
        add:function(player){
            setWarrior(player);
        }
    },
    Vampire:{
        cost: 20,
        add:function(player){
            setVampire(player);
        }
    },
    Leader:{
        cost: 20,
        add:function(player){
            setLeader(player);
        }
    },
    PotionHoarder:{
        cost: 15,
        add:function(player){
            setPotionHoard(player);
        }
    },
    Longsword: {
        cost:12,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Longsword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Mini_Knight:{
        cost:15,
        add:function(player){
            setMinie(player);
        }
    },
    Barrier:{
        cost:20,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Barrier();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Greatsword:{
        cost:24,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Greatsword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    HalfBarrier:{
        cost:12,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new HalfBarrier();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Wizard:{
        cost:15,
        add:function(player){
            setWizard(player);
        }
    },
    GlassSword:{
        cost:32,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new GlassSword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    JimmysRustySword: {
        cost: 44,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new JimmysRustySword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    StrengthUp: {
        cost:10,
        add:function(player){
            player.baseStat.strength +=1;
            setStat(player);
        }
    }
};
/* Requires Global Variable world */
class Player extends Monster {
    constructor(socket, type, name) {
        // Create Player
        super("elf");
        this.playerName = name;
		this.boughtItem=[];
        this.stat.speed=150;
        this.baseStat = {
            hp: 10,
            speed: 150,
            strength: 1,
            resistance:10
        };
        this.classStat = {
            hp: 0,
            speed: 0,
            strength: 0
        };
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
        this._weaponAnchor = {x: this.width / 2,y: this.height*0.5};
        let weapon=new Weapon(16, 32);
        map.insert(weapon);
        this.weild(weapon);
		//////////////////////////
        let OrientWeapon= function(x, y) {
            if (!this.weapon.specialAttack) {
                this.weapon.facing = this.facing;
                var pos = {
                    x: this.mousePos.x,
                    y: this.mousePos.y
                };
                util.normalize(pos, this._weaponReach);
                this.weapon.setPosition(this.polygon.pos.x + this._weaponAnchor.x + pos.x- this.weapon.origin.x, this.polygon.pos.y+this._weaponAnchor.y - this.weapon.origin.y+ pos.y);
            }
        }
        OrientWeapon=OrientWeapon.bind(this);
        world.on('nextFrame', OrientWeapon);
        
        this.on('remove',()=>{
            world.removeListener('nextFrame',OrientWeapon);
        });

        this._gold = 60;

        Object.defineProperty(this, 'gold', {
            set: (amount)=>{
                this.drops=[];
                this._gold=amount;
                for(let i =0; i< Math.min(this._gold,30);i++)
                    this.drops.push([Coin,0.9])
            },
            get: ()=>{
                return this._gold;
            }
        });

        
        //Cannot be hurt first 5 seconds of game
        this.damageFree = true;
        setTimeout(() => {
            this.damageFree = false;
        }, 5000);
        //////////////////////////////////
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
                        if (this.weapon._overrideAttack)
                            this.weapon._overrideAttack(this)
                        else
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
						 if(this.gold>=1){
							this.gold-=1
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
        world.on('nextFrame', sendFrame);
        var close = false;
        socket.on('close', () => {
            close = true;
            world.removeListener('remove', removeEntity);
            this.emit('remove');
        });
        this.once("remove", () => {
            world.removeListener('nextFrame', sendFrame);
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
        const total=[];
        current.forEach((entity) => {
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
                if (entity.type.indexOf("static") != -1) {
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
        current=total;
        this.visibleData=this.visibleData||[];
        /*
        Things player see previously but not currently
        Will notify client to set as invisible.
        Exception for static
        */
        let nonVisible=this.visibleData.filter((data)=>{
            return visibleItems.indexOf(data)===-1&&data.static != true;
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
		function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        
        
        //Get all items not bought
        let unbought_items=[];
        for(let i=0;i<Object.keys(shop_items).length;i++){
            if(this.boughtItem.indexOf(i)==-1)
                unbought_items.push(i);
        }
        
        shuffleArray(unbought_items);
        this.shopItems=unbought_items.slice(0,6);
		//Try to send
		try{
			this.socket.send(JSON.stringify({
								shop: true,
								shopItems:this.shopItems
			}));
		}catch(e){
			console.log(e);
		}
	}
	buy(entity) {
        //Select the current item
        if(this.shopItems.length<=entity){
            return;
        }
        var item = shop_items[Object.keys(shop_items)[this.shopItems[entity]]];
        //Check if enough gold  
        if (this.gold >= item.cost) {
            this.gold -= item.cost;
        } else {
            //Not enough gold
            return;
        }
		//Not item
		this.boughtItem.push(this.shopItems[entity]);
		//entity
        item.add(this);
    }
}
/*global sword*/
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
                    if (o.hp < o.stat.hp-3)
                        o.hp += 4;
                    else if (o.hp < o.stat.hp)
                        o.hp = o.stat.hp;
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
        this.gold=1;
        
        this.on('collide', (obj) => {
            if(this.gold == 0){
                this.emit("remove");
            }
            for (let o of obj) {
                if (o instanceof Player) {
                    o.gold+=this.gold;
                    this.emit("remove");
                    break;
                }
                if (o instanceof Coin) {
                    if(this.gold<o.gold){
                        o.gold+=this.gold;
                        this.gold = 0;
                        break;
                    }else if(this.id<o.id){
                        o.gold+=this.gold;
                        this.gold = 0;
                        break;
                    }
                    this.width=Math.floor(12*(Math.cbrt(this.gold)));
                    this.height=Math.floor(15*(Math.cbrt(this.gold)));
                    this.setOrigin(0,0);
                    this.box(this.width,this.height);
                }
            }
        });
    }
}