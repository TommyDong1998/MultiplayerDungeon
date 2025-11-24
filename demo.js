const express = require("express");
const { sword, setWorld, setMap, setSettings, players } = require("./state");
const { Player } = require("./player");
const { loadMap, clearMap } = require("./level");
const { loadLevel } = require("./mapLoader");
const { setWarrior, setWizard, setMinie, setRogue } = require("./entityClass");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.static("site"));
app.get("/client_script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "client_script.js"));
});
app.get("/framesManifest.json", (req, res) => {
    res.json(buildFramesManifest());
});

function buildFramesManifest() {
    const dir = path.join(__dirname, "site/images/frames");
    const manifest = {};
    let files = [];
    try {
        files = fs.readdirSync(dir);
    } catch (e) {
        return manifest;
    }
    const re = /^(.+)_anim_f(\d+)\.png$/;
    files.forEach((file) => {
        const m = re.exec(file);
        if (!m) return;
        const prefix = m[1];
        const idx = Number(m[2]);
        manifest[prefix] = manifest[prefix] || [];
        manifest[prefix][idx] = "images/frames/" + file;
    });
    // compact arrays
    Object.keys(manifest).forEach((key) => {
        manifest[key] = manifest[key].filter(Boolean);
    });
    return manifest;
}
const port = process.env.PORT || 8080;

const httpServer = app.listen(port);
// allow client to get port

app.get("/api/port", (req, res) => {
    res.send("var port=" + port + ";");
});

let settings;
let playersConnected = 0;
let loadedMap = false;

// Send player information to client
function updateGoldRank() {
    let playersList = players.sort((a, b) => {
        return b.gold - a.gold;
    });
    playersList = playersList.map((player) => {
        return player.playerName;
    });
    players.forEach((player) => {
        player.socket.send(
            JSON.stringify({
                players: playersList
            })
        );
    });
}

// Upgrade gold rankings every 5 seconds
setInterval(() => {
    updateGoldRank();
}, 5000);

const world = new sword(function (setting, socket) {
    settings = setting;
    setSettings(setting);
    socket.on("connection", function connection(ws) {
        ws.once("message", (data) => {
            try {
                if (!loadedMap) {
                    loadMap(loadLevel());
                    loadedMap = true;
                }
                playersConnected += 1;

                data = JSON.parse(data);
                if (data.name) {
                    const player = new Player(ws, "elf", data.name);
                    const startClass = (data.class || "").toLowerCase();
                    switch (startClass) {
                        case "warrior":
                            setWarrior(player);
                            break;
                        case "apprentice":
                            setWizard(player);
                            break;
                        case "rogue":
                            setRogue(player);
                            break;
                        default:
                            break;
                    }
                    players.push(player);
                    updateGoldRank();
                    player.on("remove", () => {
                        if (players.indexOf(player) != -1) {
                            players.splice(players.indexOf(player), 1);
                            playersConnected -= 1;
                        }
                        setTimeout(() => {
                            if (playersConnected == 0) {
                                clearMap();
                                loadedMap = false;
                            }
                        }, 5000);
                    });
                }
            } catch (e) {
                console.log(e);
            }
        });
    });
}, httpServer);
setWorld(world);
world.setMaxListeners(100);
const map = new sword.GameMap(world, settings.width, settings.height);
setMap(map);
