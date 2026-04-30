import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import { buildIceCourse } from "@/lib/obby";

export const Route = createFileRoute("/play/obby-ice")({
  head: () => ({
    meta: [
      { title: "Ice Slide Obby — BloxWorld" },
      { name: "description", content: "Drift across slippery ice plates and dodge falling icicles in this frozen 3D obby." },
    ],
  }),
  component: IceObby,
});

const PLATFORMS = buildIceCourse();

function IceObby() {
  return (
    <ObbyGame
      game="obby-ice"
      title="Ice Slide"
      platforms={PLATFORMS}
      spawn={[0, 2, 0]}
      bgFar="#0c4a6e"
      bgNear="#082f49"
      baseReward={45}
      rewardPerSec={110}
    />
  );
}
