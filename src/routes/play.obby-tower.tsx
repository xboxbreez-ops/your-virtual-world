import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import { buildTowerCourse } from "@/lib/obby";

export const Route = createFileRoute("/play/obby-tower")({
  head: () => ({
    meta: [
      { title: "Tower of Hell — BloxWorld" },
      { name: "description", content: "Climb to the top of the tower without falling. Classic obby challenge with checkpoints, lava, and moving platforms." },
    ],
  }),
  component: TowerObby,
});

const PLATFORMS = buildTowerCourse();

function TowerObby() {
  return (
    <ObbyGame
      game="obby-tower"
      title="Tower of Hell"
      platforms={PLATFORMS}
      spawn={[0, 2, 0]}
      bgFar="#1e1b4b"
      bgNear="#0f0a2c"
      baseReward={50}
      rewardPerSec={120}
    />
  );
}
