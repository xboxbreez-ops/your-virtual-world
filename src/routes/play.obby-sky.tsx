import { createFileRoute } from "@tanstack/react-router";
import { ObbyGame } from "@/components/ObbyGame";
import { buildSkyCourse } from "@/lib/obby";

export const Route = createFileRoute("/play/obby-sky")({
  head: () => ({
    meta: [
      { title: "Sky Islands Obby — BloxWorld" },
      { name: "description", content: "Drift between floating islands high above the clouds. One slip and you're falling." },
    ],
  }),
  component: SkyObby,
});

const PLATFORMS = buildSkyCourse();

function SkyObby() {
  return (
    <ObbyGame
      game="obby-sky"
      title="Sky Islands"
      platforms={PLATFORMS}
      spawn={[0, 2, 0]}
      bgFar="#7dd3fc"
      bgNear="#bae6fd"
      baseReward={60}
      rewardPerSec={140}
      preset="obby"
    />
  );
}
