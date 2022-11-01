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
    },
    JimmysRustySword: {
        cost: 44,
        add:function(player){
            player.weapon.emit("remove");
            var weapon = new JimmysRustySword();
            weapon.owner = player;
            map.insert(weapon);
            player.weild(weapon);
        }
    },
    StrengthUp: {
        cost:10,
        add:function(player){
            player.baseStat.strength +=1;
            setStat(player);
        }
    }
};
