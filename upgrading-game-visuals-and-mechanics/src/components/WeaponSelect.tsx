// ============================================================
// COMPONENT: WeaponSelect — выбор оружия
// ============================================================

import { useState } from 'react';
import { WeaponDef } from '../game/types';
import { WEAPONS, WEAPON_CATEGORIES } from '../game/weapons';

interface Props {
  onSelect: (weapon: WeaponDef) => void;
  onBack: () => void;
}

export default function WeaponSelect({ onSelect, onBack }: Props) {
  const [activeCategory, setActiveCategory] = useState('rifle');
  const [preview, setPreview] = useState<WeaponDef>(WEAPONS.find(w => w.category === 'rifle') ?? WEAPONS[0]);

  const filtered = WEAPONS.filter(w => w.category === activeCategory);

  return (
    <div className="flex flex-col h-full w-full px-4 py-6 select-none overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-900 opacity-8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col gap-5 max-w-4xl mx-auto w-full">
        {/* Заголовок */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-mono text-sm transition-all hover:scale-105"
          >
            ← Назад
          </button>
          <div>
            <h2 className="text-white font-black text-2xl">🔫 ВЫБОР ОРУЖИЯ</h2>
            <div className="text-gray-500 font-mono text-xs">Выбери свой стиль боя</div>
          </div>
        </div>

        {/* Категории */}
        <div className="flex gap-2 flex-wrap">
          {WEAPON_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const first = WEAPONS.find(w => w.category === cat.id);
                if (first) setPreview(first);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-sm transition-all hover:scale-105
                ${activeCategory === cat.id
                  ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/50'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Список оружия */}
          <div className="flex flex-col gap-2">
            {filtered.map(weapon => (
              <button
                key={weapon.id}
                onMouseEnter={() => setPreview(weapon)}
                onClick={() => setPreview(weapon)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer
                  ${preview.id === weapon.id
                    ? 'bg-red-900/30 border-red-500/60 shadow shadow-red-900/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <span className="text-2xl">{weapon.icon}</span>
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">{weapon.name}</div>
                  <div className="text-gray-500 font-mono text-xs">{weapon.description}</div>
                </div>
                <div className={`text-xs font-mono px-2 py-1 rounded-lg ${weapon.automatic ? 'bg-red-900/60 text-red-300' : 'bg-yellow-900/60 text-yellow-300'}`}>
                  {weapon.automatic ? 'AUTO' : 'SEMI'}
                </div>
              </button>
            ))}
          </div>

          {/* Превью оружия */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{preview.icon}</span>
              <div>
                <div className="text-white font-black text-xl">{preview.name}</div>
                <div className="text-gray-500 font-mono text-xs">{preview.description}</div>
                <div className={`text-xs font-mono mt-1 px-2 py-0.5 rounded inline-block ${preview.automatic ? 'bg-red-900/60 text-red-300' : 'bg-yellow-900/60 text-yellow-300'}`}>
                  {preview.automatic ? '🔴 АВТОМАТИЧЕСКИЙ' : '🟡 ПОЛУАВТОМАТ'}
                </div>
              </div>
            </div>

            {/* Характеристики */}
            <div className="flex flex-col gap-2">
              {[
                { label: '💥 Урон', value: preview.damage, max: 160 },
                { label: '⚡ Скорострельность', value: preview.fireRate, max: 14 },
                { label: '📦 Магазин', value: preview.magazineSize, max: 55 },
                { label: '🎯 Точность', value: preview.accuracy * 100, max: 100 },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs font-mono">{stat.label}</span>
                    <span className="text-white text-xs font-bold">
                      {stat.label === '🎯 Точность' ? `${stat.value.toFixed(0)}%` : stat.value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (stat.value / stat.max) * 100)}%`,
                        background: 'linear-gradient(90deg, #DC2626, #FF0040)',
                        boxShadow: '0 0 8px rgba(220,38,38,0.6)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-gray-500 font-mono text-xs border-t border-white/5 pt-3">
              🔄 Перезарядка: {preview.reloadTime}с · 💨 Скорость пули: {preview.bulletSpeed}
            </div>

            <button
              onClick={() => onSelect(preview)}
              className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-black text-white text-base tracking-wider uppercase transition-all hover:scale-105 active:scale-95"
              style={{ boxShadow: '0 0 25px rgba(220,38,38,0.5)' }}
            >
              ⚔️ В БОЙ С {preview.name.toUpperCase()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
