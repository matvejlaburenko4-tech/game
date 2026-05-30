// ============================================================
// MODULE: WaveSystem — волны, враги, боссы
// НОВЫЕ: классы врагов (melee/ranged) + уникальные боссы
// ============================================================

import { Enemy, WaveConfig, Team, GruntSubtype } from './types';

let enemyIdCounter = 1;

export function getWaveConfig(wave: number): WaveConfig {
  const hasBoss = wave % 10 === 0;
  const hasElite = wave % 5 === 0 && !hasBoss;
  const scale = 1 + (wave - 1) * 0.15;

  return {
    wave,
    enemyCount: hasBoss ? 1 : hasElite ? 3 + Math.floor(wave / 3) : 4 + Math.floor(wave * 1.2),
    spawnInterval: Math.max(400, 1200 - wave * 40),
    hasElite,
    hasBoss,
    enemyHpMultiplier: scale,
    enemySpeedMultiplier: 1 + (wave - 1) * 0.05,
    enemyDamageMultiplier: 1 + (wave - 1) * 0.08,
  };
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function spawnPosition(canvasW: number, canvasH: number): { x: number; y: number } {
  const side = Math.floor(Math.random() * 4);
  const margin = 30;
  switch (side) {
    case 0: return { x: randRange(margin, canvasW - margin), y: -margin };
    case 1: return { x: canvasW + margin, y: randRange(margin, canvasH - margin) };
    case 2: return { x: randRange(margin, canvasW - margin), y: canvasH + margin };
    default: return { x: -margin, y: randRange(margin, canvasH - margin) };
  }
}

// ── РЯДОВЫЕ ВРАГИ: два класса ─────────────────────────────
export function createGrunt(cfg: WaveConfig, canvasW: number, canvasH: number): Enemy {
  const team: Team = Math.random() > 0.5 ? 'terrorist' : 'special-forces';
  const pos = spawnPosition(canvasW, canvasH);
  const isTerrorist = team === 'terrorist';

  // Случайно выбираем подтип: melee (ближний бой) или ranged (дальний)
  const subtype: GruntSubtype = Math.random() < 0.45 ? 'melee' : 'ranged';

  if (subtype === 'melee') {
    // БОЕЦ БЛИЖНЕГО БОЯ — быстрый фанатик с ножом
    return {
      id: enemyIdCounter++,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      hp: Math.round(50 * cfg.enemyHpMultiplier),
      maxHp: Math.round(50 * cfg.enemyHpMultiplier),
      speed: 2.6 * cfg.enemySpeedMultiplier, // очень быстрый
      damage: Math.round(18 * cfg.enemyDamageMultiplier),
      type: 'grunt',
      subtype: 'melee',
      team,
      fireRate: 0, // не стреляет
      lastShot: 0,
      color: isTerrorist ? '#C0392B' : '#2980B9',
      radius: 12,
      meleeRange: 28,
      lastMeleeHit: 0,
    };
  } else {
    // БОЕЦ ДАЛЬНЕГО БОЯ — классический стрелок
    return {
      id: enemyIdCounter++,
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
      hp: Math.round(70 * cfg.enemyHpMultiplier),
      maxHp: Math.round(70 * cfg.enemyHpMultiplier),
      speed: 1.1 * cfg.enemySpeedMultiplier, // медленнее
      damage: Math.round(10 * cfg.enemyDamageMultiplier),
      type: 'grunt',
      subtype: 'ranged',
      team,
      fireRate: 1.2,
      lastShot: 0,
      color: isTerrorist ? '#8B2500' : '#1A5276',
      radius: 14,
    };
  }
}

export function createElite(cfg: WaveConfig, canvasW: number, canvasH: number, variant: number): Enemy {
  const pos = spawnPosition(canvasW, canvasH);
  const variants = [
    // Щитоносец
    { color: '#8E44AD', speed: 1.0, hp: 220, damage: 18, shielded: true, shieldHp: 80, radius: 18 },
    // Спринтер-берсерк
    { color: '#E67E22', speed: 2.8, hp: 120, damage: 15, shielded: false, shieldHp: 0, radius: 12 },
    // Тяжеловес
    { color: '#27AE60', speed: 0.8, hp: 380, damage: 30, shielded: false, shieldHp: 0, radius: 22 },
  ];
  const v = variants[variant % variants.length];
  return {
    id: enemyIdCounter++,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    hp: Math.round(v.hp * cfg.enemyHpMultiplier),
    maxHp: Math.round(v.hp * cfg.enemyHpMultiplier),
    speed: v.speed * cfg.enemySpeedMultiplier,
    damage: Math.round(v.damage * cfg.enemyDamageMultiplier),
    type: 'elite',
    team: 'terrorist',
    fireRate: 1.5,
    lastShot: 0,
    color: v.color,
    radius: v.radius,
    shielded: v.shielded,
    shieldHp: v.shielded ? Math.round(v.shieldHp * cfg.enemyHpMultiplier) : undefined,
  };
}

// ── УНИКАЛЬНЫЕ БОССЫ (каждые 10 волн — свой) ────────────────
// Босс 1 (волна 10): КОМАНДИР — призывает миньонов
// Босс 2 (волна 20): ГРАНАТОМЁТЧИК — закидывает гранатами
// Босс 3 (волна 30): БЕРСЕРК — идёт на таран
// Босс 4 (волна 40): ПРИЗРАК — телепортируется
// Босс 5 (волна 50): ПУЛЕМЁТЧИК — спрей пуль
// И далее по кругу с усилением
export function createBoss(cfg: WaveConfig, canvasW: number, canvasH: number): Enemy {
  const pos = spawnPosition(canvasW, canvasH);
  const bossIndex = Math.floor(cfg.wave / 10); // 1,2,3,4,5,...
  const bossType = ((bossIndex - 1) % 5) + 1; // 1-5 паттерн

  const bossConfigs: Record<number, {
    color: string;
    hp: number;
    speed: number;
    damage: number;
    radius: number;
    fireRate: number;
    pattern: string;
  }> = {
    1: { color: '#FF4500', hp: 1200, speed: 1.0, damage: 30, radius: 34, fireRate: 1.5, pattern: 'summoner' },
    2: { color: '#FF6B00', hp: 1000, speed: 1.4, damage: 25, radius: 30, fireRate: 2.0, pattern: 'grenadier' },
    3: { color: '#DC143C', hp: 1400, speed: 2.0, damage: 45, radius: 36, fireRate: 1.0, pattern: 'berserker' },
    4: { color: '#9400D3', hp: 900, speed: 0.8, damage: 20, radius: 28, fireRate: 3.0, pattern: 'phantom' },
    5: { color: '#FF0066', hp: 1600, speed: 1.2, damage: 35, radius: 40, fireRate: 5.0, pattern: 'minigunner' },
  };

  const bc = bossConfigs[bossType];

  return {
    id: enemyIdCounter++,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    hp: Math.round(bc.hp * cfg.enemyHpMultiplier),
    maxHp: Math.round(bc.hp * cfg.enemyHpMultiplier),
    speed: bc.speed * cfg.enemySpeedMultiplier,
    damage: Math.round(bc.damage * cfg.enemyDamageMultiplier),
    type: 'boss',
    team: 'terrorist',
    fireRate: bc.fireRate,
    lastShot: 0,
    color: bc.color,
    radius: bc.radius,
    phase: 1,
    bossPattern: bc.pattern,
    bossIndex,
    patternTimer: 0,
    shielded: false,
    summonTimer: 0,
    chargeActive: false,
    grenadeTimer: 0,
    grenadeCooldown: 0,
  };
}

// ── Имена для врагов ─────────────────────────────────────────
export function getEnemyLabel(e: Enemy): string {
  if (e.type === 'boss') {
    const names: Record<string, string> = {
      summoner: '👑 КОМАНДИР «ПРИЗЫВАТЕЛЬ»',
      grenadier: '💣 ГРАНАТОМЁТЧИК «АД»',
      berserker: '🪓 БЕРСЕРК «ТАРАН»',
      phantom: '👻 ПРИЗРАК «ТЕНЬ»',
      minigunner: '🔥 ПУЛЕМЁТЧИК «СМЕРТЬ»',
    };
    return names[e.bossPattern ?? 'summoner'] ?? 'БОСС';
  }
  if (e.type === 'elite') return '⭐ ЭЛИТА';
  if (e.subtype === 'melee') return e.team === 'terrorist' ? '🔪 ФАНАТИК' : '🔪 ШТУРМОВИК';
  return e.team === 'terrorist' ? '🔫 ТЕРРОРИСТ' : '🔫 СПЕЦНАЗ';
}

// Создать миньона (для босса-призывателя)
export function createMinion(bossX: number, bossY: number, cfg: WaveConfig): Enemy {
  const angle = Math.random() * Math.PI * 2;
  const dist = 80 + Math.random() * 40;
  return {
    id: enemyIdCounter++,
    x: bossX + Math.cos(angle) * dist,
    y: bossY + Math.sin(angle) * dist,
    vx: 0,
    vy: 0,
    hp: Math.round(40 * cfg.enemyHpMultiplier),
    maxHp: Math.round(40 * cfg.enemyHpMultiplier),
    speed: 2.0 * cfg.enemySpeedMultiplier,
    damage: Math.round(8 * cfg.enemyDamageMultiplier),
    type: 'grunt',
    subtype: 'melee',
    team: 'terrorist',
    fireRate: 0,
    lastShot: 0,
    color: '#FF7700',
    radius: 10,
    meleeRange: 25,
    lastMeleeHit: 0,
  };
}
