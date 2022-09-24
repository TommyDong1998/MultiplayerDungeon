function setWarrior(entity){
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
}
function setLeader(entity){
	entity.entityClass="leader";
	entity.stat.hp=7;
	entity.hp+=2;
}
function setLuckMan(entity){
	entity.entityClass="luckMan";
	entity.stat.luck=3;
}
