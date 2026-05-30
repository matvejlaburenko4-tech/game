// ============================================================
// APP: Standoff 2 Wave Survival — Upgraded Edition
// ============================================================

import { useState, useCallback, useRef } from 'react';
import MainMenu from './components/MainMenu';
import WeaponSelect from './components/WeaponSelect';
import GameCanvas from './components/GameCanvas';
import UpgradeScreen from './components/UpgradeScreen';
import GameOver from './components/GameOver';
import { WeaponDef, UpgradeCard } from './game/types';
import { GameEngineState } from './game/engine';

type Screen = 'menu' | 'weapon-select' | 'playing' | 'upgrade' | 'game-over';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponDef | null>(null);
  const [pendingUpgrades, setPendingUpgrades] = useState<UpgradeCard[]>([]);
  const [pendingUpgrade, setPendingUpgrade] = useState<UpgradeCard | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [deadState, setDeadState] = useState<GameEngineState | null>(null);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('s2u_highscore') ?? '0'));
  const [allTimeKills, setAllTimeKills] = useState(() => parseInt(localStorage.getItem('s2u_kills') ?? '0'));

  const stateRef = useRef<GameEngineState | null>(null);

  // ── Навигация ────────────────────────────────────────────
  const goToMenu = useCallback(() => {
    setGameActive(false);
    setScreen('menu');
    setPendingUpgrades([]);
    setPendingUpgrade(null);
  }, []);

  const goToWeaponSelect = useCallback(() => {
    setScreen('weapon-select');
  }, []);

  const startGame = useCallback((weapon: WeaponDef) => {
    setSelectedWeapon(weapon);
    setPendingUpgrades([]);
    setPendingUpgrade(null);
    setDeadState(null);
    setGameActive(true);
    setScreen('playing');
  }, []);

  const handleRestart = useCallback(() => {
    if (!selectedWeapon) return;
    startGame(selectedWeapon);
  }, [selectedWeapon, startGame]);

  // ── Игровые события ──────────────────────────────────────
  const handleDeath = useCallback((finalState: GameEngineState) => {
    setGameActive(false);
    setDeadState(finalState);

    const score = finalState.stats.score;
    const kills = finalState.stats.totalKills;

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('s2u_highscore', String(score));
    }
    const newTotalKills = allTimeKills + kills;
    setAllTimeKills(newTotalKills);
    localStorage.setItem('s2u_kills', String(newTotalKills));

    setScreen('game-over');
  }, [highScore, allTimeKills]);

  const handleUpgradeRequired = useCallback((cards: UpgradeCard[], _state: GameEngineState) => {
    setGameActive(false);
    setPendingUpgrades(cards);
    setScreen('upgrade');
  }, []);

  const handleUpgradeSelected = useCallback((upgrade: UpgradeCard) => {
    setPendingUpgrade(upgrade);
    setPendingUpgrades([]);
    setScreen('playing');
    setTimeout(() => setGameActive(true), 50);
  }, []);

  const handleUpgradeApplied = useCallback(() => {
    setPendingUpgrade(null);
  }, []);

  const currentWave = stateRef.current?.wave ?? 1;
  const currentScore = stateRef.current?.stats.score ?? 0;

  return (
    <div className="relative w-screen h-screen bg-[#070B14] overflow-hidden">
      {/* Сканлайны */}
      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }}
      />

      {/* ── ГЛАВНОЕ МЕНЮ ──────────────────────────────────── */}
      {screen === 'menu' && (
        <MainMenu
          onStart={goToWeaponSelect}
          highScore={highScore}
          totalKills={allTimeKills}
        />
      )}

      {/* ── ВЫБОР ОРУЖИЯ ──────────────────────────────────── */}
      {screen === 'weapon-select' && (
        <WeaponSelect onSelect={startGame} onBack={goToMenu} />
      )}

      {/* ── ИГРОВОЙ ХОЛСТ ─────────────────────────────────── */}
      {selectedWeapon && (screen === 'playing' || screen === 'upgrade') && (
        <GameCanvas
          weapon={selectedWeapon}
          onDeath={handleDeath}
          onUpgradeRequired={handleUpgradeRequired}
          pendingUpgrade={pendingUpgrade}
          onUpgradeApplied={handleUpgradeApplied}
          gameActive={gameActive}
          stateRef={stateRef}
        />
      )}

      {/* ── ЭКРАН УЛУЧШЕНИЙ ───────────────────────────────── */}
      {screen === 'upgrade' && pendingUpgrades.length > 0 && (
        <UpgradeScreen
          upgrades={pendingUpgrades}
          onSelect={handleUpgradeSelected}
          wave={currentWave}
          score={currentScore}
        />
      )}

      {/* ── ЭКРАН СМЕРТИ ──────────────────────────────────── */}
      {screen === 'game-over' && deadState && (
        <GameOver
          stats={deadState.stats}
          upgrades={deadState.player.upgrades}
          isHighScore={deadState.stats.score >= highScore}
          onRestart={handleRestart}
          onMenu={goToMenu}
        />
      )}
    </div>
  );
}
