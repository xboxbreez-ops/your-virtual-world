import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import { buildSpeedCourse } from "@/lib/obby";

export const Route = createFileRoute("/play/obby-speed")({
  head: () => ({
    meta: [
      { title: "Speed Run Obby — BloxWorld" },
      { name: "description", content: "Sprint, jump, and dodge lava. Race the clock through a long obstacle course of moving platforms and gaps." },
    ],
  }),
  component: SpeedObby,
});

const PLATFORMS = buildSpeedCourse();

function SpeedObby() {
  return (
    <ObbyGame
      game="obby-speed"
      title="Speed Run"
      platforms={PLATFORMS}
      spawn={[0, 2, 0]}
      bgFar="#0c4a6e"
      bgNear="#082f49"
      baseReward={40}
      rewardPerSec={100}
      preset="obby"
    />
  );
}
