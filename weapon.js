/*
The normal weapon for player. It contains collision testing methods.
*/
class Weapon extends sword.Entity {
    constructor(w, h) {
        super(w, h);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(6, 34);
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
                            o.emit('knockback', this, 600);
                        else
                            o.emit('knockback', this, 150);
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
class RustySword extends Weapon {
    constructor() {
        super(20, 42);
        this.z = 13;
        this.sprite = 'RustSword';
        this.setOrigin(10, 30);
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
                            o.emit('knockback', this, 150);
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
class JimmysRustySword extends Weapon {
    constructor() {
        super(23, 50);
        this.z = 13;
        this.sprite = 'RustSword';
        this.setOrigin(10, 30);
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
                            o.emit('knockback', this, 300);
                        else
                            o.emit('knockback', this, 150);
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
/*
Extra gold dagger
*/
class Dagger extends Weapon {
    constructor() {
        super(12, 26);
        this.z = 13;
        this.sprite = 'Dagger';
        this.setOrigin(6, 24);
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