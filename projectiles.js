class Projectile extends sword.Entity{
    constructor(w, h) {
        super(w, h);
        this.z = 13;
        this.sprite = 'Fireball';
        this.setOrigin(8, 8);
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
				if(obj.length && hit){
					this.emit('remove');
					clearInterval(spin);
				}
        });
    }
}

function shootProjectile(player,speed){
	if (!this.timeout) {
		this.timeout = true;
		let p=new Projectile(16,16);
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
		},1000)
		setTimeout(()=>{
			this.timeout=false;
		},500);
	}
}