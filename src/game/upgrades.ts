// ============================================================
// MODULE: UpgradeSystem
// Standoff 2: Wave Survival Edition
// ============================================================

import { UpgradeCard, AppliedUpgrades, Player } from './types';
// Player type is used in UpgradeCard.apply signatures below
void (null as unknown as Player);

export const DEFAULT_UPGRADES: AppliedUpgrades = {
  fireBullets: false,
  fireStacks: 0,
  fireRateBonus: 0,
  vampirism: 0,
  ricochet: false,
  ricochetCount: 0,
  magazineBonus: 0,
  critChance: 0,
  critMultiplier: 2.0,
  piercingShots: 0,
  damageBonus: 0,
  speedBonus: 0,
  maxHpBonus: 0,
  explosiveBullets: false,
  doubleShot: false,
  reloadSpeedBonus: 0,
  armorPlating: 0,
  adrenaline: false,
};

export const ALL_UPGRADES: UpgradeCard[] = [
  // ── ОГНЕННЫЕ ПАТРОНЫ ────────────────────────────────────
  {
    id: 'fire_bullets_1',
    name: '🔥 Зажигательные патроны',
    description: 'Твои пули поджигают врагов, нанося 8 урона/сек в течение 3 секунд.',
    icon: '🔥',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, fireBullets: true, fireStacks: u.fireStacks + 1 },
      player: p,
    }),
  },
  {
    id: 'fire_bullets_2',
    name: '🔥 Адское пламя',
    description: 'Огненный урон увеличен до 15/сек, стакается на одной цели.',
    icon: '🔥',
    rarity: 'epic',
    apply: (u, p) => ({
      upgrades: { ...u, fireBullets: true, fireStacks: u.fireStacks + 2 },
      player: p,
    }),
  },
  // ── СКОРОСТРЕЛЬНОСТЬ ────────────────────────────────────
  {
    id: 'fire_rate_1',
    name: '⚡ Адреналиновый триггер',
    description: 'Скорострельность +20%.',
    icon: '⚡',
    rarity: 'common',
    apply: (u, p) => ({
      upgrades: { ...u, fireRateBonus: u.fireRateBonus + 0.20 },
      player: p,
    }),
  },
  {
    id: 'fire_rate_2',
    name: '⚡ Гатлинг-режим',
    description: 'Скорострельность +40%.',
    icon: '⚡',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, fireRateBonus: u.fireRateBonus + 0.40 },
      player: p,
    }),
  },
  // ── ВАМПИРИЗМ ───────────────────────────────────────────
  {
    id: 'vampirism_1',
    name: '🩸 Вампиризм',
    description: 'Каждое убийство восстанавливает 5 HP.',
    icon: '🩸',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, vampirism: u.vampirism + 5 },
      player: p,
    }),
  },
  {
    id: 'vampirism_2',
    name: '🩸 Кровожадность',
    description: 'Каждое убийство восстанавливает 15 HP.',
    icon: '🩸',
    rarity: 'epic',
    apply: (u, p) => ({
      upgrades: { ...u, vampirism: u.vampirism + 15 },
      player: p,
    }),
  },
  // ── РИКОШЕТ ─────────────────────────────────────────────
  {
    id: 'ricochet_1',
    name: '🎱 Рикошет',
    description: 'Пули рикошетят от стен и врагов 1 раз.',
    icon: '🎱',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, ricochet: true, ricochetCount: Math.max(u.ricochetCount, 1) },
      player: p,
    }),
  },
  {
    id: 'ricochet_2',
    name: '🎱 Бильярдный хаос',
    description: 'Пули рикошетят 3 раза, каждый раз поражая новую цель.',
    icon: '🎱',
    rarity: 'epic',
    apply: (u, p) => ({
      upgrades: { ...u, ricochet: true, ricochetCount: u.ricochetCount + 3 },
      player: p,
    }),
  },
  // ── УВЕЛИЧЕННЫЙ МАГАЗИН ─────────────────────────────────
  {
    id: 'big_mag_1',
    name: '📦 Расширенный магазин',
    description: 'Ёмкость магазина +50%.',
    icon: '📦',
    rarity: 'common',
    apply: (u, p) => ({
      upgrades: { ...u, magazineBonus: u.magazineBonus + 0.5 },
      player: p,
    }),
  },
  {
    id: 'big_mag_2',
    name: '📦 Бесконечная лента',
    description: 'Ёмкость магазина +100%.',
    icon: '📦',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, magazineBonus: u.magazineBonus + 1.0 },
      player: p,
    }),
  },
  // ── КРИТЫ ───────────────────────────────────────────────
  {
    id: 'crit_1',
    name: '💀 Критические попадания',
    description: 'Шанс крита 15%. Критический удар наносит x2 урона.',
    icon: '💀',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, critChance: u.critChance + 0.15 },
      player: p,
    }),
  },
  {
    id: 'crit_2',
    name: '💀 Снайпер смерти',
    description: 'Шанс крита +20%, множитель урона x3.',
    icon: '💀',
    rarity: 'epic',
    apply: (u, p) => ({
      upgrades: { ...u, critChance: u.critChance + 0.20, critMultiplier: u.critMultiplier + 1.0 },
      player: p,
    }),
  },
  {
    id: 'crit_3',
    name: '💀 Бог войны',
    description: 'Шанс крита +30%, множитель x4. Критические убийства оставляют взрыв.',
    icon: '💀',
    rarity: 'legendary',
    apply: (u, p) => ({
      upgrades: { ...u, critChance: Math.min(u.critChance + 0.30, 0.90), critMultiplier: u.critMultiplier + 2.0, explosiveBullets: true },
      player: p,
    }),
  },
  // ── ПРОНИЗЫВАЮЩИЕ ВЫСТРЕЛЫ ──────────────────────────────
  {
    id: 'piercing_1',
    name: '🗡️ Пробивные пули',
    description: 'Пули пробивают 2 цели насквозь.',
    icon: '🗡️',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, piercingShots: u.piercingShots + 2 },
      player: p,
    }),
  },
  // ── УРОН ────────────────────────────────────────────────
  {
    id: 'damage_1',
    name: '💥 Бронебойные патроны',
    description: 'Урон +20%.',
    icon: '💥',
    rarity: 'common',
    apply: (u, p) => ({
      upgrades: { ...u, damageBonus: u.damageBonus + 0.20 },
      player: p,
    }),
  },
  {
    id: 'damage_2',
    name: '💥 Разрывные пули',
    description: 'Урон +40%.',
    icon: '💥',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, damageBonus: u.damageBonus + 0.40 },
      player: p,
    }),
  },
  // ── СКОРОСТЬ ────────────────────────────────────────────
  {
    id: 'speed_1',
    name: '👟 Лёгкие ноги',
    description: 'Скорость передвижения +20%.',
    icon: '👟',
    rarity: 'common',
    apply: (u, p) => ({
      upgrades: { ...u, speedBonus: u.speedBonus + 0.20 },
      player: p,
    }),
  },
  {
    id: 'speed_2',
    name: '👟 Молния',
    description: 'Скорость передвижения +40%.',
    icon: '👟',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, speedBonus: u.speedBonus + 0.40 },
      player: p,
    }),
  },
  // ── HP ──────────────────────────────────────────────────
  {
    id: 'maxhp_1',
    name: '❤️ Бронежилет',
    description: 'Максимальное HP +25. Полностью восстанавливает здоровье.',
    icon: '❤️',
    rarity: 'common',
    apply: (u, p) => ({
      upgrades: { ...u, maxHpBonus: u.maxHpBonus + 25 },
      player: { ...p, maxHp: p.maxHp + 25, hp: Math.min(p.hp + 30, p.maxHp + 25) },
    }),
  },
  {
    id: 'maxhp_2',
    name: '❤️ Кевларовые пластины',
    description: 'Максимальное HP +50, снижение входящего урона на 5.',
    icon: '❤️',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, maxHpBonus: u.maxHpBonus + 50, armorPlating: u.armorPlating + 5 },
      player: { ...p, maxHp: p.maxHp + 50, hp: Math.min(p.hp + 55, p.maxHp + 50) },
    }),
  },
  // ── ВЗРЫВНЫЕ ПУЛИ ───────────────────────────────────────
  {
    id: 'explosive_1',
    name: '💣 Реактивные патроны',
    description: 'Каждая пуля взрывается при попадании, поражая врагов рядом.',
    icon: '💣',
    rarity: 'epic',
    apply: (u, p) => ({
      upgrades: { ...u, explosiveBullets: true },
      player: p,
    }),
  },
  // ── ДВОЙНОЙ ВЫСТРЕЛ ─────────────────────────────────────
  {
    id: 'double_shot',
    name: '✌️ Двойной ствол',
    description: 'Каждый выстрел выпускает 2 пули.',
    icon: '✌️',
    rarity: 'epic',
    apply: (u, p) => ({
      upgrades: { ...u, doubleShot: true },
      player: p,
    }),
  },
  // ── БЫСТРАЯ ПЕРЕЗАРЯДКА ─────────────────────────────────
  {
    id: 'reload_speed_1',
    name: '⏱️ Быстрые руки',
    description: 'Скорость перезарядки +30%.',
    icon: '⏱️',
    rarity: 'common',
    apply: (u, p) => ({
      upgrades: { ...u, reloadSpeedBonus: u.reloadSpeedBonus + 0.30 },
      player: p,
    }),
  },
  // ── АДРЕНАЛИН ───────────────────────────────────────────
  {
    id: 'adrenaline',
    name: '💊 Адреналин',
    description: 'При HP < 30% скорость и скорострельность увеличиваются на 50%.',
    icon: '💊',
    rarity: 'legendary',
    apply: (u, p) => ({
      upgrades: { ...u, adrenaline: true },
      player: p,
    }),
  },
  // ── БРОНЯ ───────────────────────────────────────────────
  {
    id: 'armor_1',
    name: '🛡️ Стальная кожа',
    description: 'Снижение каждого входящего урона на 8.',
    icon: '🛡️',
    rarity: 'rare',
    apply: (u, p) => ({
      upgrades: { ...u, armorPlating: u.armorPlating + 8 },
      player: p,
    }),
  },
];

export function getRandomUpgrades(count: number, wave: number): UpgradeCard[] {
  // Weight legendaries toward higher waves
  const pool = ALL_UPGRADES.filter((u) => {
    if (u.rarity === 'legendary') return wave >= 8;
    if (u.rarity === 'epic') return wave >= 3;
    return true;
  });

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
