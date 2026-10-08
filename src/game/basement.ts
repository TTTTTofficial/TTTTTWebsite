// Builds the basement out of primitives and procedurally drawn textures.
import * as THREE from "three";
import { SCREEN_H, SCREEN_W } from "./screen.ts";

const ROOM = { width: 4, depth: 4, height: 2.3 };

/** Where the player's chair sits (floor level), facing -Z toward the desk. */
export const SEAT = new THREE.Vector3(0, 0, -0.8);
export const EYE_HEIGHT = 1.15;

function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat: [number, number] = [1, 1],
) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!, w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(...repeat);
  texture.anisotropy = 4;
  return texture;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const shade = Math.random() < 0.5 ? 0 : 255;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${Math.random() * alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

function stains(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, color: string) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 20 + Math.random() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

const concrete = () =>
  canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#5d5c58";
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 9000, 0.25);
      stains(ctx, w, h, 10, "rgba(20,18,14,0.35)");
    },
    [3, 3],
  );

const cinderBlock = (repeat: [number, number]) =>
  canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      // One tile = 2 rows of 0.4m x 0.2m blocks, running bond.
      ctx.fillStyle = "#3d3c39";
      ctx.fillRect(0, 0, w, h);
      const mortar = 6;
      const rowH = h / 2;
      for (let row = 0; row < 2; row++) {
        const offset = row === 1 ? -w / 2 : 0;
        for (let col = 0; col < 3; col++) {
          const x = offset + col * w;
          ctx.fillStyle = `rgb(${102 + Math.random() * 10}, ${100 + Math.random() * 8}, ${94 + Math.random() * 8})`;
          ctx.fillRect(x + mortar / 2, row * rowH + mortar / 2, w - mortar, rowH - mortar);
        }
      }
      speckle(ctx, w, h, 4000, 0.3);
      stains(ctx, w, h, 3, "rgba(30,34,20,0.3)");
    },
    repeat,
  );

const poster = () =>
  canvasTexture(256, 360, (ctx, w, h) => {
    ctx.fillStyle = "#1a1416";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#b8352a";
    ctx.font = "bold 64px Rajdhani, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TTTTT", w / 2, 150);
    ctx.fillStyle = "#c9b9a6";
    ctx.font = "bold 26px Rajdhani, sans-serif";
    ctx.fillText("NEVER GIVE UP", w / 2, 200);
    ctx.font = "18px Rajdhani, sans-serif";
    ctx.fillText("(est. 2:31)", w / 2, 230);
    // Fade and water damage
    stains(ctx, w, h, 6, "rgba(120,100,60,0.25)");
    ctx.fillStyle = "rgba(200,190,160,0.12)";
    ctx.fillRect(0, 0, w, h);
  });

const calendar = () =>
  canvasTexture(256, 300, (ctx, w, h) => {
    ctx.fillStyle = "#d8d2c4";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#7c2a24";
    ctx.fillRect(0, 0, w, 56);
    ctx.fillStyle = "#f2e9da";
    ctx.font = "bold 30px Rajdhani, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MONTH ???", w / 2, 38);
    const cell = w / 7;
    for (let i = 0; i < 35; i++) {
      const x = (i % 7) * cell;
      const y = 64 + Math.floor(i / 7) * 46;
      ctx.strokeStyle = "#a59f92";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cell, 46);
      ctx.strokeStyle = "#b3261e";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 7, y + 7);
      ctx.lineTo(x + cell - 7, y + 39);
      ctx.moveTo(x + cell - 7, y + 7);
      ctx.lineTo(x + 7, y + 39);
      ctx.stroke();
    }
    stains(ctx, w, h, 4, "rgba(110,90,50,0.25)");
  });

function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(r: number, h: number, material: THREE.Material, x: number, y: number, z: number, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const mat = (color: THREE.ColorRepresentation, roughness = 0.9, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

export interface Basement {
  screenTexture: THREE.CanvasTexture;
  setMonitorGlow(color: THREE.ColorRepresentation, intensity: number): void;
  update(now: number, dt: number): void;
}

export function buildBasement(scene: THREE.Scene, screenCanvas: HTMLCanvasElement): Basement {
  scene.background = new THREE.Color(0x020202);
  scene.fog = new THREE.FogExp2(0x030303, 0.16);

  const { width, depth, height } = ROOM;

  // --- Shell ---------------------------------------------------------------
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: concrete(), roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ map: cinderBlock([width / 0.4, height / 0.4]), roughness: 1 });
  const walls: [number, number, number, number][] = [
    // x, z, rotationY, width
    [0, -depth / 2, 0, width],
    [0, depth / 2, Math.PI, width],
    [-width / 2, 0, Math.PI / 2, depth],
    [width / 2, 0, -Math.PI / 2, depth],
  ];
  for (const [x, z, ry, w] of walls) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w, height), wallMat);
    wall.position.set(x, height / 2, z);
    wall.rotation.y = ry;
    wall.receiveShadow = true;
    scene.add(wall);
  }

  // Unfinished ceiling: subfloor + exposed joists.
  const woodDark = mat(0x3a2c1f);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat(0x2a2119));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  scene.add(ceiling);
  for (let x = -width / 2 + 0.2; x < width / 2; x += 0.4) {
    scene.add(box(0.05, 0.22, depth, woodDark, x, height - 0.11, 0));
  }

  // Pipes
  const copper = mat(0x8a5a3a, 0.5, 0.7);
  const iron = mat(0x2b2b2b, 0.7, 0.6);
  const pipe1 = cylinder(0.025, width, copper, 0, height - 0.28, 0.35);
  pipe1.rotation.z = Math.PI / 2;
  const pipe2 = cylinder(0.055, width, iron, 0, height - 0.3, 1.1);
  pipe2.rotation.z = Math.PI / 2;
  scene.add(pipe1, pipe2);

  // Tiny high window with a sliver of night outside.
  const windowPane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.28),
    new THREE.MeshBasicMaterial({ color: 0x0d1526 }),
  );
  windowPane.position.set(0.9, height - 0.42, -depth / 2 + 0.01);
  scene.add(windowPane);
  scene.add(box(0.76, 0.03, 0.06, woodDark, 0.9, height - 0.27, -depth / 2 + 0.03));
  scene.add(box(0.76, 0.03, 0.06, woodDark, 0.9, height - 0.57, -depth / 2 + 0.03));
  const moonlight = new THREE.SpotLight(0x4a62a0, 1.5, 4, 0.5, 0.8, 2);
  moonlight.position.set(0.9, height - 0.42, -depth / 2 + 0.05);
  moonlight.target.position.set(0.7, 0, -0.8);
  scene.add(moonlight, moonlight.target);

  // --- Desk & battlestation ------------------------------------------------
  const deskZ = -depth / 2 + 0.38;
  const deskTop = 0.74;
  scene.add(box(1.5, 0.04, 0.72, mat(0x4a3423), 0, deskTop, deskZ));
  for (const [x, z] of [
    [-0.7, deskZ - 0.3],
    [0.7, deskZ - 0.3],
    [-0.7, deskZ + 0.3],
    [0.7, deskZ + 0.3],
  ]) {
    scene.add(box(0.05, deskTop, 0.05, woodDark, x, deskTop / 2, z));
  }

  const plastic = mat(0x111111, 0.6);
  const monitorZ = deskZ - 0.15;
  const screenY = deskTop + 0.38;
  scene.add(box(0.06, 0.24, 0.05, plastic, 0, deskTop + 0.14, monitorZ - 0.04));
  scene.add(box(0.26, 0.015, 0.18, plastic, 0, deskTop + 0.03, monitorZ - 0.02));
  scene.add(box(0.7, 0.44, 0.045, plastic, 0, screenY, monitorZ));

  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.anisotropy = 8;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.66, 0.66 * (SCREEN_H / SCREEN_W)),
    new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }),
  );
  screen.position.set(0, screenY, monitorZ + 0.024);
  scene.add(screen);

  const monitorLight = new THREE.PointLight(0x9fb2ff, 1.2, 5, 2);
  monitorLight.position.set(0, screenY, monitorZ + 0.35);
  scene.add(monitorLight);

  scene.add(box(0.46, 0.025, 0.15, mat(0x1a1a1a, 0.7), -0.05, deskTop + 0.03, deskZ + 0.17));
  scene.add(box(0.3, 0.004, 0.26, mat(0x0c0c0e, 1), 0.36, deskTop + 0.022, deskZ + 0.15));
  scene.add(box(0.065, 0.03, 0.11, mat(0x1a1a1a, 0.6), 0.36, deskTop + 0.04, deskZ + 0.15));

  // Energy drinks, a monument to bad decisions.
  const canColors = [0x1d6b2c, 0x101010, 0x2a3f8f, 0x1d6b2c, 0xb8b8b0];
  const canSpots: [number, number, number, boolean][] = [
    [0.58, deskTop + 0.08, deskZ - 0.15, false],
    [0.63, deskTop + 0.08, deskZ - 0.05, false],
    [0.52, deskTop + 0.08, deskZ - 0.24, false],
    [-0.58, deskTop + 0.08, deskZ - 0.18, false],
    [-0.5, deskTop + 0.055, deskZ + 0.12, true],
    [0.9, 0.035, deskZ + 0.55, true],
    [-0.75, 0.035, -0.35, true],
    [0.45, 0.06, -0.15, false],
  ];
  canSpots.forEach(([x, y, z, fallen], i) => {
    const can = cylinder(0.033, 0.12, mat(canColors[i % canColors.length], 0.35, 0.8), x, y, z, 12);
    if (fallen) {
      can.rotation.z = Math.PI / 2;
      can.rotation.y = Math.random() * Math.PI;
    }
    scene.add(can);
  });

  // Mug and pizza boxes
  scene.add(cylinder(0.045, 0.1, mat(0x6b1e1e, 0.6), -0.42, deskTop + 0.07, deskZ - 0.05));
  const cardboard = mat(0x8a6a43);
  const pizza1 = box(0.42, 0.045, 0.42, cardboard, -0.85, 0.023, -0.95);
  pizza1.rotation.y = 0.3;
  const pizza2 = box(0.42, 0.045, 0.42, cardboard, -0.82, 0.068, -0.93);
  pizza2.rotation.y = 0.15;
  scene.add(pizza1, pizza2);

  // Water heater and boxes of stuff nobody will ever unpack.
  scene.add(cylinder(0.28, 1.5, mat(0x9a9a90, 0.5, 0.4), -width / 2 + 0.38, 0.75, -depth / 2 + 0.38, 24));
  scene.add(cylinder(0.04, height - 1.5, iron, -width / 2 + 0.38, 1.5 + (height - 1.5) / 2, -depth / 2 + 0.38));
  [
    [1.55, 0.2, 1.6, 0.5, 0.4, 0.5],
    [1.5, 0.55, 1.62, 0.42, 0.3, 0.42],
    [1.1, 0.18, 1.7, 0.4, 0.36, 0.4],
    [-1.6, 0.22, 1.5, 0.5, 0.44, 0.6],
  ].forEach(([x, y, z, w, h, d]) => {
    const b = box(w, h, d, cardboard, x, y, z);
    b.rotation.y = (Math.random() - 0.5) * 0.4;
    scene.add(b);
  });

  // Wall decor
  const posterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.59),
    new THREE.MeshStandardMaterial({ map: poster(), roughness: 1 }),
  );
  posterMesh.position.set(-1.0, 1.45, -depth / 2 + 0.01);
  posterMesh.rotation.z = 0.04;
  const calendarMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.35),
    new THREE.MeshStandardMaterial({ map: calendar(), roughness: 1 }),
  );
  calendarMesh.position.set(-width / 2 + 0.01, 1.4, -0.9);
  calendarMesh.rotation.y = Math.PI / 2;
  scene.add(posterMesh, calendarMesh);

  // Chair the player is sitting in (mostly out of view).
  const chairMat = mat(0x151515, 0.8);
  scene.add(box(0.5, 0.08, 0.5, chairMat, SEAT.x, 0.46, SEAT.z + 0.05));
  scene.add(box(0.5, 0.65, 0.06, chairMat, SEAT.x, 0.82, SEAT.z + 0.3));
  scene.add(cylinder(0.03, 0.42, iron, SEAT.x, 0.21, SEAT.z + 0.05));

  // --- Lighting ------------------------------------------------------------
  scene.add(new THREE.HemisphereLight(0x30302c, 0x080808, 0.35));

  // A single bare bulb on a cord, behind and above you.
  const bulbPos = new THREE.Vector3(0.55, height - 0.45, 0.35);
  const cord = cylinder(0.004, 0.4, mat(0x111111), bulbPos.x, height - 0.22, bulbPos.z, 6);
  cord.castShadow = false;
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffc98a });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), bulbMat);
  bulb.position.copy(bulbPos);
  const bulbLight = new THREE.PointLight(0xffb066, 1.6, 7, 2);
  bulbLight.position.copy(bulbPos).y -= 0.06;
  bulbLight.castShadow = true;
  bulbLight.shadow.mapSize.set(512, 512);
  bulbLight.shadow.bias = -0.003;
  scene.add(cord, bulb, bulbLight);

  // --- Dust ----------------------------------------------------------------
  const DUST = 350;
  const positions = new Float32Array(DUST * 3);
  const seeds = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    positions[i * 3] = (Math.random() - 0.5) * width;
    positions[i * 3 + 1] = Math.random() * height;
    positions[i * 3 + 2] = (Math.random() - 0.5) * depth;
    seeds[i] = Math.random() * 100;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ color: 0xb0a890, size: 0.005, transparent: true, opacity: 0.55, depthWrite: false }),
  );
  scene.add(dust);

  // --- Animation -----------------------------------------------------------
  let flickerUntil = 0;
  let nextFlicker = 3;
  const monitorTarget = { color: new THREE.Color(0x9fb2ff), intensity: 1.2 };

  return {
    screenTexture,
    setMonitorGlow(color, intensity) {
      monitorTarget.color.set(color);
      monitorTarget.intensity = intensity;
    },
    update(now, dt) {
      // The bulb occasionally loses its will to live.
      if (now > nextFlicker) {
        flickerUntil = now + 0.15 + Math.random() * 0.6;
        nextFlicker = now + 4 + Math.random() * 14;
      }
      const flickering = now < flickerUntil;
      const level = flickering ? (Math.random() < 0.5 ? 0.15 : 0.8) : 1 + Math.sin(now * 50) * 0.02;
      bulbLight.intensity = 1.6 * level;
      bulbMat.color.setRGB(1 * level, 0.79 * level, 0.54 * level);

      monitorLight.color.lerp(monitorTarget.color, Math.min(1, dt * 4));
      monitorLight.intensity += (monitorTarget.intensity - monitorLight.intensity) * Math.min(1, dt * 4);

      const pos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < DUST; i++) {
        let y = pos.getY(i) - dt * 0.02;
        if (y < 0) y = height;
        pos.setY(i, y);
        pos.setX(i, pos.getX(i) + Math.sin(now * 0.3 + seeds[i]) * dt * 0.01);
      }
      pos.needsUpdate = true;
    },
  };
}
