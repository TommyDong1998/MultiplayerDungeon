const { sword, util, getWorld, getMap } = require("./state");
const { Potion, Coin } = require("./item");

/*
This is the class that all entities inherit. NPC and Players.
*/
class Monster extends sword.Entity {
    constructor(type, mapInstance = null) {
        super(1,1);
        this.setType(type);
        this.z = 10;
        this.stat = {
            hp: this.hp,
            mana: 0,
            speed: 100,
            strength: 1, //Ability Power
            resistance: 0, //Knockback and Status Effect Resistance
            defense: 0 //Blocks 1 hp of damage per 10 seconds
        };
        this.status=[];
		this.facing = 1;
		this._weaponReach=10;
        // Use provided map instance or fallback to global
        const map = mapInstance || getMap();
        const world = getWorld();
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
                    let col=this.collideWith((ob)=>{return ob.type.indexOf('solid') != -1;}).find((entity) => {
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
        this.drops=[[Potion.bind(null,"HealthPotion"),0.1], [Coin,0.7]]
        //When this get attacked
        this.on('damage', (amt, obj) => {
            if (this.damageFree)
                return;
            this.hp -= amt;
            if (this.hp <= 0 && !this.isPlayer) {
                // Only remove non-player entities (players handle death differently)
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
        weapon.owner=this;
        weapon.setPosition(this.polygon.pos.x + this._weaponAnchor.x + - this.weapon.width / 2, this.polygon.pos.y+this._weaponAnchor.y - weapon.origin.y/2);
        //weapon.setPosition(this.polygon.pos.x + this.width / 2 - weapon.width * this.facing, this.polygon.pos.y - weapon.origin.y);
        this.weapon.emit('init', this)
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
                this.box(22, 38);
                this.sprite = 'elf_m_run';
                this.spriteScale = 1.4;
                this._updateWeaponAnchor(28);
                this.hp = 10;
                break;
            case "skeleton":
                this.box(18, 30);
                this.sprite = 'skelet_run';
                this.spriteScale = 1.9;
                this._updateWeaponAnchor(16);
                this.hp = 6;
                break;
            case "demon":
                this.box(53, 60);
                this.sprite = 'big_demon_run';
                this.spriteScale = 1.7;
                this._updateWeaponAnchor(36);
                this.hp = 15;
                break;
            case "minion":
                this.box(16, 18);
                this.sprite = 'goblin_run';
                this.spriteScale = 1.1;
                this._updateWeaponAnchor(16);
                this.hp = 3;
                break;
            case "TallMinion":
                this.box(18, 36);
                this.sprite = 'zombie_run';
                this.spriteScale = 2.3;
                this._updateWeaponAnchor(16);
                this.hp = 5;
                break;
            case "TinyMinion":
                this.box(16, 24);
                this.sprite = 'chort_run';
                this.spriteScale = 1.0;
                this._updateWeaponAnchor(24);
                this.hp = 4;
                break;

            // === DEMON REALM ENEMIES ===
            case "chort":
                this.box(16, 24);
                this.sprite = 'chort_run';
                this.spriteScale = 1.0;
                this._updateWeaponAnchor(24);
                this.hp = 5;
                break;
            case "imp":
                this.box(14, 18);
                this.sprite = 'imp_run';
                this.spriteScale = 1.1;
                this._updateWeaponAnchor(16);
                this.hp = 4;
                break;
            case "wogol":
                this.box(16, 22);
                this.sprite = 'wogol_run';
                this.spriteScale = 1.1;
                this._updateWeaponAnchor(20);
                this.hp = 6;
                break;
            case "necromancer":
                this.box(18, 24);
                this.sprite = 'necromancer_run';
                this.spriteScale = 1.2;
                this._updateWeaponAnchor(20);
                this.hp = 8;
                break;
            case "big_demon":
                this.box(60, 70);
                this.sprite = 'big_demon_run';
                this.spriteScale = 1.9;
                this._updateWeaponAnchor(36);
                this.hp = 25;
                break;

            // === ORC STRONGHOLD ENEMIES ===
            case "orc_warrior":
                this.box(18, 24);
                this.sprite = 'orc_warrior_run';
                this.spriteScale = 1.2;
                this._updateWeaponAnchor(20);
                this.hp = 10;
                break;
            case "orc_shaman":
                this.box(18, 24);
                this.sprite = 'orc_shaman_run';
                this.spriteScale = 1.2;
                this._updateWeaponAnchor(20);
                this.hp = 8;
                break;
            case "masked_orc":
                this.box(18, 24);
                this.sprite = 'masked_orc_run';
                this.spriteScale = 1.2;
                this._updateWeaponAnchor(20);
                this.hp = 12;
                break;
            case "ogre":
                this.box(48, 52);
                this.sprite = 'ogre_run';
                this.spriteScale = 1.6;
                this._updateWeaponAnchor(32);
                this.hp = 20;
                break;
            case "ogre_boss":
                this.box(60, 70);
                this.sprite = 'ogre_run';
                this.spriteScale = 2.2;
                this._updateWeaponAnchor(32);
                this.hp = 50;
                break;

            // === UNDEAD CATACOMBS ENEMIES ===
            case "zombie":
                this.box(18, 36);
                this.sprite = 'zombie_run';
                this.spriteScale = 2.3;
                this._updateWeaponAnchor(16);
                this.hp = 7;
                break;
            case "tiny_zombie":
                this.box(14, 18);
                this.sprite = 'tiny_zombie_run';
                this.spriteScale = 1.1;
                this._updateWeaponAnchor(16);
                this.hp = 4;
                break;
            case "ice_zombie":
                this.box(16, 20);
                this.sprite = 'ice_zombie_run';
                this.spriteScale = 1.3;
                this._updateWeaponAnchor(16);
                this.hp = 6;
                break;
            case "muddy":
                this.box(16, 20);
                this.sprite = 'muddy_run';
                this.spriteScale = 1.3;
                this._updateWeaponAnchor(16);
                this.hp = 5;
                break;
            case "big_zombie":
                this.box(50, 60);
                this.sprite = 'big_zombie_run';
                this.spriteScale = 1.8;
                this._updateWeaponAnchor(34);
                this.hp = 18;
                break;
            case "necromancer_boss":
                this.box(24, 30);
                this.sprite = 'necromancer_run';
                this.spriteScale = 1.5;
                this._updateWeaponAnchor(20);
                this.hp = 60;
                break;

            // === FINAL BOSS ===
            case "mega_demon":
                this.box(80, 90);
                this.sprite = 'big_demon_run';
                this.spriteScale = 2.5;
                this._updateWeaponAnchor(36);
                this.hp = 100;
                break;
        }
    }
    _updateWeaponAnchor(spriteHeight) {
        // Adjust weapon anchor to match visual sprite center
        const scaledHeight = spriteHeight * this.spriteScale;
        // Sprite is bottom-aligned, so visual center is offset upward
        const visualCenterY = this.height - scaledHeight / 2;
        this._weaponAnchor = {
            x: this.width / 2,
            y: visualCenterY
        };
    }
    //Knocked back by an obj
    knockback(obj, amt) {
        amt = amt*(5/(5+this.stat.resistance))
        this._knockbackCount=this._knockbackCount||0;
        this._knockbackCount+=1;
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
            this._knockbackCount-=1;
            this.velocity.x -= d.x;
            this.velocity.y -= d.y;
        }, 300)
    }
}

module.exports = {
    Monster
};
