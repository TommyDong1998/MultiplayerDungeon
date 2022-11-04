
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
}