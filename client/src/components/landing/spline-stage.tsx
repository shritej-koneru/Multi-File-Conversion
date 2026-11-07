import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "framer-motion";
import type { Application, SPEObject } from "@splinetool/runtime";

const SCENE_URL =
  "https://prod.spline.design/LEvjG3OETYd2GsRw/scene.splinecode";

/** The source Spline object is about 292 world units wide (1 unit ≈ 1 CSS px). */
const BASE_SIZE = 292;
const CLONE_COUNT = 12;

type Vec3 = [number, number, number];
type Rgb = [number, number, number];
type PresetName = "hero" | "wall" | "tunnel" | "orbit" | "privacy" | "final";

type Layout = {
  width: number;
  height: number;
  mobile: boolean;
  cx: number;
  cy: number;
  heroPx: number;
  wallPx: number;
  ringPx: number;
  smallPx: number;
  ringRadius: number;
  orbitX: number;
  orbitY: number;
  wallGap: number;
};

type ObjectState = {
  position: Vec3;
  rotation: Vec3;
  scale: number;
  color: Rgb;
  visible: boolean;
};

const C = {
  teal: [20, 168, 193] as Rgb,
  tealDeep: [10, 118, 137] as Rgb,
  yellow: [248, 199, 44] as Rgb,
  orange: [255, 122, 38] as Rgb,
  blue: [45, 140, 240] as Rgb,
  mint: [34, 196, 154] as Rgb,
  pink: [211, 78, 143] as Rgb,
  calm: [62, 196, 190] as Rgb,
  pale: [228, 251, 244] as Rgb,
  white: [247, 253, 251] as Rgb,
};

const PALETTE: Rgb[] = [
  C.teal,
  C.yellow,
  C.orange,
  C.blue,
  C.mint,
  C.pink,
  C.tealDeep,
  C.yellow,
  C.blue,
  C.mint,
  C.orange,
  C.pink,
];

const KEYFRAMES: Array<{ at: number; preset: PresetName }> = [
  { at: 0, preset: "hero" },
  { at: 0.1, preset: "hero" },
  { at: 0.205, preset: "wall" },
  { at: 0.28, preset: "wall" },
  { at: 0.385, preset: "tunnel" },
  { at: 0.46, preset: "tunnel" },
  { at: 0.55, preset: "orbit" },
  { at: 0.645, preset: "orbit" },
  { at: 0.72, preset: "privacy" },
  { at: 0.8, preset: "privacy" },
  { at: 0.885, preset: "final" },
  { at: 1, preset: "final" },
];

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

function makeLayout(
  width: number,
  height: number,
  viewportWidth = width,
): Layout {
  // Wide, shallow viewports read as a split layout rather than a tall
  // mobile stack. This covers phones in landscape and shallow windows.
  // Use the viewport width for breakpoints so they match the CSS media
  // queries; the canvas is a few pixels narrower when a scrollbar exists.
  const landscape =
    viewportWidth >= 560 && height <= 700 && viewportWidth >= height;
  const mobile = viewportWidth <= 900 && !landscape;
  const short = height < 720;
  const heroPx = mobile
    ? Math.min(width * 0.63, height * (short ? 0.25 : 0.29))
    : Math.min(width * 0.27, height * 0.42);
  const wallPx = mobile
    ? Math.min(width * (short ? 0.16 : 0.18), height * 0.12)
    : Math.min(width * 0.105, height * 0.15);
  const ringPx = mobile
    ? Math.min(width * 0.145, height * 0.115)
    : Math.min(width * 0.076, height * 0.115);
  const smallPx = mobile
    ? Math.min(width * 0.1, height * 0.075)
    : Math.min(width * 0.052, height * 0.085);

  return {
    width,
    height,
    mobile,
    cx: mobile ? 0 : width * 0.22,
    cy: mobile ? height * (short ? 0.22 : 0.17) : 0,
    heroPx,
    wallPx,
    ringPx,
    smallPx,
    ringRadius: mobile
      ? Math.min(width * 0.3, height * 0.33)
      : Math.min(width * 0.18, height * 0.3),
    orbitX: mobile
      ? Math.min(width * 0.37, height * 0.42)
      : Math.min(width * 0.2, height * 0.32),
    orbitY: mobile
      ? Math.min(width * 0.15, height * 0.16)
      : Math.min(width * 0.085, height * 0.14),
    wallGap: mobile ? 8 : Math.max(10, width * 0.009),
  };
}

function hidden(layout: Layout, index: number): ObjectState {
  return {
    position: [layout.cx, layout.cy, -160],
    rotation: [0, index * 0.22, 0],
    scale: 0,
    color: PALETTE[index % PALETTE.length],
    visible: false,
  };
}

function pxScale(px: number) {
  return px / BASE_SIZE;
}

function buildPreset(
  preset: PresetName,
  layout: Layout,
  time: number,
  count: number,
): ObjectState[] {
  const states = Array.from({ length: count }, (_, index) =>
    hidden(layout, index),
  );

  if (preset === "hero") {
    const mainPx = layout.heroPx;
    states[0] = {
      position: [
        layout.cx + Math.sin(time * 0.72) * 3,
        layout.cy + Math.sin(time * 0.94) * 6,
        0,
      ],
      rotation: [
        -0.2 + Math.sin(time * 0.34) * 0.05,
        0.66 + Math.sin(time * 0.3) * 0.16,
        0.035,
      ],
      scale: pxScale(mainPx),
      color: C.teal,
      visible: true,
    };

    if (count > 1) {
      states[1] = {
        position: [
          layout.cx + mainPx * 0.61,
          layout.cy + mainPx * 0.4,
          -110,
        ],
        rotation: [0.2, 1.05 + Math.sin(time * 0.3) * 0.18, -0.14],
        scale: pxScale(mainPx * 0.3),
        color: C.yellow,
        visible: true,
      };
    }

    if (count > 2) {
      states[2] = {
        position: [
          layout.cx - mainPx * 0.58,
          layout.cy - mainPx * 0.36,
          -150,
        ],
        rotation: [-0.2, -0.9 + Math.cos(time * 0.26) * 0.16, 0.12],
        scale: pxScale(mainPx * 0.21),
        color: C.blue,
        visible: true,
      };
    }

    return states;
  }

  if (preset === "wall") {
    const cols = layout.mobile ? 3 : 4;
    const rows = 3;
    const visibleCount = Math.min(cols * rows, count);
    const gridWidth = cols * layout.wallPx + (cols - 1) * layout.wallGap;
    const gridHeight = rows * layout.wallPx + (rows - 1) * layout.wallGap;
    const startX = layout.cx - gridWidth / 2 + layout.wallPx / 2;
    const startY =
      layout.cy +
      gridHeight / 2 -
      layout.wallPx / 2 +
      (layout.mobile && layout.height < 720 ? 18 : 0);
    const centerIndex = Math.floor((visibleCount - 1) / 2);

    for (let index = 0; index < visibleCount; index += 1) {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const jitter = Math.sin(time * 0.7 + index * 1.31);
      const color =
        index === centerIndex
          ? C.yellow
          : index === centerIndex + 3
            ? C.orange
            : index % 7 === 0
              ? C.blue
              : C.teal;

      states[index] = {
        position: [
          startX + col * (layout.wallPx + layout.wallGap) + jitter * 1.4,
          startY -
            row * (layout.wallPx + layout.wallGap) +
            Math.sin(time * 0.8 + index) * 2.2,
          ((index * 37) % 7) * 6 - 18,
        ],
        rotation: [
          Math.sin(time * 0.45 + index * 0.62) * 0.06 + (row - 1) * 0.07,
          Math.cos(time * 0.38 + index * 0.53) * 0.11 +
            (col - (cols - 1) / 2) * 0.1,
          Math.sin(time * 0.3 + index * 0.7) * 0.04,
        ],
        scale:
          pxScale(layout.wallPx) *
          (index === centerIndex ? 1.035 : 1) *
          (0.985 + Math.sin(time * 0.5 + index) * 0.015),
        color,
        visible: true,
      };
    }

    return states;
  }

  if (preset === "tunnel") {
    const corePx = layout.heroPx * 0.52;
    const tunnelLift =
      layout.mobile && layout.height < 720 ? 20 : 0;
    states[0] = {
      position: [
        layout.cx,
        layout.cy + tunnelLift + Math.sin(time * 0.5) * 3,
        0,
      ],
      rotation: [
        -0.12 + Math.sin(time * 0.3) * 0.05,
        0.35 + time * 0.2,
        0.04,
      ],
      scale: pxScale(corePx),
      color: C.yellow,
      visible: true,
    };

    const perRing = Math.max(1, Math.ceil((count - 1) / 2));
    for (let index = 1; index < count; index += 1) {
      const k = index - 1;
      const ring = k % 2;
      const ringIndex = Math.floor(k / 2);
      const angle =
        (ringIndex / perRing) * Math.PI * 2 +
        (ring ? Math.PI / 6 : 0) +
        time * 0.2;
      const radius = layout.ringRadius * (ring ? 1.02 : 0.64);
      const color = PALETTE[k % PALETTE.length];

      states[index] = {
        position: [
          layout.cx + Math.cos(angle) * radius,
          layout.cy + tunnelLift + Math.sin(angle) * radius * 0.73,
          -40 - ring * 70 + Math.sin(angle) * 55,
        ],
        rotation: [
          0.24 + Math.sin(time * 0.4 + k) * 0.08,
          -angle + Math.PI / 2,
          angle * 0.22 + Math.sin(time * 0.35 + k) * 0.1,
        ],
        scale:
          pxScale(layout.ringPx) *
          (ring ? 0.82 : 0.66) *
          (0.9 + Math.cos(angle) * 0.1),
        color,
        visible: true,
      };
    }

    return states;
  }

  if (preset === "orbit") {
    states[0] = {
      position: [layout.cx, layout.cy + Math.sin(time * 0.7) * 3, -130],
      rotation: [0.05, 0.6 + time * 0.18, 0.02],
      scale: pxScale(layout.heroPx * 0.3),
      color: C.yellow,
      visible: true,
    };

    for (let index = 1; index < count; index += 1) {
      const k = index - 1;
      const angle = (k / Math.max(1, count - 1)) * Math.PI * 2 + time * 0.12;
      const depth = (Math.sin(angle) + 1) / 2;

      states[index] = {
        position: [
          layout.cx + Math.cos(angle) * layout.orbitX,
          layout.cy + Math.sin(angle) * layout.orbitY,
          -80 + Math.sin(angle) * 90,
        ],
        rotation: [
          0.16 + Math.sin(time * 0.4 + k) * 0.06,
          -angle + Math.PI / 2,
          angle * 0.72 + Math.sin(time * 0.25 + k) * 0.08,
        ],
        scale: pxScale(layout.ringPx) * (0.7 + depth * 0.36),
        color: PALETTE[k % PALETTE.length],
        visible: true,
      };
    }

    return states;
  }

  if (preset === "privacy") {
    // On phones the promise panel is tall, so lift the composition clear of the copy.
    const privacyY =
      layout.cy + (layout.mobile ? (layout.height < 720 ? 70 : 80) : 0);

    states[0] = {
      position: [
        layout.cx + Math.sin(time * 0.4) * 2,
        privacyY + Math.sin(time * 0.62) * 4,
        0,
      ],
      rotation: [
        -0.12 + Math.sin(time * 0.28) * 0.03,
        0.56 + time * 0.13,
        0.02,
      ],
      scale: pxScale(layout.heroPx * (layout.mobile ? 0.62 : 0.76)),
      color: C.calm,
      visible: true,
    };

    if (layout.mobile) {
      for (let index = 1; index <= Math.min(6, count - 1); index += 1) {
        const angle = ((index - 1) / 6) * Math.PI * 2 + time * 0.1;
        const radius = layout.ringRadius * 0.95;
        states[index] = {
          position: [
            layout.cx + Math.cos(angle) * radius,
            privacyY + Math.sin(angle) * radius * 0.92,
            -30,
          ],
          rotation: [0.14, angle, angle * 0.3],
          scale: pxScale(layout.smallPx * 0.4),
          color: index % 3 === 0 ? C.yellow : C.teal,
          visible: true,
        };
      }
    } else {
      for (let index = 1; index < count; index += 1) {
        const angle = ((index - 1) / (count - 1)) * Math.PI * 2 + time * 0.1;
        const radius = layout.ringRadius * 0.85;
        states[index] = {
          position: [
            layout.cx + Math.cos(angle) * radius,
            privacyY + Math.sin(angle) * radius * 0.92,
            -35,
          ],
          rotation: [0.12, angle, angle * 0.3],
          scale: pxScale(layout.smallPx * 0.36),
          color: index % 4 === 0 ? C.yellow : C.tealDeep,
          visible: true,
        };
      }
    }

    return states;
  }

  // Final constellation
  const finalY =
    layout.cy + (layout.mobile ? (layout.height < 720 ? 25 : 55) : 0);

  states[0] = {
    position: [
      layout.cx + Math.sin(time * 0.55) * 3,
      finalY + Math.sin(time * 0.8) * 5,
      0,
    ],
    rotation: [
      -0.15 + Math.sin(time * 0.28) * 0.04,
      0.38 + time * 0.17,
      0.03,
    ],
    scale: pxScale(layout.heroPx * (layout.mobile ? 0.86 : 0.94)),
    color: C.teal,
    visible: true,
  };

  for (let index = 1; index < count; index += 1) {
    const k = index - 1;
    const angle =
      (k / Math.max(1, count - 1)) * Math.PI * 2 +
      Math.PI / 12 +
      time * 0.085;
    const depth = (Math.sin(angle) + 1) / 2;

    states[index] = {
      position: [
        layout.cx + Math.cos(angle) * layout.orbitX * 1.02,
        finalY + Math.sin(angle) * layout.orbitY * 1.08,
        -140 + Math.sin(angle) * 70,
      ],
      rotation: [
        0.18 + Math.sin(time * 0.35 + k) * 0.06,
        -angle + Math.PI / 2,
        angle * 0.8 + Math.sin(time * 0.3 + k) * 0.08,
      ],
      scale: pxScale(layout.smallPx) * (0.74 + depth * 0.34),
      color: PALETTE[k % PALETTE.length],
      visible: true,
    };
  }

  return states;
}

function smoothstep(value: number) {
  return value * value * (3 - 2 * value);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ];
}

function getBlend(progress: number) {
  if (progress <= KEYFRAMES[0].at) {
    return { from: KEYFRAMES[0], to: KEYFRAMES[0], t: 0 };
  }

  for (let index = 0; index < KEYFRAMES.length - 1; index += 1) {
    const from = KEYFRAMES[index];
    const to = KEYFRAMES[index + 1];
    if (progress >= from.at && progress <= to.at) {
      const raw = (progress - from.at) / Math.max(0.0001, to.at - from.at);
      return { from, to, t: smoothstep(raw) };
    }
  }

  return {
    from: KEYFRAMES[KEYFRAMES.length - 1],
    to: KEYFRAMES[KEYFRAMES.length - 1],
    t: 0,
  };
}

type SplineStageProps = {
  progress: MotionValue<number>;
  reducedMotion: boolean;
};

export function SplineStage({ progress, reducedMotion }: SplineStageProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const objectsRef = useRef<SPEObject[]>([]);
  const layoutRef = useRef<Layout>(makeLayout(1440, 900));
  const targetRef = useRef(0);
  const reducedRef = useRef(reducedMotion);
  const visibleRef = useRef(true);
  const lastColorsRef = useRef<string[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  reducedRef.current = reducedMotion;

  useMotionValueEvent(progress, "change", (value) => {
    targetRef.current = value;
  });

  useEffect(() => {
    if (!hasWebGL()) {
      setFailed(true);
      return;
    }

    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    let disposed = false;
    let frameId: number | null = null;
    let currentProgress = progress.get();
    let lastTime = performance.now();
    let elapsed = 0;

    const measure = () => {
      const width = wrap.clientWidth || window.innerWidth;
      const height = wrap.clientHeight || window.innerHeight;
      layoutRef.current = makeLayout(
        width,
        height,
        window.innerWidth || width,
      );
    };
    measure();

    const resizeObserver =
      "ResizeObserver" in window
        ? new ResizeObserver(() => measure())
        : null;
    resizeObserver?.observe(wrap);

    const intersectionObserver =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              visibleRef.current = entry.isIntersecting;
            },
            { threshold: 0.01 },
          )
        : null;
    intersectionObserver?.observe(wrap);

    const onVisibility = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    const boot = async () => {
      try {
        // Keep the Spline runtime out of the converter's initial bundle.
        const { Application } = await import("@splinetool/runtime");
        if (disposed) return;

        const app = new Application(canvas, {
          renderer: "webgl",
          renderMode: "manual",
        });
        appRef.current = app;

        await app.load(SCENE_URL);
        if (disposed) return;

        app.setBackgroundColor("rgba(0,0,0,0)");

        const cube = app.findObjectByName("Cube");
        if (!cube) throw new Error("The Spline scene did not expose a Cube.");

        cube.visible = true;
        cube.color = "#14a8c1";

        const objects: SPEObject[] = [cube];
        for (let index = 0; index < CLONE_COUNT; index += 1) {
          const clone = app.cloneObject(cube, {
            name: `StoryTile-${index + 1}`,
          });
          clone.visible = true;
          clone.position.x = 0;
          clone.position.y = 0;
          clone.position.z = 0;
          clone.scale.x = 0.001;
          clone.scale.y = 0.001;
          clone.scale.z = 0.001;
          objects.push(clone);
        }
        objectsRef.current = objects;
        lastColorsRef.current = [];

        targetRef.current = progress.get();
        currentProgress = targetRef.current;

        const render = (now: number) => {
          if (disposed) return;
          const delta = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
          lastTime = now;

          if (!reducedRef.current) elapsed += delta;

          const target = targetRef.current;
          const ease = 1 - Math.pow(0.0012, delta);
          currentProgress += (target - currentProgress) * ease;
          if (Math.abs(target - currentProgress) < 0.00005) {
            currentProgress = target;
          }

          if (visibleRef.current && objectsRef.current.length) {
            const layout = layoutRef.current;
            const blend = getBlend(currentProgress);
            const fromStates = buildPreset(
              blend.from.preset,
              layout,
              elapsed,
              objectsRef.current.length,
            );
            const toStates = buildPreset(
              blend.to.preset,
              layout,
              elapsed,
              objectsRef.current.length,
            );

            objectsRef.current.forEach((object, index) => {
              const from = fromStates[index];
              const to = toStates[index];
              if (!from || !to) return;

              const t = blend.t;
              object.position.x = lerp(from.position[0], to.position[0], t);
              object.position.y = lerp(from.position[1], to.position[1], t);
              object.position.z = lerp(from.position[2], to.position[2], t);
              object.rotation.x = lerp(
                from.rotation[0],
                to.rotation[0],
                t,
              );
              object.rotation.y = lerp(
                from.rotation[1],
                to.rotation[1],
                t,
              );
              object.rotation.z = lerp(
                from.rotation[2],
                to.rotation[2],
                t,
              );
              const scale = lerp(from.scale, to.scale, t);
              object.scale.x = Math.max(0.0001, scale);
              object.scale.y = Math.max(0.0001, scale);
              object.scale.z = Math.max(0.0001, scale);
              object.visible = scale > 0.006;

              const color = lerpColor(from.color, to.color, t);
              const nextColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
              const previousColor = lastColorsRef.current[index];
              if (previousColor !== nextColor) {
                object.color = nextColor;
                lastColorsRef.current[index] = nextColor;
              }
            });

            app.requestRender();
          }

          frameId = requestAnimationFrame(render);
        };

        app.requestRender();
        frameId = requestAnimationFrame(render);
        setReady(true);

        if (import.meta.env.DEV) {
          (window as unknown as { __splineStageReady?: boolean }).__splineStageReady =
            true;
        }
      } catch {
        if (!disposed) {
          setFailed(true);
          setReady(false);
        }
      }
    };

    void boot();

    return () => {
      disposed = true;
      if (frameId !== null) cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      objectsRef.current = [];
      lastColorsRef.current = [];
      if (import.meta.env.DEV) {
        (window as unknown as { __splineStageReady?: boolean }).__splineStageReady =
          false;
      }
      try {
        appRef.current?.dispose();
      } catch {
        // The runtime can already be partially torn down during HMR.
      }
      appRef.current = null;
    };
  }, [progress]);

  return (
    <div
      ref={wrapRef}
      className={`story-stage${ready ? " is-ready" : ""}${
        failed ? " is-fallback" : ""
      }`}
      aria-hidden="true"
    >
      <div className="story-css-tiles">
        <span className="story-css-tile story-css-tile-blue" />
        <span className="story-css-tile story-css-tile-yellow" />
        <span className="story-css-tile story-css-tile-main" />
      </div>

      <canvas ref={canvasRef} className="story-canvas" />

      {!ready && !failed ? (
        <span className="story-stage-loading">
          <i />
          Loading 3D
        </span>
      ) : null}
    </div>
  );
}
