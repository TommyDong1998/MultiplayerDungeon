/*
The normal weapon for player. It contains collision testing methods.
*/
class Weapon extends sword.Entity {
    constructor(w, h) {
        super(w, h); 
        world.emit('collision', this);           
        this.removeAllListeners('collide');
        this.type.push('weapon');        
        this.attack = true;
        this.z = 15;
        this.setOrigin(w/2, h);
        this.sprite = 'Dagger';
        this.damage = 1;        
        this.critDamage = 2;
        this.critChance = 0; 
        this.knockback = 200;
        this.attackTime = 10; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
    weaponMaker(){
        this.on('collide', (obj) => {
            if (this.attack) {
                for (let o of obj) {
                    if (o.hp && o.weapon != this) {
                        if (Math.random() >= (1-this.critChance))
                            o.emit('damage', this.critDamage, this);
                        else
                            o.emit('damage', this.damage, this);
                        if (this.specialAttack)
                            o.emit('knockback', this, this.knockback*2);
                        else
                            o.emit('knockback', this, this.knockback);
                        this.attack = false;
                        setTimeout(() => {
                            this.attack = true;
                        }, (Math.floor(1000/this.attackTime)));
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
        this.setOrigin(10, 40);
        this.sprite = 'Sword';
        this.damage = 1;
        this.critDamage = 2;
        this.critChance = .25; 
        this.knockback = 250;
        this.attackTime = 4; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}
class Longsword extends Weapon {
    constructor() {
        super(20, 44);
        this.sprite = 'Longsword';
        this.setOrigin(10, 44);
        this.damage = 1;
        this.critDamage = 2;
        this.critChance = .5; 
        this.knockback = 250;
        this.attackTime = 4; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}
class Greatsword extends Weapon {
    constructor() {
        super(24, 48);
        this.sprite = 'Greatsword';
        this.setOrigin(12, 48);
        this.damage = 1;
        this.critDamage = 2;
        this.critChance = .75; 
        this.knockback = 300;
        this.attackTime = 4; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}
class GlassSword extends Weapon {
    constructor() {
        super(22, 54);
        this.sprite = 'GlassSword';
        this.setOrigin(11, 54);
        this.damage = 2;
        this.critDamage = 2;
        this.critChance = 0; 
        this.knockback = 300;
        this.attackTime = 5; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}

class JimmysRustySword extends Weapon {
    constructor() {
        super(28, 80);
        this.sprite = 'JimmysRustySword';
        this.setOrigin(14, 80);
        this.damage = .5;
        this.critDamage = 20;
        this.critChance = .04; 
        this.knockback = 500;
        this.attackTime = 4; //Attacks Per Second (max 30)
        this.weaponMaker();
    }
}

class Barrier extends Weapon {
    constructor() {
        super(64, 64);
        this.sprite = 'Barrier';
        this.setOrigin(32, 32);
        this.damage = 0;
        this.critDamage = 1;
        this.critChance = .02; 
        this.knockback = 30;
        this.attackTime = 25; //Attacks Per Second (max 30)
        this.weaponMaker();

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
        this.attack = true;
        this.setOrigin(32, 32);
        this.damage = 0;
        this.critDamage = 1;
        this.critChance = .3; 
        this.knockback = 40;
        this.attackTime = 25; //Attacks Per Second (max 30)
        this.weaponMaker();
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