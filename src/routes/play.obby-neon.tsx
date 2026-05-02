import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import { buildNeonCourse } from "@/lib/obby";

export const Route = createFileRoute("/play/obby-neon")({
  head: () => ({
    meta: [
      { title: "Neon Rush Obby — BloxWorld" },
      { name: "description", content: "Pulsing pads, rotating bridges, and laser walls in a glowing cyber tower." },
    ],
  }),
  component: NeonObby,
});

const PLATFORMS = buildNeonCourse();

function NeonObby() {
  return (
    <ObbyGame
      game="obby-neon"
      title="Neon Rush"
      platforms={PLATFORMS}
      spawn={[0, 2, 0]}
      bgFar="#1e1b4b"
      bgNear="#0a0a1a"
      baseReward={55}
      rewardPerSec={130}
      preset="obby"
    />
  );
}
