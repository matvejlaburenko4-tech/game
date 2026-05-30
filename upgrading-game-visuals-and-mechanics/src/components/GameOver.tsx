// ============================================================
// COMPONENT: GameOver
// ============================================================

import { GameStats, AppliedUpgrades } from '../game/types';
import { upgradePickCounts } from '../game/upgrades';

interface Props {
  stats: GameStats;
  upgrades: AppliedUpgrades;
  isHighScore: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOver({ stats, upgrades, isHighScore, onRestart, onMenu }: Props) {
  const activeUpgrades: string[] = [];

  if (upgrades.fireBullets) activeUpgrades.push(`🔥 Огонь (стак ×${upgrades.fireStacks})`);
  if (upgrades.vampirism > 0) activeUpgrades.push(`🩸 Вампиризм (+${upgrades.vampirism} HP/убийство)`);
  if (upgrades.ricochet) activeUpgrades.push(`🎱 Рикошет (×${upgrades.ricochetCount} рикошета)`);
  if (upgrades.critChance > 0) activeUpgrades.push(`💀 Криты ${Math.round(upgrades.critChance * 100)}% (×${upgrades.critMultiplier.toFixed(2)})`);
  if (upgrades.explosiveBullets) activeUpgrades.push('💣 Взрывные пули');
  if (upgrades.doubleShot) activeUpgrades.push('✌️ Двойной выстрел');
  if (upgrades.piercingShots > 0) activeUpgrades.push(`🗡️ Пробой ×${upgrades.piercingShots}`);
  if (upgrades.armorPlating > 0) activeUpgrades.push(`🛡️ Броня (-${upgrades.armorPlating} урона)`);
  if (upgrades.damageBonus > 0) activeUpgrades.push(`💥 Урон ×${(1 + upgrades.damageBonus).toFixed(2)}`);
  if (upgrades.fireRateBonus > 0) activeUpgrades.push(`⚡ Скорость ×${(1 + upgrades.fireRateBonus).toFixed(2)}`);
  if (upgrades.speedBonus > 0) activeUpgrades.push(`👟 Скорость ×${(1 + upgrades.speedBonus).toFixed(2)}`);
  if (upgrades.magazineBonus > 0) activeUpgrades.push(`📦 Магазин ×${(1 + upgrades.magazineBonus).toFixed(2)}`);
  if (upgrades.adrenaline) activeUpgrades.push('💊 Адреналин');
  if (upgrades.reloadSpeedBonus > 0) activeUpgrades.push(`⏱️ Перезарядка -${Math.round(upgrades.reloadSpeedBonus * 100)}%`);

  // Подсчёт всего количества взятых перков
  const totalPickCount = Object.values(upgradePickCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 select-none overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900 opacity-15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-2xl text-center py-4">
        {/* Заголовок */}
        <div>
          <div className="text-6xl mb-3 animate-bounce">💀</div>
          <h2 className="text-white font-black text-4xl md:text-5xl mb-2" style={{ textShadow: '0 0 40px rgba(220,38,38,0.9)' }}>
            ВЫ ПОГИБЛИ
          </h2>
          {isHighScore && (
            <div className="text-yellow-400 font-bold text-lg animate-pulse">🏆 НОВЫЙ РЕКОРД!</div>
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {[
            { label: 'ВОЛНА', value: stats.wave, icon: '🌊', color: 'text-blue-400' },
            { label: 'ОЧКИ', value: stats.score.toLocaleString(), icon: '⭐', color: 'text-yellow-400' },
            { label: 'УБИЙСТВ', value: stats.totalKills, icon: '💀', color: 'text-red-400' },
            { label: 'НАНЕСЕНО', value: Math.round(stats.damageDealt).toLocaleString(), icon: '💥', color: 'text-orange-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`font-black text-xl ${stat.color}`}>{stat.value}</div>
              <div className="text-gray-500 text-xs font-mono">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Подробная статистика */}
        <div className="grid grid-cols-2 gap-3 w-full text-xs font-mono">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-left">
            <div className="text-gray-400 mb-1">🛡️ Получено урона</div>
            <div className="text-red-400 font-bold text-base">{Math.round(stats.damageTaken).toLocaleString()}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-left">
            <div className="text-gray-400 mb-1">⬆️ Всего перков</div>
            <div className="text-purple-400 font-bold text-base">{totalPickCount}</div>
          </div>
        </div>

        {/* Собранные улучшения */}
        {activeUpgrades.length > 0 && (
          <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left">
            <div className="text-gray-400 text-xs font-mono mb-3 uppercase tracking-wider">
              Собранные улучшения ({activeUpgrades.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {activeUpgrades.map((u, i) => (
                <span key={i} className="text-xs bg-white/10 rounded-lg px-2 py-1 text-gray-300 font-mono">{u}</span>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex gap-4 w-full">
          <button
            onClick={onMenu}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold text-white text-sm tracking-wider uppercase transition-all hover:scale-105 active:scale-95"
          >
            🏠 В МЕНЮ
          </button>
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-black text-white text-sm tracking-wider uppercase transition-all hover:scale-105 active:scale-95"
            style={{ boxShadow: '0 0 20px rgba(220,38,38,0.5)' }}
          >
            🔄 СНОВА В БОЙ
          </button>
        </div>
      </div>
    </div>
  );
}
