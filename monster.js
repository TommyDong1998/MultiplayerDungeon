/*global sword*/
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
            speed: 100,
            strength: 1
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
                    let col=this.collideWith().find((entity) => {
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
        this.drops=[[Potion.bind(null,"HealthPotion"),0.5], [Coin,0.7]]
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
        weapon.setPosition(this.polygon.pos.x + this.width / 2 - weapon.width * this.facing, this.polygon.pos.y - weapon.origin.y);
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
                this.hp = 6;
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
            this.velocity.x -= d.x;
            this.velocity.y -= d.y;
        }, 300)
    }
}