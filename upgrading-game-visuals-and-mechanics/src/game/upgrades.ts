// ============================================================
// MODULE: UpgradeSystem — СТАКИНГ ПЕРКОВ
// Все перки стакаются (суммируются или перемножаются)!
// ============================================================

import { UpgradeCard, AppliedUpgrades } from './types';
import type { Player } from './types';
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

// ── Трекер количества взятий перков ──────────────────────────
// Хранится в памяти, обновляется при каждом pick
export const upgradePickCounts: Record<string, number> = {};

export function resetUpgradePickCounts() {
  for (const k in upgradePickCounts) delete upgradePickCounts[k];
}

function trackPick(id: string): number {
  upgradePickCounts[id] = (upgradePickCounts[id] || 0) + 1;
  return upgradePickCounts[id];
}

// Вспомогательная функция: перемножение бонуса
// Если взял x2 дважды → x4; трижды → x8 и т.д.
function multiplicativeBonus(base: number, currentMult: number): number {
  // currentMult — текущее значение (напр. fireRateBonus = 0.20)
  // base — сколько добавляет один стак (0.20)
  // При стакинге: (1 + текущий) * (1 + base) - 1
  return (1 + currentMult) * (1 + base) - 1;
}

export const ALL_UPGRADES: UpgradeCard[] = [
  // ── ОГНЕННЫЕ ПАТРОНЫ ────────────────────────────────────
  {
    id: 'fire_bullets',
    name: '🔥 Зажигательные патроны',
    description: 'Пули поджигают врагов. СТАК: каждый стак +8 урона/сек огня. ×2 → ×4 → ×8...',
    icon: '🔥',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('fire_bullets');
      const newStacks = u.fireStacks + 1;
      return {
        upgrades: { ...u, fireBullets: true, fireStacks: newStacks },
        player: p,
      };
    },
  },
  // ── СКОРОСТРЕЛЬНОСТЬ (МУЛЬТИПЛИКАТИВНЫЙ СТАК) ───────────
  {
    id: 'fire_rate_1',
    name: '⚡ Адреналиновый триггер',
    description: 'Скорострельность ×1.2. СТАК: ×1.2 каждый раз (×1.44, ×1.73...)',
    icon: '⚡',
    rarity: 'common',
    apply: (u, p) => {
      trackPick('fire_rate_1');
      return {
        upgrades: { ...u, fireRateBonus: multiplicativeBonus(0.20, u.fireRateBonus) },
        player: p,
      };
    },
  },
  {
    id: 'fire_rate_2',
    name: '⚡ Гатлинг-режим',
    description: 'Скорострельность ×1.4. СТАК: перемножается с другими бонусами!',
    icon: '⚡',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('fire_rate_2');
      return {
        upgrades: { ...u, fireRateBonus: multiplicativeBonus(0.40, u.fireRateBonus) },
        player: p,
      };
    },
  },
  // ── ВАМПИРИЗМ (СУММИРУЕТСЯ) ──────────────────────────────
  {
    id: 'vampirism_1',
    name: '🩸 Вампиризм',
    description: 'Каждое убийство +5 HP. СТАК: +5 HP за каждый стак (х2 → +10 HP/убийство).',
    icon: '🩸',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('vampirism_1');
      return {
        upgrades: { ...u, vampirism: u.vampirism + 5 },
        player: p,
      };
    },
  },
  {
    id: 'vampirism_2',
    name: '🩸 Кровожадность',
    description: 'Каждое убийство +15 HP. СТАК: суммируется со всем вампиризмом.',
    icon: '🩸',
    rarity: 'epic',
    apply: (u, p) => {
      trackPick('vampirism_2');
      return {
        upgrades: { ...u, vampirism: u.vampirism + 15 },
        player: p,
      };
    },
  },
  // ── РИКОШЕТ (СТАК УВЕЛИЧИВАЕТ КОЛИЧЕСТВО) ───────────────
  {
    id: 'ricochet_1',
    name: '🎱 Рикошет',
    description: 'Пули рикошетят +1 раз. СТАК: +1 рикошет каждый раз.',
    icon: '🎱',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('ricochet_1');
      return {
        upgrades: { ...u, ricochet: true, ricochetCount: u.ricochetCount + 1 },
        player: p,
      };
    },
  },
  {
    id: 'ricochet_2',
    name: '🎱 Бильярдный хаос',
    description: 'Пули рикошетят +3 раза. СТАК: суммируется!',
    icon: '🎱',
    rarity: 'epic',
    apply: (u, p) => {
      trackPick('ricochet_2');
      return {
        upgrades: { ...u, ricochet: true, ricochetCount: u.ricochetCount + 3 },
        player: p,
      };
    },
  },
  // ── МАГАЗИН (МУЛЬТИПЛИКАТИВНЫЙ СТАК) ────────────────────
  {
    id: 'big_mag_1',
    name: '📦 Расширенный магазин',
    description: 'Магазин ×1.5. СТАК: ×1.5 каждый раз! (×2.25, ×3.37...)',
    icon: '📦',
    rarity: 'common',
    apply: (u, p) => {
      trackPick('big_mag_1');
      return {
        upgrades: { ...u, magazineBonus: multiplicativeBonus(0.5, u.magazineBonus) },
        player: p,
      };
    },
  },
  {
    id: 'big_mag_2',
    name: '📦 Бесконечная лента',
    description: 'Магазин ×2. СТАК: перемножается! (×4, ×8...)',
    icon: '📦',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('big_mag_2');
      return {
        upgrades: { ...u, magazineBonus: multiplicativeBonus(1.0, u.magazineBonus) },
        player: p,
      };
    },
  },
  // ── КРИТЫ (СУММИРУЕТСЯ ШАНС, ПЕРЕМНОЖАЕТСЯ МНОЖИТЕЛЬ) ───
  {
    id: 'crit_1',
    name: '💀 Критические попадания',
    description: 'Шанс крита +15%. СТАК: +15% каждый раз. Множитель ×2.',
    icon: '💀',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('crit_1');
      return {
        upgrades: { ...u, critChance: Math.min(u.critChance + 0.15, 0.95) },
        player: p,
      };
    },
  },
  {
    id: 'crit_2',
    name: '💀 Снайпер смерти',
    description: 'Шанс крита +20%, множитель ×1.5. СТАК: перемножается!',
    icon: '💀',
    rarity: 'epic',
    apply: (u, p) => {
      trackPick('crit_2');
      return {
        upgrades: {
          ...u,
          critChance: Math.min(u.critChance + 0.20, 0.95),
          critMultiplier: u.critMultiplier * 1.5,
        },
        player: p,
      };
    },
  },
  {
    id: 'crit_3',
    name: '💀 Бог войны',
    description: 'Шанс крита +30%, множитель ×2. СТАК: множитель перемножается!',
    icon: '💀',
    rarity: 'legendary',
    apply: (u, p) => {
      trackPick('crit_3');
      return {
        upgrades: {
          ...u,
          critChance: Math.min(u.critChance + 0.30, 0.95),
          critMultiplier: u.critMultiplier * 2.0,
          explosiveBullets: true,
        },
        player: p,
      };
    },
  },
  // ── ПРОНИЗЫВАЮЩИЕ ВЫСТРЕЛЫ ──────────────────────────────
  {
    id: 'piercing_1',
    name: '🗡️ Пробивные пули',
    description: 'Пули пробивают +2 цели. СТАК: суммируется.',
    icon: '🗡️',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('piercing_1');
      return {
        upgrades: { ...u, piercingShots: u.piercingShots + 2 },
        player: p,
      };
    },
  },
  // ── УРОН (МУЛЬТИПЛИКАТИВНЫЙ СТАК) ───────────────────────
  {
    id: 'damage_1',
    name: '💥 Бронебойные патроны',
    description: 'Урон ×1.2. СТАК: перемножается! (×1.44, ×1.73...)',
    icon: '💥',
    rarity: 'common',
    apply: (u, p) => {
      trackPick('damage_1');
      return {
        upgrades: { ...u, damageBonus: multiplicativeBonus(0.20, u.damageBonus) },
        player: p,
      };
    },
  },
  {
    id: 'damage_2',
    name: '💥 Разрывные пули',
    description: 'Урон ×1.4. СТАК: перемножается с другими бонусами!',
    icon: '💥',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('damage_2');
      return {
        upgrades: { ...u, damageBonus: multiplicativeBonus(0.40, u.damageBonus) },
        player: p,
      };
    },
  },
  // ── СКОРОСТЬ (МУЛЬТИПЛИКАТИВНЫЙ СТАК) ───────────────────
  {
    id: 'speed_1',
    name: '👟 Лёгкие ноги',
    description: 'Скорость ×1.2. СТАК: перемножается!',
    icon: '👟',
    rarity: 'common',
    apply: (u, p) => {
      trackPick('speed_1');
      return {
        upgrades: { ...u, speedBonus: multiplicativeBonus(0.20, u.speedBonus) },
        player: p,
      };
    },
  },
  {
    id: 'speed_2',
    name: '👟 Молния',
    description: 'Скорость ×1.4. СТАК: перемножается с другими бонусами!',
    icon: '👟',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('speed_2');
      return {
        upgrades: { ...u, speedBonus: multiplicativeBonus(0.40, u.speedBonus) },
        player: p,
      };
    },
  },
  // ── HP ──────────────────────────────────────────────────
  {
    id: 'maxhp_1',
    name: '❤️ Бронежилет',
    description: 'Макс. HP +25, восстановление HP. СТАК: суммируется!',
    icon: '❤️',
    rarity: 'common',
    apply: (u, p) => {
      trackPick('maxhp_1');
      return {
        upgrades: { ...u, maxHpBonus: u.maxHpBonus + 25 },
        player: { ...p, maxHp: p.maxHp + 25, hp: Math.min(p.hp + 30, p.maxHp + 25) },
      };
    },
  },
  {
    id: 'maxhp_2',
    name: '❤️ Кевларовые пластины',
    description: 'Макс. HP +50, броня -5 урона. СТАК: суммируется!',
    icon: '❤️',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('maxhp_2');
      return {
        upgrades: { ...u, maxHpBonus: u.maxHpBonus + 50, armorPlating: u.armorPlating + 5 },
        player: { ...p, maxHp: p.maxHp + 50, hp: Math.min(p.hp + 55, p.maxHp + 50) },
      };
    },
  },
  // ── ВЗРЫВНЫЕ ПУЛИ ───────────────────────────────────────
  {
    id: 'explosive_1',
    name: '💣 Реактивные патроны',
    description: 'Каждая пуля взрывается при попадании. СТАК: радиус взрыва растёт!',
    icon: '💣',
    rarity: 'epic',
    apply: (u, p) => {
      trackPick('explosive_1');
      return {
        upgrades: { ...u, explosiveBullets: true },
        player: p,
      };
    },
  },
  // ── ДВОЙНОЙ ВЫСТРЕЛ ─────────────────────────────────────
  {
    id: 'double_shot',
    name: '✌️ Двойной ствол',
    description: 'Каждый выстрел выпускает 2 пули. СТАК: пули множатся!',
    icon: '✌️',
    rarity: 'epic',
    apply: (u, p) => {
      trackPick('double_shot');
      return {
        upgrades: { ...u, doubleShot: true },
        player: p,
      };
    },
  },
  // ── БЫСТРАЯ ПЕРЕЗАРЯДКА ─────────────────────────────────
  {
    id: 'reload_speed_1',
    name: '⏱️ Быстрые руки',
    description: 'Скорость перезарядки +30%. СТАК: суммируется (до -90%).',
    icon: '⏱️',
    rarity: 'common',
    apply: (u, p) => {
      trackPick('reload_speed_1');
      return {
        upgrades: { ...u, reloadSpeedBonus: Math.min(u.reloadSpeedBonus + 0.30, 0.90) },
        player: p,
      };
    },
  },
  {
    id: 'reload_speed_2',
    name: '⏱️ Мгновенная перезарядка',
    description: 'Скорость перезарядки +50%. СТАК: суммируется!',
    icon: '⏱️',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('reload_speed_2');
      return {
        upgrades: { ...u, reloadSpeedBonus: Math.min(u.reloadSpeedBonus + 0.50, 0.90) },
        player: p,
      };
    },
  },
  // ── БРОНЯ ───────────────────────────────────────────────
  {
    id: 'armor_1',
    name: '🛡️ Тяжёлая броня',
    description: 'Снижение урона -8. СТАК: суммируется!',
    icon: '🛡️',
    rarity: 'rare',
    apply: (u, p) => {
      trackPick('armor_1');
      return {
        upgrades: { ...u, armorPlating: u.armorPlating + 8 },
        player: p,
      };
    },
  },
  // ── АДРЕНАЛИН ───────────────────────────────────────────
  {
    id: 'adrenaline',
    name: '💊 Адреналин',
    description: 'При HP < 30% — скорость ×2. СТАК: активен всегда при повторе.',
    icon: '💊',
    rarity: 'epic',
    apply: (u, p) => {
      trackPick('adrenaline');
      return {
        upgrades: { ...u, adrenaline: true },
        player: p,
      };
    },
  },
];

// ── Выбор случайных карточек с учётом стакинга ─────────────
export function getRandomUpgrades(count: number, wave: number): UpgradeCard[] {
  // Взвешенный рандом по редкости
  const rarityWeights: Record<string, number> = {
    common: 50,
    rare: 30,
    epic: 15,
    legendary: wave >= 5 ? 5 : 0,
  };

  const weighted: UpgradeCard[] = [];
  for (const card of ALL_UPGRADES) {
    const w = rarityWeights[card.rarity] || 0;
    for (let i = 0; i < w; i++) weighted.push(card);
  }

  const result: UpgradeCard[] = [];
  const used = new Set<string>();
  let attempts = 0;

  while (result.length < count && attempts < 200) {
    attempts++;
    const card = weighted[Math.floor(Math.random() * weighted.length)];
    if (!used.has(card.id)) {
      used.add(card.id);
      // Показываем количество стаков
      const stackCount = upgradePickCounts[card.id] || 0;
      result.push({ ...card, stackCount });
    }
  }

  return result;
}
