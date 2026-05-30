// ============================================================
// APP: Standoff 2 — Wave Survival Edition
// Browser Prototype — React + Canvas
// ============================================================

import { useState, useRef, useCallback } from 'react';
import { GameState, WeaponDef } from './game/types';
import { UpgradeCard } from './game/types';
import { GameEngineState } from './game/engine';
import MainMenu from './components/MainMenu';
import WeaponSelect from './components/WeaponSelect';
import GameCanvas from './components/GameCanvas';
import UpgradeScreen from './components/UpgradeScreen';
import GameOver from './components/GameOver';

export default function App() {
  const [screen, setScreen] = useState<GameState>('menu');
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponDef | null>(null);
  const [pendingUpgrades, setPendingUpgrades] = useState<UpgradeCard[]>([]);
  const [pendingUpgrade, setPendingUpgrade] = useState<UpgradeCard | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [deadState, setDeadState] = useState<GameEngineState | null>(null);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('s2_highscore') ?? '0'));
  const [allTimeKills, setAllTimeKills] = useState(() => parseInt(localStorage.getItem('s2_kills') ?? '0'));

  const stateRef = useRef<GameEngineState | null>(null);

  // ── Navigation ─────────────────────────────────────────────
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

  // ── Game Events ────────────────────────────────────────────
  const handleDeath = useCallback((finalState: GameEngineState) => {
    setGameActive(false);
    setDeadState(finalState);

    const score = finalState.stats.score;
    const kills = finalState.stats.totalKills;

    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('s2_highscore', String(score));
    }
    const newTotalKills = allTimeKills + kills;
    setAllTimeKills(newTotalKills);
    localStorage.setItem('s2_kills', String(newTotalKills));

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
    // Small delay before resuming to let state settle
    setTimeout(() => setGameActive(true), 50);
  }, []);

  const handleUpgradeApplied = useCallback(() => {
    setPendingUpgrade(null);
  }, []);

  // ── Current wave/score for upgrade screen header ─────────
  const currentWave = stateRef.current?.wave ?? 1;
  const currentScore = stateRef.current?.stats.score ?? 0;

  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: '#070B14', fontFamily: "'Courier New', monospace" }}
    >
      {/* Global decorative scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-50"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }}
      />

      {/* ── MAIN MENU ──────────────────────────────────── */}
      {screen === 'menu' && (
        <MainMenu
          onStart={goToWeaponSelect}
          highScore={highScore}
          totalKills={allTimeKills}
        />
      )}

      {/* ── WEAPON SELECT ──────────────────────────────── */}
      {screen === 'weapon-select' && (
        <WeaponSelect
          onSelect={startGame}
          onBack={goToMenu}
        />
      )}

      {/* ── GAME CANVAS (always mounted when weapon selected, hidden on other screens) ── */}
      {selectedWeapon && (screen === 'playing' || screen === 'upgrade') && (
        <div className={`absolute inset-0 ${screen === 'upgrade' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          <GameCanvas
            weapon={selectedWeapon}
            onDeath={handleDeath}
            onUpgradeRequired={handleUpgradeRequired}
            pendingUpgrade={pendingUpgrade}
            onUpgradeApplied={handleUpgradeApplied}
            gameActive={gameActive}
            stateRef={stateRef}
          />
        </div>
      )}

      {/* ── UPGRADE SCREEN ─────────────────────────────── */}
      {screen === 'upgrade' && pendingUpgrades.length > 0 && (
        <div className="absolute inset-0 z-30">
          <UpgradeScreen
            upgrades={pendingUpgrades}
            wave={currentWave}
            score={currentScore}
            onSelect={handleUpgradeSelected}
          />
        </div>
      )}

      {/* ── GAME OVER ──────────────────────────────────── */}
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
