"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import MathBlock from "@/components/primitives/MathBlock";

/* -------------------------------------------------------------------------- */
/* MATH HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function convolveAt(
  image: number[][],
  kernel: number[][],
  row: number,
  col: number
): number {
  let sum = 0;
  for (let u = 0; u < kernel.length; u++) {
    for (let v = 0; v < kernel[0].length; v++) {
      sum += image[row + u][col + v] * kernel[u][v];
    }
  }
  return sum;
}

function computeFeatureMap(
  image: number[][],
  kernel: number[][],
  stride: number
): number[][] {
  const k = kernel.length;
  const out: number[][] = [];
  for (let i = 0; i + k <= image.length; i += stride) {
    const row: number[] = [];
    for (let j = 0; j + k <= image[0].length; j += stride) {
      row.push(convolveAt(image, kernel, i, j));
    }
    out.push(row);
  }
  return out;
}

function maxPool(map: number[][], size: number, stride: number): number[][] {
  const out: number[][] = [];
  for (let i = 0; i + size <= map.length; i += stride) {
    const row: number[] = [];
    for (let j = 0; j + size <= map[0].length; j += stride) {
      let m = -Infinity;
      for (let a = 0; a < size; a++)
        for (let b = 0; b < size; b++) m = Math.max(m, map[i + a][j + b]);
      row.push(m);
    }
    out.push(row);
  }
  return out;
}

function relu(x: number) {
  return Math.max(0, x);
}

function clamp01to9(n: number) {
  return Math.max(0, Math.min(9, n));
}

/* -------------------------------------------------------------------------- */
/* SHARED PRIMITIVES                                                          */
/* -------------------------------------------------------------------------- */

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono pointer-events-none">
      ✦ {children}
    </div>
  );
}

function StatChips({
  items,
}: {
  items: { label: string; value: React.ReactNode; color: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((s) => (
        <div
          key={s.label}
          className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
        >
          <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
            {s.label}
          </div>
          <div className="text-2xl font-bold font-mono mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
      {children}
    </div>
  );
}

function SectionHeader({
  index,
  label,
  title,
  desc,
}: {
  index: string;
  label: string;
  title: string;
  desc?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">
        {index} · {label}
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      {desc && (
        <p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">
          {desc}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 0 — HERO                                                           */
/* -------------------------------------------------------------------------- */

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
        Deep Learning · Topic 1
      </div>

      <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
        How do{" "}
        <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">
          CNNs see images?
        </span>
      </h1>

      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Every time your phone unlocks by looking at your face, or Instagram
          slaps a filter onto your selfie, a{" "}
          <strong className="text-foreground">
            Convolutional Neural Network
          </strong>{" "}
          is doing the seeing.
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed">
          The wild part? A CNN doesn&apos;t know what a &quot;face&quot; or a
          &quot;dog&quot; is at all. It only knows{" "}
          <strong className="text-foreground">numbers</strong>. This page
          shows you exactly how a grid of numbers slowly turns into
          &quot;that&apos;s a cat.&quot;
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">
          The core trick is a small sliding operation called{" "}
          <strong className="text-foreground">convolution</strong>. Learn
          that one idea and the rest of computer vision starts clicking into
          place.
        </p>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 1 — FIRST INTUITION: IMAGES ARE NUMBERS                           */
/* -------------------------------------------------------------------------- */

function FirstIntuition() {
  const size = 5;
  const [grid, setGrid] = useState<number[][]>(() => {
    const g: number[][] = [];
    for (let i = 0; i < size; i++) {
      const row: number[] = [];
      for (let j = 0; j < size; j++) {
        row.push(i === j || i + j === size - 1 ? 8 : 1);
      }
      g.push(row);
    }
    return g;
  });

  const brightSum = grid.flat().reduce((a, b) => a + b, 0);
  const avg = (brightSum / (size * size)).toFixed(2);

  function bump(i: number, j: number) {
    setGrid((prev) =>
      prev.map((row, ri) =>
        row.map((val, ci) => (ri === i && ci === j ? clamp01to9(val + 3) % 10 : val))
      )
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        index="1"
        label="First Intuition"
        title="An image is just a grid of numbers"
        desc={
          <>
            Every pixel in a phone photo is really 1–3 numbers (brightness,
            or Red/Green/Blue). Click any cell below — you&apos;re editing a
            tiny grayscale &quot;photo,&quot; pixel by pixel.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <div
            className="grid gap-1 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0,1fr))`,
              maxWidth: 320,
            }}
          >
            {grid.map((row, i) =>
              row.map((val, j) => (
                <button
                  key={`${i}-${j}`}
                  onClick={() => bump(i, j)}
                  className="aspect-square rounded-md border border-[#ff5f9e]/30 flex items-center justify-center font-mono text-xs transition-transform hover:scale-105"
                  style={{
                    backgroundColor: `rgba(255,95,158,${val / 9})`,
                    color: val > 5 ? "#080810" : "#f5f5f5",
                  }}
                >
                  {val}
                </button>
              ))
            )}
          </div>
          <Hint>Click a pixel</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">What just changed?</h3>
          <p className="text-sm text-foreground-muted leading-relaxed">
            You changed one number, and the picture changed too. A full-color
            phone photo is the same idea, scaled up: a{" "}
            <span className="font-mono text-[#ff5f9e]">
              height × width × 3
            </span>{" "}
            box of numbers (one layer each for Red, Green and Blue).
          </p>
          <StatChips
            items={[
              {
                label: "Grid size",
                value: `${size}×${size}`,
                color: "border-[#ff5f9e] text-[#ff5f9e]",
              },
              {
                label: "Average brightness",
                value: avg,
                color: "border-[#ffd166] text-[#ffd166]",
              },
            ]}
          />
          <p className="text-sm text-foreground-muted leading-relaxed">
            A real photo might be{" "}
            <span className="font-mono">1080 × 1080 × 3</span> — over three
            million numbers. A CNN's whole job is finding patterns hiding in
            that pile of numbers.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 2 — DEEPER MECHANICS: CONVOLUTION                                 */
/* -------------------------------------------------------------------------- */

const BASE_IMAGE: number[][] = [
  [0, 0, 9, 9, 0, 0],
  [0, 0, 9, 9, 0, 0],
  [0, 0, 9, 9, 0, 0],
  [0, 0, 9, 9, 0, 0],
  [0, 0, 9, 9, 0, 0],
  [0, 0, 9, 9, 0, 0],
];

const VERTICAL_EDGE_KERNEL = [
  [1, 0, -1],
  [1, 0, -1],
  [1, 0, -1],
];

function DeeperMechanics() {
  const kSize = VERTICAL_EDGE_KERNEL.length;
  const maxPos = BASE_IMAGE.length - kSize;
  const [pos, setPos] = useState({ row: 0, col: 1 });

  const activation = convolveAt(
    BASE_IMAGE,
    VERTICAL_EDGE_KERNEL,
    pos.row,
    pos.col
  );

  return (
    <section className="space-y-6">
      <SectionHeader
        index="2"
        label="Deeper Mechanics"
        title="Convolution: a filter that slides and multiplies"
        desc={
          <>
            A <strong className="text-foreground">kernel</strong> (a tiny
            grid of numbers) slides over the image. At every stop, it
            multiplies its numbers with the pixels underneath and adds them
            up. This vertical-edge kernel lights up wherever brightness
            jumps from dark to light.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <div
            className="grid gap-1 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${BASE_IMAGE.length}, minmax(0,1fr))`,
              maxWidth: 340,
            }}
          >
            {BASE_IMAGE.map((row, i) =>
              row.map((val, j) => {
                const inside =
                  i >= pos.row &&
                  i < pos.row + kSize &&
                  j >= pos.col &&
                  j < pos.col + kSize;
                return (
                  <div
                    key={`${i}-${j}`}
                    className="aspect-square rounded-md border flex items-center justify-center font-mono text-[10px]"
                    style={{
                      backgroundColor: `rgba(255,209,102,${val / 9})`,
                      borderColor: inside
                        ? "#22e5c9"
                        : "rgba(255,255,255,0.08)",
                      borderWidth: inside ? 2 : 1,
                      color: val > 5 ? "#080810" : "#f5f5f5",
                    }}
                  >
                    {val}
                  </div>
                );
              })
            )}
          </div>
          <Hint>Move the filter with the arrows</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Slide the kernel</h3>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setPos((p) => ({ ...p, col: Math.max(0, p.col - 1) }))
              }
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono hover:border-[#22e5c9]"
            >
              ← left
            </button>
            <button
              onClick={() =>
                setPos((p) => ({ ...p, col: Math.min(maxPos, p.col + 1) }))
              }
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono hover:border-[#22e5c9]"
            >
              right →
            </button>
            <button
              onClick={() =>
                setPos((p) => ({ ...p, row: Math.max(0, p.row - 1) }))
              }
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono hover:border-[#22e5c9]"
            >
              ↑ up
            </button>
            <button
              onClick={() =>
                setPos((p) => ({ ...p, row: Math.min(maxPos, p.row + 1) }))
              }
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono hover:border-[#22e5c9]"
            >
              ↓ down
            </button>
          </div>

          <MathBlock tex="\mathbf{Y}_{i,j} = \sum_{u}\sum_{v} \mathbf{X}_{i+u,j+v}\,\mathbf{K}_{u,v}" />

          <StatChips
            items={[
              {
                label: "Activation here",
                value: activation,
                color:
                  activation >= 0
                    ? "border-[#34d399] text-[#34d399]"
                    : "border-[#fb923c] text-[#fb923c]",
              },
              {
                label: "Position",
                value: `(${pos.row}, ${pos.col})`,
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            Notice the activation spikes right on top of the light/dark
            border in the middle. That&apos;s the kernel detecting an edge —
            exactly the kind of thing Instagram-style edge filters do.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 3 — NUMBER CRUNCHING LAB: FULL FEATURE MAP                        */
/* -------------------------------------------------------------------------- */

const KERNEL_PRESETS: Record<string, number[][]> = {
  "Vertical Edge": [
    [1, 0, -1],
    [1, 0, -1],
    [1, 0, -1],
  ],
  Blur: [
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
    [1 / 9, 1 / 9, 1 / 9],
  ],
  Sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
};

function NumberCrunchingLab() {
  const [presetName, setPresetName] =
    useState<keyof typeof KERNEL_PRESETS>("Vertical Edge");
  const [stride, setStride] = useState(1);

  const kernel = KERNEL_PRESETS[presetName];
  const featureMap = useMemo(
    () => computeFeatureMap(BASE_IMAGE, kernel, stride),
    [kernel, stride]
  );
  const activated = featureMap.map((row) => row.map(relu));

  const maxAbs = Math.max(
    1,
    ...featureMap.flat().map((v) => Math.abs(v))
  );

  return (
    <section className="space-y-6">
      <SectionHeader
        index="3"
        label="Number Crunching Lab"
        title="Sliding the kernel across the whole image"
        desc={
          <>
            Slide the kernel over{" "}
            <strong className="text-foreground">every</strong> position and
            you get a full{" "}
            <strong className="text-foreground">feature map</strong> — a new,
            smaller grid where bright cells mark &quot;the pattern this
            kernel looks for was found here.&quot;
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(KERNEL_PRESETS).map((name) => (
              <button
                key={name}
                onClick={() =>
                  setPresetName(name as keyof typeof KERNEL_PRESETS)
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${presetName === name
                    ? "border-[#a78bfa] text-[#a78bfa] bg-[#a78bfa]/10"
                    : "border-border text-foreground-muted hover:border-[#a78bfa]/50"
                  }`}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted mb-2 font-mono">
                Feature map (post-ReLU)
              </div>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${activated[0].length}, minmax(0,1fr))`,
                }}
              >
                {activated.map((row, i) =>
                  row.map((val, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="aspect-square rounded flex items-center justify-center font-mono text-[9px] border border-[#34d399]/20"
                      style={{
                        backgroundColor: `rgba(52,211,153,${Math.abs(val) / maxAbs
                          })`,
                      }}
                    >
                      {val.toFixed(1)}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted mb-2 font-mono">
                Raw activations
              </div>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${featureMap[0].length}, minmax(0,1fr))`,
                }}
              >
                {featureMap.map((row, i) =>
                  row.map((val, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="aspect-square rounded flex items-center justify-center font-mono text-[9px] border"
                      style={{
                        backgroundColor:
                          val >= 0
                            ? `rgba(52,211,153,${Math.abs(val) / maxAbs})`
                            : `rgba(251,146,60,${Math.abs(val) / maxAbs})`,
                        borderColor:
                          val >= 0
                            ? "rgba(52,211,153,0.3)"
                            : "rgba(251,146,60,0.3)",
                      }}
                    >
                      {val.toFixed(1)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <Hint>Change the kernel</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Stride & output size</h3>

          <div className="text-xs font-mono text-[#ffd166] mb-1">
            ✦ Stride: {stride}
          </div>
          <input
            type="range"
            min={1}
            max={2}
            step={1}
            value={stride}
            onChange={(e) => setStride(Number(e.target.value))}
            className="w-full"
          />

          <MathBlock tex="H_{out} = \left\lfloor \frac{H+2P-K}{S} \right\rfloor + 1" />
          <MathBlock tex="\operatorname{ReLU}(x)=\max(0,x)" />

          <StatChips
            items={[
              {
                label: "Output size",
                value: `${featureMap.length}×${featureMap[0].length}`,
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
              {
                label: "Kernel",
                value: presetName,
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            <strong className="text-foreground">ReLU</strong> just deletes
            negative activations, keeping only &quot;yes, I found this
            pattern&quot; signals. A bigger stride skips positions, shrinking
            the output faster but seeing less detail — the same trade-off
            camera apps make when generating quick low-res previews.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 4 — 3D SPACE: IMAGES AS TENSORS                                   */
/* -------------------------------------------------------------------------- */

function ThreeDSpace() {
  const [separation, setSeparation] = useState(40);
  const channels = [
    { label: "Red", color: "#ff5f9e" },
    { label: "Green", color: "#34d399" },
    { label: "Blue", color: "#6366f1" },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        index="4"
        label="Three Dimensions"
        title="A color image is a stack of grids"
        desc={
          <>
            A color photo isn&apos;t one grid of numbers — it&apos;s three
            grids stacked on top of each other: one for Red, one for Green,
            one for Blue. Together they form a{" "}
            <span className="font-mono">height × width × channels</span>{" "}
            tensor.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5 flex items-center justify-center h-72">
          <div
            style={{
              perspective: "800px",
            }}
            className="relative w-48 h-48"
          >
            {channels.map((c, idx) => (
              <div
                key={c.label}
                className="absolute inset-0 rounded-xl border-2 flex items-center justify-center font-mono text-xs font-bold transition-transform duration-300"
                style={{
                  borderColor: c.color,
                  backgroundColor: c.color + "22",
                  color: c.color,
                  transform: `translateZ(${idx * separation}px) translateX(${idx * (separation / 2.2)
                    }px)`,
                  boxShadow: `0 0 24px ${c.color}33`,
                }}
              >
                {c.label}
              </div>
            ))}
          </div>
          <Hint>Move the slider</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Pull the channels apart</h3>

          <div className="text-xs font-mono text-[#a78bfa] mb-1">
            ✦ Separation: {separation}px
          </div>
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={separation}
            onChange={(e) => setSeparation(Number(e.target.value))}
            className="w-full"
          />

          <StatChips
            items={[
              {
                label: "Tensor shape",
                value: "6×6×3",
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
              {
                label: "Total numbers",
                value: 6 * 6 * 3,
                color: "border-[#6366f1] text-[#6366f1]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            A kernel used on a color image also gets a depth of 3 — it looks
            at a little cube of pixels (height × width × 3) at once, not
            just a flat square. That's why early CNN layers already start
            mixing color information into their features.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 5 — REAL WORLD DATA: POOLING                                      */
/* -------------------------------------------------------------------------- */

function RealWorldData() {
  const kernel = KERNEL_PRESETS["Vertical Edge"];
  const featureMap = useMemo(
    () => computeFeatureMap(BASE_IMAGE, kernel, 1).map((r) => r.map(relu)),
    []
  );
  const [poolSize, setPoolSize] = useState(2);
  const pooled = useMemo(
    () => maxPool(featureMap, poolSize, poolSize),
    [featureMap, poolSize]
  );

  return (
    <section className="space-y-6">
      <SectionHeader
        index="5"
        label="Real World Data"
        title="Pooling: keeping the highlights, dropping the rest"
        desc={
          <>
            After convolution, a CNN often shrinks the feature map with{" "}
            <strong className="text-foreground">max pooling</strong>: look
            at a small window and keep only the strongest activation. It's
            the same idea as a thumbnail — smaller, but the important stuff
            still stands out.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted mb-2 font-mono">
                Feature map ({featureMap.length}×{featureMap[0].length})
              </div>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${featureMap[0].length}, minmax(0,1fr))`,
                }}
              >
                {featureMap.map((row, i) =>
                  row.map((val, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="aspect-square rounded flex items-center justify-center font-mono text-[9px] border border-[#34d399]/20"
                      style={{
                        backgroundColor: `rgba(52,211,153,${val / (Math.max(1, ...featureMap.flat()))
                          })`,
                      }}
                    >
                      {val.toFixed(1)}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted mb-2 font-mono">
                Pooled ({pooled.length}×{pooled[0].length})
              </div>
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${pooled[0].length}, minmax(0,1fr))`,
                }}
              >
                {pooled.map((row, i) =>
                  row.map((val, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="aspect-square rounded flex items-center justify-center font-mono text-[10px] border-2 border-[#ffd166]/50"
                      style={{
                        backgroundColor: `rgba(255,209,102,${val / (Math.max(1, ...featureMap.flat()))
                          })`,
                      }}
                    >
                      {val.toFixed(1)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <Hint>Change the pooling window</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Pooling window size</h3>

          <div className="text-xs font-mono text-[#ffd166] mb-1">
            ✦ Window: {poolSize}×{poolSize}
          </div>
          <input
            type="range"
            min={2}
            max={3}
            step={1}
            value={poolSize}
            onChange={(e) => setPoolSize(Number(e.target.value))}
            className="w-full"
          />

          <StatChips
            items={[
              {
                label: "Before pooling",
                value: `${featureMap.length}×${featureMap[0].length}`,
                color: "border-[#34d399] text-[#34d399]",
              },
              {
                label: "After pooling",
                value: `${pooled.length}×${pooled[0].length}`,
                color: "border-[#ffd166] text-[#ffd166]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            Stack many rounds of{" "}
            <strong className="text-foreground">
              convolve → ReLU → pool
            </strong>{" "}
            and the grid keeps shrinking while what it represents keeps
            growing more meaningful: pixels become edges, edges become
            shapes, shapes become objects.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 6 — CLASSIC AI CONNECTIONS                                        */
/* -------------------------------------------------------------------------- */

function ClassicAI() {
  const [roundness, setRoundness] = useState(0.6);
  const [furriness, setFurriness] = useState(0.7);
  const [threshold, setThreshold] = useState(0.65);

  const score = 0.5 * roundness + 0.5 * furriness;
  const prediction = score > threshold ? "Cat 🐱" : "Dog 🐶";

  return (
    <section className="space-y-6">
      <SectionHeader
        index="6"
        label="Classic AI"
        title="Before deep learning: hand-picked features"
        desc={
          <>
            Long before CNNs, computer vision engineers hand-designed
            filters (like the edge detector above) and fed the extracted
            numbers into simple classic-ML models such as{" "}
            <strong className="text-foreground">
              logistic regression
            </strong>
            . A CNN automates the &quot;design filters&quot; step — it{" "}
            <em>learns</em> the filters instead of a human choosing them.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5 h-72 bg-background/60 rounded-xl border border-border overflow-hidden">
          <svg viewBox="0 0 300 260" className="w-full h-full">
            <line
              x1={0}
              y1={260 - threshold * 240 - 10}
              x2={300}
              y2={260 - threshold * 240 - 10}
              stroke="#6366f1"
              strokeDasharray="6 4"
              strokeWidth={2}
            />
            <text x={8} y={260 - threshold * 240 - 16} fill="#6366f1" fontSize="10" fontFamily="monospace">
              decision boundary
            </text>
            <circle
              cx={roundness * 260 + 20}
              cy={260 - (0.5 * roundness + 0.5 * furriness) * 240 - 10}
              r={10}
              fill={score > threshold ? "#ff5f9e" : "#22e5c9"}
              stroke="white"
              strokeWidth={2}
            />
          </svg>
          <Hint>Move the sliders</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Classify by hand-made features</h3>

          <div className="text-xs font-mono text-[#ff5f9e] mb-1">
            ✦ Roundness: {roundness.toFixed(2)}
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={roundness}
            onChange={(e) => setRoundness(Number(e.target.value))}
            className="w-full"
          />

          <div className="text-xs font-mono text-[#22e5c9] mb-1">
            ✦ Furriness: {furriness.toFixed(2)}
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={furriness}
            onChange={(e) => setFurriness(Number(e.target.value))}
            className="w-full"
          />

          <div className="text-xs font-mono text-[#6366f1] mb-1">
            ✦ Decision threshold: {threshold.toFixed(2)}
          </div>
          <input
            type="range"
            min={0.2}
            max={0.9}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full"
          />

          <StatChips
            items={[
              {
                label: "Feature score",
                value: score.toFixed(2),
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
              {
                label: "Prediction",
                value: prediction,
                color: "border-[#ffd166] text-[#ffd166]",
              },
            ]}
          />

          <p className="text-sm text-foreground-muted leading-relaxed">
            &quot;Roundness&quot; and &quot;furriness&quot; here stand in for
            things like edge-detector responses. Classic vision: a human
            invents these features. Deep learning: the network invents
            better ones than any human would.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 7 — DEEP LEARNING AI: HIERARCHY & APPLICATIONS                    */
/* -------------------------------------------------------------------------- */

const LAYERS = [
  {
    name: "Layer 1",
    detects: "Edges & simple colors",
    color: "#ffd166",
    desc: "Filters here look almost like the edge/blur kernels above — simple, local, low-level.",
  },
  {
    name: "Layer 2",
    detects: "Textures & corners",
    color: "#ff5f9e",
    desc: "Combining edges from layer 1 starts producing textures like fur, scales, or fabric weave.",
  },
  {
    name: "Layer 3",
    detects: "Parts (eyes, wheels, ears)",
    color: "#22e5c9",
    desc: "Textures combine into recognizable object parts — a CNN 'knows' what an eye-shaped blob looks like.",
  },
  {
    name: "Layer 4",
    detects: "Whole objects",
    color: "#a78bfa",
    desc: "Parts combine into full concepts: 'this is a face,' 'this is a stop sign.'",
  },
];

const APPLICATIONS = [
  "Face unlock",
  "Self-driving cars",
  "Medical scan diagnosis",
  "Image search",
  "Security cameras",
  "Handwriting recognition",
];

function DeepLearningAI() {
  const [layerIdx, setLayerIdx] = useState(0);
  const layer = LAYERS[layerIdx];

  return (
    <section className="space-y-6">
      <SectionHeader
        index="7"
        label="Modern Deep Learning"
        title="Stacking layers builds a visual hierarchy"
        desc={
          <>
            A real CNN stacks dozens of convolution + pooling rounds. Each
            layer builds on the last, so the network's understanding climbs
            from raw pixels all the way up to real objects.
          </>
        }
      />

      <SectionCard>
        <div className="relative w-full lg:w-3/5">
          <div className="flex gap-2 mb-4 flex-wrap">
            {LAYERS.map((l, idx) => (
              <button
                key={l.name}
                onClick={() => setLayerIdx(idx)}
                className={`px-3 py-2 rounded-lg text-xs font-mono border transition-all ${idx === layerIdx
                    ? "text-background"
                    : "border-border text-foreground-muted hover:border-white/30"
                  }`}
                style={
                  idx === layerIdx
                    ? { backgroundColor: l.color, borderColor: l.color }
                    : {}
                }
              >
                {l.name}
              </button>
            ))}
          </div>

          <div
            className="rounded-xl border p-6 min-h-[180px] flex flex-col justify-center gap-3"
            style={{ borderColor: layer.color + "55", backgroundColor: layer.color + "11" }}
          >
            <div
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: layer.color }}
            >
              {layer.name} detects
            </div>
            <div className="text-xl font-bold">{layer.detects}</div>
            <p className="text-sm text-foreground-muted leading-relaxed">
              {layer.desc}
            </p>
          </div>
          <Hint>Click a layer</Hint>
        </div>

        <div className="w-full lg:w-2/5 space-y-4">
          <h3 className="text-lg font-bold">Where this shows up in real AI</h3>
          <div className="flex flex-wrap gap-2">
            {APPLICATIONS.map((app) => (
              <span
                key={app}
                className="text-xs font-mono px-3 py-1.5 rounded-full border border-[#6366f1]/40 text-[#6366f1] bg-[#6366f1]/10"
              >
                {app}
              </span>
            ))}
          </div>
          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3">
            <strong className="text-foreground">Modern twist:</strong> the
            newest vision systems often mix CNNs with Transformer-style
            attention, but the CNN backbone — convolution, ReLU, pooling,
            repeat — still does most of the heavy lifting for extracting
            visual features cheaply.
          </p>
        </div>
      </SectionCard>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 8 — CONCEPT MAP                                                   */
/* -------------------------------------------------------------------------- */

function ConceptMap() {
  const nodes = [
    {
      label: "Pixels & Tensors",
      desc: "Images are grids of numbers, stacked into height × width × channels.",
      color: "#ff5f9e",
    },
    {
      label: "Kernel / Filter",
      desc: "A tiny learnable grid of numbers that detects one specific pattern.",
      color: "#22e5c9",
    },
    {
      label: "Convolution",
      desc: "Sliding the kernel across the image, multiplying and summing at each stop.",
      color: "#ffd166",
    },
    {
      label: "Feature Map",
      desc: "The grid of activations produced by one kernel scanning the image.",
      color: "#34d399",
    },
    {
      label: "Stride & Padding",
      desc: "Controls how far the kernel jumps and what happens at the edges.",
      color: "#fb923c",
    },
    {
      label: "Pooling",
      desc: "Shrinks feature maps by keeping only the strongest local activations.",
      color: "#a78bfa",
    },
    {
      label: "Feature Hierarchy",
      desc: "Stacked layers turn edges into textures, textures into parts, parts into objects.",
      color: "#6366f1",
    },
    {
      label: "Real-World CNNs",
      desc: "Face unlock, medical imaging, and self-driving cars all run this pipeline.",
      color: "#ffd166",
    },
  ];

  return (
    <section className="space-y-6">
      <SectionHeader
        index="8"
        label="Concept Map"
        title="The whole journey in one picture"
        desc="Start with raw pixels. Learn filters. Slide them across the image. Stack the results into a hierarchy of understanding."
      />

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {nodes.map((n) => (
            <div
              key={n.label}
              className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default"
              style={{ borderColor: n.color + "55" }}
            >
              <div
                className="text-xs font-bold font-mono"
                style={{ color: n.color }}
              >
                {n.label}
              </div>
              <div className="text-[10px] text-foreground-muted leading-relaxed">
                {n.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* SECTION 9 — FOOTER                                                        */
/* -------------------------------------------------------------------------- */

function PageFooter() {
  return (
    <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
      <p className="text-foreground-muted text-sm max-w-lg">
        Basically: a CNN is a stack of tiny pattern detectors, slid across an
        image over and over, learning on their own which patterns actually
        matter — pixels in, understanding out.
      </p>

      <Link
        href="/deep-learning"
        className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all"
      >
        ← Deep Learning
      </Link>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function ConvolutionalNeuralNetworksPage() {
  return (
    <div className="relative min-h-screen text-foreground px-4 md:px-10 py-16 max-w-5xl mx-auto overflow-x-hidden space-y-24">
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent/6 blur-[160px]" />
        <div className="absolute right-0 top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#ffd166]/5 blur-[130px]" />
        <div className="absolute left-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#ff5f9e]/5 blur-[130px]" />
      </div>

      <HeroWidget />
      <FirstIntuition />
      <DeeperMechanics />
      <NumberCrunchingLab />
      <ThreeDSpace />
      <RealWorldData />
      <ClassicAI />
      <DeepLearningAI />
      <ConceptMap />
      <PageFooter />
    </div>
  );
}