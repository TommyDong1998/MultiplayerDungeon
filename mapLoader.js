const fs = require("fs");
const path = require("path");

let cachedLevel;

function parseLayerData(raw) {
    return raw
        .trim()
        .split(/[\s,]+/)
        .filter((val) => val.length > 0)
        .map((val) => Number(val));
}

function loadLevel() {
    if (cachedLevel) return cachedLevel;

    const tmxPath = path.join(__dirname, "build/map/level.tmx");
    const xml = fs.readFileSync(tmxPath, "utf8");

    const widthMatch = xml.match(/width="(\d+)"/);
    const heightMatch = xml.match(/height="(\d+)"/);
    const width = widthMatch ? Number(widthMatch[1]) : 0;
    const height = heightMatch ? Number(heightMatch[1]) : 0;

    const layerRegex = /<layer[^>]*name="([^"]+)"[^>]*>[\s\S]*?<data[^>]*>([\s\S]*?)<\/data>[\s\S]*?<\/layer>/g;
    const layersByName = {};
    let match;
    while ((match = layerRegex.exec(xml))) {
        const [, name, rawData] = match;
        layersByName[name] = {
            name,
            data: parseLayerData(rawData)
        };
    }

    // Align to legacy index-based access in loadMap
    const layerOrder = ["Overlay", "Wall", "Monster", "Decorative Floor", "Tile"];
    const layers = layerOrder.map((key) => layersByName[key] || { name: key, data: [] });

    cachedLevel = { width, height, layers };
    return cachedLevel;
}

module.exports = {
    loadLevel
};
