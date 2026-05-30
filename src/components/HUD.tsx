// ============================================================
// COMPONENT: HUD — игровой интерфейс
// ============================================================

import { Player, GameStats } from '../game/types';
import { getEnemyLabel } from '../game/waveSystem';
import { Enemy } from '../game/types';

interface Props {
  player: Player;
  stats: GameStats;
  wave: number;
  waveState: string;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  boss?: Enemy;
  enemiesLeft: number;
}

function HPBar({ current, max, label }: { current: number; max: number; label?: string }) {
  const pct = Math.max(0, current / max);
  const color = pct > 0.6 ? '#2ECC71' : pct > 0.3 ? '#F39C12' : '#E74C3C';
  return (
    <div>
      {label && <div className="text-xs text-gray-400 font-mono mb-0.5">{label}</div>}
      <div className="h-3 bg-black/50 rounded-full border border-white/10 overflow-hidden w-full">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{ width: `${pct * 100}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      <div className="text-xs font-mono mt-0.5" style={{ color }}>
        {Math.ceil(current)} / {max}
      </div>
    </div>
  );
}

function AmmoBar({ current, max, isReloading, progress }: { current: number; max: number; isReloading: boolean; progress: number }) {
  if (isReloading) {
    return (
      <div>
        <div className="text-xs text-yellow-400 font-mono mb-0.5 animate-pulse">🔄 ПЕРЕЗАРЯДКА...</div>
        <div className="h-3 bg-black/50 rounded-full border border-yellow-500/30 overflow-hidden w-full">
          <div className="h-full rounded-full bg-yellow-500 transition-all duration-100"
            style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-xs text-gray-400 font-mono mb-0.5">
        🔫 {current} / {max}
      </div>
      <div className="flex gap-0.5 flex-wrap">
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} className={`h-2 flex-1 min-w-[4px] max-w-[14px] rounded-sm transition-colors ${i < current ? 'bg-yellow-400' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
}

export default function HUD({ player, stats, wave, waveState, bossActive, bossHp, bossMaxHp, boss, enemiesLeft }: Props) {
  const upgrades = player.upgrades;
  const activeBuffs = [
    upgrades.fireBullets && { icon: '🔥', label: 'Огонь' },
    upgrades.vampirism > 0 && { icon: '🩸', label: `+${upgrades.vampirism}HP` },
    upgrades.ricochet && { icon: '🎱', label: `×${upgrades.ricochetCount}` },
    upgrades.critChance > 0 && { icon: '💀', label: `${Math.round(upgrades.critChance * 100)}%крит` },
    upgrades.explosiveBullets && { icon: '💣', label: 'Взрыв' },
    upgrades.doubleShot && { icon: '✌️', label: 'х2' },
    upgrades.piercingShots > 0 && { icon: '🗡️', label: `пробой×${upgrades.piercingShots}` },
    upgrades.armorPlating > 0 && { icon: '🛡️', label: `-${upgrades.armorPlating}` },
    upgrades.adrenaline && { icon: '💊', label: 'Адреналин' },
  ].filter(Boolean) as { icon: string; label: string }[];

  const isLowHp = player.hp / player.maxHp < 0.3;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
      {/* Top-left: Player stats */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none"
        style={{ width: '200px' }}>
        <div className={`bg-black/70 border rounded-xl p-3 backdrop-blur-sm ${isLowHp ? 'border-red-500/70 shadow-lg shadow-red-900/50' : 'border-white/10'}`}>
          <HPBar current={player.hp} max={player.maxHp} label="❤️ Здоровье" />
          <div className="mt-2">
            <AmmoBar
              current={player.ammo}
              max={Math.round(player.weapon.magazineSize * (1 + upgrades.magazineBonus))}
              isReloading={player.isReloading}
              progress={player.reloadProgress}
            />
          </div>
          <div className="text-xs text-gray-500 font-mono mt-2 border-t border-white/5 pt-2">
            {player.weapon.name.toUpperCase()} · {player.weapon.automatic ? 'AUTO' : 'SEMI'}
          </div>
        </div>

        {/* Active buffs */}
        {activeBuffs.length > 0 && (
          <div className="bg-black/60 border border-white/10 rounded-xl p-2 backdrop-blur-sm">
            <div className="text-gray-500 text-xs font-mono mb-1.5">АКТИВНЫЕ БОНУСЫ:</div>
            <div className="flex flex-wrap gap-1">
              {activeBuffs.map((buff, i) => (
                <div key={i} className="flex items-center gap-1 bg-white/10 rounded-lg px-1.5 py-0.5 text-xs">
                  <span>{buff.icon}</span>
                  <span className="text-gray-300">{buff.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top-center: Wave info */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="bg-black/70 border border-white/10 rounded-xl px-6 py-2 backdrop-blur-sm text-center">
          <div className="text-red-400 text-xs font-mono tracking-widest uppercase">
            {waveState === 'spawning' ? '⚡ ВОЛНА НАЧИНАЕТСЯ' : waveState === 'fighting' ? '⚔️ БОЙ' : '✅ ВОЛНА ЗАВЕРШЕНА'}
          </div>
          <div className="text-white font-black text-2xl leading-none"
            style={{ textShadow: '0 0 20px rgba(220,38,38,0.8)' }}>
            ВОЛНА {wave}
          </div>
          {enemiesLeft > 0 && (
            <div className="text-gray-400 text-xs font-mono">Врагов: {enemiesLeft}</div>
          )}
        </div>

        {/* Wave milestones */}
        <div className="flex gap-1">
          {[5, 10, 15, 20].map((milestone) => (
            <div key={milestone}
              className={`text-xs px-2 py-0.5 rounded font-mono ${wave >= milestone ? 'bg-red-900/80 text-red-300 border border-red-700' : 'bg-black/50 text-gray-600 border border-white/5'}`}>
              {milestone % 10 === 0 ? `💀${milestone}` : `⚡${milestone}`}
            </div>
          ))}
        </div>
      </div>

      {/* Top-right: Score */}
      <div className="absolute top-3 right-3">
        <div className="bg-black/70 border border-white/10 rounded-xl p-3 backdrop-blur-sm text-right">
          <div className="text-yellow-400 font-black text-xl">{stats.score.toLocaleString()}</div>
          <div className="text-gray-500 text-xs font-mono">ОЧКИ</div>
          <div className="text-gray-400 text-xs font-mono mt-1">💀 {stats.totalKills} убийств</div>
        </div>
      </div>

      {/* Boss HP Bar */}
      {bossActive && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
          <div className="bg-black/80 border border-red-800 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 font-black text-sm tracking-wider animate-pulse">
                ☠️ {boss ? getEnemyLabel(boss) : 'БОСС'}
              </span>
              <span className="text-red-300 font-mono text-sm">{Math.ceil(bossHp)} / {bossMaxHp}</span>
            </div>
            <div className="h-4 bg-black/50 rounded-full border border-red-900 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${(bossHp / bossMaxHp) * 100}%`,
                  background: 'linear-gradient(90deg, #7F1D1D, #DC2626, #FF0040)',
                  boxShadow: '0 0 15px rgba(220,38,38,0.8)',
                }}
              />
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-500 font-mono justify-center">
              <span>⚡ Фаза: {boss?.phase ?? 1}</span>
              <span>·</span>
              <span>🎯 Паттерн: {boss?.bossPattern ?? '???'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Low HP warning */}
      {isLowHp && (
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(220,38,38,0.15) 100%)',
            animation: 'pulse 1s ease-in-out infinite',
          }}
        />
      )}

      {/* Controls reminder */}
      <div className="absolute bottom-3 right-3 text-gray-600 text-xs font-mono text-right">
        WASD — движение · ЛКМ — огонь · R — перезарядка
      </div>
    </div>
  );
}
