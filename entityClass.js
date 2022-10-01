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
	entity.stat.hp=8;
	entity.hp+=2;
	entity.sprite="knight";
	entity.attack=chargeAttack;
}
function setVampire(entity){
	entity.emit("newClass");
    entity._classSetter=setVampire;
	entity.stat.hp=4;
	entity.entityClass="vampire";
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
	entity.entityClass="leader";
	entity.stat.hp=20;
	entity.hp+=14;
	entity.attack=spinAttack;
}

function setMinie(entity){
	entity.emit("newClass");
    entity._classSetter=setMinie;
	entity.box(15, 20);
	entity.entityClass="Mini_Knight";
	entity.sprite="knight";
	entity.stat.hp=2;
	entity.hp=2;
	entity._weaponReach=5;
	entity.attack=chargeAttack;
}

function setLuckMan(entity){
	entity.entityClass="luckMan";
	entity.stat.luck=3;
}
