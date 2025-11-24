var itemsDef=[
	{name:"Sword",				description:"A little longer.Moderate chance of doing double damage!",						cost:6,		rarity:0},
	{name:"Dagger",				description:"Very short. Little knockback. Increased gold chance!",							cost:5,		rarity:0},
	{name:"Warrior",			description:"Extra health. Invincible charge special attack!",								cost:15,	rarity:0},
	{name:"Vampire",			description:"Doing damage heals you!",														cost:20,	rarity:1},
	{name:"Human Leader",		description:"Giant among men. Clearly the leader!",											cost:20,	rarity:1},
	{name:"Potion Hoarder",		description:"You can now hoard potions. Get 1 potion every 20 seconds!",					cost:15,	rarity:0},
	{name:"Longsword",			description:"The Sword of the Superior Swordsman.",											cost:12,	rarity:0},
	{name:"Mini Knight",		description:"The strongest, tinist warrior alive.",											cost:15,	rarity:0},
	{name:"Barrier",			description:"You can use forcefield but it disable your attack.",							cost:20,	rarity:0},
	{name:"Greatsword",			description:"Make swords great again.",														cost:24,	rarity:0},
	{name:"HalfBarrier",		description:"Its Like a forcefield but not all the way.",									cost:12,	rarity:0},
	{name:"Wizard",				description:"Long ranged attack",															cost:15,	rarity:0},
	{name:"GlassSword",			description:"Good lord a sovereign sword!",													cost:32,	rarity:0},
	{name:"JimmysRustySword",	description:"May come with tetanus.",														cost:44,	rarity:0},
	{name:"StrengthUp",			description:"Increases Strength by 1",														cost:10,	rarity:0}
];
///////////////
const canvas = document.getElementById('canvas');

var setting={
	width:Math.min(window.innerHeight*1.5,window.innerWidth-200),
	height:Math.min(window.innerWidth,window.innerHeight)
};
setting.scale=Math.ceil(Math.max(setting.width,setting.height)/500)
canvas.width=setting.width;
canvas.height=setting.height;

var ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled =false;
document.getElementById('shop').style.visibility="hidden";
/////Shop
document.querySelector("#shop").onclick=()=>{
	if(document.querySelector("#popmenu").style.visibility!="visible"){
		document.querySelector("#popmenu").style.visibility="visible";
	}else{
		document.querySelector("#popmenu").style.visibility="hidden";
	}
};
var currentShop=[];
document.querySelectorAll(".bbutton").forEach((e)=>{
	e.onclick=function(){
		let id=this.parentNode.id.substr(7)-1
		buyShop(id);
		document.querySelector("#popmenu").style.visibility="hidden";
		if(gold>=itemsDef[currentShop[id]].cost){
			createBlankItem(id);
		}else{
			alert("Not enough gold")
		}
	}
})
document.querySelector("#refreshShop .bbutton").onclick=()=>{
	socket.send(JSON.stringify([4]));
}
function setXp(amt){
	document.querySelector("#xp #bar").style.visibility="visible";
	document.querySelector("#xp #bar").style.width=amt+"%";
}
function createBlankItem(loc){
	var doc=document.querySelector("#section"+(loc+1));
	doc.querySelector("img").hidden=true;
	doc.querySelector(".detail").innerHTML="Nothing for sale<br/><small>Nothing here</small>";
	doc.querySelector(".bbutton").innerText="Nothing for sale"
	currentShop[loc]=false;
}
function createItem(loc,item){
	var doc=document.querySelector("#section"+loc);
	doc.querySelector("img").hidden=false;
	doc.querySelector("img").src="images/"+itemsDef[item].name+".png";
	doc.querySelector(".detail").innerHTML="<b>"+itemsDef[item].name+"</b><br/>"+itemsDef[item].description;
	doc.querySelector(".bbutton").innerText=itemsDef[item].cost+"G Buy";
	currentShop[loc-1]=item;
}
function buyShop(item){
	socket.send(JSON.stringify([3,item]))
}

ctx.scale(setting.scale ,setting.scale);
var player;
var gold;
class item{
	constructor(item){
		this.id=item.id;
		this.zOrder=item.z||0;
		this.static=item.static;
		this.sprite={x:0,y:0,width:0,height:0,info:loadSprite(item.sprite)};
		this.particle=item.particle;
		this.update(item);
		updateIndex();
		if(item.player){
		player=this;
		console.log("new player")
		}
	}
	update(item){
		var sprite=this.sprite;
		if(item.sprite){
			sprite.info=loadSprite(item.sprite);
		}
		if(item.x!=undefined){
			var difference=item.x-sprite.x;
			sprite.x=item.x;
		}
		if(item.y!=undefined)
			sprite.y=item.y;
		if(item.w){
			sprite.width=item.w;
		}
		if(item.hp!=undefined){
			sprite.hp=item.hp;
		}
		if(item.maxHP!=undefined){
			sprite.maxHP=item.maxHP;
		}
		if(item.xp!=undefined){
			sprite.xp=item.xp;
		}
		if(item.playerName!=undefined){
			sprite.playerName=item.playerName;
		}
		if(item.h)
			sprite.height=item.h;
		if(item.origin){
			sprite.origin=item.origin;
		}
		if(item.rotate){
			sprite.rotate=item.rotate;
		}
		if(item.facing!=undefined){
			sprite.flip=item.facing!=1;
		}
		if(item.gold!=undefined){
			gold=item.gold;
			document.querySelector("#gold").innerText=gold+"G";
		}
		if(item.potion!=undefined){
			sprite.potion=item.potion;
		}
}
}
class map{
	constructor(){
		this.map={};
		this.update= [];
	}
	addOrUpdate(obj){
		if(this.map[obj.id]){
			this.map[obj.id].update(obj);
		}
		else{
			this.map[obj.id]=new item(obj);
		}
		if (this.update.indexOf(this.map[obj.id])==-1){
			this.update.push(this.map[obj.id])
		}
		if(this.map[obj.id].visibility==false){
			this.map[obj.id].visibility=true;
		}
	}
	remove(entity){
		//Set to invisible instead of removing object since server only sends new info about an object
		if(this.map[entity])
			this.map[entity].visibility=false;
	}
}

//Holds all the items
var gameMap= new map;
//	Load tiles
var tiles=new Image(512,512);
tiles.src="images/map.png";

//	Do this when the tiles are loaded
tiles.onload=loaded;
function loaded(){
	window.requestAnimationFrame(update);
}

//	Load information about the sprite
function loadSprite(name){
	//If inside sprite sheet
	var info=spriteData[name];
	if(info){
		return info;
	}else if(name=="elf"){
		return [{x:16*8+1,y:16*3-3,width:15,height:19},
				{x:16*9+1,y:16*3-2,width:15,height:18},
				{x:16*10+1,y:16*3-1,width:15,height:17},
				{x:16*11+1,y:16*3-2,width:15,height:18}];
	}
	else if(name=="wizard"){
		return [{x:16*8+1,y:173,width:15,height:19},
				{x:16*9+1,y:172,width:15,height:19},
				{x:16*10+1,y:174,width:15,height:18},
				{x:16*11+1,y:173,width:15,height:19}];
	}
	//lava
	else if(name==36||name==37||name==38){
		return [{x:(36%32)*16,y:(Math.trunc(36/32))*16,width:16,height:16},
		{x:(37%32)*16,y:(Math.trunc(37/32))*16,width:16,height:16},
		{x:(38%32)*16,y:(Math.trunc(38/32))*16,width:16,height:16}]
	}
	else if(name=="knight"){
		return [{x:16*8+1,y:108,width:15,height:20},
				{x:16*9+1,y:108,width:15,height:20},
				{x:16*10+1,y:108,width:15,height:20},
				{x:16*11+1,y:109,width:15,height:20}];
	}else if(name=="skeleton"){
		return [{x:371,y:82,width:10,height:14},
				{x:387,y:84,width:10,height:12},
				{x:403,y:85,width:10,height:11},
				{x: 418,y: 83,width:10,height:13}];
	}else if(name=="demon"){
		return [{x:21,y:370,width:23,height:30},
				{x:52,y:369,width:24,height:31},
				{x:85,y:369,width:22,height:32},
				{x: 115,y: 372,width:26,height:29}];
	}else if(name=="minion"){
		return [{x:371,y:334,width:11,height:18},
				{x:387,y:338,width:11,height:18},
				{x:403,y:337,width:11,height:18},
				{x: 419,y: 331,width:10,height:21}];
	}
	else if(typeof name =="number"){
		return {x:(name%32)*16,y:(Math.trunc(name/32))*16,width:16,height:16};
	}
	return {x:0,y:0,width:0,height:0};
}

var util={
	//Info - location of sprite in sprite sheet
	//Sprite - 
	drawSprite:(info,sprite)=>{
		//If there is an image file
		if(info.src){
			//Load it once
			if(info.image==undefined){
				info.image = new Image();
				info.image.src = info.src;
			}else if (info.image.complete){
				ctx.drawImage(info.image, sprite.x,sprite.y,sprite.width,sprite.height);
			}
		}else{
			ctx.drawImage(tiles,info.x,info.y,info.width,info.height,
			sprite.x,sprite.y,sprite.width,sprite.height);
		}
	},
	flip:(info,sprite,c)=>{
		ctx.save();
		ctx.scale(-1,1);
		c({x:(sprite.x+sprite.width)*-1,y:sprite.y,width:sprite.width,height:sprite.height});
		ctx.restore();
	},
	rotate:(info,sprite,c)=>{
		ctx.save();

		var origin={};
		if(sprite.origin)
			origin=sprite.origin;
		var x=origin.x
		var y=origin.y
		var rotate=sprite.rotate;

		ctx.translate(sprite.x+x,sprite.y+y);
		ctx.rotate(rotate);
		ctx.translate((sprite.x+x)*-1,(sprite.y+y)*-1);
		c({x:sprite.x,y:sprite.y,width:sprite.width,height:sprite.height});
		ctx.restore();
	}
}
function clamp(value, min, max){
	if(value < min) return min;
	else if(value > max) return max;
	return value;
}
//	Update the canvas once per frame
function update(){
	ctx.clearRect(0, 0, setting.height, setting.width)

	//Camera
	ctx.save()
	if(player){
		ctx.translate(Math.round(setting.width/setting.scale/2-player.sprite.x-player.sprite.width/2),
						Math.round(setting.height/setting.scale/2-player.sprite.y-player.sprite.height/2));
	}

	//Draw all items
	for(var item of gameMap.update){
		if(item.visibility == false)
			continue;

		//Load sprite information
		var info=item.sprite.info; //{x y width height} or [{x y width height}]
		var sprite=item.sprite; //{x,y,width,height}

		if(info.length){
			sprite.frame=sprite.frame||0;
			info=info[Math.trunc(sprite.frame/5)%info.length];
			sprite.frame++;
		}
		var spriteInfo=Object.assign({},item.sprite);
		var origin={};

		if(item.particle){
			ctx.fillRect(info.x,info.y,10,10);
		}
		else if(sprite.rotate!=undefined){
			util.rotate(info,sprite,()=>{
				if(sprite.flip){
					util.flip(info,sprite,(sprite)=>{
						util.drawSprite(info,sprite);
					});
				}else{
					util.drawSprite(info,sprite);
				}
			});
		}else{
			if(sprite.flip){
					util.flip(info,sprite,(sprite)=>{
						util.drawSprite(info,sprite);
					});
				}else{
					util.drawSprite(info,sprite);
				}
		}
		if(sprite.playerName){
			ctx.save();
			ctx.font = "12px VT323";
			if(item==player)
				ctx.fillText(sprite.playerName, sprite.x, sprite.y-5);
			else
				ctx.fillText(sprite.playerName, sprite.x, sprite.y-13);
			ctx.restore();
		}
		if(item!=player&&sprite.hp&&sprite.maxHP&&sprite.maxHP!=sprite.hp){
			ctx.save();
			ctx.fillStyle='green';
			var amount=sprite.width*sprite.hp/sprite.maxHP;
			ctx.fillRect(sprite.x,sprite.y-10,amount,5);
			
			ctx.fillStyle='grey';
			ctx.fillRect(sprite.x+amount,sprite.y-10,sprite.width-amount,5);
			ctx.restore();
		}
	}
	ctx.restore();
	if(player){
		//Draw hp
		for(var x=0;x<(player.sprite.maxHP/2);x++){
			//If still have 2 more hearts to draw
			if(x>=10){
				if((x+1)*2 <=player.sprite.hp)
					util.drawSprite(loadSprite(530),{x:26*x-243,y:15,width:26,height:26});
				
					//If 2 is too much
				else if(player.sprite.hp%2&&player.sprite.hp-(x)*2>0)
					util.drawSprite(loadSprite(531),{x:26*x-243,y:15,width:26,height:26});
				else
					util.drawSprite(loadSprite(532),{x:26*x-243,y:15,width:26,height:26});
			}
			else{
				if((x+1)*2 <=player.sprite.hp)
					util.drawSprite(loadSprite(530),{x:4+26*x,y:2,width:26,height:26});
				
					//If 2 is too much
				else if(player.sprite.hp%2&&player.sprite.hp-(x)*2>0)
					util.drawSprite(loadSprite(531),{x:4+26*x,y:2,width:26,height:26});
				else
					util.drawSprite(loadSprite(532),{x:4+26*x,y:2,width:26,height:26});
			}
		}
		//Draw potion
		for(var x=0;x<(player.sprite.potion);x++){
				util.drawSprite(loadSprite("HealthPotion"),{x:6+18*x,y:44,width:16,height:22});
		}
		
		//Display team
		ctx.save();
		ctx.restore();
	}
	window.requestAnimationFrame(update);
	
}


//	Create a socket to connect to the server
var socket=new WebSocket((window.location.protocol === 'https:' ? 'wss' : 'ws')+"://"+window.location.host);
var pname;
function randomName() {
	//var randomNum = Math.floor(Math.random() * 10);
	var noun = ["CrackedHead", "Monke", "Ape", "Egg", "Groot", "Dumper", "Minion", "Nose", "Cheeks", "Leg"];
	var adjective = ["Fart","Creepy","Blushing","Adorable","Ill","Itchy","Motionless","Ugly","Tender","Nervous"];
		return adjective[Math.floor(Math.random() * adjective.length)] + " " + noun[Math.floor(Math.random() * noun.length)];
}
function startGame(){
	document.getElementById('shop').style.visibility="visible";
	pname=document.querySelector('#name').value;
	socket.send(JSON.stringify({"name":pname}));
	document.querySelector("#signinBackground").style.display="none";
	setUpControl();
}
socket.addEventListener("open",()=>{
	document.querySelector('#name').value=randomName();
});
socket.onmessage=recievePackets;
//	When you get message from server do this
function recievePackets(event){
	var message=JSON.parse(event.data);
	if(message.shop){
		let i=1;
		message.shopItems.forEach((item)=>{
			createItem(i,item);
			i++;
		})
	}
	else if(message.item){
		message.item.forEach((item)=>{
			//Create the item and add to map or update the item
			gameMap.addOrUpdate(item);
			updateIndex();
		});
	}
	// Something got killed
	else if(message.kill){
		gameMap.remove(message.kill);
	}
	else if(message.players){
		let player="";
		let rank=1;
		message.players.forEach((playerName)=>{
			player+="<div>#"+rank+" "+playerName+"</div>";
			rank+=1;
		});
		document.querySelector('#playerList').innerHTML=player;
	}
	if (message.removeUpdate){
		message.removeUpdate.forEach((entity)=>{
			if(gameMap.map[entity])
				gameMap.remove(entity);
		})
	}
	if(message.restart){
		showRestartOverlay(()=>{
			var tempSocket=new WebSocket((window.location.protocol === 'https:' ? 'wss' : 'ws')+"://"+window.location.host);
			tempSocket.addEventListener("open",()=>{
				socket.send(JSON.stringify({"name":pname}));
			});
			tempSocket.onmessage=recievePackets;
			socket= tempSocket;
			gameMap= new map;
		},()=>{
			console.log("no restart")
		});
	}
}

//////////////////////////////
//User input
//////////////////////////////

function setUpControl(){
	document.onkeydown = keyPress;
	document.onkeyup = keyUp;
	document.onmousemove= moveMouse;
	canvas.onmousedown =()=>{
		sendAttack();
	};
	canvas.onmouseup =()=>{
		clearInterval(kpress.space);
		kpress.space=null;
	};
}

var kpress={x:0,y:0,space:null};
var prevMouse={x:0,y:0};
function moveMouse(e){
	var currentMouse={x:e.clientX-setting.width/2-canvas.getBoundingClientRect().left,y:e.clientY-setting.height/2};
	if(Math.floor(prevMouse.x)!=Math.floor(currentMouse.x)||Math.floor(prevMouse.y)!=Math.floor(currentMouse.y)){
		prevMouse=currentMouse;
	}
	try{
		socket.send(JSON.stringify([2,prevMouse.x,prevMouse.y]));
	}catch(e){
		console.log(e);
	}
}
function sendAttack(){
	if(kpress.space==null){
		socket.send(JSON.stringify([1,kpress.space]));
		kpress.space=setInterval(function(){	
			socket.send(JSON.stringify([1,kpress.space]));
		},50);
	}
}
//	When the user presses down
function keyPress(e) {
	e = e || window.event;
	if(e.keyCode == '32'){
		sendAttack();
	}
	//up
		if (e.keyCode == '38'||e.keyCode == '87') {
			kpress.y=-1;
		}
		//down
		else if (e.keyCode == '40'||e.keyCode == '83') {
			kpress.y=1;
		}
	//left
		else if (e.keyCode == '37'||e.keyCode == '65') {
			kpress.x=-1;
		}
		//right
		else if (e.keyCode == '39'||e.keyCode == '68') {
			kpress.x=1;
		}
		socket.send(JSON.stringify([0,kpress.x,kpress.y]));
}

//	When the user lift the key up
function keyUp(e) {
	e = e || window.event;
	if(e.keyCode == '32'){
		clearInterval(kpress.space);
		kpress.space=null;
	}
	//up
	if (e.keyCode == '38'||e.keyCode == '87') {
		kpress.y=0;
	}
	//down
	else if (e.keyCode == '40'||e.keyCode == '83') {
		kpress.y=0;
	}
	//left
	else if (e.keyCode == '37'||e.keyCode == '65') {
		kpress.x=0;
	}
	//right
	else if (e.keyCode == '39'||e.keyCode == '68') {
		kpress.x=0;
	}
	socket.send(JSON.stringify([0,kpress.x,kpress.y]));
}

//Sort the z index
function updateIndex() {
	gameMap.update.sort(function(a,b) {
		a.zOrder = a.zOrder || 0;
		b.zOrder = b.zOrder || 0;
		return a.zOrder - b.zOrder
	});
};
function showRestartOverlay(onRestart,onCancel){
	const modal=document.getElementById("restartOverlay");
	if(!modal){
		if(onRestart) onRestart();
		return;
	}
	const primary=modal.querySelector(".restart-primary");
	const cancel=modal.querySelector(".restart-cancel");
	const cleanup=()=>{
		modal.style.display="none";
		primary.onclick=null;
		cancel.onclick=null;
	};
	modal.style.display="flex";
	primary.onclick=()=>{
		cleanup();
		onRestart&&onRestart();
	};
	cancel.onclick=()=>{
		cleanup();
		onCancel&&onCancel();
	};
}
