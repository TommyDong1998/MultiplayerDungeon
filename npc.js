const { Monster } = require("./monster");
const { players } = require("./state");
const { Coin } = require("./item");

class NPC extends Monster {
    constructor(type, mapInstance = null) {
        super(type, mapInstance);
        var attack = true;
        this.on('collide', (obj) => {
            if (attack) {
                for (let o of obj) {
                    if (o.hp && !(o instanceof NPC)) {
                        o.emit('damage', 1, this);
                        o.emit('knockback', this, 150);
                    }
                    else {
                        o.emit('knockback', this, 75);
                    }

                }
                attack = false;
                setTimeout(() => {
                    attack = true;
                }, 300)
            }
        });
        this.once('remove', () => {
            clearInterval(this.action);
        });
    }
    attackFirst() {
        var prev = {
            x: 0,
            y: 0
        };
        if (this.action)
            clearInterval(this.action);
        this.action = setInterval(() => {
            var nearest;
            players.forEach((obj) => {
                if (obj && obj.isPlayer && obj != this) {
                    var distance = Math.sqrt(Math.pow(obj.pos.x+obj.width/2 - this.pos.x+this.width/2, 2) + Math.pow(obj.pos.y+obj.height/2 - this.pos.y+this.height/2, 2));
                    if(distance>300)
                        return
                    if (!nearest)
                        nearest = obj;
                    else {
                        var oldDistance = Math.sqrt(Math.pow(nearest.pos.x+nearest.width/2 - this.pos.x+this.width/2, 2) + Math.pow(nearest.pos.y+nearest.height/2 - this.pos.y+this.height/2, 2));
                        if (distance < oldDistance) {
                            nearest = obj;
                        }
                    }
                }
            });
            if (nearest && nearest.removed == undefined) {
                this.velocity.x -= prev.x;
                this.velocity.y -= prev.y;
                prev = this.velocityToward(nearest, this.stat.speed);
            }
            if (prev.x > 0) {
                this.facing = 1;
            } else if (this.velocity.x < 0) {
                this.facing = -1;
            }
        }, 500);
    }
    growTo(minion,time){
        setTimeout(()=>{
            if(this.hp>0){
                var enemy = new NPC(minion);
                enemy.setPosition(this.pos.x, this.pos.y);
                enemy.attackFirst();
                this.emit('remove');
            }
        },time);
    }
    attackSpawn() {
        this.attackFirst();
        var minion = 5;
        var action = setInterval(() => {
            this.attackFirst();
            setTimeout(() => {
                clearInterval(this.action);
                if (this.hp != this.stat.hp && minion) {
					var enemy = new NPC('minion');
                    enemy.setPosition(this.pos.x, this.pos.y);
                    enemy.attackFirst();
                    enemy.on('remove', () => {
                        minion++;
                    });
                    minion--;
                }
                this.velocity.x = 0;
                this.velocity.y = 0;
            }, 4000);
        }, 5000);
        this.once("remove", () => {
            clearInterval(action);
        });
    }
    randomRun() {
        var x = 0;
        var offsetx = 0;
        var offsety = 0;
        this.on('collide', (obj) => {
            for (let o of obj) {
                if (o.type.indexOf('solid') != -1) {
                    offsetx = this.velocity.x * -10;
                    offsety = this.velocity.y * -10;
                }
            }
        });
        setInterval(() => {
            x++;
            this.velocityToward({
                pos: {
                    x: Math.sin(x / 10) * 500 + offsetx,
                    y: Math.cos(x / 10) * 500 + offsety
                }
            }, 100);
            if (this.velocity.x > 0) {
                this.facing = 1;
            } else if (this.velocity.x < 0) {
                this.facing = -1;
            }
        }, 500);
    }
}
//Main boss
//Based off normal npc
class Demon extends NPC {
    constructor(type = "demon", mapInstance = null) {
        super(type, mapInstance);
        // Default stats - can be overridden
        if(!this.hp || this.hp < 20) {
            this.hp = 20;
            this.stat.hp = 20;
        }
        this.stat.speed = 150;
        this.stat.resistance = 15;
        this.on('damage', (amt, obj) => {
            if (this.hp <= 0) {
                // Drop coins
                for (var x = 0; x < 10; x++) {
                    var coin = new Coin();
                    coin.setPosition(this.pos.x + (Math.random() * 100), this.pos.y + (Math.random() * 100));
                    if (obj.goldBoost) {
                        var coin = new Coin();
                        coin.setPosition(this.pos.x + (Math.random() * 100), this.pos.y + (Math.random() * 100));
                    }
                }
            }
        });
        setInterval(() => {
            if (this.hp != this.stat.hp) {
                this.hp++;
            }
        }, 5000);
    }
}

module.exports = {
    NPC,
    Demon
};
