// WebGL coin. The SVG coin stays the source of truth for layout, keyboard and
// accessibility; this module only draws a real photogrammetry scan of a Roman
// aureus on top of it when the browser can. Any failure (no WebGL, missing
// model, reduced motion) leaves the CSS coin untouched.

import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MODEL_URL } from './config.js';

/** Vertical travel of the coin at the apex, in coin radii. */
const LIFT = 0.5;

let renderer: WebGLRenderer | null = null;
let scene: Scene | null = null;
let camera: PerspectiveCamera | null = null;
let tilt: Group | null = null;
let spinner: Group | null = null;

let host: HTMLElement | null = null;
let active = false;
let parity = 0; // 0 = obverse up, 1 = reverse up
let flipping = false;

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInQuad = (t: number): number => t * t;

export function isCoin3dActive(): boolean {
  return active;
}

export function isCoin3dFlipping(): boolean {
  return flipping;
}

function renderOnce(): void {
  if (renderer && scene && camera) renderer.render(scene, camera);
}

/** Procedural studio environment: no HDR file to download. */
function buildEnvironment(r: WebGLRenderer): Scene {
  const source = new Scene();
  const plane = new PlaneGeometry(12, 12);
  const light = (
    color: number,
    intensity: number,
    pos: [number, number, number],
    rot: [number, number, number],
  ): void => {
    const mesh = new Mesh(plane, new MeshBasicMaterial({ color, side: DoubleSide }));
    mesh.material.color.multiplyScalar(intensity);
    mesh.position.set(...pos);
    mesh.rotation.set(...rot);
    source.add(mesh);
  };
  light(0xfff4e0, 2.2, [0, 7, 1.5], [-Math.PI / 2, 0, 0]);
  light(0xffdca0, 1.2, [-7, 1, 4], [0, Math.PI / 2, 0]);
  light(0x9fb6e8, 0.6, [7, 2, -3], [0, -Math.PI / 2, 0]);
  light(0x120b02, 1.0, [0, -7, 0], [Math.PI / 2, 0, 0]);

  const pmrem = new PMREMGenerator(r);
  const envMap = pmrem.fromScene(source, 0.05).texture;
  pmrem.dispose();

  const scene = new Scene();
  scene.environment = envMap;
  scene.environmentIntensity = 0.85;
  return scene;
}

function resize(): void {
  if (!renderer || !camera || !host) return;
  const w = host.clientWidth || 1;
  const h = host.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderOnce();
}

/** Center the scan on its own bounding box, scale it to radius 1 and lay it
 *  flat: the file is Z-up and centred at (-16.3, 16.5, 0.2). */
function normalize(model: Group): Group {
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const scale = 2 / Math.max(size.x, size.y);
  // The scan is a photogrammetry shell about 3% of the diameter thick; a real
  // aureus is ~10%. Stretching its thin axis is invisible face-on and stops it
  // reading as a razor blade mid-toss.
  const thickness = scale * 2.4;

  model.scale.set(scale, scale, thickness);
  // The offset has to be scaled per axis as well, or the coin lands off pivot.
  model.position.set(-center.x * scale, -center.y * scale, -center.z * thickness);

  const flat = new Group();
  flat.rotation.x = -Math.PI / 2; // Z-up scan -> face to +Y
  flat.add(model);
  return flat;
}

export async function initCoin3d(target: HTMLElement): Promise<boolean> {
  if (active) return true;
  host = target;

  let r: WebGLRenderer;
  try {
    r = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    return false; // no WebGL: the SVG coin stays
  }

  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.toneMapping = ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  r.outputColorSpace = SRGBColorSpace;
  host.appendChild(r.domElement);

  const s = buildEnvironment(r);
  const cam = new PerspectiveCamera(34, 1, 0.1, 100);
  // The canvas is 2.6x the coin box (see .coin__canvas) so the coin can lift
  // without clipping; the camera steps back by the same factor to keep the
  // coin the same size on screen.
  cam.position.set(0.02, 1.5, 9.6);
  cam.lookAt(0, 0, 0);

  const t = new Group();
  t.rotation.set(1.0, 0.14, 0);
  const spin = new Group();
  t.add(spin);
  s.add(t);

  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync(MODEL_URL);
  } catch {
    host.removeChild(r.domElement);
    r.dispose();
    return false;
  }

  spin.add(normalize(gltf.scene));

  const dir = new DirectionalLight(0xfff4d6, 1.1);
  dir.position.set(-2.5, 4, 3);
  s.add(dir);

  renderer = r;
  scene = s;
  camera = cam;
  tilt = t;
  spinner = spin;
  active = true;

  resize();
  // A ResizeObserver, not a window listener: the canvas host is display:none
  // until the .is-3d class lands, so the first measurement only arrives when
  // it becomes visible.
  new ResizeObserver(() => resize()).observe(host);
  return true;
}

export interface FlipOptions {
  /** Whole turns before the coin lands, so two tosses never feel identical. */
  turns: number;
  /** Land on the reverse. */
  toTails: boolean;
  durationMs: number;
}

/** Animate one toss. Resolves when the coin has landed. */
export function flipCoin3d(options: FlipOptions): Promise<void> {
  const spin = spinner;
  const liftGroup = tilt;
  if (!spin || !liftGroup) return Promise.resolve();

  flipping = true;
  const from = spin.rotation.x;
  // Keep the landing face exact no matter how many turns are added.
  const desired = options.toTails ? 1 : 0;
  const delta = (desired - parity + 2) % 2 === 0 ? 0 : Math.PI;
  parity = desired;
  const to = from + options.turns * Math.PI * 2 + delta;

  const start = performance.now();
  return new Promise<void>((resolve) => {
    const step = (now: number): void => {
      const p = Math.min(1, (now - start) / Math.max(1, options.durationMs));
      // Same shape as the CSS keyframes: fast rise, braking fall.
      const lift = p < 0.45 ? easeOutCubic(p / 0.45) : 1 - easeInQuad((p - 0.45) / 0.55);
      liftGroup.position.y = lift * LIFT;
      spin.rotation.x = from + (to - from) * easeOutCubic(p);
      renderOnce();
      if (p < 1) {
        requestAnimationFrame(step);
        return;
      }
      liftGroup.position.y = 0;
      renderOnce();
      flipping = false;
      resolve();
    };
    requestAnimationFrame(step);
  });
}
