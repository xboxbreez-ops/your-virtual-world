import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import { buildJungleCourse } from "@/lib/obby";

export const Route = createFileRoute("/play/obby-jungle")({
  head: () => ({
    meta: [
      { title: "Jungle Run Obby — BloxWorld" },
      { name: "description", content: "Hop logs, swing past vines, and avoid the poison swamp in a deep jungle." },
    ],
  }),
  component: JungleObby,
});

const PLATFORMS = buildJungleCourse();

function JungleObby() {
  return (
    <ObbyGame
      game="obby-jungle"
      title="Jungle Run"
      platforms={PLATFORMS}
      spawn={[0, 2, 0]}
      bgFar="#14532d"
      bgNear="#052e16"
      baseReward={50}
      rewardPerSec={120}
      preset="garden"
    />
  );
}
