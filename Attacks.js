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