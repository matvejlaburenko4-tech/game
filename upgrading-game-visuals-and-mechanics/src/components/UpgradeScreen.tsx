// ============================================================
// COMPONENT: UpgradeScreen — экран выбора перков (со стакингом)
// ============================================================

import { UpgradeCard } from '../game/types';
import { upgradePickCounts } from '../game/upgrades';

interface Props {
  upgrades: UpgradeCard[];
  onSelect: (upgrade: UpgradeCard) => void;
  wave: number;
  score: number;
}

const RARITY_STYLES: Record<string, { border: string; glow: string; badge: string; bg: string }> = {
  common: {
    border: 'border-gray-500/50',
    glow: 'hover:shadow-gray-500/30',
    badge: 'bg-gray-700 text-gray-300',
    bg: 'bg-white/5',
  },
  rare: {
    border: 'border-blue-500/60',
    glow: 'hover:shadow-blue-500/40',
    badge: 'bg-blue-900/80 text-blue-300',
    bg: 'bg-blue-900/10',
  },
  epic: {
    border: 'border-purple-500/70',
    glow: 'hover:shadow-purple-500/50',
    badge: 'bg-purple-900/80 text-purple-300',
    bg: 'bg-purple-900/10',
  },
  legendary: {
    border: 'border-yellow-500/80',
    glow: 'hover:shadow-yellow-500/60',
    badge: 'bg-yellow-900/80 text-yellow-300',
    bg: 'bg-yellow-900/10',
  },
};

const RARITY_NAMES: Record<string, string> = {
  common: 'ОБЫЧНЫЙ',
  rare: 'РЕДКИЙ',
  epic: 'ЭПИЧЕСКИЙ',
  legendary: '⭐ ЛЕГЕНДАРНЫЙ',
};

export default function UpgradeScreen({ upgrades, onSelect, wave, score }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-20 px-4">
      {/* Фоновое свечение */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-900 opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-3xl">
        {/* Заголовок */}
        <div className="text-center">
          <div className="text-gray-500 font-mono text-sm tracking-widest">Волна {wave - 1} завершена</div>
          <h2 className="text-white font-black text-3xl md:text-4xl" style={{ textShadow: '0 0 30px rgba(168,85,247,0.8)' }}>
            ⬆️ ВЫБЕРИ УЛУЧШЕНИЕ
          </h2>
          <div className="text-yellow-400 font-mono text-sm mt-1">Счёт: {score.toLocaleString()}</div>
        </div>

        {/* Карточки апгрейдов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {upgrades.map((upgrade, i) => {
            const style = RARITY_STYLES[upgrade.rarity];
            const currentStacks = upgradePickCounts[upgrade.id] || 0;
            const isLegendary = upgrade.rarity === 'legendary';

            return (
              <button
                key={i}
                onClick={() => onSelect(upgrade)}
                className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 ${style.border} ${style.bg} 
                  hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer text-left
                  hover:shadow-xl ${style.glow} group
                  ${isLegendary ? 'animate-[legendaryPulse_2s_ease-in-out_infinite]' : ''}`}
              >
                {/* Значок редкости */}
                <div className={`absolute top-2 right-2 text-xs font-mono px-2 py-0.5 rounded-full ${style.badge}`}>
                  {RARITY_NAMES[upgrade.rarity]}
                </div>

                {/* Значок стака — если перк уже был взят */}
                {currentStacks > 0 && (
                  <div className="absolute top-2 left-2 bg-yellow-500/90 text-black text-xs font-black rounded-full px-1.5 py-0.5 stack-badge">
                    СТАК ×{currentStacks + 1}
                  </div>
                )}

                {/* Иконка */}
                <div className="text-5xl mt-2 group-hover:scale-110 transition-transform duration-200 select-none">
                  {upgrade.icon}
                </div>

                {/* Название */}
                <div className="text-white font-black text-base text-center leading-tight">
                  {upgrade.name}
                </div>

                {/* Описание */}
                <div className="text-gray-400 text-xs text-center leading-relaxed">
                  {upgrade.description}
                </div>

                {/* Индикатор мощи стака */}
                {currentStacks > 0 && (
                  <div className="w-full bg-yellow-900/30 border border-yellow-500/30 rounded-lg px-2 py-1 text-center">
                    <span className="text-yellow-400 text-xs font-mono">
                      🔥 Мощь: ×{Math.pow(2, currentStacks).toFixed(0)} (стак {currentStacks + 1})
                    </span>
                  </div>
                )}

                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                  style={{ boxShadow: `inset 0 0 30px ${upgrade.rarity === 'legendary' ? 'rgba(234,179,8,0.2)' : upgrade.rarity === 'epic' ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)'}` }} />
              </button>
            );
          })}
        </div>

        <div className="text-gray-600 text-xs font-mono">Кликни на карточку для применения улучшения</div>
      </div>
    </div>
  );
}
