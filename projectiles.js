const { sword, util, getWorld, getMap } = require("./state");

class Projectile extends sword.Entity {
    constructor(entity) {
        super(16, 32);
        this.z = 13;
        this.width = 16;
        this.height = 32;
        this.sprite = "Dagger";
        this.spriteScale = 1;
        this.type.push("weapon");
        this.speed = 400;
        this.damage = 0.5;
        this.knockback = 25;
        this.rotation = 0;
        this.lifetime = 500;
        this.pierce = false;
        this.piercetime = 40;
        this.attackSpeed = 100;
        this.spread = 45;
        this.opacity = 0.5;
        this.attackPerSec = 100;
        const world = getWorld();
        world.emit("collision", this);
        world.emit("velocity", this);
    }
    // TO DO: Acceleration, Curve, Sprite Change, Invulnerabilty Frame Time
    setSpeed(direction, speed) {
        let spread = ((Math.random() - 0.5) * this.spread * Math.PI) / 180;

        let angle = Math.atan2(direction.y, direction.x);
        angle += spread;

        direction.x = Math.cos(angle);
        direction.y = Math.sin(angle);
        util.normalize(direction, speed);

        this.velocity.x += direction.x;
        this.velocity.y += direction.y;
    }
    createProjectile() {
        this.box(this.width, this.height);
        this.setOrigin(this.width / 2, this.height / 2);
        let spin = setInterval(() => {
            this.rotate((this.rotation * Math.PI) / 180);
        }, 33);
        const world = getWorld();
        this.on("collide", (obj) => {
            let hit = false;
            for (let o of obj) {
                if (o.hp && this.owner != o && hit == false) {
                    hit = true;
                    o.emit("damage", this.damage, this);
                    o.emit("knockback", this, this.knockback);
                } else if (o.type.includes("solid")) {
                    hit = true;
                    this.emit("remove");
                    clearInterval(spin);
                }
                if (obj.length && hit && !this.pierce) {
                    if (this.piercetime != 0) {
                        setTimeout(() => {
                            if (this) {
                                this.emit("remove");
                                clearInterval(spin);
                            }
                        }, this.piercetime);
                    } else {
                        this.emit("remove");
                        clearInterval(spin);
                    }
                }
            }
        });
        setTimeout(() => {
            if (this) {
                this.emit("remove");
                clearInterval(spin);
            }
        }, this.lifetime);
    }
}

class Fireball extends Projectile {
    constructor(entity) {
        super(24, 24);
        this.width = 24;
        this.height = 24;
        this.sprite = "Fireball";
        this.spriteScale = 1;
        this.speed = 250;
        this.damage = 3;
        this.knockback = 0;
        this.rotation = 20;
        this.lifetime = 1200;
        this.pierce = false;
        this.piercetime = 0;
        this.attackSpeed = 400;
        this.spread = 5;
    }
}
class GoldenMoon extends Projectile {
    constructor(entity) {
        super(32, 32);
        this.width = 32;
        this.height = 32;
        this.sprite = "GoldenMoon";
        this.spriteScale = 1;
        this.speed = 300;
        this.damage = 0.2;
        this.knockback = 0;
        this.rotation = 40;
        this.lifetime = 1500;
        this.pierce = false;
        this.piercetime = 200;
        this.attackSpeed = 200;
        this.spread = 10;
    }
}
class ForceBarrier extends Projectile {
    constructor(entity) {
        super(48, 24);
        this.width = 48;
        this.height = 24;
        this.sprite = "HalfBarrier";
        this.spriteScale = 1;
        this.speed = 160;
        this.damage = 0;
        this.knockback = 100;
        this.rotation = 0;
        this.lifetime = 1600;
        this.pierce = false;
        this.piercetime = 100;
        this.attackSpeed = 100;
        this.spread = 25;
    }
}
class Quintuple extends Projectile {
    constructor(entity) {
        super(32, 32);
        this.width = 32;
        this.height = 32;
        this.sprite = "QuintuplicateBolt";
        this.spriteScale = 1;
        this.speed = 200;
        this.damage = 0.3;
        this.knockback = 40;
        this.rotation = 0;
        this.lifetime = 800;
        this.pierce = false;
        this.piercetime = 150;
        this.attackSpeed = 175;
        this.spread = 0;
    }
}
function shootProjectile(entity, direction, projectile, quantity, spread) {
    if (!this.timeout) {
        this.timeout = true;
        if (quantity == undefined) quantity = 1;
        if (spread == undefined) spread = 360 / quantity;
        const map = getMap();

        if (quantity != 1 && spread != 0) {
            let degree = (spread * (quantity + 1) * Math.PI) / 360;
            let angle = Math.atan2(direction.y, direction.x);
            angle -= degree;

            direction.x = Math.cos(angle);
            direction.y = Math.sin(angle);
        }

        for (let i = 1; i <= quantity; i++) {
            if (quantity != 1 && spread != 0) {
                let degree = (spread * Math.PI) / 180;
                let angle = Math.atan2(direction.y, direction.x);
                angle += degree;

                direction.x = Math.cos(angle);
                direction.y = Math.sin(angle);
            }

            let p = new projectile(entity);
            p.createProjectile();
            p.setSpeed(direction, p.speed);
            map.insert(p);
            p.setPosition(entity.pos.x + entity.width / 4, entity.pos.y + entity.height / 4);
            p.owner = entity;
            p.rotate(Math.atan2(direction.y, direction.x) + 2.5 * Math.PI);
            if (i == quantity) {
                setTimeout(() => {
                    this.timeout = false;
                }, p.attackSpeed);
            }
        }
    }
}

module.exports = {
    Projectile,
    Fireball,
    GoldenMoon,
    ForceBarrier,
    Quintuple,
    shootProjectile
};
