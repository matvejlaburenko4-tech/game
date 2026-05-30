// ============================================================
// COMPONENT: MainMenu
// ============================================================

// React is used implicitly via JSX transform

interface Props {
  onStart: () => void;
  highScore: number;
  totalKills: number;
}

export default function MainMenu({ onStart, highScore, totalKills }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none">
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600 opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-blue-600 opacity-10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 text-center max-w-2xl">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-16 bg-gradient-to-b from-red-500 to-red-900" />
            <div>
              <div className="text-red-400 text-sm font-mono tracking-[0.4em] uppercase mb-1">Axlebolt · Fan Concept</div>
              <h1 className="text-5xl md:text-6xl font-black text-white leading-none tracking-tight"
                style={{ textShadow: '0 0 40px rgba(220,38,38,0.8), 0 0 80px rgba(220,38,38,0.4)' }}>
                STANDOFF 2
              </h1>
              <div className="text-xl md:text-2xl font-bold text-red-400 tracking-widest mt-1">
                WAVE SURVIVAL EDITION
              </div>
            </div>
            <div className="w-1 h-16 bg-gradient-to-b from-red-500 to-red-900" />
          </div>
          <p className="text-gray-400 text-sm font-mono max-w-sm">
            Тактический шутер · Роглайт-прокачка · Бесконечные волны
          </p>
        </div>

        {/* Stats */}
        {(highScore > 0 || totalKills > 0) && (
          <div className="flex gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center">
              <div className="text-yellow-400 font-black text-2xl">{highScore.toLocaleString()}</div>
              <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mt-1">Рекорд</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center">
              <div className="text-red-400 font-black text-2xl">{totalKills.toLocaleString()}</div>
              <div className="text-gray-500 text-xs font-mono uppercase tracking-wider mt-1">Убийств</div>
            </div>
          </div>
        )}

        {/* Mechanics preview */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { icon: '🌊', title: 'Волны врагов', desc: 'Нарастающая сложность' },
            { icon: '⬆️', title: 'RPG-прокачка', desc: 'Рогалик-улучшения' },
            { icon: '💀', title: 'Боссы', desc: 'Каждые 10 волн' },
          ].map((item) => (
            <div key={item.title}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white text-xs font-bold">{item.title}</div>
              <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onStart}
          className="relative group px-14 py-4 bg-red-600 hover:bg-red-500 rounded-xl font-black text-white text-xl tracking-widest uppercase transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ boxShadow: '0 0 30px rgba(220,38,38,0.6), 0 4px 20px rgba(0,0,0,0.5)' }}
        >
          <span className="relative z-10">⚔️ В БОЙ</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-600 to-red-400 opacity-0 group-hover:opacity-20 transition-opacity" />
        </button>

        <div className="text-gray-600 text-xs font-mono">
          WASD / ↑↓←→ — движение &nbsp;·&nbsp; ЛКМ — огонь &nbsp;·&nbsp; R — перезарядка
        </div>
      </div>
    </div>
  );
}
