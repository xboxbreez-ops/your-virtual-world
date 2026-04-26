import * as THREE from "three";

/**
 * Position the active camera either in first-person (at the player's eyes) or in
 * third-person behind the player (when the user has toggled zoom-out via the
 * V key or the right-stick click on a gamepad).
 *
 * The third-person camera orbits behind the player along the current yaw/pitch
 * so right-stick look still rotates the view naturally.
 */
export function applyPlayerCamera(
  camera: THREE.Camera,
  pos: THREE.Vector3,
  yaw: number,
  pitch: number,
  zoomOut: boolean,
  options: { eyeHeight?: number; distance?: number } = {},
) {
  const eyeHeight = options.eyeHeight ?? 1.6;
  const distance = options.distance ?? 5.5;
  const eye = new THREE.Vector3(pos.x, pos.y + eyeHeight, pos.z);

  if (!zoomOut) {
    camera.position.copy(eye);
    camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
    return;
  }

  // Vector pointing forward from the player's view (matches the input convention used in games)
  const forward = new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  );
  // Camera sits behind the player + slightly above
  const cam = eye.clone().sub(forward.clone().multiplyScalar(distance));
  cam.y += 1.2;
  camera.position.copy(cam);
  camera.lookAt(eye);
}
