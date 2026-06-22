import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import type { Platform } from "@/lib/obby";

export const Route = createFileRoute("/play/slap-tower")({
  head: () => ({
    meta: [
      { title: "Slap Tower — BloxWorld" },
      { name: "description", content: "Climb a tower of spinning platforms with giant slap pads that fling you sideways." },
    ],
  }),
  component: SlapTower,
});

function buildSlapTower(): Platform[] {
  const out: Platform[] = [];
  // Base
  out.push({ pos: [0, 0, 0], size: [12, 0.6, 12], color: "#7c3aed" });
  out.push({ pos: [0, 0.5, 0], size: [3, 0.3, 3], color: "#22d3ee", checkpoint: true });

  // Rotating ring platforms (treated as moving via X/Z to feel like a spin)
  let y = 1.5;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = 4 + (i % 3);
    out.push({
      pos: [Math.cos(a) * r, y + i * 1.2, Math.sin(a) * r],
      size: [2.6, 0.35, 2.6],
      color: i % 4 === 0 ? "#ec4899" : "#a855f7",
      moveX: { amp: 1.4, period: 2 + (i % 3) },
    });
    // "Slap pad" — pulsing red pad to dodge
    if (i % 3 === 1) {
      out.push({
        pos: [Math.cos(a + 0.4) * (r + 1), y + i * 1.2 - 0.1, Math.sin(a + 0.4) * (r + 1)],
        size: [1.6, 0.4, 1.6],
        color: "#ef4444",
        killer: true,
        moveY: { amp: 0.4, period: 1.5 },
      });
    }
  }

  y += 16 * 1.2 + 1;
  out.push({ pos: [0, y, 0], size: [6, 0.4, 6], color: "#22d3ee", checkpoint: true });

  // Mid section — moving cross bridges with side slap walls
  for (let i = 0; i < 6; i++) {
    out.push({
      pos: [0, y + 1.5 + i * 2, -4 - i * 4],
      size: [3, 0.3, 3],
      color: "#fafafa",
      moveX: { amp: 3, period: 2.5 + i * 0.2 },
    });
    out.push({
      pos: [4, y + 1.5 + i * 2, -4 - i * 4],
      size: [1, 1.2, 1],
      color: "#ef4444",
      killer: true,
      moveX: { amp: 2.5, period: 1.8 + i * 0.15 },
    });
    out.push({
      pos: [-4, y + 1.5 + i * 2, -4 - i * 4],
      size: [1, 1.2, 1],
      color: "#ef4444",
      killer: true,
      moveX: { amp: 2.5, period: 1.8 + i * 0.15 },
    });
  }

  // Final podium
  const fy = y + 1.5 + 6 * 2 + 2;
  const fz = -4 - 6 * 4 - 4;
  out.push({ pos: [0, fy, fz], size: [6, 0.5, 6], color: "#fde047", finish: true });
  return out;
}

const PLATFORMS = buildSlapTower();

function SlapTower() {
  return (
    <ObbyGame
      game="slap-tower"
      title="Slap Tower"
      platforms={PLATFORMS}
      spawn={[0, 1, 0]}
      bgFar="#1e1b4b"
      bgNear="#7c3aed"
      baseReward={80}
      rewardPerSec={180}
      preset="arena"
    />
  );
}
