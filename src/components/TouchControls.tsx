import { useEffect, useRef, useState, type RefObject } from "react";
import { ChevronUp, Zap, Eye } from "lucide-react";

type Input = {
  f: boolean; b: boolean; l: boolean; r: boolean;
  jump: boolean; action: boolean; sprint: boolean;
  lookDX: number; lookDY: number; pointerLocked: boolean; zoomOut: boolean;
};

/**
 * Mobile touch overlay: left thumb = virtual joystick (move),
 * right side swipe = camera look, plus on-screen jump / sprint / zoom buttons.
 *
 * Active only on coarse-pointer (touch) devices. Writes straight into the
 * shared inputRef so all games pick it up with no per-game changes.
 */
export function TouchControls({ inputRef }: { inputRef: RefObject<Input> }) {
  const [isTouch, setIsTouch] = useState(false);
  const [stickPos, setStickPos] = useState<{ x: number; y: number } | null>(null);
  const stickBaseRef = useRef<{ x: number; y: number } | null>(null);
  const stickIdRef = useRef<number | null>(null);
  const lookIdRef = useRef<number | null>(null);
  const lookLastRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsTouch(mq.matches || "ontouchstart" in window);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  if (!isTouch) return null;

  const setMove = (dx: number, dy: number) => {
    const inp = inputRef.current;
    if (!inp) return;
    const dz = 0.2;
    inp.l = dx < -dz;
    inp.r = dx > dz;
    inp.f = dy < -dz;
    inp.b = dy > dz;
  };
  const clearMove = () => {
    const inp = inputRef.current;
    if (!inp) return;
    inp.l = inp.r = inp.f = inp.b = false;
  };

  const onStickStart = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    stickIdRef.current = e.pointerId;
    stickBaseRef.current = { x: e.clientX, y: e.clientY };
    setStickPos({ x: 0, y: 0 });
  };
  const onStickMove = (e: React.PointerEvent) => {
    if (stickIdRef.current !== e.pointerId || !stickBaseRef.current) return;
    const max = 50;
    let dx = e.clientX - stickBaseRef.current.x;
    let dy = e.clientY - stickBaseRef.current.y;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    setStickPos({ x: dx, y: dy });
    setMove(dx / max, dy / max);
  };
  const onStickEnd = (e: React.PointerEvent) => {
    if (stickIdRef.current !== e.pointerId) return;
    stickIdRef.current = null;
    stickBaseRef.current = null;
    setStickPos(null);
    clearMove();
  };

  const onLookStart = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    lookIdRef.current = e.pointerId;
    lookLastRef.current = { x: e.clientX, y: e.clientY };
  };
  const onLookMove = (e: React.PointerEvent) => {
    if (lookIdRef.current !== e.pointerId || !lookLastRef.current) return;
    const dx = e.clientX - lookLastRef.current.x;
    const dy = e.clientY - lookLastRef.current.y;
    lookLastRef.current = { x: e.clientX, y: e.clientY };
    const inp = inputRef.current;
    if (!inp) return;
    inp.lookDX += dx * 0.006;
    inp.lookDY += dy * 0.006;
  };
  const onLookEnd = (e: React.PointerEvent) => {
    if (lookIdRef.current !== e.pointerId) return;
    lookIdRef.current = null;
    lookLastRef.current = null;
  };

  const setBtn = (key: "jump" | "sprint" | "action", v: boolean) => {
    const inp = inputRef.current;
    if (inp) inp[key] = v;
  };
  const toggleZoom = () => {
    const inp = inputRef.current;
    if (inp) inp.zoomOut = !inp.zoomOut;
  };

  return (
    <>
      {/* Right half = look swipe area */}
      <div
        className="absolute right-0 top-0 z-10 h-full w-1/2 touch-none"
        onPointerDown={onLookStart}
        onPointerMove={onLookMove}
        onPointerUp={onLookEnd}
        onPointerCancel={onLookEnd}
      />
      {/* Left thumb stick */}
      <div
        className="absolute bottom-6 left-6 z-20 grid h-36 w-36 touch-none place-items-center rounded-full border-2 border-white/30 bg-black/30 backdrop-blur"
        onPointerDown={onStickStart}
        onPointerMove={onStickMove}
        onPointerUp={onStickEnd}
        onPointerCancel={onStickEnd}
      >
        <div
          className="h-16 w-16 rounded-full border-2 border-white/60 bg-white/70 shadow-block transition-transform"
          style={{ transform: stickPos ? `translate(${stickPos.x}px, ${stickPos.y}px)` : "none" }}
        />
      </div>
      {/* Right buttons */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3 touch-none">
        <button
          onPointerDown={(e) => { e.preventDefault(); toggleZoom(); }}
          className="grid h-12 w-12 place-items-center rounded-full border-2 border-white/40 bg-black/40 text-white backdrop-blur"
          aria-label="Toggle camera"
        >
          <Eye className="h-5 w-5" />
        </button>
        <div className="flex items-end gap-3">
          <button
            onPointerDown={(e) => { e.preventDefault(); setBtn("sprint", true); }}
            onPointerUp={() => setBtn("sprint", false)}
            onPointerCancel={() => setBtn("sprint", false)}
            onPointerLeave={() => setBtn("sprint", false)}
            className="grid h-14 w-14 place-items-center rounded-full border-2 border-yellow-300/70 bg-yellow-400/30 text-white backdrop-blur active:scale-95"
            aria-label="Sprint"
          >
            <Zap className="h-6 w-6" />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); setBtn("jump", true); }}
            onPointerUp={() => setBtn("jump", false)}
            onPointerCancel={() => setBtn("jump", false)}
            onPointerLeave={() => setBtn("jump", false)}
            className="grid h-20 w-20 place-items-center rounded-full border-2 border-green-300/70 bg-green-500/40 text-white backdrop-blur active:scale-95"
            aria-label="Jump"
          >
            <ChevronUp className="h-8 w-8" />
          </button>
        </div>
      </div>
    </>
  );
}

/** Returns true if the current device looks like a touch device. */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsTouch(mq.matches || "ontouchstart" in window);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return isTouch;
}
