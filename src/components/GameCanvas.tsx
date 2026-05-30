// ============================================================
// COMPONENT: GameCanvas — основной игровой холст
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { WeaponDef } from '../game/types';
import {
  GameEngineState,
  createInitialState,
  updateGame,
  renderGame,
  advanceWave,
} from '../game/engine';
import { getRandomUpgrades } from '../game/upgrades';
import { UpgradeCard } from '../game/types';
import HUD from './HUD';

interface Props {
  weapon: WeaponDef;
  onDeath: (state: GameEngineState) => void;
  onUpgradeRequired: (upgrades: UpgradeCard[], state: GameEngineState) => void;
  pendingUpgrade: UpgradeCard | null;
  onUpgradeApplied: () => void;
  gameActive: boolean;
  stateRef: React.MutableRefObject<GameEngineState | null>;
}

export default function GameCanvas({
  weapon,
  onDeath,
  onUpgradeRequired,
  pendingUpgrade,
  onUpgradeApplied,
  gameActive,
  stateRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const localStateRef = useRef<GameEngineState | null>(null);
  const upgradePendingRef = useRef(false);

  // Sync external state
  useEffect(() => {
    if (stateRef.current) {
      localStateRef.current = stateRef.current;
    }
  });

  // Apply upgrade when received
  useEffect(() => {
    if (pendingUpgrade && localStateRef.current) {
      const s = localStateRef.current;
      const result = pendingUpgrade.apply(s.player.upgrades, s.player);
      const nextWaveState = advanceWave(s);
      localStateRef.current = {
        ...nextWaveState,
        player: { ...result.player, upgrades: result.upgrades },
      };
      stateRef.current = localStateRef.current;
      upgradePendingRef.current = false;
      onUpgradeApplied();
    }
  }, [pendingUpgrade]);

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const state = createInitialState(weapon, canvas.width, canvas.height);
    localStateRef.current = state;
    stateRef.current = state;
    upgradePendingRef.current = false;
  }, [weapon]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Key handlers
    const onKeyDown = (e: KeyboardEvent) => {
      if (localStateRef.current) {
        localStateRef.current = {
          ...localStateRef.current,
          keys: { ...localStateRef.current.keys, [e.code]: true },
        };
      }
      if (e.code === 'KeyR') {
        // handled in engine
      }
      e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (localStateRef.current) {
        localStateRef.current = {
          ...localStateRef.current,
          keys: { ...localStateRef.current.keys, [e.code]: false },
        };
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (localStateRef.current) {
        localStateRef.current = {
          ...localStateRef.current,
          mouseX: e.clientX - rect.left,
          mouseY: e.clientY - rect.top,
        };
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && localStateRef.current) {
        localStateRef.current = { ...localStateRef.current, mouseDown: true };
        // Single shot trigger
        if (!localStateRef.current.player.weapon.automatic) {
          localStateRef.current = { ...localStateRef.current, mouseDown: true };
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && localStateRef.current) {
        localStateRef.current = { ...localStateRef.current, mouseDown: false };
        // Reset lastShot for semi-auto to allow next click
        if (!localStateRef.current.player.weapon.automatic) {
          localStateRef.current = {
            ...localStateRef.current,
            player: { ...localStateRef.current.player, lastShot: 0 },
          };
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameActive) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (timestamp: number) => {
      if (!gameActive) return;

      const delta = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const s = localStateRef.current;
      if (!s || upgradePendingRef.current) {
        renderGame(ctx, s!, canvas.width, canvas.height);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const { state: newState, playerDied, waveComplete } = updateGame(s, delta, canvas.width, canvas.height);
      localStateRef.current = newState;
      stateRef.current = newState;

      renderGame(ctx, newState, canvas.width, canvas.height);

      if (playerDied) {
        cancelAnimationFrame(rafRef.current);
        onDeath(newState);
        return;
      }

      if (waveComplete && !upgradePendingRef.current) {
        upgradePendingRef.current = true;
        const cards = getRandomUpgrades(3, newState.wave);
        // Pause loop briefly for upgrade screen
        setTimeout(() => {
          onUpgradeRequired(cards, newState);
        }, 500);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, [gameActive, onDeath, onUpgradeRequired]);

  const s = localStateRef.current;
  const boss = s?.enemies.find((e) => e.type === 'boss');

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-none"
        style={{ imageRendering: 'pixelated' }}
      />
      {s && (
        <HUD
          player={s.player}
          stats={s.stats}
          wave={s.wave}
          waveState={s.waveState}
          bossActive={s.bossActive}
          bossHp={s.bossHp}
          bossMaxHp={s.bossMaxHp}
          boss={boss}
          enemiesLeft={s.enemies.length + s.spawnQueue}
        />
      )}
    </div>
  );
}
