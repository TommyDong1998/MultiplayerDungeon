const sword = require("swordengine");

// Shared utilities and singletons for the game world
const util = {
    normalize: (point, scale) => {
        // From stackoverflow // Modified // Creative commons
        const norm = Math.sqrt(Math.abs(point.x * point.x) + Math.abs(point.y * point.y));
        if (norm !== 0) {
            point.x = scale * point.x / norm;
            point.y = scale * point.y / norm;
        }
    },
    diff: (object, object3) => {
        const diff = {};
        for (const obj in object3) {
            if (!Object.prototype.hasOwnProperty.call(object, obj) || object3[obj] !== object[obj]) {
                diff[obj] = object3[obj];
            }
        }
        return diff;
    }
};

const players = [];

let world;
let map;
let settings;

const getWorld = () => world;
const setWorld = (instance) => {
    world = instance;
};

const getMap = () => map;
const setMap = (instance) => {
    map = instance;
};

const getSettings = () => settings;
const setSettings = (value) => {
    settings = value;
};

module.exports = {
    sword,
    util,
    players,
    getWorld,
    setWorld,
    getMap,
    setMap,
    getSettings,
    setSettings
};
