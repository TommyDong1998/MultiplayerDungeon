/*
The normal weapon for player. It contains collision testing methods.
*/
class Weapon extends sword.Entity {
    constructor(w, h) {
        super(w, h);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(8, 24);
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
        var rotation = this.rad;
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
        this.setOrigin(10, 32);
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
        this.setOrigin(10, 34);
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
                            o.emit('knockback', this, 20);
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
        this.setOrigin(12, 42);
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
                        if (Math.random() > 0.95)
                            o.emit('damage', 1, this);
                        else
                            o.emit('damage', 0, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, 40);
                        else
                            o.emit('knockback', this, 40);
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
class HalfBarrier extends Weapon {
    constructor() {
        super(64, 32);
        this.z = 13;
        this.sprite = 'HalfBarrier';
        this.setOrigin(32, 28);
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
                            o.emit('knockback', this, 50);
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
        this.setOrigin(8, 24);
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