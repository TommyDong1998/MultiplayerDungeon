/*global sword*/
/*
This is the class that all entities inherit. NPC and Players. 
*/
class Monster extends sword.Entity {
    constructor(type) {
        switch (type) {
            case "elf":
                super(30, 38);
                this.sprite = 'elf';
                this.hp = 6;
                break;
            case "skeleton":
                super(25, 30);
                this.sprite = 'skeleton';
                this.hp = 6;
                break;
            case "demon":
                super(46, 60);
                this.sprite = 'demon';
                break;
            case "minion":
                super(11, 18);
                this.sprite = 'minion';
                this.hp = 3;
                break;
            case "TallMinion":
                super(23, 36);
                this.sprite = 'TallMinion';
                this.hp = 5;
                break;
			case "TinyMinion":
				super(20, 24);
                this.sprite = 'TinyMinion';
                this.hp = 3;
                break;
        }
        this.z = 10;
        this.stat = {
            hp: this.hp,
            speed: 100,
            strength: 1
        };
        this.status=[];
		this.facing = 1;
        map.insert(this);
        world.emit('velocity', this);
        world.emit('collision', this);
        this.on('collide', (obj) => {
            for (let o of obj) {
                if (o.type.indexOf('solid') != -1) {
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
        });
        //When this get attacked
        this.on('damage', (amt, obj) => {
            if (this.damageFree)
                return;
            this.hp -= amt;
            if (this.hp <= 0) {
                //Spawn potion when npc dies
                if (Math.random() > 0.5) {
                    var potion = new Potion("HealthPotion");
                    potion.setPosition(this.pos.x, this.pos.y);
                }
                if (Math.random() > 0.3) {
                    if (obj.goldBoost) {
                        var coin = new Coin();
                        coin.setPosition(this.pos.x + (Math.random() * 10), this.pos.y + (Math.random() * 10));
                    }
                    var coin = new Coin();
                    coin.setPosition(this.pos.x, this.pos.y);
                }
                this.emit('remove');
            }
        });
        //When this get knockback
        this.on('knockback', (obj, amt) => {
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
            var direction = this.facing;
			setTimeout(() => {
                this.damageFree = true;
            }, 100);
            setTimeout(() => {
                this.damageFree = false;
            }, 600);
            this.weapon.spin(6 * Math.PI, 900, () => {
                this.timeout = false;
            });
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