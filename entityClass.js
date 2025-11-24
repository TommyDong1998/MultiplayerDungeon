const { chargeAttack, pounceAttack, potionAttack, spinAttack } = require("./attacks");
const { Projectile, Fireball, GoldenMoon, ForceBarrier, Quintuple, shootProjectile } = require("./projectiles");

// ============================================================================
// HOW TO ADD A NEW CLASS
// ============================================================================
// 1. Add a new entry to the CLASSES object below
// 2. That's it! The class is automatically available
//
// MINIMAL EXAMPLE:
//   myNewClass: {
//     sprite: "my_sprite_run",
//     size: [30, 40],
//     stats: { hp: 5, speed: 20, strength: 1, resistance: 2 }
//   }
//
// FIELD REFERENCE:
//   sprite       - Sprite name (e.g., "knight_m_run")
//   size         - [width, height] for hitbox
//   stats        - { hp, speed, strength, resistance } bonuses
//   spriteScale  - Visual scale multiplier (e.g., 2 for 2x size)
//   attack       - Attack function (optional, defaults to chargeAttack)
//   weaponReach  - Melee range (optional, defaults to 10)
//   setup        - Custom init function (optional)
//
// ============================================================================
// CLASS DEFINITIONS
// ============================================================================

const CLASSES = {
	// Balanced tank with charge attack
	// Sprite: 16x28, Hitbox: 30x40 → Scale: ~1.4x (40/28 ≈ 1.43)
	warrior: {
		sprite: "knight_m_run",
		size: [30, 40],
		spriteScale: 1.4,
		stats: { hp: 6, speed: 10, strength: 1, resistance: 3 },
	},

	// Fast class with gold bonus
	// Sprite: 16x28, Hitbox: 28x36 → Scale: ~1.3x (36/28 ≈ 1.29)
	rogue: {
		sprite: "elf_m_run",
		size: [28, 36],
		spriteScale: 1.3,
		weaponReach: 12,
		stats: { hp: 0, speed: 25, strength: 0, resistance: 1 },
		setup: (entity) => {
			entity.goldBoost = true;
		}
	},

	// High speed melee with lifesteal
	// Sprite: 16x28, Hitbox: 30x40 → Scale: ~1.4x (40/28 ≈ 1.43)
	vampire: {
		sprite: "elf_m_run",
		size: [30, 40],
		spriteScale: 1.4,
		stats: { hp: 2, speed: 50, strength: 1, resistance: 1 },
		attack: pounceAttack,
	},

	// Potion specialist with auto-regen
	// Sprite: 16x28, Hitbox: 30x40 → Scale: ~1.4x (40/28 ≈ 1.43)
	potionHoard: {
		sprite: "knight_m_run",
		size: [30, 40],
		spriteScale: 1.4,
		stats: { hp: 6, speed: 0, strength: 0, resistance: 0 },
		attack: potionAttack,
		setup: (entity) => {
			entity.healthPotions = 3;
			let addPotion = setInterval(() => {
				if(entity.healthPotions < 10)
					entity.healthPotions += 1;
			}, 20 * 1000);

			entity.once('newClass', () => {
				if(addPotion) clearInterval(addPotion);
				entity.healthPotions = 0;
			});

			entity.once('remove', () => {
				if(addPotion) clearInterval(addPotion);
			});
		}
	},

	// Giant tank with spin attack
	// Sprite: 16x28, Hitbox: 45x60 → Scale: ~2.1x (60/28 ≈ 2.14)
	leader: {
		sprite: "elf_m_run",
		size: [45, 60],
		spriteScale: 2.1,
		weaponReach: 30,
		stats: { hp: 10, speed: 25, strength: 2, resistance: 50 },
		setup: (entity) => {
			entity.attack = spinAttack.bind(entity);
		}
	},

	// Tiny fast knight
	// Sprite: 16x28, Hitbox: 15x20 → Scale: ~0.7x (20/28 ≈ 0.71)
	Mini_Knight: {
		sprite: "knight_m_run",
		size: [15, 20],
		spriteScale: 0.7,
		stats: { hp: 0, speed: 15, strength: 0, resistance: -1 },
	},

	// Ranged spellcaster
	// Sprite: 16x28, Hitbox: 30x40 → Scale: ~1.4x (40/28 ≈ 1.43)
	Wizard: {
		sprite: "wizzard_m_run",
		size: [30, 40],
		spriteScale: 1.4,
		stats: { hp: 2, speed: -25, strength: 0, resistance: 0 },
		setup: (entity) => {
			entity.abilityAccuracy = 10;
			let spells = [Projectile, Fireball, GoldenMoon, ForceBarrier, Quintuple];
			entity.spell = spells[Math.floor(Math.random() * 5)];
			entity.attack = () => {
				shootProjectile(entity, {
					x: entity.mousePos.x,
					y: entity.mousePos.y
				}, entity.spell, entity.stat.strength, (20 - entity.stat.strength));
			};
		}
	},

	// Luck modifier (special case - no visuals)
	luckMan: {
		setup: (entity) => {
			entity.stat.luck = 3;
		}
	}
};

// ============================================================================
// CORE SYSTEM - Don't modify unless you know what you're doing!
// ============================================================================

function setStat(entity) {
	entity.stat.hp = entity.baseStat.hp + entity.classStat.hp;
	entity.stat.speed = entity.baseStat.speed + entity.classStat.speed;
	entity.stat.strength = entity.baseStat.strength + entity.classStat.strength;
	entity.stat.resistance = entity.baseStat.resistance + entity.classStat.resistance;
	entity.hp = entity.stat.hp;
	console.log(entity.stat.resistance);
}

/**
 * Applies a class to an entity
 * @param {Object} entity - The entity to modify
 * @param {string} classKey - The class name from CLASSES
 */
function applyClass(entity, classKey) {
	const config = CLASSES[classKey];
	if (!config) {
		console.error(`Class not found: ${classKey}. Check CLASSES definition.`);
		return;
	}

	// Emit class change event
	entity.emit("newClass");
	entity._classSetter = () => applyClass(entity, classKey);
	entity.entityClass = classKey;

	// Apply size (hitbox dimensions)
	if (config.size) {
		const [width, height] = config.size;
		entity.width = width;
		entity.height = height;
		entity.box(width, height);
		// Default weapon anchor at hitbox center
		entity._weaponAnchor = { x: width / 2, y: height / 2 };
	}

	// Apply weapon reach (defaults to 10)
	entity._weaponReach = config.weaponReach !== undefined ? config.weaponReach : 10;

	// Apply sprite
	if (config.sprite) {
		entity.sprite = config.sprite;
	}

	// Apply sprite scale and adjust weapon anchor for visual center
	if (config.spriteScale !== undefined) {
		entity.spriteScale = config.spriteScale;

		// Adjust weapon anchor to match visual sprite center
		// Sprites are typically 16x28 pixels (characters)
		const typicalSpriteHeight = 28; // Most character sprites
		const scaledHeight = typicalSpriteHeight * config.spriteScale;
		// Sprite is bottom-aligned, so visual center is offset upward
		const visualCenterY = entity.height - scaledHeight / 2;
		entity._weaponAnchor = {
			x: entity.width / 2, // Horizontal center stays the same
			y: visualCenterY     // Vertical adjusted to visual sprite center
		};
	}

	// Apply stats
	if (config.stats) {
		entity.classStat = { ...config.stats };
		setStat(entity);
	}

	// Apply attack (defaults to chargeAttack)
	if (config.attack !== undefined) {
		entity.attack = config.attack;
	} else if (!config.setup) {
		// Only set default if setup doesn't handle attack
		entity.attack = chargeAttack;
	}

	// Run custom setup function
	if (config.setup) {
		config.setup(entity);
	}
}

// ============================================================================
// BACKWARD COMPATIBILITY - Auto-generated wrappers
// ============================================================================

function setWarrior(entity) { applyClass(entity, 'warrior'); }
function setRogue(entity) { applyClass(entity, 'rogue'); }
function setVampire(entity) { applyClass(entity, 'vampire'); }
function setPotionHoard(entity) { applyClass(entity, 'potionHoard'); }
function setLeader(entity) { applyClass(entity, 'leader'); }
function setMinie(entity) { applyClass(entity, 'Mini_Knight'); }
function setWizard(entity) { applyClass(entity, 'Wizard'); }
function setLuckMan(entity) { applyClass(entity, 'luckMan'); }

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
	// Main API - use these!
	CLASSES,
	applyClass,
	setStat,

	// Legacy functions - for backward compatibility
	setWarrior,
	setRogue,
	setVampire,
	setPotionHoard,
	setLeader,
	setMinie,
	setWizard,
	setLuckMan
};
