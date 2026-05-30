// ============================================================
// MODULE: WaveSystem — волны, враги, боссы
// Standoff 2: Wave Survival Edition
// ============================================================

import { Enemy, WaveConfig, Team } from './types';

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

export function createGrunt(cfg: WaveConfig, canvasW: number, canvasH: number): Enemy {
  const team: Team = Math.random() > 0.5 ? 'terrorist' : 'special-forces';
  const pos = spawnPosition(canvasW, canvasH);
  const isTerrorist = team === 'terrorist';

  return {
    id: enemyIdCounter++,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    hp: Math.round(60 * cfg.enemyHpMultiplier),
    maxHp: Math.round(60 * cfg.enemyHpMultiplier),
    speed: 1.4 * cfg.enemySpeedMultiplier,
    damage: Math.round(10 * cfg.enemyDamageMultiplier),
    type: 'grunt',
    team,
    fireRate: 1.2,
    lastShot: 0,
    color: isTerrorist ? '#C0392B' : '#2980B9',
    radius: 14,
  };
}

export function createElite(cfg: WaveConfig, canvasW: number, canvasH: number, variant: number): Enemy {
  const pos = spawnPosition(canvasW, canvasH);
  const variants = [
    // Shield carrier
    {
      color: '#8E44AD',
      speed: 1.0,
      hp: 220,
      damage: 18,
      shielded: true,
      shieldHp: 80,
      radius: 18,
    },
    // Speed runner
    {
      color: '#E67E22',
      speed: 2.8,
      hp: 120,
      damage: 15,
      shielded: false,
      shieldHp: 0,
      radius: 12,
    },
    // Juggernaut
    {
      color: '#27AE60',
      speed: 0.8,
      hp: 380,
      damage: 30,
      shielded: false,
      shieldHp: 0,
      radius: 22,
    },
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

export function createBoss(cfg: WaveConfig, canvasW: number, canvasH: number): Enemy {
  const pos = spawnPosition(canvasW, canvasH);
  const bossPatterns = ['charge', 'spray', 'teleport'];
  const pattern = bossPatterns[(cfg.wave / 10 - 1) % bossPatterns.length];

  return {
    id: enemyIdCounter++,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    hp: Math.round(1200 * cfg.enemyHpMultiplier),
    maxHp: Math.round(1200 * cfg.enemyHpMultiplier),
    speed: 1.2 * cfg.enemySpeedMultiplier,
    damage: Math.round(35 * cfg.enemyDamageMultiplier),
    type: 'boss',
    team: 'terrorist',
    fireRate: 2.5,
    lastShot: 0,
    color: '#FF0040',
    radius: 36,
    phase: 1,
    bossPattern: pattern,
    patternTimer: 0,
    shielded: false,
  };
}

export function getEnemyLabel(e: Enemy): string {
  if (e.type === 'boss') {
    const names: Record<string, string> = {
      charge: 'КОМАНДИР «МЕДВЕДЬ»',
      spray: 'ПУЛЕМЁТЧИК «АД»',
      teleport: 'ПРИЗРАК «ТЕНЬ»',
    };
    return names[e.bossPattern ?? 'charge'] ?? 'БОСС';
  }
  if (e.type === 'elite') return 'ЭЛИТА';
  return e.team === 'terrorist' ? 'ТЕРРОРИСТ' : 'СПЕЦНАЗ';
}
