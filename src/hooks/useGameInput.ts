import { useEffect, useRef, useState } from "react";
import { getSettings } from "@/lib/settings";

export type GameInput = {
  f: boolean; b: boolean; l: boolean; r: boolean;
  jump: boolean; action: boolean; sprint: boolean;
  // Per-frame deltas (consumed by camera each frame, then reset)
  lookDX: number; lookDY: number;
  // Mouse pointer-lock state
  pointerLocked: boolean;
};

export function useGameInput(canvasContainer: React.RefObject<HTMLDivElement | null>) {
  const inputRef = useRef<GameInput>({
    f: false, b: false, l: false, r: false,
    jump: false, action: false, sprint: false,
    lookDX: 0, lookDY: 0, pointerLocked: false,
  });
  const [usingPad, setUsingPad] = useState(false);
  const [locked, setLocked] = useState(false);

  // Keyboard
  useEffect(() => {
    const set = (e: KeyboardEvent, v: boolean) => {
      const r = inputRef.current;
      switch (e.code) {
        case "KeyW": case "ArrowUp": r.f = v; break;
        case "KeyS": case "ArrowDown": r.b = v; break;
        case "KeyA": case "ArrowLeft": r.l = v; break;
        case "KeyD": case "ArrowRight": r.r = v; break;
        case "Space": r.jump = v; if (v) e.preventDefault(); break;
        case "ShiftLeft": case "ShiftRight": r.sprint = v; break;
        case "KeyE": case "Mouse0": r.action = v; break;
      }
    };
    const dn = (e: KeyboardEvent) => set(e, true);
    const up = (e: KeyboardEvent) => set(e, false);
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  // Mouse + Pointer Lock
  useEffect(() => {
    const el = canvasContainer.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      const s = getSettings();
      inputRef.current.lookDX += e.movementX * 0.0025 * s.sensitivity;
      inputRef.current.lookDY += e.movementY * 0.0025 * s.sensitivity * (s.invertY ? -1 : 1);
    };
    const onClick = () => { if (!document.pointerLockElement) el.requestPointerLock?.(); };
    const onLockChange = () => {
      const isLocked = document.pointerLockElement === el;
      setLocked(isLocked);
      inputRef.current.pointerLocked = isLocked;
    };
    const onMouseDown = (e: MouseEvent) => { if (e.button === 0) inputRef.current.action = true; };
    const onMouseUp = (e: MouseEvent) => { if (e.button === 0) inputRef.current.action = false; };
    el.addEventListener("click", onClick);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("pointerlockchange", onLockChange);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("click", onClick);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [canvasContainer]);

  // Gamepad polling — feeds movement + right-stick look deltas
  useEffect(() => {
    let raf = 0;
    const poll = () => {
      const pads = navigator.getGamepads?.() ?? [];
      const gp = pads.find((p) => !!p);
      if (gp) {
        if (!usingPad) setUsingPad(true);
        const s = getSettings();
        const dz = s.padDeadzone;
        const r = inputRef.current;
        const ax = (v: number) => (Math.abs(v) > dz ? v : 0);
        const lx = ax(gp.axes[0] ?? 0);
        const ly = ax(gp.axes[1] ?? 0);
        r.f = ly < -0.2; r.b = ly > 0.2;
        r.l = lx < -0.2; r.r = lx > 0.2;
        r.jump = !!gp.buttons[0]?.pressed; // A
        r.action = !!gp.buttons[7]?.pressed || !!gp.buttons[5]?.pressed; // RT or RB
        r.sprint = !!gp.buttons[10]?.pressed; // L3
        const rx = ax(gp.axes[2] ?? 0);
        const ry = ax(gp.axes[3] ?? 0);
        // Right stick adds delta per frame (~16ms). Multiplier mimics mouse feel.
        r.lookDX += rx * 0.06 * s.sensitivity;
        r.lookDY += ry * 0.06 * s.sensitivity * (s.invertY ? -1 : 1);
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
  }, [usingPad]);

  return { input: inputRef, usingPad, locked };
}
