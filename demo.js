var express = require("express");
var app = express();

app.use(express.static('site'));
let port=process.env.PORT||8080

var httpServer=app.listen(port);
//allow client to get port

app.get('/api/port', (req, res) => {
    res.send('var port='+port+';');
});

var sword = require("swordengine");
/*
ToDo
Finish xp implementation
Level Teleporting
Leader Class
Mage Class
*/

// Some common untilities that will be used.
var util = {
    normalize: (point, scale) => {
        //From stackoverflow//Modified //Creative commons
        var norm = Math.sqrt(Math.abs(point.x * point.x) + Math.abs(point.y * point.y));
        if (norm != 0) { // as3 return 0,0 for a point of zero length
            point.x = scale * point.x / norm;
            point.y = scale * point.y / norm;
        }
        //End
    },
    //Used to get difference between two objects
    diff: (object, object3) => {
        var diff = {}
        for (var obj in object3) {
            if (!object.hasOwnProperty(obj) || object3[obj] != object[obj]) {
                diff[obj] = object3[obj];
            }
        }
        return diff;
    }
};

var settings;
var players=[];
var world = new sword(function(setting, socket) {
    settings = setting;
    socket.on('connection', function connection(ws) {
        var logged;
		if(players.length==0){
			loadMap(require("./map/level1.json"));
		}
        ws.once("message", (data) => {
            try {
                data = JSON.parse(data);
                if (data.name) {
                    var player = new Player(ws, "elf", data.name);
					players.push(player);
					player.on("remove",()=>{
						if(players.indexOf(player)!=-1)
							players.splice(players.indexOf(player),1);
					});
                }
            } catch (e) {
                console.log(e);
            }
        });
    });
},httpServer);
world.setMaxListeners(100);
var map = new sword.GameMap(world, settings.width, settings.height);