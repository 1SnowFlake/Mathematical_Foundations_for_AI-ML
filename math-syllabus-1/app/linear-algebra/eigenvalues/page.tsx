"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MathBlock from "@/components/primitives/MathBlock";

const W = 480, H = 480, SCALE = 44;
const OX = W / 2, OY = H / 2;

function toSvg(x: number, y: number) {
  return { x: OX + x * SCALE, y: OY - y * SCALE };
}

function toGrid(svgX: number, svgY: number, snap = 0.5) {
  return {
    x: Math.round(((svgX - OX) / SCALE) / snap) * snap,
    y: Math.round(((-(svgY - OY)) / SCALE) / snap) * snap,
  };
}

const LIMIT = 4.5;

function clamp(n: number) {
  return Math.max(-LIMIT, Math.min(LIMIT, n));
}

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="8"
      refY="5"
      markerWidth="5"
      markerHeight="5"
      orient="auto"
    >
      <path d="M 0 1 L 9 5 L 0 9 z" fill={color} />
    </marker>
  );
}

function GridLines() {
  const lines: React.ReactNode[] = [];

  for (let i = -5; i <= 5; i++) {
    const vp = toSvg(i, 0);
    const hp = toSvg(0, i);
    const bold = i === 0;

    lines.push(
      <line
        key={`v${i}`}
        x1={vp.x}
        y1={0}
        x2={vp.x}
        y2={H}
        stroke={
          bold
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.07)"
        }
        strokeWidth={bold ? 1.5 : 1}
      />,
      <line
        key={`h${i}`}
        x1={0}
        y1={hp.y}
        x2={W}
        y2={hp.y}
        stroke={
          bold
            ? "rgba(255,255,255,0.35)"
            : "rgba(255,255,255,0.07)"
        }
        strokeWidth={bold ? 1.5 : 1}
      />
    );

    if (i !== 0) {
      lines.push(
        <text
          key={`lv${i}`}
          x={vp.x}
          y={OY + 16}
          fill="rgba(255,255,255,0.25)"
          fontSize="9"
          textAnchor="middle"
        >
          {i}
        </text>,
        <text
          key={`lh${i}`}
          x={OX - 14}
          y={hp.y + 3.5}
          fill="rgba(255,255,255,0.25)"
          fontSize="9"
          textAnchor="middle"
        >
          {i}
        </text>
      );
    }
  }

  return <>{lines}</>;
}

function DragHandle({
  x,
  y,
  color,
  svgRef,
  onDrag,
}: {
  x: number;
  y: number;
  color: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onDrag: (x: number, y: number) => void;
}) {
  const dragging = useRef(false);
  const p = toSvg(x, y);

  return (
    <circle
      cx={p.x}
      cy={p.y}
      r={10}
      fill={color}
      fillOpacity={0.9}
      stroke="white"
      strokeWidth={2}
      style={{
        cursor: "grab",
        filter: `drop-shadow(0 0 6px ${color})`,
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !svgRef.current) return;

        const r = svgRef.current.getBoundingClientRect();
        const g = toGrid(e.clientX - r.left, e.clientY - r.top);

        onDrag(clamp(g.x), clamp(g.y));
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
    />
  );
}

interface Vector2 {
  x: number;
  y: number;
}

function magnitude(v: Vector2) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function matrixVector(
  a: number,
  b: number,
  c: number,
  d: number,
  v: Vector2
): Vector2 {
  return {
    x: a * v.x + b * v.y,
    y: c * v.x + d * v.y,
  };
}

function HeroWidget() {
  return (
    <header className="space-y-6">
      <div>
        <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">
          Linear Algebra · Topic 7
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
          What is{" "}
          <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">
            Change of Basis, Eigenvectors & Eigenvalues?
          </span>
        </h1>
      </div>

      <div className="max-w-3xl space-y-4">
        <p className="text-lg text-foreground-muted leading-relaxed">
          Imagine playing a video game where you suddenly rotate the camera.
          Your character has not moved — but the way you describe their
          position has completely changed.{" "}
          <strong className="text-foreground">
            Change of basis is basically changing the coordinate system you use
            to describe the same world.
          </strong>
        </p>

        <p className="text-lg text-foreground-muted leading-relaxed">
          Eigenvectors take this idea somewhere cooler: they are special
          directions that a transformation refuses to turn. The transformation
          may stretch them, squash them, or flip them — but they stay on the
          same line.
        </p>

        <p className="text-sm text-foreground-muted leading-relaxed">
          In AI and machine learning, eigenvectors and eigenvalues help models
          find the most important directions hidden inside huge datasets,
          powering techniques such as{" "}
          <strong className="text-[#6366f1]">
            PCA dimensionality reduction
          </strong>
          .
        </p>
      </div>
    </header>
  );
}

function FirstIntuition() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [vector, setVector] = useState<Vector2>({
    x: 2,
    y: 1,
  });

  const lambda = 1.5;

  const transformed: Vector2 = {
    x: vector.x * lambda,
    y: vector.y * lambda,
  };

  const p = toSvg(vector.x, vector.y);
  const tp = toSvg(transformed.x, transformed.y);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#ffd166]">
          1 · First Intuition
        </div>

        <h2 className="text-2xl font-bold">
          The special direction that refuses to turn
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed max-w-3xl">
          Think about zooming into a photo. Everything gets bigger, but a line
          pointing northeast still points northeast. An{" "}
          <strong className="text-foreground">eigenvector</strong> is a vector
          that keeps its direction after a transformation. The number telling
          you how much it stretches or flips is its{" "}
          <strong className="text-foreground">eigenvalue</strong>.
        </p>
      </div>

      <MathBlock tex="\mathbf{A}\mathbf{v}=\lambda\mathbf{v}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 relative">
          <svg
            ref={svgRef}
            width={W}
            height={H}
            className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair"
            style={{ maxWidth: "100%" }}
          >
            <defs>
              <ArrowMarker id="first-original" color="#ff5f9e" />
              <ArrowMarker id="first-scaled" color="#ffd166" />
            </defs>

            <GridLines />

            <line
              x1={OX}
              y1={OY}
              x2={tp.x}
              y2={tp.y}
              stroke="#ffd166"
              strokeWidth={5}
              markerEnd="url(#first-scaled)"
              opacity={0.8}
            />

            <line
              x1={OX}
              y1={OY}
              x2={p.x}
              y2={p.y}
              stroke="#ff5f9e"
              strokeWidth={4}
              markerEnd="url(#first-original)"
            />

            <text
              x={p.x + 10}
              y={p.y - 12}
              fill="#ff5f9e"
              fontSize="13"
              fontFamily="monospace"
            >
              v
            </text>

            <text
              x={tp.x + 10}
              y={tp.y - 12}
              fill="#ffd166"
              fontSize="13"
              fontFamily="monospace"
            >
              λv
            </text>

            <DragHandle
              x={vector.x}
              y={vector.y}
              color="#ff5f9e"
              svgRef={svgRef}
              onDrag={(x, y) => setVector({ x, y })}
            />
          </svg>

          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
            ✦ Drag me! Watch the scaled vector move too
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div>
            <h3 className="text-lg font-bold">Same direction, new length</h3>

            <p className="text-sm text-foreground-muted leading-relaxed mt-2">
              The pink vector is your original direction. The yellow vector is
              the result after multiplying by the eigenvalue{" "}
              <span className="font-mono text-[#ffd166]">{lambda}</span>.
              Notice how they stay perfectly aligned.
            </p>
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">
              Formula
            </div>

            <MathBlock tex="\mathbf{A}\mathbf{v}=\lambda\mathbf{v}" />

            <div className="mt-3 text-xs font-mono text-foreground-muted">
              λ = {lambda}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "Original length",
                value: magnitude(vector).toFixed(2),
                color: "border-[#ff5f9e] text-[#ff5f9e]",
              },
              {
                label: "New length",
                value: magnitude(transformed).toFixed(2),
                color: "border-[#ffd166] text-[#ffd166]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                  {s.label}
                </div>

                <div className="text-2xl font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#ffd166] pl-3">
            <strong className="text-foreground">The big idea:</strong> most
            vectors get rotated by a transformation. Eigenvectors are the rare
            directions that say,{" "}
            <em>"Nope. You can stretch me, but you cannot turn me."</em>
          </p>
        </div>
      </div>
    </section>
  );
}

function DeeperMechanics() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [vector, setVector] = useState<Vector2>({
    x: 2,
    y: 1,
  });

  const [lambda, setLambda] = useState(2);

  const transformed = {
    x: vector.x * lambda,
    y: vector.y * lambda,
  };

  const originalP = toSvg(vector.x, vector.y);
  const transformedP = toSvg(transformed.x, transformed.y);

  const flipped = lambda < 0;
  const vanished = Math.abs(lambda) < 0.1;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#a78bfa]">
          2 · Deeper Mechanics
        </div>

        <h2 className="text-2xl font-bold">
          Stretch, squash, flip — eigenvalues control the drama
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed max-w-3xl">
          Imagine a game character running along a rail. They can speed up,
          slow down, or run backward — but they cannot leave the rail.
          Eigenvalues control exactly that kind of behavior.
        </p>
      </div>

      <MathBlock tex="\mathbf{A}\mathbf{v}=\lambda\mathbf{v}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 relative">
          <svg
            ref={svgRef}
            width={W}
            height={H}
            className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair"
            style={{ maxWidth: "100%" }}
          >
            <defs>
              <ArrowMarker id="mechanic-original" color="#22e5c9" />
              <ArrowMarker
                id="mechanic-transformed"
                color={flipped ? "#fb923c" : "#a78bfa"}
              />
            </defs>

            <GridLines />

            <line
              x1={OX}
              y1={OY}
              x2={originalP.x}
              y2={originalP.y}
              stroke="#22e5c9"
              strokeWidth={4}
              markerEnd="url(#mechanic-original)"
            />

            {!vanished && (
              <line
                x1={OX}
                y1={OY}
                x2={transformedP.x}
                y2={transformedP.y}
                stroke={flipped ? "#fb923c" : "#a78bfa"}
                strokeWidth={5}
                markerEnd="url(#mechanic-transformed)"
              />
            )}

            <DragHandle
              x={vector.x}
              y={vector.y}
              color="#22e5c9"
              svgRef={svgRef}
              onDrag={(x, y) => setVector({ x, y })}
            />
          </svg>

          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
            ✦ Drag the cyan vector and compare both directions
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div>
            <h3 className="text-lg font-bold">Control the eigenvalue</h3>

            <p className="text-sm text-foreground-muted leading-relaxed mt-2">
              ✦ Move the slider to stretch the vector. Try pushing it past
              zero. What happens when you make it negative?
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-foreground-muted">Eigenvalue λ</span>

              <span
                className={
                  lambda >= 0 ? "text-[#34d399]" : "text-[#fb923c]"
                }
              >
                {lambda.toFixed(1)}
              </span>
            </div>

            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={lambda}
              onChange={(e) => setLambda(Number(e.target.value))}
              className="w-full accent-[#a78bfa]"
            />
          </div>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${flipped
                ? "border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"
                : "border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]"
              }`}
          >
            {flipped
              ? "⚠️ Warning — negative eigenvalue! The vector flips to the opposite direction."
              : vanished
                ? "⚠️ Warning — λ ≈ 0 squashes this direction almost completely."
                : "✓ Notice how the vector stays on the same line while its length changes."}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "λ sign",
                value: lambda >= 0 ? "+" : "−",
                color:
                  lambda >= 0
                    ? "border-[#34d399] text-[#34d399]"
                    : "border-[#fb923c] text-[#fb923c]",
              },
              {
                label: "Scale factor",
                value: Math.abs(lambda).toFixed(1),
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                  {s.label}
                </div>

                <div className="text-2xl font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NumberCrunchingLab() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [a, setA] = useState(3);
  const [d, setD] = useState(2);
  const [vector, setVector] = useState<Vector2>({
    x: 2,
    y: 1,
  });

  const discriminant = (a + d) * (a + d) - 4 * a * d;
  const lambda1 = ((a + d) + Math.sqrt(Math.max(0, discriminant))) / 2;
  const lambda2 = ((a + d) - Math.sqrt(Math.max(0, discriminant))) / 2;

  const p = toSvg(vector.x, vector.y);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#ffd166]">
          3 · Number Crunching Lab
        </div>

        <h2 className="text-2xl font-bold">
          A quick tip for computing eigenvalues
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed max-w-3xl">
          Here is the cheat code: instead of randomly guessing eigenvalues,
          start from the{" "}
          <strong className="text-foreground">characteristic equation</strong>.
          For a diagonal matrix, life gets especially easy — the diagonal
          entries are already the eigenvalues.
        </p>
      </div>

      <MathBlock tex="\det(\mathbf{A}-\lambda\mathbf{I})=0" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 relative">
          <svg
            ref={svgRef}
            width={W}
            height={H}
            className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair"
            style={{ maxWidth: "100%" }}
          >
            <defs>
              <ArrowMarker id="crunch-vector" color="#ffd166" />
            </defs>

            <GridLines />

            <line
              x1={OX}
              y1={OY}
              x2={p.x}
              y2={p.y}
              stroke="#ffd166"
              strokeWidth={4}
              markerEnd="url(#crunch-vector)"
            />

            <DragHandle
              x={vector.x}
              y={vector.y}
              color="#ffd166"
              svgRef={svgRef}
              onDrag={(x, y) => setVector({ x, y })}
            />

            <text
              x={20}
              y={32}
              fill="rgba(255,255,255,0.55)"
              fontFamily="monospace"
              fontSize="12"
            >
              A = [[{a}, 0], [0, {d}]]
            </text>
          </svg>

          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
            ✦ Drag the yellow dot while changing the matrix
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div>
            <h3 className="text-lg font-bold">
              The diagonal matrix shortcut
            </h3>

            <p className="text-sm text-foreground-muted leading-relaxed mt-2">
              ✦ Move the sliders. Because the off-diagonal values are zero,
              the matrix stretches the x- and y-directions independently.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-[#ff5f9e]">x scale: a</span>
                <span>{a.toFixed(1)}</span>
              </div>

              <input
                type="range"
                min="-4"
                max="4"
                step="0.5"
                value={a}
                onChange={(e) => setA(Number(e.target.value))}
                className="w-full accent-[#ff5f9e]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-[#22e5c9]">y scale: d</span>
                <span>{d.toFixed(1)}</span>
              </div>

              <input
                type="range"
                min="-4"
                max="4"
                step="0.5"
                value={d}
                onChange={(e) => setD(Number(e.target.value))}
                className="w-full accent-[#22e5c9]"
              />
            </div>
          </div>

          <div className="bg-background border border-border rounded-xl p-4 space-y-3">
            <div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">
              Live calculation
            </div>

            <div className="font-mono text-sm">
              <span className="text-[#a78bfa]">A</span>
              {" = "}
              <span className="text-[#ff5f9e]">[ {a} </span>
              <span className="text-foreground-muted">0 ]</span>
              <br />
              <span className="ml-10 text-[#22e5c9]">[ 0 {d} ]</span>
            </div>

            <div className="font-mono text-sm text-foreground-muted">
              det(A − λI) = ({a} − λ)({d} − λ)
            </div>

            <div className="font-mono text-sm">
              λ₁ ={" "}
              <span
                className={
                  lambda1 >= 0 ? "text-[#34d399]" : "text-[#fb923c]"
                }
              >
                {lambda1.toFixed(2)}
              </span>
              {" · "}
              λ₂ ={" "}
              <span
                className={
                  lambda2 >= 0 ? "text-[#34d399]" : "text-[#fb923c]"
                }
              >
                {lambda2.toFixed(2)}
              </span>
            </div>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#a78bfa] pl-3">
            <strong className="text-foreground">Quick tip:</strong> for a
            triangular matrix, the eigenvalues are also sitting right on the
            main diagonal. Before doing a huge determinant calculation, always
            inspect the matrix first.
          </p>
        </div>
      </div>
    </section>
  );
}

function ThreeDSpace() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [x, setX] = useState(2);
  const [y, setY] = useState(1.5);
  const [z, setZ] = useState(2.5);

  const vectorRef = useRef(new THREE.Vector3(x, y, z));

  useEffect(() => {
    vectorRef.current.set(x, y, z);
  }, [x, y, z]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);

    const width = container.clientWidth;
    const height = 420;

    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      100
    );

    camera.position.set(7, 6, 8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.07;

    const grid = new THREE.GridHelper(10, 10, 0x333344, 0x181820);
    scene.add(grid);

    const xAxis = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 0),
      4.5,
      0xff5f9e,
      0.25,
      0.15
    );

    const yAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      4.5,
      0x22e5c9,
      0.25,
      0.15
    );

    const zAxis = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, 0),
      4.5,
      0xffd166,
      0.25,
      0.15
    );

    scene.add(xAxis, yAxis, zAxis);

    const eigenArrow = new THREE.ArrowHelper(
      new THREE.Vector3(1, 1, 1).normalize(),
      new THREE.Vector3(0, 0, 0),
      1,
      0xa78bfa,
      0.3,
      0.18
    );

    scene.add(eigenArrow);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    let animationFrame = 0;

    const animate = () => {
      const v = vectorRef.current;
      const length = Math.max(0.001, v.length());

      const direction = v.clone().normalize();

      eigenArrow.setDirection(direction);
      eigenArrow.setLength(length, 0.3, 0.18);

      controls.update();
      renderer.render(scene, camera);

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    const onResize = () => {
      if (!container) return;

      const newWidth = container.clientWidth;

      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();

      renderer.setSize(newWidth, height);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onResize);

      controls.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      scene.clear();
    };
  }, []);

  const mag = Math.sqrt(x * x + y * y + z * z);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#ffd166]">
          4 · 3D Space
        </div>

        <h2 className="text-2xl font-bold">
          Eigenvectors do not stop at flat screens
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed max-w-3xl">
          A video game world is three-dimensional. So are many real datasets.
          In 3D, an eigenvector is still a special direction — a line through
          space that a transformation can stretch without knocking it sideways.
        </p>
      </div>

      <MathBlock tex="\mathbf{v}=\begin{bmatrix}x\\y\\z\end{bmatrix}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5 relative">
          <div
            ref={containerRef}
            className="rounded-xl overflow-hidden bg-[#080810] w-full"
          />

          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
            🖱️ Drag to orbit · Scroll to zoom
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <div>
            <h3 className="text-lg font-bold">Build a direction in space</h3>

            <p className="text-sm text-foreground-muted leading-relaxed mt-2">
              ✦ Move the X, Y and Z sliders. The purple arrow changes instantly
              inside the 3D world.
            </p>
          </div>

          {[
            {
              label: "X component",
              value: x,
              setValue: setX,
              color: "#ff5f9e",
            },
            {
              label: "Y component",
              value: y,
              setValue: setY,
              color: "#22e5c9",
            },
            {
              label: "Z component",
              value: z,
              setValue: setZ,
              color: "#ffd166",
            },
          ].map((axis) => (
            <div key={axis.label}>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span style={{ color: axis.color }}>{axis.label}</span>
                <span>{axis.value.toFixed(1)}</span>
              </div>

              <input
                type="range"
                min="-4"
                max="4"
                step="0.1"
                value={axis.value}
                onChange={(e) => axis.setValue(Number(e.target.value))}
                className="w-full accent-[#a78bfa]"
              />
            </div>
          ))}

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              Column vector
            </div>

            <div className="font-mono text-xl leading-relaxed">
              <span className="text-[#a78bfa]">[</span>{" "}
              <span className={x >= 0 ? "text-[#34d399]" : "text-[#fb923c]"}>
                {x.toFixed(1)}
              </span>{" "}
              <span className="text-[#a78bfa]">]</span>
              <br />
              <span className="text-[#a78bfa]">[</span>{" "}
              <span className={y >= 0 ? "text-[#34d399]" : "text-[#fb923c]"}>
                {y.toFixed(1)}
              </span>{" "}
              <span className="text-[#a78bfa]">]</span>
              <br />
              <span className="text-[#a78bfa]">[</span>{" "}
              <span className={z >= 0 ? "text-[#34d399]" : "text-[#fb923c]"}>
                {z.toFixed(1)}
              </span>{" "}
              <span className="text-[#a78bfa]">]</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#ffd166] text-[#ffd166] rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                Magnitude
              </div>

              <div className="text-2xl font-bold font-mono mt-1">
                {mag.toFixed(2)}
              </div>
            </div>

            <div className="border border-[#a78bfa] text-[#a78bfa] rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                Dimension
              </div>

              <div className="text-2xl font-bold font-mono mt-1">3D</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RealWorldData() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [features, setFeatures] = useState({
    price: true,
    rooms: true,
    distance: false,
    age: false,
    area: true,
  });

  const [point, setPoint] = useState<Vector2>({
    x: 2,
    y: 1.5,
  });

  const featureList = [
    {
      key: "price" as const,
      label: "Price",
      value: "₹65L",
      number: 65,
      color: "#ff5f9e",
    },
    {
      key: "rooms" as const,
      label: "Rooms",
      value: "3",
      number: 3,
      color: "#22e5c9",
    },
    {
      key: "distance" as const,
      label: "Distance",
      value: "7 km",
      number: 7,
      color: "#ffd166",
    },
    {
      key: "age" as const,
      label: "Age",
      value: "8 yrs",
      number: 8,
      color: "#fb923c",
    },
    {
      key: "area" as const,
      label: "Area",
      value: "1400",
      number: 14,
      color: "#a78bfa",
    },
  ];

  const activeFeatures = featureList.filter((f) => features[f.key]);

  const p = toSvg(point.x, point.y);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#22e5c9]">
          5 · Real-World Object as Data
        </div>

        <h2 className="text-2xl font-bold">
          How does a house become math?
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed max-w-3xl">
          When you scroll through a property app, a house looks like photos and
          text. To a machine learning model, it becomes a list of numbers.
          Each number is a{" "}
          <strong className="text-foreground">feature</strong> — one measurable
          piece of information.
        </p>
      </div>

      <MathBlock tex="\mathbf{x}=\begin{bmatrix}x_1\\x_2\\\vdots\\x_n\end{bmatrix}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 relative">
          <svg
            ref={svgRef}
            width={W}
            height={H}
            className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair"
            style={{ maxWidth: "100%" }}
          >
            <defs>
              <ArrowMarker id="house-data" color="#a78bfa" />
            </defs>

            <GridLines />

            <circle
              cx={OX}
              cy={OY}
              r={110}
              fill="#a78bfa"
              fillOpacity={0.04}
              stroke="#a78bfa"
              strokeOpacity={0.3}
              strokeDasharray="5 7"
            />

            <line
              x1={OX}
              y1={OY}
              x2={p.x}
              y2={p.y}
              stroke="#a78bfa"
              strokeWidth={4}
              markerEnd="url(#house-data)"
            />

            <DragHandle
              x={point.x}
              y={point.y}
              color="#a78bfa"
              svgRef={svgRef}
              onDrag={(x, y) => setPoint({ x, y })}
            />

            <text
              x={20}
              y={30}
              fill="rgba(255,255,255,0.45)"
              fontSize="12"
              fontFamily="monospace"
            >
              feature space
            </text>
          </svg>

          <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
            ✦ Drag the data point through feature space
          </div>
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div>
            <h3 className="text-lg font-bold">Toggle the dimensions</h3>

            <p className="text-sm text-foreground-muted leading-relaxed mt-2">
              ✦ Add or remove features. Notice how the data vector grows and
              shrinks. More features means a higher-dimensional description.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {featureList.map((feature) => (
              <button
                key={feature.key}
                onClick={() =>
                  setFeatures((current) => ({
                    ...current,
                    [feature.key]: !current[feature.key],
                  }))
                }
                className={`text-xs font-mono px-3 py-2 rounded-lg border transition-all ${features[feature.key]
                    ? "bg-background"
                    : "opacity-40 bg-background/30"
                  }`}
                style={{
                  borderColor: `${feature.color}88`,
                  color: feature.color,
                }}
              >
                {features[feature.key] ? "✓ " : "+ "}
                {feature.label}
              </button>
            ))}
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              House as a column vector
            </div>

            {activeFeatures.length === 0 ? (
              <div className="font-mono text-sm text-[#fb923c]">
                [ no features selected ]
              </div>
            ) : (
              <div className="font-mono text-sm space-y-1">
                {activeFeatures.map((feature) => (
                  <div
                    key={feature.key}
                    style={{ color: feature.color }}
                    className="flex justify-between"
                  >
                    <span>[ {feature.number} ]</span>
                    <span className="text-foreground-muted">
                      {feature.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#22e5c9] text-[#22e5c9] rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                Active features
              </div>

              <div className="text-2xl font-bold font-mono mt-1">
                {activeFeatures.length}
              </div>
            </div>

            <div className="border border-[#a78bfa] text-[#a78bfa] rounded-xl p-3 bg-background/60">
              <div className="text-[10px] uppercase tracking-widest text-foreground-muted">
                Vector size
              </div>

              <div className="text-2xl font-bold font-mono mt-1">
                {activeFeatures.length}D
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClassicAI() {
  const [x1, setX1] = useState(3);
  const [x2, setX2] = useState(2);
  const [w1, setW1] = useState(1.2);
  const [w2, setW2] = useState(-0.6);
  const [bias, setBias] = useState(0.5);

  const output = x1 * w1 + x2 * w2 + bias;
  const threshold = 2;
  const fires = output > threshold;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#6366f1]">
          6 · Eigenvalues in Classic AI — PCA
        </div>

        <h2 className="text-2xl font-bold">
          You know how a giant dataset can have way too much information?
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed max-w-3xl">
          Imagine trying to describe every song using thousands of numbers:
          tempo, bass, vocals, genre signals, popularity, and more.{" "}
          <strong className="text-foreground">
            Principal Component Analysis (PCA)
          </strong>{" "}
          looks for the directions where the data changes the most — and
          eigenvectors help find them.
        </p>
      </div>

      <MathBlock tex="\mathbf{C}\mathbf{v}=\lambda\mathbf{v}" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-1/2 space-y-5">
          <h3 className="text-lg font-bold">A tiny importance simulator</h3>

          <p className="text-sm text-foreground-muted leading-relaxed">
            ✦ Adjust the two features and their weights. Think of the result as
            a toy "importance score" showing why changing directions and scales
            matters before PCA chooses important axes.
          </p>

          {[
            {
              label: "Feature x₁",
              value: x1,
              setValue: setX1,
              min: -4,
              max: 4,
            },
            {
              label: "Feature x₂",
              value: x2,
              setValue: setX2,
              min: -4,
              max: 4,
            },
            {
              label: "Weight w₁",
              value: w1,
              setValue: setW1,
              min: -2,
              max: 2,
            },
            {
              label: "Weight w₂",
              value: w2,
              setValue: setW2,
              min: -2,
              max: 2,
            },
            {
              label: "Bias",
              value: bias,
              setValue: setBias,
              min: -2,
              max: 2,
            },
          ].map((control) => (
            <div key={control.label}>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-foreground-muted">{control.label}</span>
                <span>{control.value.toFixed(1)}</span>
              </div>

              <input
                type="range"
                min={control.min}
                max={control.max}
                step="0.1"
                value={control.value}
                onChange={(e) =>
                  control.setValue(Number(e.target.value))
                }
                className="w-full accent-[#6366f1]"
              />
            </div>
          ))}
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div className="bg-background border border-border rounded-xl p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-3">
              Live weighted calculation
            </div>

            <div className="font-mono text-sm text-foreground-muted">
              ({x1.toFixed(1)} × {w1.toFixed(1)}) +
              <br />
              ({x2.toFixed(1)} × {w2.toFixed(1)}) +
              <br />
              {bias.toFixed(1)}
            </div>

            <div className="mt-4 text-[10px] uppercase tracking-widest text-foreground-muted">
              Importance output
            </div>

            <div className="text-4xl font-extrabold font-mono text-[#6366f1] mt-1">
              {output.toFixed(2)}
            </div>
          </div>

          <div
            className={`text-xs font-mono px-3 py-2 rounded-lg border ${fires
                ? "border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]"
                : "border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"
              }`}
          >
            {fires
              ? "✓ Model fires — prediction: YES"
              : "✗ Below threshold — prediction: NO"}
          </div>

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">
              Why eigenvalues matter in PCA
            </div>

            <p className="text-sm text-foreground-muted leading-relaxed">
              PCA computes eigenvectors of a covariance matrix. A bigger
              eigenvalue means that eigenvector points along a direction where
              the dataset has more variation — basically,{" "}
              <strong className="text-[#ffd166]">
                more useful information.
              </strong>
            </p>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3">
            This is literally what happens inside{" "}
            <strong className="text-foreground">PCA preprocessing</strong> when
            a machine learning system compresses messy high-dimensional data
            before trying to learn patterns from it.
          </p>
        </div>
      </div>
    </section>
  );
}

function DeepLearningAI() {
  const [focus, setFocus] = useState(1.2);
  const [temperature, setTemperature] = useState(1);
  const [queryScale, setQueryScale] = useState(1);

  const baseMatrix = [
    [0.2, 0.6, 0.1, 0.4],
    [0.5, 0.3, 0.8, 0.2],
    [0.1, 0.7, 0.4, 0.6],
    [0.8, 0.2, 0.5, 0.3],
  ];

  const matrix = baseMatrix.map((row, i) => {
    const raw = row.map((value, j) => {
      const focused = i === j ? value * focus : value;
      return focused * queryScale;
    });

    const exps = raw.map((value) =>
      Math.exp(value / Math.max(0.1, temperature))
    );

    const sum = exps.reduce((acc, value) => acc + value, 0);

    return exps.map((value) => value / sum);
  });

  const flat = matrix.flat();

  const maxAttention = Math.max(...flat);
  const maxIndex = flat.indexOf(maxAttention);
  const maxRow = Math.floor(maxIndex / 4);
  const maxCol = maxIndex % 4;

  const entropy =
    -flat.reduce(
      (acc, p) => acc + p * Math.log2(Math.max(p, 0.00001)),
      0
    ) / 4;

  const cellSize = 70;

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#6366f1]">
          7 · Eigenvectors in Deep Learning — Transformer Self-Attention
        </div>

        <h2 className="text-2xl font-bold">
          This is how modern AI decides what deserves attention
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed max-w-3xl">
          When you type a sentence into a Transformer, the model needs to
          figure out which words are related. The attention mechanism compares
          vectors and creates a map of{" "}
          <strong className="text-foreground">who should pay attention to
            whom</strong>. Eigenvector-style thinking also appears throughout
          deep learning when models study important directions in huge
          representations.
        </p>
      </div>

      <MathBlock tex="\operatorname{Attention}(Q,K,V)=\operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V" />

      <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6">
        <div className="w-full lg:w-3/5 space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-[#0a0a0c] p-4">
            <svg
              width={320}
              height={320}
              viewBox="0 0 320 320"
              className="w-full max-w-[380px] mx-auto"
            >
              <text
                x={160}
                y={18}
                textAnchor="middle"
                fill="rgba(255,255,255,0.55)"
                fontSize="11"
                fontFamily="monospace"
              >
                attention weights
              </text>

              {matrix.map((row, i) =>
                row.map((val, j) => (
                  <g key={`${i}-${j}`}>
                    <rect
                      x={20 + j * cellSize}
                      y={35 + i * cellSize}
                      width={cellSize - 2}
                      height={cellSize - 2}
                      fill="#6366f1"
                      fillOpacity={Math.max(0.05, Math.min(1, val * 2.8))}
                      rx={6}
                    />

                    <text
                      x={20 + j * cellSize + (cellSize - 2) / 2}
                      y={35 + i * cellSize + 40}
                      textAnchor="middle"
                      fill="white"
                      fontSize={9}
                      fontFamily="monospace"
                    >
                      {val.toFixed(2)}
                    </text>
                  </g>
                ))
              )}
            </svg>

            <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">
              ✦ Move the sliders to reshape attention
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Max attention",
                value: maxAttention.toFixed(3),
                color: "border-[#ffd166] text-[#ffd166]",
              },
              {
                label: "Entropy",
                value: entropy.toFixed(2),
                color: "border-[#22e5c9] text-[#22e5c9]",
              },
              {
                label: "Strongest link",
                value: `${maxRow + 1}→${maxCol + 1}`,
                color: "border-[#a78bfa] text-[#a78bfa]",
              },
            ].map((s) => (
              <div
                key={s.label}
                className={`border rounded-xl p-3 bg-background/60 ${s.color}`}
              >
                <div className="text-[9px] uppercase tracking-widest text-foreground-muted">
                  {s.label}
                </div>

                <div className="text-lg font-bold font-mono mt-1">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-2/5 space-y-5">
          <div>
            <h3 className="text-lg font-bold">
              Tune the attention engine
            </h3>

            <p className="text-sm text-foreground-muted leading-relaxed mt-2">
              ✦ Make diagonal focus stronger to encourage tokens to look at
              themselves. Change temperature to make attention more confident
              or more spread out.
            </p>
          </div>

          {[
            {
              label: "Self-focus",
              value: focus,
              setValue: setFocus,
              min: 0.1,
              max: 3,
            },
            {
              label: "Temperature",
              value: temperature,
              setValue: setTemperature,
              min: 0.2,
              max: 2.5,
            },
            {
              label: "Query strength",
              value: queryScale,
              setValue: setQueryScale,
              min: 0.2,
              max: 2.5,
            },
          ].map((control) => (
            <div key={control.label}>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-foreground-muted">{control.label}</span>
                <span className="text-[#6366f1]">
                  {control.value.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min={control.min}
                max={control.max}
                step="0.05"
                value={control.value}
                onChange={(e) =>
                  control.setValue(Number(e.target.value))
                }
                className="w-full accent-[#6366f1]"
              />
            </div>
          ))}

          <div className="bg-background border border-border rounded-xl p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">
              Modern AI connection
            </div>

            <div className="text-4xl font-extrabold font-mono text-[#6366f1]">
              {maxAttention.toFixed(3)}
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed mt-2">
              The brightest tile represents the strongest relationship currently
              discovered by this tiny attention simulator.
            </p>
          </div>

          <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3">
            <strong className="text-foreground">Why does this matter?</strong>{" "}
            This exact attention operation runs enormous numbers of times inside
            Transformer models whenever you send text to an AI assistant.
            Understanding vectors, matrices, and important directions means
            understanding the mathematical engine behind modern AI.
          </p>
        </div>
      </div>
    </section>
  );
}

function ConceptMap() {
  const nodes = [
    {
      label: "Eigenvector",
      desc: "A direction that a transformation does not rotate.",
      color: "#ffd166",
    },
    {
      label: "Scaling",
      desc: "The vector stretches, shrinks, or flips.",
      color: "#ff5f9e",
    },
    {
      label: "Eigenvalue",
      desc: "The number measuring that stretch or flip.",
      color: "#22e5c9",
    },
    {
      label: "3D Extension",
      desc: "The same idea works for directions in space.",
      color: "#a78bfa",
    },
    {
      label: "Feature Vector",
      desc: "Real objects become lists of numerical features.",
      color: "#fb923c",
    },
    {
      label: "PCA",
      desc: "Uses eigenvectors to find important data directions.",
      color: "#34d399",
    },
    {
      label: "Transformer",
      desc: "Uses huge vector and matrix operations for attention.",
      color: "#6366f1",
    },
    {
      label: "Modern AI",
      desc: "State-of-the-art models learn patterns in high-dimensional spaces.",
      color: "#ffd166",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <div className="text-xs font-mono uppercase tracking-widest text-[#a78bfa]">
          8 · Concept Map
        </div>

        <h2 className="text-2xl font-bold">
          From one stubborn direction to modern AI
        </h2>

        <p className="text-sm text-foreground-muted leading-relaxed max-w-3xl">
          Here is the entire journey. Start with a strange mathematical idea,
          follow it through transformations and real data, and you eventually
          arrive at systems that process language and images.
        </p>
      </div>

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

function FooterWidget() {
  return (
    <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4">
      <p className="text-foreground-muted text-sm max-w-lg">
        Basically: eigenvectors are the directions a transformation cannot turn,
        and eigenvalues tell you exactly how much those directions get stretched
        — which is way more useful than it first sounds.
      </p>

      <Link
        href="/linear-algebra"
        className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all"
      >
        ← Linear Algebra
      </Link>
    </footer>
  );
}

export default function ChangeOfBasisEigenPage() {
  return (
    <main className="relative min-h-screen text-foreground px-4 md:px-10 py-16 max-w-5xl mx-auto overflow-x-hidden space-y-24">
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
      <FooterWidget />
    </main>
  );
}