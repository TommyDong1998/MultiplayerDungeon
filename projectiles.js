class Projectile extends sword.Entity{
    constructor(w, h) {
        super(w, h);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(8, 8);
        this.type.push('weapon');
		this.stats={speed:250};
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
    setSpeed(direction,speed){
		util.normalize(direction, speed);
		this.velocity.x+=direction.x ;
		this.velocity.y+=direction.y ;
    }
}

class Fireball extends Projectile{
	constructor(w, h) {
        super(w, h);
        this.sprite = 'Fireball';
	}
}

function shootProjectile(entity,direction,projectile){
	if (!this.timeout) {
		this.timeout = true;
		let p=new projectile(16,16);
		map.insert(p)
        p.setSpeed(direction,p.stats.speed);
		p.setPosition(entity.pos.x,entity.pos.y);
		p.owner=entity;

		p.rotate(Math.atan2(direction.y, direction.x) + 2.5 * Math.PI);
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