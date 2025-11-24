const { sword, getWorld, getMap } = require("./state");

/**
 * Portal entity that teleports players to different dungeons
 */
class Portal extends sword.Entity {
    constructor(destinationDungeon, mapInstance = null) {
        super(32, 32);
        this.box(48, 48);
        this.sprite = 'big_demon_idle'; // Temporary - using demon as portal visual
        this.spriteScale = 2.0;
        this.destinationDungeon = destinationDungeon;
        this.z = 5; // Render above ground

        const map = mapInstance || getMap();
        const world = getWorld();

        // Insert into map first
        map.insert(this);

        // Enable collision detection
        world.emit('collision', this);

        console.log(`Portal created at (${Math.floor(this.pos.x)}, ${Math.floor(this.pos.y)}) -> ${destinationDungeon}`);

        // Handle collision with players
        this.on('collide', (objects) => {
            for (let obj of objects) {
                if (obj.isPlayer && this.destinationDungeon) {
                    // Check if player recently used this portal (prevent spam)
                    const now = Date.now();
                    if (!obj._lastPortalUse || now - obj._lastPortalUse > 2000) {
                        console.log(`Player ${obj.playerName} entering portal to ${this.destinationDungeon}`);
                        // Notify player they're entering portal
                        obj.emit('enterPortal', this.destinationDungeon);

                        // Mark when player used portal (cooldown)
                        obj._lastPortalUse = now;
                    }
                }
            }
        });
    }
}

module.exports = {
    Portal
};
