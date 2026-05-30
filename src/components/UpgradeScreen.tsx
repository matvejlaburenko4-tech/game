// ============================================================
// COMPONENT: UpgradeScreen — выбор улучшений между волнами
// ============================================================

import { UpgradeCard } from '../game/types';

const RARITY_STYLES: Record<string, { border: string; bg: string; badge: string; glow: string }> = {
  common: {
    border: 'border-gray-500',
    bg: 'from-gray-800 to-gray-900',
    badge: 'bg-gray-700 text-gray-300',
    glow: 'shadow-gray-800/50',
  },
  rare: {
    border: 'border-blue-500',
    bg: 'from-blue-900 to-gray-900',
    badge: 'bg-blue-700 text-blue-200',
    glow: 'shadow-blue-900/60',
  },
  epic: {
    border: 'border-purple-500',
    bg: 'from-purple-900 to-gray-900',
    badge: 'bg-purple-700 text-purple-200',
    glow: 'shadow-purple-900/60',
  },
  legendary: {
    border: 'border-yellow-400',
    bg: 'from-yellow-900 to-gray-900',
    badge: 'bg-yellow-600 text-yellow-100',
    glow: 'shadow-yellow-800/70',
  },
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Обычное',
  rare: 'Редкое',
  epic: 'Эпическое',
  legendary: '✨ ЛЕГЕНДАРНОЕ',
};

interface Props {
  upgrades: UpgradeCard[];
  wave: number;
  score: number;
  onSelect: (upgrade: UpgradeCard) => void;
}

export default function UpgradeScreen({ upgrades, wave, score, onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 select-none">
      {/* Background pulse */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900 opacity-10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-3xl">
        {/* Header */}
        <div className="text-center">
          <div className="text-purple-400 text-sm font-mono tracking-widest uppercase mb-1">Волна {wave - 1} завершена</div>
          <h2 className="text-white font-black text-3xl md:text-4xl"
            style={{ textShadow: '0 0 30px rgba(168,85,247,0.8)' }}>
            ⬆️ ВЫБЕРИ УЛУЧШЕНИЕ
          </h2>
          <div className="text-gray-400 text-sm mt-2 font-mono">
            Счёт: <span className="text-yellow-400 font-bold">{score.toLocaleString()}</span>
          </div>
        </div>

        {/* Upgrade Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {upgrades.map((upgrade, i) => {
            const style = RARITY_STYLES[upgrade.rarity];
            return (
              <button
                key={upgrade.id + i}
                onClick={() => onSelect(upgrade)}
                className={`group relative text-left rounded-2xl border-2 ${style.border} bg-gradient-to-br ${style.bg} p-5 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl ${style.glow}`}
                style={upgrade.rarity === 'legendary'
                  ? { boxShadow: '0 0 30px rgba(234,179,8,0.4), 0 4px 30px rgba(0,0,0,0.6)', animation: 'legendaryPulse 2s ease-in-out infinite' }
                  : {}
                }
              >
                {/* Rarity badge */}
                <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-3 ${style.badge}`}>
                  {RARITY_LABELS[upgrade.rarity]}
                </div>

                {/* Icon */}
                <div className="text-4xl mb-3">{upgrade.icon}</div>

                {/* Name */}
                <h3 className="text-white font-black text-base mb-2 leading-tight">
                  {upgrade.name}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed">
                  {upgrade.description}
                </p>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl border-2 ${style.border} opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none`}
                  style={{ boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)' }} />

                {/* Pick indicator */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-green-400 font-black text-xs">ВЫБРАТЬ →</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-gray-600 text-xs font-mono">Кликни на карточку для применения улучшения</p>
      </div>
    </div>
  );
}
