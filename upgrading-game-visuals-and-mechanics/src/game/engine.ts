// ============================================================
// MODULE: GameEngine — основной игровой цикл
// УЛУЧШЕННАЯ ВЕРСИЯ: гуманоиды, оружие от первого лица,
// классы врагов, уникальные боссы, стакинг перков
// ============================================================

import {
  Player, Enemy, Bullet, Particle, FloatingText,
  AppliedUpgrades, GameStats, Vec2, Grenade,
} from './types';
import { WeaponDef } from './types';
import {
  getWaveConfig, createGrunt, createElite, createBoss,
  getEnemyLabel, createMinion,
} from './waveSystem';
import { DEFAULT_UPGRADES } from './upgrades';

let bulletIdCounter = 0;
let particleIdCounter = 0;
let floatIdCounter = 0;
let grenadeIdCounter = 0;

// ── Helpers ───────────────────────────────────────────────────
function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x; const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function normalize(dx: number, dy: number): Vec2 {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── Particle Factory ──────────────────────────────────────────
function makeParticle(x: number, y: number, type: Particle['type'], color = '#ff4444'): Particle {
  const angle = Math.random() * Math.PI * 2;
  const speed = 1 + Math.random() * 3;
  return {
    id: particleIdCounter++, x, y,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    life: 1, maxLife: 1, color, size: 2 + Math.random() * 4, type,
  };
}
function makeFloat(x: number, y: number, text: string, color: string, size = 18): FloatingText {
  return { id: floatIdCounter++, x, y: y - 20, text, color, life: 1, maxLife: 1, size };
}

// ── Initial Player ────────────────────────────────────────────
export function createPlayer(weapon: WeaponDef, canvasW: number, canvasH: number): Player {
  return {
    x: canvasW / 2, y: canvasH / 2,
    hp: 100, maxHp: 100, speed: 3.2,
    weapon,
    ammo: weapon.magazineSize, isReloading: false, reloadProgress: 0,
    lastShot: 0, upgrades: { ...DEFAULT_UPGRADES },
    aimAngle: 0,
  };
}

// ── Bullet Creation ───────────────────────────────────────────
export function createBullet(
  from: Vec2, to: Vec2, weapon: WeaponDef, upgrades: AppliedUpgrades, isCrit: boolean
): Bullet[] {
  const dx = to.x - from.x; const dy = to.y - from.y;
  const spread = (1 - weapon.accuracy) * 0.4;
  const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread;
  let damage = weapon.damage * (1 + upgrades.damageBonus);
  if (isCrit) damage *= upgrades.critMultiplier;

  const bullet: Bullet = {
    id: bulletIdCounter++, x: from.x, y: from.y,
    vx: Math.cos(angle) * weapon.bulletSpeed, vy: Math.sin(angle) * weapon.bulletSpeed,
    damage, isPlayer: true,
    piercing: upgrades.piercingShots,
    bounces: upgrades.ricochet ? upgrades.ricochetCount : 0,
    burning: upgrades.fireBullets,
    explosive: upgrades.explosiveBullets,
  };

  if (upgrades.doubleShot) {
    const sp2 = 0.12;
    const b2: Bullet = { ...bullet, id: bulletIdCounter++, vx: Math.cos(angle + sp2) * weapon.bulletSpeed, vy: Math.sin(angle + sp2) * weapon.bulletSpeed };
    const b3: Bullet = { ...bullet, id: bulletIdCounter++, vx: Math.cos(angle - sp2) * weapon.bulletSpeed, vy: Math.sin(angle - sp2) * weapon.bulletSpeed };
    return [b2, b3];
  }
  return [bullet];
}

// ── Main Game State ───────────────────────────────────────────
export interface GameEngineState {
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  enemyBullets: Bullet[];
  grenades: Grenade[];
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
    enemies: [], bullets: [], enemyBullets: [], grenades: [],
    particles: [], floatingTexts: [],
    stats: { wave: 1, kills: 0, totalKills: 0, score: 0, damageDealt: 0, damageTaken: 0 },
    wave: 1, waveState: 'spawning',
    spawnQueue: cfg.enemyCount, spawnTimer: 0, spawnInterval: cfg.spawnInterval,
    bossActive: false, bossHp: 0, bossMaxHp: 0,
    time: 0, keys: {}, mouseX: canvasW / 2, mouseY: canvasH / 2, mouseDown: false,
  };
}

// ── Update Loop ───────────────────────────────────────────────
export function updateGame(
  state: GameEngineState, delta: number, canvasW: number, canvasH: number
): { state: GameEngineState; playerDied: boolean; waveComplete: boolean } {
  let s = { ...state };
  s.time += delta;
  let playerDied = false;
  let waveComplete = false;
  const now = s.time * 1000;

  // Обновляем угол прицела
  s.player = {
    ...s.player,
    aimAngle: Math.atan2(s.mouseY - s.player.y, s.mouseX - s.player.x),
  };

  // ── Адреналин ──────────────────────────────────────────────
  const isLowHp = s.player.hp / s.player.maxHp < 0.3;
  const speedMult = 1 + s.player.upgrades.speedBonus + (isLowHp && s.player.upgrades.adrenaline ? 1.0 : 0);
  const fireRateMult = 1 + s.player.upgrades.fireRateBonus;

  // ── Движение игрока ────────────────────────────────────────
  let dx = 0, dy = 0;
  if (s.keys['KeyW'] || s.keys['ArrowUp']) dy -= 1;
  if (s.keys['KeyS'] || s.keys['ArrowDown']) dy += 1;
  if (s.keys['KeyA'] || s.keys['ArrowLeft']) dx -= 1;
  if (s.keys['KeyD'] || s.keys['ArrowRight']) dx += 1;
  if (dx !== 0 || dy !== 0) {
    const n = normalize(dx, dy);
    const spd = s.player.speed * speedMult;
    s.player = {
      ...s.player,
      x: Math.max(20, Math.min(canvasW - 20, s.player.x + n.x * spd)),
      y: Math.max(20, Math.min(canvasH - 20, s.player.y + n.y * spd)),
    };
  }

  // ── Перезарядка (R) ────────────────────────────────────────
  if (s.keys['KeyR'] && !s.player.isReloading && s.player.ammo < Math.round(s.player.weapon.magazineSize * (1 + s.player.upgrades.magazineBonus))) {
    s.player = { ...s.player, isReloading: true, reloadProgress: 0 };
  }

  // ── Прогресс перезарядки ────────────────────────────────────
  if (s.player.isReloading) {
    const reloadTime = s.player.weapon.reloadTime * (1 - s.player.upgrades.reloadSpeedBonus);
    const prog = s.player.reloadProgress + delta / reloadTime;
    s.player = { ...s.player, reloadProgress: prog };
    if (prog >= 1) {
      const magSize = Math.round(s.player.weapon.magazineSize * (1 + s.player.upgrades.magazineBonus));
      s.player = { ...s.player, isReloading: false, reloadProgress: 0, ammo: magSize };
    }
  }
  if (!s.player.isReloading && s.player.ammo === 0) {
    s.player = { ...s.player, isReloading: true, reloadProgress: 0 };
  }

  // ── Стрельба ───────────────────────────────────────────────
  const fireInterval = 1000 / (s.player.weapon.fireRate * fireRateMult);
  const canShoot = s.mouseDown && !s.player.isReloading && s.player.ammo > 0;
  const shootReady = now - s.player.lastShot >= fireInterval;
  if (canShoot && shootReady) {
    const isCrit = Math.random() < s.player.upgrades.critChance;
    const newBullets = createBullet(
      { x: s.player.x, y: s.player.y },
      { x: s.mouseX, y: s.mouseY },
      s.player.weapon, s.player.upgrades, isCrit
    );
    s.bullets = [...s.bullets, ...newBullets];
    s.player = { ...s.player, ammo: s.player.ammo - 1, lastShot: now };
    if (isCrit) {
      s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y - 30, '💀 КРИТ!', '#FFD700', 22)];
    }
  }

  // ── Спавн врагов ───────────────────────────────────────────
  if (s.waveState === 'spawning' && s.spawnQueue > 0) {
    s.spawnTimer += delta * 1000;
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
        enemy = createElite(cfg, canvasW, canvasH, s.stats.kills % 3);
      } else {
        enemy = createGrunt(cfg, canvasW, canvasH);
      }
      s.enemies = [...s.enemies, enemy];
      s.spawnQueue -= 1;
      if (s.spawnQueue <= 0) s.waveState = 'fighting';
    }
  }

  // ── Обновление врагов ──────────────────────────────────────
  const cfg = getWaveConfig(s.wave);
  const newEnemyBullets: Bullet[] = [];
  const newGrenades: Grenade[] = [];
  const newMinions: Enemy[] = [];

  s.enemies = s.enemies.map(enemyRaw => {
    let enemy = { ...enemyRaw };
    const dx2 = s.player.x - enemy.x;
    const dy2 = s.player.y - enemy.y;
    const d = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const newPatternTimer = (enemy.patternTimer ?? 0) + delta;
    enemy = { ...enemy, patternTimer: newPatternTimer };

    // ── Фаза Босса (смена на 50% HP) ──────────────────────
    if (enemy.type === 'boss' && enemy.phase === 1 && enemy.hp < enemy.maxHp * 0.5) {
      enemy = { ...enemy, phase: 2, speed: enemy.speed * 1.4, fireRate: enemy.fireRate * 1.6 };
      s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y - 60, '⚡ ФАЗА 2!', '#FF0040', 28)];
    }

    // ── Логика босса по паттерну ───────────────────────────
    if (enemy.type === 'boss') {
      const pattern = enemy.bossPattern ?? 'summoner';

      if (pattern === 'summoner') {
        // Призывает миньонов каждые 4 секунды
        const summonT = (enemy.summonTimer ?? 0) + delta;
        const summonInterval = enemy.phase === 2 ? 2.5 : 4.0;
        if (summonT >= summonInterval) {
          const count = enemy.phase === 2 ? 4 : 2;
          for (let i = 0; i < count; i++) newMinions.push(createMinion(enemy.x, enemy.y, cfg));
          enemy = { ...enemy, summonTimer: 0 };
          s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y - 50, '👥 ПРИЗЫВ!', '#FF4500', 20)];
        } else {
          enemy = { ...enemy, summonTimer: summonT };
        }
        // Медленно движется к игроку
        if (d > 60) enemy = { ...enemy, x: enemy.x + (dx2 / d) * enemy.speed, y: enemy.y + (dy2 / d) * enemy.speed };
        // Стреляет обычными пулями
        if (d < 600 && now - enemy.lastShot >= 1000 / enemy.fireRate) {
          const ang = Math.atan2(dy2, dx2);
          newEnemyBullets.push({ id: bulletIdCounter++, x: enemy.x, y: enemy.y, vx: Math.cos(ang) * 5, vy: Math.sin(ang) * 5, damage: enemy.damage, isPlayer: false });
          enemy = { ...enemy, lastShot: now };
        }

      } else if (pattern === 'grenadier') {
        // Закидывает гранатами, держит дистанцию
        const prefDist = 250;
        if (d < prefDist - 30) {
          // Отступает
          enemy = { ...enemy, x: enemy.x - (dx2 / d) * enemy.speed * 0.8, y: enemy.y - (dy2 / d) * enemy.speed * 0.8 };
        } else if (d > prefDist + 50) {
          enemy = { ...enemy, x: enemy.x + (dx2 / d) * enemy.speed * 0.6, y: enemy.y + (dy2 / d) * enemy.speed * 0.6 };
        }
        // Бросает гранаты
        const grenCooldown = enemy.phase === 2 ? 1.5 : 2.5;
        const grenTimer = (enemy.grenadeTimer ?? 0) + delta;
        if (grenTimer >= grenCooldown && d < 500) {
          const ang = Math.atan2(dy2, dx2);
          const spread = (enemy.phase === 2 ? 3 : 1);
          for (let gi = 0; gi < spread; gi++) {
            const gAng = ang + (gi - Math.floor(spread / 2)) * 0.25;
            newGrenades.push({
              id: grenadeIdCounter++,
              x: enemy.x, y: enemy.y,
              vx: Math.cos(gAng) * 4.5, vy: Math.sin(gAng) * 4.5,
              timer: 2.0,
              radius: 80,
            });
          }
          enemy = { ...enemy, grenadeTimer: 0 };
          s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y - 40, '💣 ГРАНАТА!', '#FF6B00', 18)];
        } else {
          enemy = { ...enemy, grenadeTimer: grenTimer };
        }
        // Иногда стреляет
        if (d < 400 && now - enemy.lastShot >= 1000 / enemy.fireRate) {
          const ang = Math.atan2(dy2, dx2);
          newEnemyBullets.push({ id: bulletIdCounter++, x: enemy.x, y: enemy.y, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6, damage: enemy.damage, isPlayer: false });
          enemy = { ...enemy, lastShot: now };
        }

      } else if (pattern === 'berserker') {
        // Идёт на таран: разгоняется и врезается
        if (!enemy.chargeActive) {
          // Обычное движение
          if (d > 50) enemy = { ...enemy, x: enemy.x + (dx2 / d) * enemy.speed, y: enemy.y + (dy2 / d) * enemy.speed };
          // Заряжает таран каждые 5 секунд
          if (newPatternTimer > 5 && d < 400) {
            enemy = { ...enemy, chargeActive: true, patternTimer: 0, chargeTarget: { x: s.player.x, y: s.player.y } };
            s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y - 40, '⚡ ТАРАН!', '#DC143C', 24)];
          }
        } else {
          // Несётся к цели
          const ct = enemy.chargeTarget ?? { x: s.player.x, y: s.player.y };
          const cdx = ct.x - enemy.x; const cdy = ct.y - enemy.y;
          const cd = Math.sqrt(cdx * cdx + cdy * cdy);
          const chargeSpd = enemy.speed * (enemy.phase === 2 ? 5 : 3.5);
          if (cd > 20) {
            enemy = { ...enemy, x: enemy.x + (cdx / cd) * chargeSpd, y: enemy.y + (cdy / cd) * chargeSpd };
          } else {
            enemy = { ...enemy, chargeActive: false };
            // Наносит урон при таране
            if (dist({ x: enemy.x, y: enemy.y }, s.player) < 60) {
              const dmg = Math.max(0, enemy.damage * 2 - s.player.upgrades.armorPlating);
              s.player = { ...s.player, hp: s.player.hp - dmg };
              s.stats = { ...s.stats, damageTaken: s.stats.damageTaken + dmg };
              s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y - 30, `-${Math.round(dmg)}`, '#FF4444')];
            }
          }
        }

      } else if (pattern === 'phantom') {
        // Телепортируется и стреляет со всех сторон
        if (newPatternTimer > (enemy.phase === 2 ? 3 : 5)) {
          // Телепорт вокруг игрока
          const tAng = Math.random() * Math.PI * 2;
          const tDist = 150 + Math.random() * 100;
          enemy = {
            ...enemy, patternTimer: 0,
            x: s.player.x + Math.cos(tAng) * tDist,
            y: s.player.y + Math.sin(tAng) * tDist,
          };
          // Очередь пуль после телепорта
          for (let i = 0; i < 8; i++) {
            const bAng = (i / 8) * Math.PI * 2;
            newEnemyBullets.push({ id: bulletIdCounter++, x: enemy.x, y: enemy.y, vx: Math.cos(bAng) * 5, vy: Math.sin(bAng) * 5, damage: enemy.damage, isPlayer: false });
          }
          s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y - 40, '👻 ТЕЛЕПОРТ!', '#9400D3', 18)];
        }
        // Медленно дрейфует к игроку
        if (d > 80) enemy = { ...enemy, x: enemy.x + (dx2 / d) * enemy.speed, y: enemy.y + (dy2 / d) * enemy.speed };
        // Стреляет
        if (now - enemy.lastShot >= 1000 / enemy.fireRate) {
          const ang = Math.atan2(dy2, dx2);
          newEnemyBullets.push({ id: bulletIdCounter++, x: enemy.x, y: enemy.y, vx: Math.cos(ang) * 7, vy: Math.sin(ang) * 7, damage: enemy.damage, isPlayer: false });
          enemy = { ...enemy, lastShot: now };
        }

      } else if (pattern === 'minigunner') {
        // Стоит на месте и льёт пули
        if (d > 200) enemy = { ...enemy, x: enemy.x + (dx2 / d) * enemy.speed * 0.5, y: enemy.y + (dy2 / d) * enemy.speed * 0.5 };
        // Шквал огня
        if (now - enemy.lastShot >= 1000 / enemy.fireRate) {
          const baseAng = Math.atan2(dy2, dx2);
          const burstCount = enemy.phase === 2 ? 5 : 3;
          for (let bi = 0; bi < burstCount; bi++) {
            const ang = baseAng + (Math.random() - 0.5) * 0.4;
            newEnemyBullets.push({ id: bulletIdCounter++, x: enemy.x, y: enemy.y, vx: Math.cos(ang) * 8, vy: Math.sin(ang) * 8, damage: enemy.damage * 0.6, isPlayer: false });
          }
          enemy = { ...enemy, lastShot: now };
        }
      }

    } else if (enemy.type === 'elite') {
      // Элиты: всегда двигаются и стреляют
      if (d > enemy.radius + 20) {
        const spd = enemy.shielded && (enemy.shieldHp ?? 0) > 0 ? enemy.speed * 0.7 : enemy.speed;
        enemy = { ...enemy, x: enemy.x + (dx2 / d) * spd, y: enemy.y + (dy2 / d) * spd };
      }
      if (d < 500 && now - enemy.lastShot >= 1000 / enemy.fireRate) {
        const ang = Math.atan2(dy2, dx2) + (Math.random() - 0.5) * 0.2;
        newEnemyBullets.push({ id: bulletIdCounter++, x: enemy.x, y: enemy.y, vx: Math.cos(ang) * 7, vy: Math.sin(ang) * 7, damage: enemy.damage, isPlayer: false });
        enemy = { ...enemy, lastShot: now };
      }

    } else {
      // ── Рядовые враги: логика по подтипу ────────────────
      if (enemy.subtype === 'melee') {
        // БЛИЖНИЙ БОЙ: бежит прямо к игроку
        if (d > (enemy.meleeRange ?? 28)) {
          enemy = { ...enemy, x: enemy.x + (dx2 / d) * enemy.speed, y: enemy.y + (dy2 / d) * enemy.speed };
        } else {
          // Атакует в ближнем бою
          const meleeCooldown = 600; // мс
          if (now - (enemy.lastMeleeHit ?? 0) >= meleeCooldown) {
            const dmg = Math.max(0, enemy.damage - s.player.upgrades.armorPlating);
            s.player = { ...s.player, hp: s.player.hp - dmg };
            s.stats = { ...s.stats, damageTaken: s.stats.damageTaken + dmg };
            s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y - 25, `-${Math.round(dmg)}`, '#FF4444')];
            enemy = { ...enemy, lastMeleeHit: now };
            // Кровь от удара
            for (let i = 0; i < 5; i++) s.particles = [...s.particles, makeParticle(s.player.x, s.player.y, 'blood', '#CC0000')];
          }
        }
      } else {
        // ДАЛЬНИЙ БОЙ: держит дистанцию 180–350, стреляет
        const minDist = 180, maxDist = 350;
        if (d < minDist) {
          // Отступает
          enemy = { ...enemy, x: enemy.x - (dx2 / d) * enemy.speed * 0.8, y: enemy.y - (dy2 / d) * enemy.speed * 0.8 };
        } else if (d > maxDist) {
          // Сближается
          enemy = { ...enemy, x: enemy.x + (dx2 / d) * enemy.speed, y: enemy.y + (dy2 / d) * enemy.speed };
        }
        // Стреляет
        if (d < 500 && now - enemy.lastShot >= 1000 / enemy.fireRate) {
          const ang = Math.atan2(dy2, dx2) + (Math.random() - 0.5) * 0.25;
          newEnemyBullets.push({ id: bulletIdCounter++, x: enemy.x, y: enemy.y, vx: Math.cos(ang) * 6, vy: Math.sin(ang) * 6, damage: enemy.damage, isPlayer: false });
          enemy = { ...enemy, lastShot: now };
        }
      }
    }

    // ── Горение ──────────────────────────────────────────────
    if (enemy.burning && (enemy.burnTimer ?? 0) > 0) {
      const burnDmg = 8 * (1 + (s.player.upgrades.fireStacks - 1) * 0.5) * delta;
      enemy = { ...enemy, hp: enemy.hp - burnDmg, burnTimer: (enemy.burnTimer ?? 0) - delta };
      if ((enemy.burnTimer ?? 0) <= 0) enemy = { ...enemy, burning: false };
    }

    // Клэмп позиции
    enemy = {
      ...enemy,
      x: Math.max(-120, Math.min(canvasW + 120, enemy.x)),
      y: Math.max(-120, Math.min(canvasH + 120, enemy.y)),
    };

    return enemy;
  });

  // Добавляем новых миньонов и снаряды
  s.enemies = [...s.enemies, ...newMinions];
  s.enemyBullets = [...s.enemyBullets, ...newEnemyBullets];
  s.grenades = [...(s.grenades || []), ...newGrenades];

  // ── Обновление гранат ─────────────────────────────────────
  const activeGrenades: Grenade[] = [];
  for (const g of s.grenades) {
    const ng = { ...g, x: g.x + g.vx, y: g.y + g.vy, timer: g.timer - delta };
    if (ng.timer <= 0) {
      // Взрыв
      for (let i = 0; i < 16; i++) s.particles = [...s.particles, makeParticle(ng.x, ng.y, 'explosion', '#FF6B00')];
      s.floatingTexts = [...s.floatingTexts, makeFloat(ng.x, ng.y, '💥', '#FF6B00', 28)];
      // Урон игроку если в радиусе
      const gd = dist({ x: ng.x, y: ng.y }, s.player);
      if (gd < ng.radius) {
        const falloff = 1 - gd / ng.radius;
        const dmg = Math.max(0, Math.round(50 * falloff) - s.player.upgrades.armorPlating);
        s.player = { ...s.player, hp: s.player.hp - dmg };
        s.stats = { ...s.stats, damageTaken: s.stats.damageTaken + dmg };
        if (dmg > 0) s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y - 30, `-${dmg}`, '#FF6B00', 20)];
      }
    } else {
      activeGrenades.push(ng);
    }
  }
  s.grenades = activeGrenades;

  // ── Пули игрока ──────────────────────────────────────────
  const activeBullets: Bullet[] = [];
  for (const bullet of s.bullets) {
    const nb = { ...bullet, x: bullet.x + bullet.vx, y: bullet.y + bullet.vy };
    if (nb.x < -100 || nb.x > canvasW + 100 || nb.y < -100 || nb.y > canvasH + 100) continue;

    // Рикошет от стен
    let rb = { ...nb };
    const rbBounces = rb.bounces ?? 0;
    if (rbBounces > 0) {
      if (rb.x < 0 || rb.x > canvasW) rb = { ...rb, vx: -rb.vx, bounces: rbBounces - 1 };
      if (rb.y < 0 || rb.y > canvasH) rb = { ...rb, vy: -rb.vy, bounces: rbBounces - 1 };
    }

    let hit = false;
    let remaining = { ...rb };
    const survivingEnemies: Enemy[] = [];

    for (const enemy of s.enemies) {
      const d2 = dist({ x: rb.x, y: rb.y }, { x: enemy.x, y: enemy.y });
      if (d2 < enemy.radius + 6) {
        hit = true;
        let updatedEnemy = { ...enemy };
        let actualDmg = rb.damage;

        // Щит
        if (updatedEnemy.shielded && (updatedEnemy.shieldHp ?? 0) > 0) {
          const shieldDmg = Math.min(actualDmg, updatedEnemy.shieldHp ?? 0);
          updatedEnemy = { ...updatedEnemy, shieldHp: (updatedEnemy.shieldHp ?? 0) - shieldDmg };
          actualDmg -= shieldDmg;
          if ((updatedEnemy.shieldHp ?? 0) <= 0) updatedEnemy = { ...updatedEnemy, shielded: false };
        }

        updatedEnemy = { ...updatedEnemy, hp: updatedEnemy.hp - actualDmg };

        // Поджигание
        if (rb.burning && s.player.upgrades.fireBullets) {
          updatedEnemy = { ...updatedEnemy, burning: true, burnTimer: 3 + s.player.upgrades.fireStacks * 0.5 };
        }

        s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y - 20, `-${Math.round(actualDmg)}`, actualDmg > 60 ? '#FF0040' : '#FFD700')];
        s.stats = { ...s.stats, damageDealt: s.stats.damageDealt + actualDmg };

        // Кровь
        for (let i = 0; i < 5; i++) s.particles = [...s.particles, makeParticle(enemy.x, enemy.y, 'blood', '#CC0000')];

        // Смерть врага
        if (updatedEnemy.hp <= 0) {
          const killScore = updatedEnemy.type === 'boss' ? 500 : updatedEnemy.type === 'elite' ? 100 : 10;
          s.stats = { ...s.stats, kills: s.stats.kills + 1, totalKills: s.stats.totalKills + 1, score: s.stats.score + killScore * s.wave };
          if (s.player.upgrades.vampirism > 0) {
            const heal = s.player.upgrades.vampirism;
            s.player = { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + heal) };
            s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y, `+${heal} HP`, '#2ECC71')];
          }
          // Взрыв при убийстве взрывными пулями
          if (rb.explosive) {
            for (let i = 0; i < 20; i++) s.particles = [...s.particles, makeParticle(enemy.x, enemy.y, 'explosion', '#FF8800')];
            // AoE урон врагам рядом
            s.enemies = s.enemies.map(e => {
              if (e.id === enemy.id) return e;
              if (dist({ x: enemy.x, y: enemy.y }, { x: e.x, y: e.y }) < 80) {
                return { ...e, hp: e.hp - rb.damage * 0.5 };
              }
              return e;
            });
          }
          if (updatedEnemy.type === 'boss') {
            s.bossActive = false;
            for (let i = 0; i < 30; i++) s.particles = [...s.particles, makeParticle(enemy.x, enemy.y, 'explosion', '#FF0040')];
            s.floatingTexts = [...s.floatingTexts, makeFloat(enemy.x, enemy.y - 50, '💀 БОСС ПОВЕРЖЕН!', '#FFD700', 26)];
          }
        } else {
          survivingEnemies.push(updatedEnemy);
        }

        if ((remaining.piercing ?? 0) > 0) {
          remaining = { ...remaining, piercing: (remaining.piercing ?? 0) - 1 };
          hit = false;
        }
      } else {
        survivingEnemies.push(enemy);
      }
    }
    s.enemies = survivingEnemies;

    if (!hit || (remaining.piercing ?? 0) > 0) {
      activeBullets.push(remaining);
    } else if ((rb.bounces ?? 0) > 0) {
      activeBullets.push({ ...rb, vx: -rb.vx, vy: -rb.vy, bounces: (rb.bounces ?? 1) - 1 });
    }
  }
  s.bullets = activeBullets;

  // ── Пули врагов ──────────────────────────────────────────
  const activeEnemyBullets: Bullet[] = [];
  for (const bullet of s.enemyBullets) {
    const nb = { ...bullet, x: bullet.x + bullet.vx, y: bullet.y + bullet.vy };
    if (nb.x < -50 || nb.x > canvasW + 50 || nb.y < -50 || nb.y > canvasH + 50) continue;
    const d = dist({ x: nb.x, y: nb.y }, s.player);
    if (d < 18) {
      const dmg = Math.max(0, nb.damage - s.player.upgrades.armorPlating);
      s.player = { ...s.player, hp: s.player.hp - dmg };
      s.stats = { ...s.stats, damageTaken: s.stats.damageTaken + dmg };
      if (dmg > 0) s.floatingTexts = [...s.floatingTexts, makeFloat(s.player.x, s.player.y - 25, `-${Math.round(dmg)}`, '#FF4444')];
      for (let i = 0; i < 4; i++) s.particles = [...s.particles, makeParticle(s.player.x, s.player.y, 'blood', '#CC0000')];
    } else {
      activeEnemyBullets.push(nb);
    }
  }
  s.enemyBullets = activeEnemyBullets;

  // ── Босс HP трекинг ───────────────────────────────────────
  const boss = s.enemies.find(e => e.type === 'boss');
  if (boss) { s.bossHp = boss.hp; s.bossMaxHp = boss.maxHp; }

  // ── Конец волны ───────────────────────────────────────────
  if (s.waveState === 'fighting' && s.enemies.length === 0) {
    waveComplete = true;
    s.waveState = 'complete';
    s.bossActive = false;
  }

  // ── Частицы ──────────────────────────────────────────────
  s.particles = s.particles
    .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.05, life: p.life - delta * 1.5 }))
    .filter(p => p.life > 0);

  // ── Плавающий текст ───────────────────────────────────────
  s.floatingTexts = s.floatingTexts
    .map(f => ({ ...f, y: f.y - 0.5, life: f.life - delta * 1.8 }))
    .filter(f => f.life > 0);

  s.player = { ...s.player, hp: Math.max(0, Math.min(s.player.maxHp, s.player.hp)) };

  if (s.player.hp <= 0) playerDied = true;

  return { state: s, playerDied, waveComplete };
}

// ── Advance Wave ──────────────────────────────────────────────
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
    grenades: [],
    bossActive: false,
    stats: { ...state.stats, wave: nextWave, kills: 0 },
  };
}

// ============================================================
// RENDERER — гуманоиды, оружие в руках, классы врагов
// ============================================================

// Рисует гуманоида (человечка)
function drawHumanoid(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  radius: number,
  color: string,
  aimAngle: number,
  isPlayer: boolean,
  subtype?: string,
  isBoss?: boolean,
  phase?: number
) {
  const r = radius;

  ctx.save();
  ctx.translate(x, y);

  // Тень
  ctx.shadowBlur = isBoss ? 30 : isPlayer ? 18 : 12;
  ctx.shadowColor = isPlayer ? '#00BFFF' : isBoss ? '#FF0040' : color;

  // === ТЕЛО (торс) ===
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.15, r * 0.55, r * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // === ГОЛОВА ===
  const headColor = isPlayer ? '#FFDAB9' : isBoss ? '#8B0000' : (subtype === 'melee' ? '#CC6633' : '#FFDAB9');
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(0, -r * 0.65, r * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Шлем/каска
  if (!isPlayer) {
    ctx.fillStyle = isBoss ? '#333' : (subtype === 'melee' ? '#8B0000' : '#2C3E50');
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.8, r * 0.42, r * 0.28, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else {
    // Кепка/шлем игрока
    ctx.fillStyle = '#1A3A5C';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.78, r * 0.42, r * 0.25, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  // Глаза
  ctx.fillStyle = isBoss ? '#FF0000' : '#000';
  ctx.beginPath();
  ctx.arc(-r * 0.12, -r * 0.65, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r * 0.12, -r * 0.65, r * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // === НОГИ ===
  const legColor = isPlayer ? '#1A3A5C' : isBoss ? '#4A0000' : '#2C3E50';
  ctx.fillStyle = legColor;
  // Левая нога
  ctx.fillRect(-r * 0.32, r * 0.6, r * 0.28, r * 0.55);
  // Правая нога
  ctx.fillRect(r * 0.04, r * 0.6, r * 0.28, r * 0.55);

  // Обувь
  ctx.fillStyle = '#111';
  ctx.fillRect(-r * 0.38, r * 1.05, r * 0.38, r * 0.18);
  ctx.fillRect(r * 0.0, r * 1.05, r * 0.38, r * 0.18);

  ctx.shadowBlur = 0;

  // === РУКА С ОРУЖИЕМ (поворачивается к прицелу) ===
  ctx.rotate(aimAngle);

  if (isPlayer) {
    // Рука игрока
    ctx.fillStyle = '#FFDAB9';
    ctx.beginPath();
    ctx.ellipse(r * 0.5, 0, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Оружие в руке
    drawWeaponInHand(ctx, r * 0.55, 0, r, isPlayer);
  } else if (subtype === 'melee') {
    // Нож в руке
    ctx.fillStyle = '#FFDAB9';
    ctx.beginPath();
    ctx.ellipse(r * 0.5, 0, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Нож
    ctx.strokeStyle = '#CCC';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#999';
    ctx.beginPath();
    ctx.moveTo(r * 0.55, -r * 0.05);
    ctx.lineTo(r * 1.3, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(r * 0.9, 0);
    ctx.lineTo(r * 1.3, -r * 0.12);
    ctx.lineTo(r * 1.3, 0);
    ctx.closePath();
    ctx.fillStyle = '#CCC';
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // Пистолет/автомат в руке врага
    ctx.fillStyle = '#FFDAB9';
    ctx.beginPath();
    ctx.ellipse(r * 0.5, 0, r * 0.18, r * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    drawWeaponInHand(ctx, r * 0.55, 0, r, false);
  }

  ctx.restore();

  // Метка фазы для босса
  if (isBoss && phase === 2) {
    ctx.fillStyle = '#FF0040';
    ctx.font = `bold ${Math.round(r * 0.5)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('⚡ ФАЗА 2', x, y - r * 1.8);
  }
}

// Рисует оружие в руке (FPS-style от 3-го лица)
function drawWeaponInHand(
  ctx: CanvasRenderingContext2D,
  baseX: number, baseY: number,
  r: number,
  isPlayer: boolean
) {
  const gunColor = isPlayer ? '#333' : '#555';
  const stockColor = isPlayer ? '#8B4513' : '#6B3A1F';

  // Ствол
  ctx.fillStyle = gunColor;
  ctx.shadowBlur = isPlayer ? 12 : 6;
  ctx.shadowColor = isPlayer ? '#00BFFF' : '#888';
  ctx.fillRect(baseX, baseY - r * 0.08, r * 0.8, r * 0.16);

  // Приклад
  ctx.fillStyle = stockColor;
  ctx.fillRect(baseX - r * 0.1, baseY - r * 0.1, r * 0.2, r * 0.2);

  // Магазин
  ctx.fillStyle = gunColor;
  ctx.fillRect(baseX + r * 0.2, baseY + r * 0.08, r * 0.15, r * 0.22);

  // Прицел сверху
  if (isPlayer) {
    ctx.fillStyle = '#FF2200';
    ctx.beginPath();
    ctx.arc(baseX + r * 0.6, baseY - r * 0.15, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

// ── Render ────────────────────────────────────────────────────
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameEngineState,
  canvasW: number,
  canvasH: number
) {
  // Очистка
  ctx.fillStyle = '#0A0E1A';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Сетка арены
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < canvasW; gx += 60) {
    ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvasH); ctx.stroke();
  }
  for (let gy = 0; gy < canvasH; gy += 60) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvasW, gy); ctx.stroke();
  }

  // Граница арены
  ctx.strokeStyle = 'rgba(220,38,38,0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, canvasW - 16, canvasH - 16);

  // Частицы (позади всего)
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Пули игрока
  for (const b of state.bullets) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = b.burning ? '#FF6B35' : '#FFD700';
    ctx.fillStyle = b.burning ? '#FF6B35' : '#FFD700';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
    // Трейл пули
    ctx.fillStyle = b.burning ? 'rgba(255,107,53,0.4)' : 'rgba(255,215,0,0.3)';
    ctx.beginPath();
    ctx.arc(b.x - b.vx * 1.5, b.y - b.vy * 1.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Пули врагов
  for (const b of state.enemyBullets) {
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#FF4444';
    ctx.fillStyle = '#FF4444';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Гранаты
  for (const g of (state.grenades || [])) {
    const blink = g.timer < 0.8 ? Math.sin(state.time * 20) > 0 : true;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FF6B00';
    ctx.fillStyle = blink ? '#FF6B00' : '#FF4400';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 7, 0, Math.PI * 2);
    ctx.fill();
    // Кольцо опасности
    if (g.timer < 1.0) {
      ctx.strokeStyle = `rgba(255,107,0,${0.5 * (1 - g.timer)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius * (1 - g.timer / 1.0), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  // Враги (гуманоиды)
  for (const enemy of state.enemies) {
    const isBoss = enemy.type === 'boss';
    const isElite = enemy.type === 'elite';

    // Щит
    if (enemy.shielded && (enemy.shieldHp ?? 0) > 0) {
      ctx.strokeStyle = '#4FC3F7';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#4FC3F7';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Горение
    if (enemy.burning) {
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF6B35';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Индикатор заряда берсерка
    if (enemy.chargeActive) {
      ctx.strokeStyle = '#DC143C';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#DC143C';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Направление к игроку (для ориентации гуманоида)
    const ex = state.player.x - enemy.x;
    const ey = state.player.y - enemy.y;
    const aimAng = Math.atan2(ey, ex);

    // Рисуем гуманоида
    drawHumanoid(
      ctx, enemy.x, enemy.y, enemy.radius,
      enemy.color, aimAng, false,
      enemy.subtype, isBoss, enemy.phase
    );

    // HP Bar
    const barW = enemy.radius * 2.8;
    const barH = 5;
    const barX = enemy.x - barW / 2;
    const barY = enemy.y - enemy.radius - 18;
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barW, barH);
    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);
    const hpColor = hpPct > 0.6 ? '#2ECC71' : hpPct > 0.3 ? '#F39C12' : '#E74C3C';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpPct, barH);

    // Имя врага
    ctx.fillStyle = isBoss ? '#FF4444' : isElite ? '#FFD700' : enemy.subtype === 'melee' ? '#FF8888' : '#AAAAAA';
    ctx.font = `bold ${isBoss ? 11 : 9}px monospace`;
    ctx.textAlign = 'center';
    ctx.shadowBlur = isBoss ? 10 : 0;
    ctx.shadowColor = '#FF0040';
    ctx.fillText(getEnemyLabel(enemy), enemy.x, barY - 4);
    ctx.shadowBlur = 0;

    // Элита: звёздочки
    if (isElite) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '10px monospace';
      ctx.fillText('★★★', enemy.x, barY - 14);
    }
  }

  // ── Игрок (гуманоид от 3-го лица) ────────────────────────
  const { player } = state;
  const isLowHp = player.hp / player.maxHp < 0.3;
  const playerColor = isLowHp ? '#FF4444' : '#00BFFF';

  drawHumanoid(
    ctx, player.x, player.y, 16,
    playerColor, player.aimAngle, true
  );

  // Эффект низкого HP
  if (isLowHp) {
    ctx.strokeStyle = 'rgba(255,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Индикатор перезарядки вокруг игрока
  if (player.isReloading) {
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.reloadProgress);
    ctx.stroke();
  }

  // Прицел
  const cx = state.mouseX; const cy = state.mouseY;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;
  const cs = 12;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(cx - cs, cy); ctx.lineTo(cx - 4, cy);
  ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + cs, cy);
  ctx.moveTo(cx, cy - cs); ctx.lineTo(cx, cy - 4);
  ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + cs);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.stroke();

  // Линия от прицела до игрока (лазерный прицел)
  ctx.strokeStyle = 'rgba(255,50,50,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  // Плавающие тексты
  for (const ft of state.floatingTexts) {
    ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
    ctx.fillStyle = ft.color;
    ctx.font = `bold ${ft.size}px monospace`;
    ctx.textAlign = 'center';
    ctx.shadowBlur = 8;
    ctx.shadowColor = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
