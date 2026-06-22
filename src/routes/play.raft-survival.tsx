import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import type { Platform } from "@/lib/obby";

export const Route = createFileRoute("/play/raft-survival")({
  head: () => ({
    meta: [
      { title: "Raft Survival — BloxWorld" },
      { name: "description", content: "Hop between drifting wooden rafts on the open ocean. Don't fall in the water." },
    ],
  }),
  component: RaftSurvival,
});

function buildRaftCourse(): Platform[] {
  const out: Platform[] = [];

  // Starting raft (big, safe)
  out.push({ pos: [0, 0, 0], size: [8, 0.4, 8], color: "#92400e" });
  out.push({ pos: [0, 0.4, 0], size: [3, 0.25, 3], color: "#22d3ee", checkpoint: true });
  // Mast
  out.push({ pos: [0, 1.8, -3.5], size: [0.4, 3.2, 0.4], color: "#78350f" });

  // Wave hazards (killer water strips between rafts)
  const water = (z: number) => out.push({
    pos: [0, -0.4, z], size: [60, 0.2, 3.2], color: "#0ea5e9",
    killer: true, moveY: { amp: 0.15, period: 1.8 },
  });

  // Chain of drifting rafts heading out to sea
  let z = -6;
  for (let i = 0; i < 12; i++) {
    water(z + 1.5);
    const side = i % 2 ? 1 : -1;
    out.push({
      pos: [side * (1 + (i % 3)), 0.1, z - 1.5],
      size: [3.4, 0.35, 3.4],
      color: i % 4 === 0 ? "#a16207" : "#92400e",
      moveX: { amp: 1.5 + (i % 3) * 0.5, period: 2.5 + (i % 4) * 0.4 },
      moveY: { amp: 0.25, period: 1.7 + (i % 3) * 0.2 },
    });
    if (i === 5) {
      out.push({ pos: [0, 0.5, z - 1.5], size: [3, 0.25, 3], color: "#22d3ee", checkpoint: true });
    }
    z -= 5;
  }

  // Shark zone — long water with floating barrels
  for (let i = 0; i < 8; i++) {
    water(z + 1.5 - i * 0.8);
  }
  for (let i = 0; i < 6; i++) {
    out.push({
      pos: [(i % 2 ? 2 : -2), 0.2, z - i * 2],
      size: [1.4, 0.4, 1.4],
      color: "#78350f",
      moveY: { amp: 0.3, period: 1.4 + i * 0.15 },
    });
  }
  z -= 14;

  // Island checkpoint
  out.push({ pos: [0, 0, z], size: [7, 0.5, 7], color: "#fde68a" });
  out.push({ pos: [0, 0.4, z], size: [3, 0.25, 3], color: "#22d3ee", checkpoint: true });
  out.push({ pos: [-1.5, 1.2, z - 1], size: [0.5, 2, 0.5], color: "#65a30d" });
  out.push({ pos: [-1.5, 2.4, z - 1], size: [1.8, 0.5, 1.8], color: "#16a34a" });
  z -= 6;

  // Final stretch — fast moving planks
  for (let i = 0; i < 6; i++) {
    water(z + 1 - i * 1.2);
    out.push({
      pos: [0, 0.1, z - i * 3.5],
      size: [2, 0.3, 2],
      color: "#92400e",
      moveX: { amp: 3.5, period: 1.8 + i * 0.1 },
    });
  }
  z -= 22;

  // Treasure island finish
  out.push({ pos: [0, 0, z], size: [8, 0.6, 8], color: "#fde047", finish: true });
  return out;
}

const PLATFORMS = buildRaftCourse();

function RaftSurvival() {
  return (
    <ObbyGame
      game="raft-survival"
      title="Raft Survival"
      platforms={PLATFORMS}
      spawn={[0, 1, 0]}
      bgFar="#0c4a6e"
      bgNear="#38bdf8"
      baseReward={100}
      rewardPerSec={200}
      preset="ice"
    />
  );
}
