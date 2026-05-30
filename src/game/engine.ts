// ============================================================
// MODULE: GameEngine — основной игровой цикл
// Standoff 2: Wave Survival Edition
// ============================================================

import {
  Player, Enemy, Bullet, Particle, FloatingText,
  AppliedUpgrades, GameStats, Vec2,
} from './types';
import { WeaponDef } from './types';
import { getWaveConfig, createGrunt, createElite, createBoss } from './waveSystem';
import { DEFAULT_UPGRADES } from './upgrades';

let bulletIdCounter = 0;
let particleIdCounter = 0;
let floatIdCounter = 0;

// ── Helpers ─────────────────────────────────────────────────
function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(dx: number, dy: number): Vec2 {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── Particle Factory ─────────────────────────────────────────
function makeParticle(x: number, y: number, type: Particle['type'], color = '#ff4444'): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 3;
  return {
    id: particleIdCounter++,
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    maxLife: 1,
    color,
    size: 2 + Math.random() * 4,
    type,
  };
}

function makeFloat(x: number, y: number, text: string, color: string, size = 18): FloatingText {
  return {
    id: floatIdCounter++,
    x, y: y - 20,
    text,
    color,
    life: 1,
    maxLife: 1,
    size,
  };
}

// ── Initial Player ───────────────────────────────────────────
export function createPlayer(weapon: WeaponDef, canvasW: number, canvasH: number): Player {
  return {
    x: canvasW / 2,
    y: canvasH / 2,
    hp: 100,
    maxHp: 100,
    speed: 3.2,
    weapon,
    ammo: weapon.magazineSize,
    isReloading: false,
    reloadProgress: 0,
    lastShot: 0,
    upgrades: { ...DEFAULT_UPGRADES },
  };
}

// ── Bullet Creation ──────────────────────────────────────────
export function createBullet(
  from: Vec2,
  to: Vec2,
  weapon: WeaponDef,
  upgrades: AppliedUpgrades,
  isCrit: boolean
): Bullet[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const spread = (1 - weapon.accuracy) * 0.4;
  const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;

  let damage = weapon.damage * (1 + upgrades.damageBonus);
  if (isCrit) damage *= upgrades.critMultiplier;

  const bullet: Bullet = {
    id: bulletIdCounter++,
    x: from.x,
    y: from.y,
    vx: Math.cos(angle) * weapon.bulletSpeed,
    vy: Math.sin(angle) * weapon.bulletSpeed,
    damage,
    isPlayer: true,
    piercing: upgrades.piercingShots,
    bounces: upgrades.ricochet ? upgrades.ricochetCount : 0,
    burning: upgrades.fireBullets,
    explosive: upgrades.explosiveBullets,
  };

  if (upgrades.doubleShot) {
    const spread2 = 0.12;
    const b2: Bullet = {
      ...bullet,
      id: bulletIdCounter++,
      vx: Math.cos(angle + spread2) * weapon.bulletSpeed,
      vy: Math.sin(angle + spread2) * weapon.bulletSpeed,
    };
    const b3: Bullet = {
      ...bullet,
      id: bulletIdCounter++,
      vx: Math.cos(angle - spread2) * weapon.bulletSpeed,
      vy: Math.sin(angle - spread2) * weapon.bulletSpeed,
    };
    return [b2, b3];
  }

  return [bullet];
}

// ── Main Game State ──────────────────────────────────────────
export interface GameEngineState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  enemyBullets: Bullet[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  stats: GameStats;
  wave: number;
  waveState: 'spawning' | 'fighting' | 'complete';
  spawnQueue: number;
  spawnTimer: number;
  spawnInterval: number;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  time: number;
  keys: Record<string, boolean>;
  mouseX: number;
  mouseY: number;
  mouseDown: boolean;
}

export function createInitialState(weapon: WeaponDef, canvasW: number, canvasH: number): GameEngineState {
  const cfg = getWaveConfig(1);
  return {
    player: createPlayer(weapon, canvasW, canvasH),
    enemies: [],
    bullets: [],
    enemyBullets: [],
    particles: [],
    floatingTexts: [],
    stats: { wave: 1, kills: 0, totalKills: 0, score: 0, damageDealt: 0, damageTaken: 0 },
    wave: 1,
    waveState: 'spawning',
    spawnQueue: cfg.enemyCount,
    spawnTimer: 0,
    spawnInterval: cfg.spawnInterval,
    bossActive: false,
    bossHp: 0,
    bossMaxHp: 0,
    time: 0,
    keys: {},
    mouseX: canvasW / 2,
    mouseY: canvasH / 2,
    mouseDown: false,
  };
}

// ── Map Bounds ───────────────────────────────────────────────
const ARENA_PADDING = 40;

// ── Update Loop (delta in seconds) ──────────────────────────
export function updateGame(
  state: GameEngineState,
  delta: number,
  canvasW: number,
  canvasH: number
): { state: GameEngineState; playerDied: boolean; waveComplete: boolean } {
  let s = { ...state };
  s.time += delta;
  let playerDied = false;
  let waveComplete = false;

  const now = s.time * 1000;

  // ── Adrenaline ─────────────────────────────────────────
  const isLowHp = s.player.hp / s.player.maxHp < 0.30;
  const adrenalineActive = s.player.upgrades.adrenaline && isLowHp;
  const speedMult = adrenalineActive ? 1.5 : 1;
  const fireRateMult = 1 + s.player.upgrades.fireRateBonus + (adrenalineActive ? 0.5 : 0);

  // ── Player Movement ────────────────────────────────────
  const k = s.keys;
  let mvx = 0;
  let mvy = 0;
  if (k['KeyW'] || k['ArrowUp']) mvy -= 1;
  if (k['KeyS'] || k['ArrowDown']) mvy += 1;
  if (k['KeyA'] || k['ArrowLeft']) mvx -= 1;
  if (k['KeyD'] || k['ArrowRight']) mvx += 1;

  if (mvx !== 0 || mvy !== 0) {
    const n = normalize(mvx, mvy);
    const spd = s.player.speed * (1 + s.player.upgrades.speedBonus) * speedMult;
    s.player = {
      ...s.player,
      x: Math.max(ARENA_PADDING, Math.min(canvasW - ARENA_PADDING, s.player.x + n.x * spd)),
      y: Math.max(ARENA_PADDING, Math.min(canvasH - ARENA_PADDING, s.player.y + n.y * spd)),
    };
  }

  // ── Reload ────────────────────────────────────────────
  if (s.player.isReloading) {
    const reloadTime = s.player.weapon.reloadTime * (1 - s.player.upgrades.reloadSpeedBonus);
    s.player = { ...s.player, reloadProgress: s.player.reloadProgress + delta / reloadTime };
    if (s.player.reloadProgress >= 1) {
      const magSize = Math.round(s.player.weapon.magazineSize * (1 + s.player.upgrades.magazineBonus));
      s.player = { ...s.player, isReloading: false, reloadProgress: 0, ammo: magSize };
    }
  }

  // ── Auto Reload ───────────────────────────────────────
  if (!s.player.isReloading && s.player.ammo === 0) {
    s.player = { ...s.player, isReloading: true, reloadProgress: 0 };
  }

  // ── Shooting ──────────────────────────────────────────
  const fireInterval = 1000 / (s.player.weapon.fireRate * fireRateMult);
  const canShoot = s.mouseDown && !s.player.isReloading && s.player.ammo > 0;
  const shootReady = now - s.player.lastShot >= fireInterval;
  const isAuto = s.player.weapon.automatic;

  if (canShoot && (isAuto ? shootReady : (shootReady && s.mouseDown))) {
    const isCrit = Math.random() < s.player.upgrades.critChance;
    const newBullets = createBullet(
      { x: s.player.x, y: s.player.y },
      { x: s.mouseX, y: s.mouseY },
      s.player.weapon,
      s.player.upgrades,
      isCrit
    );
    s.bullets = [...s.bullets, ...newBullets];
    s.player = { ...s.player, ammo: s.player.ammo - 1, lastShot: now };

    // Muzzle flash particles
    for (let i = 0; i < 4; i++) {
      s.particles = [...s.particles, makeParticle(s.player.x, s.player.y, 'spark', '#FFD700')];
    }
    if (isCrit) {
      s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y - 10, 'КРИТ!', '#FFD700', 20)];
    }
  }

  // ── Manual reload key ─────────────────────────────────
  if ((k['KeyR']) && !s.player.isReloading && s.player.ammo < Math.round(s.player.weapon.magazineSize * (1 + s.player.upgrades.magazineBonus))) {
    s.player = { ...s.player, isReloading: true, reloadProgress: 0 };
  }

  // ── Spawn Enemies ─────────────────────────────────────
  if (s.waveState === 'spawning' && s.spawnQueue > 0) {
    s.spawnTimer += delta * 1000;
    // Show wave announcement on first tick
    if (s.spawnTimer < 80 && s.enemies.length === 0) {
      const cfgPre = getWaveConfig(s.wave);
      const waveMsg = cfgPre.hasBoss ? `☠️ БОСС — ВОЛНА ${s.wave}!` : cfgPre.hasElite ? `⚡ ЭЛИТНАЯ — ВОЛНА ${s.wave}` : `🌊 ВОЛНА ${s.wave}`;
      const waveColor = cfgPre.hasBoss ? '#FF0040' : cfgPre.hasElite ? '#CF6FFF' : '#00BFFF';
      s.floatingTexts = [...s.floatingTexts, makeFloat(canvasW / 2, canvasH / 2 - 40, waveMsg, waveColor, 34)];
    }
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      const cfg = getWaveConfig(s.wave);

      let enemy: Enemy;
      if (cfg.hasBoss) {
        enemy = createBoss(cfg, canvasW, canvasH);
        s.bossActive = true;
        s.bossHp = enemy.hp;
        s.bossMaxHp = enemy.maxHp;
      } else if (cfg.hasElite) {
        const variant = s.stats.kills % 3;
        enemy = createElite(cfg, canvasW, canvasH, variant);
      } else {
        enemy = createGrunt(cfg, canvasW, canvasH);
      }

      s.enemies = [...s.enemies, enemy];
      s.spawnQueue -= 1;

      if (s.spawnQueue <= 0) {
        s.waveState = 'fighting';
      }
    }
  }

  // ── Update Enemies ─────────────────────────────────────
  const updatedEnemies: Enemy[] = [];
  for (let enemy of s.enemies) {
    // Move toward player
    const dx = s.player.x - enemy.x;
    const dy = s.player.y - enemy.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Boss patterns
    if (enemy.type === 'boss') {
      const newPatternTimer = (enemy.patternTimer ?? 0) + delta;
      enemy = { ...enemy, patternTimer: newPatternTimer };

      if (enemy.bossPattern === 'charge') {
        // Charge: alternate between slow approach and fast charge
        const isCharging = Math.floor(newPatternTimer / 3) % 2 === 1;
        const spd = isCharging ? enemy.speed * 4 : enemy.speed * 0.5;
        if (d > 40) {
          enemy = { ...enemy, x: enemy.x + (dx / d) * spd, y: enemy.y + (dy / d) * spd };
        }
        // Phase change
        if (enemy.hp < enemy.maxHp * 0.5 && enemy.phase === 1) {
          enemy = { ...enemy, phase: 2, speed: enemy.speed * 1.4 };
          s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y, '⚡ ФАЗА 2!', '#FF0040', 28)];
        }
      } else if (enemy.bossPattern === 'spray') {
        if (d > 150) {
          enemy = { ...enemy, x: enemy.x + (dx / d) * enemy.speed, y: enemy.y + (dy / d) * enemy.speed };
        }
      } else if (enemy.bossPattern === 'teleport') {
        if (newPatternTimer > 5) {
          enemy = { ...enemy, patternTimer: 0, x: s.player.x + (Math.random() - 0.5) * 200, y: s.player.y + (Math.random() - 0.5) * 200 };
          for (let i = 0; i < 12; i++) s.particles = [...s.particles, makeParticle(enemy.x, enemy.y, 'smoke', '#9B59B6')];
        } else if (d > 60) {
          enemy = { ...enemy, x: enemy.x + (dx / d) * enemy.speed, y: enemy.y + (dy / d) * enemy.speed };
        }
      }
    } else {
      // Normal / elite movement
      if (d > enemy.radius + 20) {
        const spd = enemy.shielded && enemy.shieldHp! > 0 ? enemy.speed * 0.7 : enemy.speed;
        enemy = {
          ...enemy,
          x: enemy.x + (dx / d) * spd,
          y: enemy.y + (dy / d) * spd,
        };
      }
    }

    // Enemy shooting
    const shotInterval = 1000 / enemy.fireRate;
    if (now - enemy.lastShot >= shotInterval && d < 350) {
      const angle = Math.atan2(dy, dx);
      const spread = 0.15;

      let bulletCount = 1;
      if (enemy.type === 'boss' && enemy.bossPattern === 'spray' && enemy.phase !== 1) bulletCount = 5;
      else if (enemy.type === 'boss' && enemy.bossPattern === 'spray') bulletCount = 3;

      for (let b = 0; b < bulletCount; b++) {
        const a = angle + (Math.random() - 0.5) * spread * bulletCount;
        s.enemyBullets = [...s.enemyBullets, {
          id: bulletIdCounter++,
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(a) * 7,
          vy: Math.sin(a) * 7,
          damage: enemy.damage,
          isPlayer: false,
        }];
      }
      enemy = { ...enemy, lastShot: now };
    }

    // Burn tick
    if (enemy.burning && (enemy.burnTimer ?? 0) > 0) {
      const burnDmg = 8 * delta;
      enemy = { ...enemy, hp: enemy.hp - burnDmg, burnTimer: (enemy.burnTimer ?? 0) - delta };
      if (enemy.burnTimer! <= 0) enemy = { ...enemy, burning: false };
      for (let i = 0; i < 2; i++) s.particles = [...s.particles, makeParticle(enemy.x + (Math.random() - 0.5) * 20, enemy.y + (Math.random() - 0.5) * 20, 'fire', '#FF6B35')];
    }

    // Melee damage
    if (d < enemy.radius + 18) {
      const dmg = Math.max(0, enemy.damage * delta * 2 - s.player.upgrades.armorPlating * delta);
      s.player = { ...s.player, hp: s.player.hp - dmg };
      s.stats = { ...s.stats, damageTaken: s.stats.damageTaken + dmg };
    }

    updatedEnemies.push(enemy);
  }
  s.enemies = updatedEnemies;

  // ── Move Player Bullets ────────────────────────────────
  const activeBullets: Bullet[] = [];
  for (const bullet of s.bullets) {
    const nb = { ...bullet, x: bullet.x + bullet.vx, y: bullet.y + bullet.vy };

    // Out of bounds
    if (nb.x < -100 || nb.x > canvasW + 100 || nb.y < -100 || nb.y > canvasH + 100) {
      continue;
    }

    // Ricochet off walls
    let rb = { ...nb };
    const rbBounces = rb.bounces ?? 0;
    if (rbBounces > 0) {
      if (rb.x < 0 || rb.x > canvasW) { rb = { ...rb, vx: -rb.vx, bounces: rbBounces - 1 }; }
      if (rb.y < 0 || rb.y > canvasH) { rb = { ...rb, vy: -rb.vy, bounces: rbBounces - 1 }; }
    }

    // Hit enemies
    let hit = false;
    let remaining = { ...rb };
    const survivingEnemies: Enemy[] = [];

    for (const enemy of s.enemies) {
      const d2 = dist({ x: rb.x, y: rb.y }, { x: enemy.x, y: enemy.y });
      const hitRadius = enemy.radius + 6;

      if (d2 < hitRadius) {
        hit = true;

        // Shield check
        let actualDmg = rb.damage;
        let updatedEnemy = { ...enemy };

        if (updatedEnemy.shielded && (updatedEnemy.shieldHp ?? 0) > 0) {
          const shieldDmg = Math.min(actualDmg, updatedEnemy.shieldHp ?? 0);
          updatedEnemy = { ...updatedEnemy, shieldHp: (updatedEnemy.shieldHp ?? 0) - shieldDmg };
          actualDmg -= shieldDmg;
          if (updatedEnemy.shieldHp! <= 0) {
            updatedEnemy = { ...updatedEnemy, shielded: false };
            s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y, '🛡️ ЩИТ СЛОМАН', '#F39C12')];
          }
        }

        updatedEnemy = { ...updatedEnemy, hp: updatedEnemy.hp - actualDmg };

        // Fire effect
        if (rb.burning) {
          updatedEnemy = { ...updatedEnemy, burning: true, burnTimer: 3 };
        }

        // Explosion
        if (rb.explosive) {
          for (const other of s.enemies) {
            if (other.id !== enemy.id && dist({ x: enemy.x, y: enemy.y }, { x: other.x, y: other.y }) < 80) {
              // mark for splash - handled via particles
            }
          }
          for (let i = 0; i < 16; i++) s.particles = [...s.particles, makeParticle(enemy.x, enemy.y, 'explosion', '#FF6B35')];
        }

        // Damage number
        s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y, `-${Math.round(actualDmg)}`, rb.damage > 60 ? '#FF0040' : '#FFD700')];
        s.stats = { ...s.stats, damageDealt: s.stats.damageDealt + actualDmg };

        // Blood particles
        for (let i = 0; i < 6; i++) s.particles = [...s.particles, makeParticle(enemy.x, enemy.y, 'blood', '#8B0000')];

        // Kill check
        if (updatedEnemy.hp <= 0) {
          const killScore = updatedEnemy.type === 'boss' ? 500 : updatedEnemy.type === 'elite' ? 100 : 20;
          s.stats = {
            ...s.stats,
            kills: s.stats.kills + 1,
            totalKills: s.stats.totalKills + 1,
            score: s.stats.score + killScore,
          };

          // Vampirism
          if (s.player.upgrades.vampirism > 0) {
            const heal = s.player.upgrades.vampirism;
            s.player = { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + heal) };
            s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y, `+${heal} HP`, '#2ECC71')];
          }

          if (updatedEnemy.type === 'boss') {
            s.bossActive = false;
            for (let i = 0; i < 30; i++) s.particles = [...s.particles, makeParticle(enemy.x, enemy.y, 'explosion', '#FF0040')];
          }

          // XP burst
          for (let i = 0; i < 10; i++) s.particles = [...s.particles, makeParticle(enemy.x, enemy.y, 'xp', '#F1C40F')];
          continue; // don't push dead enemy
        }

        survivingEnemies.push(updatedEnemy);

        // Piercing
        if ((remaining.piercing ?? 0) > 0) {
          remaining = { ...remaining, piercing: (remaining.piercing ?? 0) - 1 };
          hit = false; // let it continue
        }
      } else {
        survivingEnemies.push(enemy);
      }
    }

    // Re-merge survivors with un-checked enemies
    // (enemies already processed above — survivingEnemies is the new list)
    s.enemies = survivingEnemies;

    if (!hit || (remaining.piercing ?? 0) > 0) {
      activeBullets.push(remaining);
    } else if ((rb.bounces ?? 0) > 0) {
      // bounce off enemy
      activeBullets.push({ ...rb, vx: -rb.vx, vy: -rb.vy, bounces: (rb.bounces ?? 1) - 1 });
    }
  }
  s.bullets = activeBullets;

  // ── Move Enemy Bullets ────────────────────────────────
  const activeEnemyBullets: Bullet[] = [];
  for (const bullet of s.enemyBullets) {
    const nb = { ...bullet, x: bullet.x + bullet.vx, y: bullet.y + bullet.vy };
    if (nb.x < -50 || nb.x > canvasW + 50 || nb.y < -50 || nb.y > canvasH + 50) continue;

    const d = dist({ x: nb.x, y: nb.y }, { x: s.player.x, y: s.player.y });
    if (d < 16) {
      const dmg = Math.max(1, nb.damage - s.player.upgrades.armorPlating);
      s.player = { ...s.player, hp: s.player.hp - dmg };
      s.stats = { ...s.stats, damageTaken: s.stats.damageTaken + dmg };
      s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y, `-${Math.round(dmg)}`, '#FF4444')];
      for (let i = 0; i < 4; i++) s.particles = [...s.particles, makeParticle(s.player.x, s.player.y, 'blood', '#FF0000')];
    } else {
      activeEnemyBullets.push(nb);
    }
  }
  s.enemyBullets = activeEnemyBullets;

  // ── Boss HP tracking ──────────────────────────────────
  const boss = s.enemies.find((e) => e.type === 'boss');
  if (boss) {
    s.bossHp = boss.hp;
    s.bossMaxHp = boss.maxHp;
  }

  // ── Particles ─────────────────────────────────────────
  s.particles = s.particles
    .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.05, life: p.life - delta * 1.5 }))
    .filter((p) => p.life > 0);

  // ── Floating Texts ─────────────────────────────────────
  s.floatingTexts = s.floatingTexts
    .map((f) => ({ ...f, y: f.y - 0.5, life: f.life - delta * 1.8 }))
    .filter((f) => f.life > 0);

  // ── Clamp player hp ───────────────────────────────────
  s.player = { ...s.player, hp: Math.max(0, Math.min(s.player.maxHp, s.player.hp)) };

  // ── Player Death ──────────────────────────────────────
  if (s.player.hp <= 0) {
    playerDied = true;
  }

  // ── Wave Complete ─────────────────────────────────────
  if (s.waveState !== 'complete' && s.enemies.length === 0 && s.spawnQueue <= 0 && s.waveState === 'fighting') {
    waveComplete = true;
    s.waveState = 'complete';
  }

  return { state: s, playerDied, waveComplete };
}

// ── Advance to next wave ──────────────────────────────────────
export function advanceWave(state: GameEngineState): GameEngineState {
  const nextWave = state.wave + 1;
  const cfg = getWaveConfig(nextWave);

  return {
    ...state,
    wave: nextWave,
    waveState: 'spawning',
    spawnQueue: cfg.enemyCount,
    spawnTimer: 0,
    spawnInterval: cfg.spawnInterval,
    enemies: [],
    bullets: [],
    enemyBullets: [],
    stats: { ...state.stats, wave: nextWave, kills: 0 },
    bossActive: false,
  };
}

// ── Render ─────────────────────────────────────────────────
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameEngineState,
  canvasW: number,
  canvasH: number
): void {
  // Background
  ctx.fillStyle = '#0A0E1A';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < canvasW; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke();
  }
  for (let y = 0; y < canvasH; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke();
  }

  // Arena border
  ctx.strokeStyle = 'rgba(255,50,50,0.3)';
  ctx.lineWidth = 3;
  ctx.strokeRect(ARENA_PADDING, ARENA_PADDING, canvasW - ARENA_PADDING * 2, canvasH - ARENA_PADDING * 2);

  // Particles
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Enemy bullets
  for (const b of state.enemyBullets) {
    ctx.fillStyle = '#FF6B6B';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#FF0000';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player bullets
  for (const b of state.bullets) {
    ctx.fillStyle = b.burning ? '#FF6B35' : '#FFD700';
    ctx.shadowBlur = 8;
    ctx.shadowColor = b.burning ? '#FF6B35' : '#FFD700';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Enemies
  for (const enemy of state.enemies) {
    const isBoss = enemy.type === 'boss';
    const isElite = enemy.type === 'elite';

    // Glow
    ctx.shadowBlur = isBoss ? 30 : isElite ? 16 : 8;
    ctx.shadowColor = enemy.color;

    // Body
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner detail
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(enemy.x - enemy.radius * 0.3, enemy.y - enemy.radius * 0.3, enemy.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Shield ring
    if (enemy.shielded && (enemy.shieldHp ?? 0) > 0) {
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#4FC3F7';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Burn effect
    if (enemy.burning) {
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF6B35';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // HP bar
    const barW = enemy.radius * 2.5;
    const barH = 5;
    const barX = enemy.x - barW / 2;
    const barY = enemy.y - enemy.radius - 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    const hpPct = enemy.hp / enemy.maxHp;
    const hpColor = hpPct > 0.6 ? '#2ECC71' : hpPct > 0.3 ? '#F39C12' : '#E74C3C';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    // Boss phase indicator
    if (isBoss && enemy.phase === 2) {
      ctx.fillStyle = '#FF0040';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ ФАЗА 2', enemy.x, barY - 4);
    }
  }

  // Player
  const { player } = state;
  const isLowHp = player.hp / player.maxHp < 0.3;
  ctx.shadowBlur = isLowHp ? 20 : 12;
  ctx.shadowColor = isLowHp ? '#FF4444' : '#00BFFF';

  // Player body
  ctx.fillStyle = isLowHp ? '#FF4444' : '#00BFFF';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 16, 0, Math.PI * 2);
  ctx.fill();

  // Player inner
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(player.x - 5, player.y - 5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Aim direction
  const aimAngle = Math.atan2(state.mouseY - player.y, state.mouseX - player.x);
  ctx.strokeStyle = '#00BFFF';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(aimAngle) * 18, player.y + Math.sin(aimAngle) * 18);
  ctx.lineTo(player.x + Math.cos(aimAngle) * 30, player.y + Math.sin(aimAngle) * 30);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Crosshair
  const cx = state.mouseX;
  const cy = state.mouseY;
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1.5;
  const cs = 12;
  ctx.beginPath();
  ctx.moveTo(cx - cs, cy); ctx.lineTo(cx - 4, cy);
  ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + cs, cy);
  ctx.moveTo(cx, cy - cs); ctx.lineTo(cx, cy - 4);
  ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + cs);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.stroke();

  // Floating texts
  for (const ft of state.floatingTexts) {
    ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
    ctx.fillStyle = ft.color;
    ctx.font = `bold ${ft.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

export { lerp };
