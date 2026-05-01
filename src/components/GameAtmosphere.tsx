import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/**
 * Lightweight atmosphere — gives each game a distinct mood with cheap lights only.
 * No HDR Environment maps (those caused WebGL context loss on weaker GPUs).
 */
export type AtmospherePreset =
  | "arena"
  | "garden"
  | "tycoon"
  | "obby"
  | "lava"
  | "ice"
  | "disaster";

const PRESETS: Record<AtmospherePreset, {
  hemiSky: string; hemiGround: string;
  sunColor: string; sunIntensity: number; sunPos: [number, number, number];
  rimColor: string; rimIntensity: number;
  ambient: number;
  contactOpacity: number; contactBlur: number;
  contactY?: number;
}> = {
  arena:    { hemiSky: "#3b82f6", hemiGround: "#1e1b4b", sunColor: "#ffffff", sunIntensity: 1.4, sunPos: [12, 24, 8],   rimColor: "#a855f7", rimIntensity: 0.8, ambient: 0.45, contactOpacity: 0.5,  contactBlur: 2.2, contactY: 0.02 },
  garden:   { hemiSky: "#bae6fd", hemiGround: "#365314", sunColor: "#fff4dd", sunIntensity: 1.6, sunPos: [25, 35, 15],  rimColor: "#fde047", rimIntensity: 0.4, ambient: 0.65, contactOpacity: 0.4,  contactBlur: 2.5, contactY: 0.02 },
  tycoon:   { hemiSky: "#fef08a", hemiGround: "#7c2d12", sunColor: "#ffffff", sunIntensity: 1.3, sunPos: [10, 30, 10],  rimColor: "#f472b6", rimIntensity: 0.7, ambient: 0.7,  contactOpacity: 0.45, contactBlur: 2.0, contactY: 0.02 },
  obby:     { hemiSky: "#7dd3fc", hemiGround: "#312e81", sunColor: "#ffffff", sunIntensity: 1.4, sunPos: [20, 35, 18],  rimColor: "#22d3ee", rimIntensity: 0.5, ambient: 0.65, contactOpacity: 0.35, contactBlur: 2.0 },
  lava:     { hemiSky: "#7f1d1d", hemiGround: "#1c1917", sunColor: "#fb923c", sunIntensity: 1.2, sunPos: [10, 18, -8],  rimColor: "#f59e0b", rimIntensity: 1.0, ambient: 0.4,  contactOpacity: 0.6,  contactBlur: 1.6 },
  ice:      { hemiSky: "#bae6fd", hemiGround: "#0c4a6e", sunColor: "#e0f2fe", sunIntensity: 1.3, sunPos: [18, 30, 12],  rimColor: "#67e8f9", rimIntensity: 0.6, ambient: 0.7,  contactOpacity: 0.3,  contactBlur: 2.5 },
  disaster: { hemiSky: "#475569", hemiGround: "#1e293b", sunColor: "#fef3c7", sunIntensity: 1.0, sunPos: [20, 30, 10],  rimColor: "#0ea5e9", rimIntensity: 0.5, ambient: 0.55, contactOpacity: 0.55, contactBlur: 2.0 },
};

export function GameAtmosphere({
  preset,
  contactPos = [0, 0, 0],
  contactScale = 60,
}: {
  preset: AtmospherePreset;
  contactPos?: [number, number, number];
  contactScale?: number;
}) {
  const p = PRESETS[preset];
  return (
    <>
      <ambientLight intensity={p.ambient} />
      <hemisphereLight args={[new THREE.Color(p.hemiSky), new THREE.Color(p.hemiGround), 0.65]} />
      <directionalLight
        position={p.sunPos}
        intensity={p.sunIntensity}
        color={p.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-p.sunPos[0], 12, -p.sunPos[2]]} intensity={p.rimIntensity} color={p.rimColor} />
      <ContactShadows
        position={[contactPos[0], (p.contactY ?? contactPos[1]) + 0.01, contactPos[2]]}
        opacity={p.contactOpacity}
        blur={p.contactBlur}
        scale={contactScale}
        far={20}
        resolution={512}
        color="#000000"
      />
    </>
  );
}
