// ============================================================
// COMPONENT: MainMenu
// ============================================================

interface Props {
  onStart: () => void;
  highScore: number;
  totalKills: number;
}

export default function MainMenu({ onStart, highScore, totalKills }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 select-none">
      {/* Фоновое свечение */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900 opacity-10 rounded-full blur-3xl" />
        <div className="absolute top-20 right-20 w-48 h-48 bg-blue-900 opacity-10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-900 opacity-10 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-2xl w-full">
        {/* Логотип */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-red-500" />
            <span className="text-red-500 text-sm font-mono tracking-widest">AXLEBOLT · FAN CONCEPT</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-red-500" />
          </div>
          <h1 className="text-white font-black text-5xl md:text-7xl leading-none text-standoff">
            STANDOFF 2
          </h1>
          <div className="text-red-400 font-mono tracking-[0.3em] text-sm uppercase">
            WAVE SURVIVAL — UPGRADED
          </div>
        </div>

        <p className="text-gray-400 text-sm font-mono">
          Тактический шутер · Роглайт-прокачка · Стакинг перков · Уникальные боссы
        </p>

        {/* Статистика */}
        {(highScore > 0 || totalKills > 0) && (
          <div className="flex gap-6">
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center">
              <div className="text-yellow-400 font-black text-2xl">{highScore.toLocaleString()}</div>
              <div className="text-gray-500 text-xs font-mono">Рекорд</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-center">
              <div className="text-red-400 font-black text-2xl">{totalKills.toLocaleString()}</div>
              <div className="text-gray-500 text-xs font-mono">Убийств</div>
            </div>
          </div>
        )}

        {/* Фичи игры */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {[
            { icon: '🔪', title: 'Ближний бой', desc: 'Фанатики с ножами' },
            { icon: '🔫', title: 'Дальний бой', desc: 'Стрелки из укрытий' },
            { icon: '💀', title: 'Уникальные боссы', desc: 'Каждые 10 волн' },
            { icon: '⬆️', title: 'Стакинг перков', desc: 'Перки перемножаются!' },
          ].map((item) => (
            <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{item.icon}</div>
              <div className="text-white text-xs font-bold">{item.title}</div>
              <div className="text-gray-500 text-xs font-mono">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Кнопка старта */}
        <button
          onClick={onStart}
          className="w-full max-w-xs py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-white text-xl tracking-wider uppercase transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ boxShadow: '0 0 40px rgba(220,38,38,0.6), 0 4px 30px rgba(0,0,0,0.5)' }}
        >
          🎮 НАЧАТЬ БОЙ
        </button>

        {/* Управление */}
        <div className="text-gray-600 text-xs font-mono">
          WASD / ↑↓←→ — движение · ЛКМ — огонь · R — перезарядка
        </div>
      </div>
    </div>
  );
}
