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
                    if (o.hp < o.stat.hp)
                        o.hp += 1;
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
            for (let o of obj) {
                if (o instanceof Player) {
                    o.gold+=this.gold;
                    this.emit("remove");
                    break;
                }
            }
        });
    }
}