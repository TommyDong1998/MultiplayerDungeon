function chargeAttack(){
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
function setWarrior(entity){
	entity.emit("newClass");
    entity._classSetter=setWarrior;
	entity.entityClass="warrior";
	entity.box(30, 40);
	entity.stat.hp=12;
	entity.hp=12;
	entity.sprite="knight";
	entity.attack=chargeAttack;
}
function setVampire(entity){
	entity.emit("newClass");
    entity._classSetter=setVampire;
	entity.box(30, 40);
	entity.stat.hp=8;
	entity.entityClass="vampire";
	entity.sprite="elf"
	entity.attack=function(){
		if (!this.timeout) {
			this.timeout = true;
			entity.vamp=1;
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
}
function setPotionHoard(entity){
	entity.emit("newClass");
    entity._classSetter=setPotionHoard;
	entity.entityClass="potionHoard";
	entity.hp=10;
	entity.stat.hp=10;
	entity.healthPotions=3;
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
function spinAttack()
{
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
			setTimeout(()=>{
				this.timeout = false;
			},300);
		});
	}
}

function setLeader(entity){
	entity.emit("newClass");
    entity._classSetter=setLeader;
	entity.box(45, 60);
	entity.sprite='elf';
	entity.entityClass="leader";
	entity.stat.hp=20;
	entity.hp+=14;
	entity.attack=spinAttack.bind(entity);
}

function setMinie(entity){
	entity.emit("newClass");
    entity._classSetter=setMinie;
	entity.box(15, 20);
	entity.entityClass="Mini_Knight";
	entity.sprite="knight";
	entity.stat.hp=4;
	entity.hp=4;
	entity._weaponReach=5;
	entity.attack=chargeAttack;
}

class Projectile extends sword.Entity{
    constructor(w, h) {
        super(w, h);
        this.z = 13;
        this.sprite = 'Fireball';
        this.setOrigin(16, 16);
        this.type.push('weapon');
        world.emit('collision', this);
        world.emit('velocity', this);
		let spin=setInterval(()=>{
			this.rotate(12 * Math.PI / 180);
		},16);

        this.on('collide', (obj) => {
                //Can attack many at same time
				let hit=false;
                for (let o of obj) {
                    if (o.hp && this.owner != o) {
						hit=true;
                        o.emit('damage', 1, this);
						o.emit('knockback', this, 50);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 300);
                    }else if(o.type.includes('solid')){
						hit=true;
					}
                }
				if(obj.length && hit)
					this.emit('remove');
				clearInterval(spin);
        });
    }
}


function setWizard(entity){
	entity.emit("newClass");
    entity._classSetter=setWizard;
	entity.box(30, 40);
	entity.entityClass="Wizard";
	entity.sprite="wizard";
	entity.stat.hp=6;
	entity.hp=6;
	entity._weaponReach=5;
	entity.attack=shootProjectile.bind(this,entity,250);
}


function shootProjectile(player,speed){
	if (!this.timeout) {
		this.timeout = true;
		let p=new Projectile(32,32);
		map.insert(p)
		let pos={
			x: player.mousePos.x,
			y: player.mousePos.y
		}
		util.normalize(pos, speed);
		p.setPosition(player.pos.x,player.pos.y);
		p.owner=player;
		p.velocity.x+=pos.x ;
		p.velocity.y+=pos.y ;
		
		p.rotate(Math.atan2(player.mousePos.y, player.mousePos.x) + 2.5 * Math.PI);
		setTimeout(()=>{
			if(p){
				p.emit('remove');
			}
		},1500)
		setTimeout(()=>{
			this.timeout=false;
		},500);
	}
}

function setLuckMan(entity){
	entity.entityClass="luckMan";
	entity.stat.luck=3;
}