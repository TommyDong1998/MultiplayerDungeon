class Projectile extends sword.Entity{
    constructor(entity) {
        super(16,32);     
		this.z = 13;   
		this.width = 16;
		this.height = 32;		
        this.sprite = 'Dagger';
        this.type.push('weapon');
		this.speed=300;
		this.damage = .2;
		this.knockback = 25;
		this.rotation = 0;			//In Degrees
		this.lifetime = 600;		//In Milliseconds
		this.pierce = true;
		this.piercetime = 0;		//Time After Hit
		this.attackSpeed = 400;		//Milliseconds between attack
		this.spread = 40;			//In Degrees
		this.opacity = .5; 			//Can't Find Opacity Option/Not necessary?
		this.attackPerSec = 100; 	//at most 30, Need Invulnerability Fix,Not Implemented Yet
        world.emit('collision', this);
        world.emit('velocity', this);
    }
	//TO DO:Acceleration,Curve,Sprite Change, Invulnerabilty Frame Time
    setSpeed(direction,speed){
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
				if (o.hp && this.owner != o) {
					hit=true;
					o.emit('damage', this.damage, this);
					o.emit('knockback', this, this.knockback);
					this.attack = false; //What does this do?
					setTimeout(() => {
						this.attack = true;
					}, 300);
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
		this.damage = 2;
		this.knockback = 0;
		this.rotation = 20;
		this.lifetime = 1200;
		this.pierce = false;
		this.piercetime = 0;
		this.attackSpeed = 500;
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
		this.spread = 100;
		this.lifetime = 1500;
		this.pierce = false;
		this.piercetime = 200;
		this.attackSpeed = 300;
	}
}
function shootProjectile(entity,direction,projectile){
	if (!this.timeout) {
		this.timeout = true;
		let p=new projectile(entity);
		p.createProjectile(p,entity);
		map.insert(p)
        p.setSpeed(direction,p.speed);
		p.setPosition(entity.pos.x,entity.pos.y+entity.height/3);
		p.owner=entity;
		p.rotate((Math.atan2(direction.y, direction.x) + 2.5 * Math.PI));
		setTimeout(()=>{
			this.timeout=false;
		},p.attackSpeed);
	}
}