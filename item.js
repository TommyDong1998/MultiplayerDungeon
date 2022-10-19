/*global sword*/
class Potion extends sword.Entity {
    constructor(type) {
        super(16, 22);
        this.sprite = type;
        this.z = 10;
        map.insert(this);
        world.emit('velocity', this);
        world.emit('collision', this);
        this.on('collide', (obj) => {
            for (let o of obj) {
                if (o instanceof Player) {
                    if (o.hp < o.stat.hp-3)
                        o.hp += 4;
                    else if (o.hp < o.stat.hp)
                        o.hp = o.stat.hp;
					else if(o.entityClass=="potionHoard"){
						o.healthPotions++;
					}
                    this.emit("remove");
                    break;
                }
            }
        });
    }
}
/*global sword*/
class Coin extends sword.Entity {
    constructor() {
        super(12, 15);
        this.sprite = "Gold";
        this.z = 10;
        map.insert(this);
        world.emit('velocity', this);
        world.emit('collision', this);
        this.gold=1;
        
        this.on('collide', (obj) => {
            if(this.gold == 0){
                this.emit("remove");
            }
            for (let o of obj) {
                if (o instanceof Player) {
                    o.gold+=this.gold;
                    this.emit("remove");
                    break;
                }
                if (o instanceof Coin) {
                    if(this.gold<o.gold){
                        o.gold+=this.gold;
                        this.gold = 0;
                        break;
                    }else if(this.id<o.id){
                        o.gold+=this.gold;
                        this.gold = 0;
                        break;
                    }
                    this.width=Math.floor(12*(Math.cbrt(this.gold)));
                    this.height=Math.floor(15*(Math.cbrt(this.gold)));
                    this.box(this.width,this.height);
                    this.setOrigin(this.width/2, this.height/2);
                }
            }
        });
    }
}