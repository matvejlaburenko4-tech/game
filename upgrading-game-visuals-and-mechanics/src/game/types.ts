// ============================================================
// MODULE: Types & Interfaces
// Standoff 2: Wave Survival Edition — Upgraded
// ============================================================

export type WeaponCategory = 'pistol' | 'smg' | 'rifle' | 'sniper';
export type EnemyType = 'grunt' | 'elite' | 'boss';
// Новые подтипы рядовых врагов
export type GruntSubtype = 'melee' | 'ranged';
export type GameState = 'menu' | 'weapon-select' | 'playing' | 'upgrade' | 'game-over';
export type Team = 'terrorist' | 'special-forces';

export interface Vec2 {
  x: number;
  y: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: number;
  fireRate: number;
  magazineSize: number;
  reloadTime: number;
  bulletSpeed: number;
  accuracy: number;
  automatic: boolean;
  icon: string;
  color: string;
  description: string;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  isPlayer: boolean;
  piercing?: number;
  bounces?: number;
  burning?: boolean;
  explosive?: boolean;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  type: EnemyType;
  subtype?: GruntSubtype;  // для рядовых: melee | ranged
  team: Team;
  fireRate: number;
  lastShot: number;
  shielded?: boolean;
  shieldHp?: number;
  phase?: number;
  bossPattern?: string;
  bossIndex?: number;      // уникальный индекс босса (1,2,3...)
  patternTimer?: number;
  color: string;
  radius: number;
  burning?: boolean;
  burnTimer?: number;
  frozen?: boolean;
  // Для ближнего боя
  meleeRange?: number;
  lastMeleeHit?: number;
  // Для боссов: призыв миньонов
  summonTimer?: number;
  // Для уникальных паттернов
  chargeActive?: boolean;
  chargeTarget?: Vec2;
  grenadeCooldown?: number;
  grenadeTimer?: number;
}

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  weapon: WeaponDef;
  ammo: number;
  isReloading: boolean;
  reloadProgress: number;
  lastShot: number;
  upgrades: AppliedUpgrades;
  aimAngle: number; // направление прицела
}

export interface AppliedUpgrades {
  fireBullets: boolean;
  fireStacks: number;
  fireRateBonus: number;
  vampirism: number;
  ricochet: boolean;
  ricochetCount: number;
  magazineBonus: number;
  critChance: number;
  critMultiplier: number;
  piercingShots: number;
  damageBonus: number;
  speedBonus: number;
  maxHpBonus: number;
  explosiveBullets: boolean;
  doubleShot: boolean;
  reloadSpeedBonus: number;
  armorPlating: number;
  adrenaline: boolean;
}

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stackCount?: number; // сколько раз уже взят
  apply: (upgrades: AppliedUpgrades, player: Player) => { upgrades: AppliedUpgrades; player: Player };
}

export interface WaveConfig {
  wave: number;
  enemyCount: number;
  spawnInterval: number;
  hasElite: boolean;
  hasBoss: boolean;
  enemyHpMultiplier: number;
  enemySpeedMultiplier: number;
  enemyDamageMultiplier: number;
}

export interface GameStats {
  wave: number;
  kills: number;
  totalKills: number;
  score: number;
  damageDealt: number;
  damageTaken: number;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'blood' | 'spark' | 'fire' | 'smoke' | 'explosion' | 'xp';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

// Граната (для босса-гранатомётчика)
export interface Grenade {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  timer: number; // секунды до взрыва
  radius: number;
}
