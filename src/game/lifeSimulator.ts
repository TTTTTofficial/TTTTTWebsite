// TTTTT Life Simulator: sit in a basement and wait for a Dota 2 match that never starts.
import * as THREE from "three";
import { BasementAudio } from "./audio.ts";
import { EYE_HEIGHT, SEAT, buildBasement } from "./basement.ts";
import { QueueGame, type QueueTiming } from "./queue.ts";
import { SCREEN_H, SCREEN_W, drawScreen } from "./screen.ts";

export interface LifeSimulator {
  enterVR(): Promise<void>;
  setMuted(muted: boolean): void;
  dispose(): void;
}

export async function isVRSupported(): Promise<boolean> {
  if (!navigator.xr) return false;
  return navigator.xr.isSessionSupported("immersive-vr").catch(() => false);
}

const GLOW = {
  queue: { color: 0x9fb2ff, intensity: 1.2 },
  ready: { color: 0x5dff6a, intensity: 2.2 },
  failed: { color: 0xff3b2e, intensity: 1.6 },
} as const;

const DRAG_THRESHOLD = 5;
const SCREEN_FPS = 20;

export function startLifeSimulator(container: HTMLElement, timing: QueueTiming): LifeSimulator {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = SCREEN_W;
  screenCanvas.height = SCREEN_H;
  const screenCtx = screenCanvas.getContext("2d")!;
  const basement = buildBasement(scene, screenCanvas);

  // The rig is the chair. In VR the headset pose is applied relative to it.
  const rig = new THREE.Group();
  rig.position.copy(SEAT);
  scene.add(rig);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 30);
  rig.add(camera);

  const audio = new BasementAudio();
  const game = new QueueGame(timing, performance.now() / 1000);

  const accept = () => {
    if (game.accept()) audio.click();
  };

  // --- Desktop look controls: drag to look, click to accept -----------------
  let yaw = 0;
  let pitch = -0.08;
  let drag: { x: number; y: number; moved: boolean } | null = null;

  const onPointerDown = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY, moved: false };
    renderer.domElement.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    yaw = THREE.MathUtils.clamp(yaw - dx * 0.004, -1.9, 1.9);
    pitch = THREE.MathUtils.clamp(pitch - dy * 0.004, -1.1, 1.1);
    drag.x = e.clientX;
    drag.y = e.clientY;
  };
  const onPointerUp = () => {
    if (drag && !drag.moved) accept();
    drag = null;
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      accept();
    }
  };
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  container.addEventListener("keydown", onKeyDown);

  // --- VR controllers: pull the trigger to accept ---------------------------
  const rayGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
  const rayMat = new THREE.LineBasicMaterial({ color: 0x777777, transparent: true, opacity: 0.4 });
  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    controller.addEventListener("select", accept);
    controller.add(new THREE.Line(rayGeo, rayMat));
    rig.add(controller);
  }

  // --- Resize --------------------------------------------------------------
  const resize = () => {
    if (renderer.xr.isPresenting) return;
    const { clientWidth: w, clientHeight: h } = container;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  // --- Loop ----------------------------------------------------------------
  let last = performance.now() / 1000;
  let lastScreenDraw = 0;

  renderer.setAnimationLoop(() => {
    const now = performance.now() / 1000;
    const dt = Math.min(0.1, now - last);
    last = now;

    const event = game.update(now);
    if (event === "pop") audio.ready();
    if (event === "fail") audio.fail();
    if (event === "message") audio.message();
    if (event) lastScreenDraw = 0;

    const glow = GLOW[game.phase];
    const pulse = game.phase === "ready" ? 0.75 + 0.25 * Math.sin(now * 6) : 1;
    basement.setMonitorGlow(glow.color, glow.intensity * pulse);
    basement.update(now, dt);

    if (now - lastScreenDraw > 1 / SCREEN_FPS) {
      drawScreen(screenCtx, game, now);
      basement.screenTexture.needsUpdate = true;
      lastScreenDraw = now;
    }

    if (!renderer.xr.isPresenting) {
      camera.position.set(0, EYE_HEIGHT, 0);
      camera.rotation.set(pitch, yaw, 0, "YXZ");
    }
    renderer.render(scene, camera);
  });

  return {
    async enterVR() {
      if (!navigator.xr || renderer.xr.isPresenting) return;
      const session = await navigator.xr.requestSession("immersive-vr", {
        optionalFeatures: ["local-floor"],
      });
      await renderer.xr.setSession(session);
    },
    setMuted(muted) {
      audio.setMuted(muted);
    },
    dispose() {
      renderer.setAnimationLoop(null);
      void renderer.xr.getSession()?.end();
      resizeObserver.disconnect();
      container.removeEventListener("keydown", onKeyDown);
      audio.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
          obj.geometry.dispose();
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of materials) {
            (m as THREE.MeshStandardMaterial).map?.dispose();
            m.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
