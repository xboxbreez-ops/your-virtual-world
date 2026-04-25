import { useSettings } from "@/lib/settings";
import { Slider } from "@/components/ui/slider";
import { Settings as SettingsIcon, X } from "lucide-react";
import { useState } from "react";

export function SettingsPanel({ floating = true }: { floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const [s, set] = useSettings();

  if (!floating) {
    return <Body s={s} set={set} />;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto absolute right-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/75"
        aria-label="Settings"
      >
        <SettingsIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-black/60 backdrop-blur-sm">
          <div className="w-[90%] max-w-sm rounded-2xl border border-border bg-card p-5 shadow-block">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-xl">Settings</h3>
              <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
            <Body s={s} set={set} />
          </div>
        </div>
      )}
    </>
  );
}

function Body({ s, set }: { s: ReturnType<typeof useSettings>[0]; set: ReturnType<typeof useSettings>[1] }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-semibold">Look sensitivity</span>
          <span className="font-mono text-muted-foreground">{s.sensitivity.toFixed(2)}×</span>
        </div>
        <Slider
          min={0.2}
          max={3}
          step={0.05}
          value={[s.sensitivity]}
          onValueChange={(v) => set({ sensitivity: v[0] })}
        />
        <p className="mt-1 text-xs text-muted-foreground">Affects mouse and right-stick.</p>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-semibold">Stick deadzone</span>
          <span className="font-mono text-muted-foreground">{s.padDeadzone.toFixed(2)}</span>
        </div>
        <Slider
          min={0.05}
          max={0.4}
          step={0.01}
          value={[s.padDeadzone]}
          onValueChange={(v) => set({ padDeadzone: v[0] })}
        />
      </div>

      <label className="flex items-center justify-between text-sm">
        <span className="font-semibold">Invert Y axis</span>
        <input
          type="checkbox"
          checked={s.invertY}
          onChange={(e) => set({ invertY: e.target.checked })}
          className="h-4 w-4 accent-primary"
        />
      </label>
    </div>
  );
}
