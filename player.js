//Shop number
const entityClassNum=1;

//A list of all the items and their cost
//If change must update boughtItem below

var shop_items = {
    Sword: {
        cost: 6,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Sword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Dagger: {
        cost: 5,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Dagger();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Warrior:{
        cost: 15,
        add:function(player){
            setWarrior(player);
        }
    },
    Vampire:{
        cost: 20,
        add:function(player){
            setVampire(player);
        }
    },
    Leader:{
        cost: 20,
        add:function(player){
            setLeader(player);
        }
    },
    PotionHoarder:{
        cost: 15,
        add:function(player){
            setPotionHoard(player);
        }
    },
    Longsword: {
        cost:12,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Longsword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Mini_Knight:{
        cost:15,
        add:function(player){
            setMinie(player);
        }
    },
    Barrier:{
        cost:20,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Barrier();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Greatsword:{
        cost:24,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new Greatsword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    HalfBarrier:{
        cost:12,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new HalfBarrier();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    Wizard:{
        cost:15,
        add:function(player){
            setWizard(player);
        }
    },
    GlassSword:{
        cost:32,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new GlassSword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    }
};


/* Requires Global Variable world */
class Player extends Monster {
    constructor(socket, type, name) {
        // Create Player
        super("elf");
        this.playerName = name;
		this.boughtItem=[];
        this.stat.speed = 150;
        this.mousePos = {
            x: 0,
            y: 0
        };
        this.setPosition(25*32 + Math.random() * 30, 15*32 + Math.random() * 30);
        this.socket = socket;
		//////////////////////////////
        // Add to main velocity loop
        // Create weapon
		//////////////////////////////
        this._weaponAnchor = {x: this.width / 2,y: this.height*0.5};
        let weapon=new Weapon(16, 32);
        map.insert(weapon);
        this.weild(weapon);
		//////////////////////////
        let OrientWeapon= function(x, y) {
            if (!this.weapon.specialAttack) {
                this.weapon.facing = this.facing;
                var pos = {
                    x: this.mousePos.x,
                    y: this.mousePos.y
                };
                util.normalize(pos, this._weaponReach);
                this.weapon.setPosition(this.polygon.pos.x + this._weaponAnchor.x + pos.x- this.weapon.origin.x, this.polygon.pos.y+this._weaponAnchor.y - this.weapon.origin.y+ pos.y);
            }
        }
        OrientWeapon=OrientWeapon.bind(this);
        world.on('nextFrame', OrientWeapon);
        
        this.on('remove',()=>{
            world.removeListener('nextFrame',OrientWeapon);
        });

        this._gold = 30;

        Object.defineProperty(this, 'gold', {
            set: (amount)=>{
                this.drops=[];
                this._gold=amount;
                for(let i =0; i< Math.min(this._gold,30);i++)
                    this.drops.push([Coin,0.9])
            },
            get: ()=>{
                return this._gold;
            }
        });

        
        //Cannot be hurt first 5 seconds of game
        this.damageFree = true;
        setTimeout(() => {
            this.damageFree = false;
        }, 5000);
        //////////////////////////////////
		var prevMov={x:0,y:0};
		socket.on('message', (data) => {
            try {
                data = JSON.parse(data);
                var arg = data[0];
                data = data.slice(1);
                switch (arg) {
                    case 0:
                        // Movement
                        this.velocity.x-=prevMov.x;
                        this.velocity.y-=prevMov.y;
						prevMov.x=data[0];
						prevMov.y=data[1];
						util.normalize(prevMov, this.stat.speed);
						this.velocity.x += prevMov.x;
                        this.velocity.y += prevMov.y;
                        if (this.velocity.x > 0) {
                            this.facing = 1;
                        } else if (this.velocity.x < 0) {
                            this.facing = -1;
                        }
                        break;
                        //Attack
                    case 1:
                        if (this.weapon._overrideAttack)
                            this.weapon._overrideAttack(this)
                        else
                            this.attack();
                        break;
                        //Mouse movement
                    case 2:
                        this.mousePos.x = data[0];
                        this.mousePos.y = data[1];
                        if (!this.weapon.specialAttack) {
                            var diff = Math.atan2(data[1], data[0]) - this.weapon.rad || 0;
                            this.weapon.rotate(diff + 2.5 * Math.PI);
                        }
                        break;
                        //Buy stuff
                    case 3:
                        try {
                            this.buy(data[0]);
                        } catch (e) {
                            console.log(e);
                        }
                        break;
						//Refresh shop
					case 4:
						 if(this.gold>=1){
							this.gold-=1
							this.shop();
						 }
					break;
                }
            } catch (e) {
                console.log('Error:' + e);
            }
        });
		this.shop();
        
        //Whenever something get removed
        function removeEntity(id) {
            try {
				socket.send(JSON.stringify({
					kill: id
				}));
            } catch (e) {
                console.log(e);
            }
        }
        // Display
        var sendFrame = this.sendFrame.bind(this);
        world.on('remove', removeEntity);
        world.on('nextFrame', sendFrame);
        var close = false;
        socket.on('close', () => {
            close = true;
            world.removeListener('remove', removeEntity);
            this.emit('remove');
        });
        this.once("remove", () => {
            world.removeListener('nextFrame', sendFrame);
            if (!close){
				world.removeListener('remove', removeEntity);
                socket.send(JSON.stringify({
                    restart: true
                }));
			}
        });
        //this.buy(0);
    }
    sendFrame() {
        this.data = this.data || {
            item: []
        };
        var current = map.findNear(this, 700);
        let visibleItems=[];
        const total=[];
        current.forEach((entity) => {
            if (entity.sprite || entity instanceof Bullet) {
                var info = {
                    id: entity.id,
                    x: Math.trunc(entity.pos.x),
                    y: Math.trunc(entity.pos.y),
                    w: entity.width,
                    h: entity.height,
                    sprite: entity.sprite,
                    z: entity.z
                };
                if (entity == this) {
                    info.player = true;
                    info.gold = entity.gold;
                    info.potion = entity.healthPotions;
					info.xp=entity.xp;
                }
                if (entity.hp != undefined) {
                    info.hp = entity.hp;
                    info.maxHP = entity.stat.hp;
                }
                if (entity.facing != undefined) {
                    info.facing = entity.facing;
                }
                if (entity.rad != undefined) {
                    info.origin = entity.origin;
                    info.rotate = entity.rad.toFixed(1);
                }
                if (entity instanceof Bullet) {
                    info.particle = true;
                }
                if (entity.type.indexOf("static") != -1) {
                    info.static = true;
                }
                if (entity.playerName) {
                    info.playerName = entity.playerName;
                }
                var exist = this.data.item.find((obj) => {
                    return obj.id == entity.id;
                });
                var data;
                // If player is in cache then only get the difference
                if (exist) {
                    data = util.diff(exist, info);
                    Object.assign(exist, data);
                } else {
                    data = info;
                    this.data.item.push(info);
                }
                // ///////////////////////////////////////////////////
                if (Object.keys(data).length > 0||this.visibleData.indexOf(entity.id)===-1) {
                    Object.assign(data, {
                        id: entity.id
                    });
                    total.push(data);
                }
            }
            visibleItems.push(entity.id);
            return total;
        }, []);
        current=total;
        this.visibleData=this.visibleData||[];
        /*
        Things player see previously but not currently
        Will notify client to set as invisible.
        Exception for static
        */
        let nonVisible=this.visibleData.filter((data)=>{
            return visibleItems.indexOf(data)===-1&&data.static != true;
        });
        
        this.visibleData=visibleItems;
        
        if (current.length){
            try {
                this.socket.send(JSON.stringify({
                    item: current
                }));
            } catch (e) {}
        }
        
        if(nonVisible.length){
            try {
                this.socket.send(JSON.stringify({
                    removeUpdate:nonVisible
//                    addUpdate:addUpdateData
                }));
            } catch (e) {}
        }
    }
    shop(){
		function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
        
        
        //Get all items not bought
        let unbought_items=[];
        for(let i=0;i<Object.keys(shop_items).length;i++){
            if(this.boughtItem.indexOf(i)==-1)
                unbought_items.push(i);
        }
        
        shuffleArray(unbought_items);
        this.shopItems=unbought_items.slice(0,6);
		//Try to send
		try{
			this.socket.send(JSON.stringify({
								shop: true,
								shopItems:this.shopItems
			}));
		}catch(e){
			console.log(e);
		}
	}
	buy(entity) {
        //Select the current item
        if(this.shopItems.length<=entity){
            return;
        }
        var item = shop_items[Object.keys(shop_items)[this.shopItems[entity]]];
        //Check if enough gold  
        if (this.gold >= item.cost) {
            this.gold -= item.cost;
        } else {
            //Not enough gold
            return;
        }
		//Not item
		this.boughtItem.push(this.shopItems[entity]);
		//entity
        item.add(this);
    }
}
