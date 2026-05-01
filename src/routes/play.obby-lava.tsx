import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import { buildLavaCourse } from "@/lib/obby";

export const Route = createFileRoute("/play/obby-lava")({
  head: () => ({
    meta: [
      { title: "Lava Escape Obby — BloxWorld" },
      { name: "description", content: "Hop pulsing pistons and weave fire walls in this fiery 3D obby. Don't touch the lava." },
    ],
  }),
  component: LavaObby,
});

const PLATFORMS = buildLavaCourse();

function LavaObby() {
  return (
    <ObbyGame
      game="obby-lava"
      title="Lava Escape"
      platforms={PLATFORMS}
      spawn={[0, 2, 0]}
      bgFar="#7f1d1d"
      bgNear="#450a0a"
      baseReward={45}
      rewardPerSec={110}
      preset="lava"
    />
  );
}
