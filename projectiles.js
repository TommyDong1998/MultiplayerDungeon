class Projectile extends sword.Entity{
    constructor(entity) {
        let width = 32;
		let height = 32;		
		super(width,height);        
		this.z = 13;
		this.setOrigin(width/2,height/2);
        this.sprite = 'Dagger';
        this.type.push('weapon');
		this.speed=100;
		this.damage = 1;
		this.knockback = 1;
		this.rotation = 10;
		this.lifetime = 2000;
		this.pierce = true;
        world.emit('collision', this);
        world.emit('velocity', this);
		this.createProjectile(this,entity);
    }
	//TO DO:Speed,Acceleration,Curve 
    setSpeed(direction,speed){
		util.normalize(direction, speed);
		this.velocity.x+=direction.x ;
		this.velocity.y+=direction.y ;
    }
	createProjectile(entity){
		let spin=setInterval(()=>{
			this.rotate(this.rotation * Math.PI / 180);
			},33);
		this.on('collide', (obj) => {
			let hit=false;
			for (let o of obj) {
				if (o.hp && this.owner != o) {
					hit=true;
					o.emit('damage', this.damage, this);
					o.emit('knockback', this, this.knockback);
					this.attack = false;
					setTimeout(() => {
						this.attack = true;
					}, 300);
				}else if(o.type.includes('solid')){
					hit=true;
				}
			if(obj.length && hit && !this.pierce && !(o instanceof NPC)){
				this.emit('remove');
				clearInterval(spin);
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
		let width = 32;
		let height = 32;
		super(width,height)
		this.sprite = 'Fireball';
		this.damage = 1;
		this.knockback = 1;
		this.rotation = 2;
		this.lifetime = 500;
		this.speed = 100;
		this.pierce = true;
		createProjectile(this,entity);
	}
}
function shootProjectile(entity,direction,projectile){
	
	if (!this.timeout) {
		this.timeout = true;
		let p=new projectile(entity);
		map.insert(p)
        p.setSpeed(direction,p.speed);
		p.setPosition(entity.pos.x,entity.pos.y);
		p.owner=entity;
		console.log("direction = ",direction);
		console.log("speed = ",p.speed);
		p.rotate(Math.atan2(direction.y, direction.x) + 2.5 * Math.PI);
		/*setTimeout(()=>{
			if(p){
				p.emit('remove');
			}
		},1000)
		*/
		setTimeout(()=>{
			this.timeout=false;
		},500);
	}
}