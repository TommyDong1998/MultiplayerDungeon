/*
The normal weapon for player. It contains collision testing methods.
*/
class Weapon extends sword.Entity {
    constructor(w, h) {
        super(w, h);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(8, 32);
        this.type.push('weapon');
        world.emit('collision', this);
        this.attack = true;
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        o.emit('damage', 1, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 400);
                        else
                            o.emit('knockback', this, 200);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 300);
                    }
                }
            }
        });
    }
    spin(length, speed, c) {
        var splitNum = speed / 16;
        var degree = length / splitNum;
        this.specialAttack = true;
        var x = 0,
            y = 0;
        this.rad = this.rad||0;
        var amp = 13;
        var stop = setInterval(() => {
            x = Math.cos(this.rad - 1) * amp + this.owner.polygon.pos.x + this.owner.width / 2 - this.width / 2;
            y = Math.sin(this.rad - 1) * amp + this.owner.polygon.pos.y + 25 - this.origin.y;
            this.setPosition(x, y);
            if (splitNum > 0) {
                this.rotate(degree);
            } else {
                if (c)
                    c();
                clearInterval(stop);
                this.specialAttack = false;
            }
            splitNum--;
        }, 16);
    }
}
/*
Extra damage
*/
class Sword extends Weapon {
    constructor() {
        super(20, 40);
        this.z = 13;
        this.sprite = 'Sword';
        this.setOrigin(10, 40);
        this.type.push('weapon');
        this.attack = true;
        this.removeAllListeners('collide');
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        if (Math.random() > 0.5)
                            o.emit('damage', 2, this);
                        else
                            o.emit('damage', 1, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 500);
                        else
                            o.emit('knockback', this, 250);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 300);
                    }
                }
            }
        });
    }
}
class Longsword extends Weapon {
    constructor() {
        super(20, 44);
        this.z = 13;
        this.sprite = 'Longsword';
        this.setOrigin(10, 44);
        this.type.push('weapon');
        this.attack = true;
        this.removeAllListeners('collide');
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        if (Math.random() > 0.5)
                            o.emit('damage', 2, this);
                        else
                            o.emit('damage', 1, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 600);
                        else
                            o.emit('knockback', this, 250);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 300);
                    }
                }
            }
        });
    }
}
class Greatsword extends Weapon {
    constructor() {
        super(24, 48);
        this.z = 13;
        this.sprite = 'Greatsword';
        this.setOrigin(12, 48);
        this.type.push('weapon');
        this.attack = true;
        this.removeAllListeners('collide');
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        if (Math.random() > 0.25)
                            o.emit('damage', 2, this);
                        else
                            o.emit('damage', 1, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 600);
                        else
                            o.emit('knockback', this, 300);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 300);
                    }
                }
            }
        });
    }
}
class GlassSword extends Weapon {
    constructor() {
        super(22, 54);
        this.z = 13;
        this.sprite = 'GlassSword';
        this.setOrigin(11, 54);
        this.type.push('weapon');
        this.attack = true;
        this.removeAllListeners('collide');
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        o.emit('damage', 2, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 600);
                        else
                            o.emit('knockback', this, 300);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 300);
                    }
                }
            }
        });
    }
}
class Barrier extends Weapon {
    constructor() {
        super(64, 64);
        this.z = 13;
        this.sprite = 'Barrier';
        this.setOrigin(32, 32);
        this.type.push('weapon');
        this.attack = true;
        this.removeAllListeners('collide');
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        if (Math.random() > 0.96)
                            o.emit('damage', 1, this);
                        else
                            o.emit('damage', 0, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 300);
                        else
                            o.emit('knockback', this, 20);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 20);
                    }
                }
            }
        });
        this.once('init',function(player){
            player._weaponAnchor = {x: player.width / 2,y: player.height/2};
            let tempReach=player._weaponReach;
            let tempAnchor=player._weaponAnchor;
            player._weaponReach = 0;
            
            this.once('remove',function(){
                if(this.player && this.player._classSetter){
                    this.player._classSetter(this.player)
                }
                else if(this.player){
                    this.player._weaponAnchor = tempAnchor;
                    this.player._weaponReach=tempReach;
                }
            })
        })
        //Override class attack
        this._overrideAttack=function(player){
            if (!this.timeout) {
                player.timeout = true;
                player.damageFree = true;
                this.setOrigin(64, 64);
                this.box(128,128);
                setTimeout(()=>{                
                    this.box(64,64);
                    this.setOrigin(32, 32);
                    player.damageFree = false;
                    setTimeout(()=>{
                        player.timeout=false;
                    },1500);
                },1000);
            }
        }
    }
}
class HalfBarrier extends Weapon {
    constructor() {
        super(64, 32);
        this.z = 13;
        this.sprite = 'HalfBarrier';
        this.setOrigin(32, 32);
        this.type.push('weapon');
        this.attack = true;
        this.removeAllListeners('collide');
        this.on('collide', (obj) => {
            if (this.attack) {
                //Can attack many at same time
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        if (Math.random() > 0.95)
                            o.emit('damage', 1, this);
                        else
                            o.emit('damage', 0, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 100);
                        else
                            o.emit('knockback', this, 50);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, 30);
                    }
                }
            }
        });
    }
}
/*
Extra gold dagger
*/
class Dagger extends Weapon {
    constructor() {
        super(16, 32);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(8, 32);
        this.type.push('weapon');
        this.attack = true;
        this.goldBoost = 1;
    }
}
/*
Bullet class is for wizard particles
*/
class Bullet extends sword.Entity {
    constructor(size) {
        super(size, size);
        map.insert(this);
        world.emit('velocity', this);
    }
}