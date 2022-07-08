(function() {
    'use strict';
    // ///////////////
    // Sword Engine///
    // By Tom     ///
    // //////////////
    const QuadNode = require('quad-node');
    const SAT = require('sat');
    const WebSocket = require('ws');
    // Built in
    const EventEmitter = require('events');
    /*
    	ToDo List
    	- Make bounding box in GameMap better for rotation
    */
    const settings = {
        speed: 30,
        width: 5000,
        height: 5000,
        port: 8080,
        gravity: 10,
        debug: true
    };

    // Display basic server information
    function consoleStatus() {
        console.log('///////////////////////////////////////////');
        console.log('//Sword Engine Started Last Update 6/14/19//');
        console.log('///////////////////////////////////////////');
        console.log(`Target ${settings.speed} fps`);
        console.log(`Map ${settings.width} width ${settings.height} height`);
        console.log('///////////////////////////////////////////');
    }

    // Game map class
    class GameMap {
        constructor(server, w, h) {
            this.server = server;
            this.quadTree = new QuadNode({
                minx: 0,
                miny: 0,
                maxx: w,
                maxy: h
            }, 64, 10);
        }
        insert(object) {
            object.map = this;
            object.bound = {
                minx: object.pos.x,
                miny: object.pos.y,
                maxx: object.pos.x + object.width,
                maxy: object.pos.y + object.height
            };
            this.quadTree.insert(object);
        }
        update(object) {
            //Sometimes object is deleted already
            try {
                object.bound = {
                    minx: object.pos.x,
                    miny: object.pos.y,
                    maxx: object.pos.x + object.width,
                    maxy: object.pos.y + object.height
                };
                if (object.rad) {
                    var max = object.height > object.width ? object.height : object.width;
                    object.bound.minx -= max;
                    object.bound.maxx += 2 * max;
                    object.bound.miny -= max;
                    object.bound.maxy += 2 * max;
                }
                if (object._quadNode)
                    this.quadTree.update(object);
            } catch (e) {
                console.log("error", e);
            }
        }
        // //////////////////////////////////
        // Find any objects that may collide
        // //////////////////////////////////
        find(object) {
            var returnVal = [];
            this.quadTree.any(object.bound, (o) => {
                if (object != o)
                    returnVal.push(o);
            });
            return returnVal;
        }
        // /////////////////////////////////////////////////
        // Find any objects that may collide in the distance
        // /////////////////////////////////////////////////
        findNear(object, distance, cb) {
            var bound = JSON.parse(JSON.stringify(object.bound));
            bound.minx -= distance / 2;
            bound.miny -= distance / 2;
            bound.maxx += distance / 2;
            bound.maxy += distance / 2;
            var returnVal = [];
            this.quadTree.any(bound, (o) => {
                returnVal.push(o);
                if (cb)
                    cb(o);
            });
            return returnVal;
        }

        destroy(object) {
			try{
				this.quadTree.remove(object);
            }catch(e){
				console.log(e)
			}
			//object.attachE.forEach((entity) => {
            //  entity.emit('remove');
            //});
        }
    }

    // Entity
    // All creatures are entities
    class Entity extends EventEmitter {
        constructor(w, h) {
            super();
            h = h || w;
            this.degree = 0;
            this.box(w, h);
            this.id = Entity.id++;
            this.velocity = {
                x: 0,
                y: 0
            };
            this.type = [];
            this.attachE = [];
            this.once('remove', () => {
                this.removed = true;
                this.map.destroy(this);
                this.map.server.emit('remove', this.id);
            });
        }
		velocityTimeout(obj,amt,ms){
			var d = new SAT.Vector(obj.x,obj.y);
            d.normalize();
            d.scale(amt, amt);
            this.velocity.x += d.x;
            this.velocity.y += d.y;
			setTimeout(()=>{
				this.velocity.x -= d.x;
				this.velocity.y -= d.y;
			},ms);
            return d;
		}
        //Velocity towards an object
        velocityToward(obj, amt) {
            var d = new SAT.Vector(obj.pos.x - this.pos.x, obj.pos.y - this.pos.y);
            d.normalize();
            d.scale(amt, amt);
            this.velocity.x += d.x;
            this.velocity.y += d.y;
            return d;
        }
        // Set location
        setPosition(x, y) {
            this.polygon.pos.x = x;
            this.polygon.pos.y = y;
            if (this.map && this._quadNode)
                this.map.update(this);
            return this;
        }
        // Change entity hitbox
        box(w, h) {
            var vector;
            if (this.polygon)
                vector = this.polygon.pos;
            else
                vector = new SAT.Vector();
            this.polygon = new SAT.Box(vector, Math.floor(w), Math.floor(h)).toPolygon();
            this.pos = this.polygon.pos;
            this.setOrigin(w / 2, h / 2);
            this.size(w, h);
            return this;
        }
        // Change entity hitbox
        circle(w) {
            var vector;
            if (this.polygon) {
                vector = this.polygon.pos;
            } else {
                vector = new SAT.Vector();
            }
            this.polygon = new SAT.Circle(vector, w / 2);
            this.pos = this.polygon.pos;
            this.setOrigin(w / 2, w / 2);
            this.size(w, w);
            return this;
        }
        size(w, h) {
            this.width = w;
            this.height = h;
        }
        // set origin
        setOrigin(x, y) {
            this.origin = {
                x: Math.trunc(x),
                y: Math.trunc(y)
            };
        }
        // rotate
        rotate(rad) {
            this.rad = this.rad || 0;
            var diff = rad;
            this.rad += rad;
            if (this.polygon.translate) {
                this.polygon.translate(this.origin.x * -1, this.origin.y * -1);
                this.polygon.rotate(diff);
                this.polygon.translate(this.origin.x, this.origin.y);
            }
            this.map.update(this);
            return this;
        }
        // inherit all prototypes of another object
        extend(type) {
            Object.assign(this.constructor.prototype, type);
            return this;
        }
        // Return what this object collide with
        collideWith() {
            var returnVal = [];
            // Checks if what this object may collide with
            this.map.find(this).forEach((enemy) => {
                // Check if they actually collide
                if (SAT.testPolygonPolygon(this.polygon, enemy.polygon)) {
                    return returnVal.push(enemy);
                }
            });
            return returnVal;
        }
        attach(obj) {
            this.attachE.push(obj);
        }
    }

    // All entity have different id
    Entity.id = 0;
    // ////////////////////
    // Constructor
    function main(cb,httpServer) {
        // Run one time
        consoleStatus();
        let opt;
        if(httpServer){
            opt={
                server: httpServer,
                perMessageDeflate: false
            }
        }else{
            opt={
            port: settings.port,
            perMessageDeflate: false
            }
        }
        const socket = new WebSocket.Server(opt);
        const velocity = [];
        const collision = [];
        let undoVelocity = [];
        this.on('velocity', (object) => {
            velocity.push(object);
            object.once('remove', () => {
                velocity.splice(velocity.indexOf(object), 1);
            });
        });
        this.on('rmVelocity', (object) => {
            velocity.splice(velocity.indexOf(object), 1);
        });
        this.on('undoVelocity', (o, x, y) => {
            if (undoVelocity.indexOf(o) == -1)
                undoVelocity.push({
                    object: o,
                    x: x,
                    y: y
                });
        });
        this.on('collision', (object) => {
            collision.push(object);
            object.once('remove', () => {
				if(collision.indexOf(object)!=-1)
                collision.splice(collision.indexOf(object), 1);
            });
        });
        this.on('rmCollision', (object) => {
            collision.splice(collision.indexOf(object), 1);
        });

        let lastTick = Date.now();
        const loop=setInterval(() => {
            //Calculate delta
            const currentTicket=Date.now();
            const delta=(currentTicket-lastTick)/1000;
            lastTick=currentTicket;

            if (settings.debug && delta > 0.04) {
                console.log("Time(normal " + Math.floor(1 / settings.speed*100)/100 + ")", delta);
            }
            
            velocity.forEach((entity) => {
                entity.dx = entity.velocity.x * delta;
                entity.dy = entity.velocity.y * delta;
                entity.setPosition(entity.polygon.pos.x + entity.dx, entity.polygon.pos.y + entity.dy);
                entity.emit('velocity', entity.dx, entity.dy);
                for (var x of entity.attachE) {
                    x.setPosition(x.polygon.pos.x + entity.dx, x.polygon.pos.y + entity.dy);
                }
            });

            collision.forEach((entity) => {
                // Check collision
                const overlapping = entity.collideWith();
                entity.emit('collide', overlapping);
            });

            undoVelocity.forEach((entity) => {
                let newX = entity.object.polygon.pos.x;
                let newY = entity.object.polygon.pos.y;
                if (entity.x)
                    newX -= entity.object.dx;
                if (entity.y)
                    newY -= entity.object.dy;
                entity.object.setPosition(newX, newY);
                for (let x of entity.object.attachE) {
                    x.setPosition(x.polygon.pos.x - entity.object.dx, x.polygon.pos.y - entity.object.dy);
                }
            });
            undoVelocity = [];
            this.emit('processFinish');
        }, Math.floor(1000 / settings.speed/10)*10);
		cb(settings, socket);
    }
    Object.assign(main.prototype, EventEmitter.prototype);
    Object.assign(main, {
        GameMap,
        Entity
    });
    module.exports = main;
})();