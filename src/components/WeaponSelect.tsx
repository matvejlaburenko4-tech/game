// ============================================================
// COMPONENT: WeaponSelect
// ============================================================

import { useState } from 'react';
import { WeaponDef, WeaponCategory } from '../game/types';
import { WEAPONS, WEAPON_CATEGORIES } from '../game/weapons';

interface Props {
  onSelect: (weapon: WeaponDef) => void;
  onBack: () => void;
}

const RARITY_COLORS: Record<WeaponCategory, string> = {
  pistol: 'from-gray-700 to-gray-600',
  smg: 'from-blue-900 to-blue-800',
  rifle: 'from-orange-900 to-orange-800',
  sniper: 'from-purple-900 to-purple-800',
};

const STAT_COLOR = (val: number, max: number) => {
  const pct = val / max;
  if (pct > 0.7) return '#2ECC71';
  if (pct > 0.4) return '#F39C12';
  return '#E74C3C';
};

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(1, value / max);
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-xs w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct * 100}%`, backgroundColor: STAT_COLOR(pct, 1) }}
        />
      </div>
    </div>
  );
}

export default function WeaponSelect({ onSelect, onBack }: Props) {
  const [category, setCategory] = useState<WeaponCategory>('rifle');
  const [hovered, setHovered] = useState<WeaponDef | null>(null);

  const filtered = WEAPONS.filter((w) => w.category === category);
  const preview = hovered ?? filtered[0];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 py-8 select-none">
      <div className="relative z-10 w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-gray-500 hover:text-white text-sm font-mono transition-colors flex items-center gap-2">
            ← НАЗАД
          </button>
          <h2 className="text-white font-black text-2xl tracking-widest uppercase"
            style={{ textShadow: '0 0 20px rgba(220,38,38,0.6)' }}>
            🔫 Выбор Оружия
          </h2>
          <div className="w-20" />
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 justify-center flex-wrap">
          {WEAPON_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setCategory(cat.id as WeaponCategory); setHovered(null); }}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all duration-200 border ${category === cat.id
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/50'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white'
                }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          {/* Weapon List */}
          <div className="flex flex-col gap-2 w-64 shrink-0">
            {filtered.map((weapon) => (
              <div
                key={weapon.id}
                onMouseEnter={() => setHovered(weapon)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(weapon)}
                className={`cursor-pointer rounded-xl border p-3 transition-all duration-200 bg-gradient-to-r ${RARITY_COLORS[weapon.category]} ${hovered?.id === weapon.id
                  ? 'border-red-500 scale-105 shadow-lg shadow-red-900/40'
                  : 'border-white/10 hover:border-white/30'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{weapon.icon}</div>
                  <div>
                    <div className="text-white font-bold text-sm">{weapon.name}</div>
                    <div className="text-gray-400 text-xs">{weapon.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview Panel */}
          {preview && (
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-5xl">{preview.icon}</div>
                <div>
                  <h3 className="text-white font-black text-2xl" style={{ color: preview.color }}>
                    {preview.name}
                  </h3>
                  <div className="text-gray-400 text-sm mt-1">{preview.description}</div>
                  <div className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold border ${preview.automatic
                    ? 'border-red-500/50 bg-red-900/30 text-red-400'
                    : 'border-yellow-500/50 bg-yellow-900/30 text-yellow-400'
                    }`}>
                    {preview.automatic ? '🔴 АВТОМАТИЧЕСКИЙ' : '🟡 ПОЛУАВТОМАТ'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: '💥 Урон', value: preview.damage, max: 160 },
                  { label: '⚡ Скорострельность', value: preview.fireRate, max: 14 },
                  { label: '📦 Магазин', value: preview.magazineSize, max: 55 },
                  { label: '🎯 Точность', value: preview.accuracy * 100, max: 100 },
                ].map((stat) => (
                  <div key={stat.label} className="bg-black/30 rounded-xl p-3">
                    <div className="text-white font-bold text-lg"
                      style={{ color: STAT_COLOR(stat.value / stat.max, 1) }}>
                      {stat.label === '🎯 Точность' ? `${stat.value.toFixed(0)}%` : stat.value}
                    </div>
                    <div className="text-gray-500 text-xs mb-2">{stat.label}</div>
                    <StatBar label="" value={stat.value} max={stat.max} />
                  </div>
                ))}
              </div>

              <div className="flex gap-3 text-xs text-gray-500 font-mono mb-6">
                <span>🔄 Перезарядка: {preview.reloadTime}с</span>
                <span>·</span>
                <span>💨 Скорость пули: {preview.bulletSpeed}</span>
              </div>

              <button
                onClick={() => onSelect(preview)}
                className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-black text-white text-lg tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ boxShadow: '0 0 20px rgba(220,38,38,0.5)' }}
              >
                ВЫБРАТЬ {preview.name.toUpperCase()} ⚔️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
