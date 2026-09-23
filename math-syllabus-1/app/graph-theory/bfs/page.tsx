"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import MathBlock from "@/components/primitives/MathBlock";

const W = 480, H = 480, SCALE = 44;
const OX = W / 2, OY = H / 2;
const LIMIT = 4.5;

type Vec2 = { x: number; y: number };
type Node = { id: string; x: number; y: number };
type Edge = { from: string; to: string; weight: number };

interface DragHandleProps {
  x: number;
  y: number;
  color: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onDrag: (x: number, y: number) => void;
}

interface ConceptNode {
  label: string;
  desc: string;
  color: string;
}

function toSvg(x: number, y: number) { return { x: OX + x * SCALE, y: OY - y * SCALE }; }
function toGrid(svgX: number, svgY: number, snap = 0.5) {
  return {
    x: Math.round(((svgX - OX) / SCALE) / snap) * snap,
    y: Math.round(((-(svgY - OY)) / SCALE) / snap) * snap,
  };
}
function clamp(n: number) { return Math.max(-LIMIT, Math.min(LIMIT, n)); }
function ArrowMarker({ id, color }: { id: string; color: string }) {
  return <marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 1 L 9 5 L 0 9 z" fill={color} /></marker>;
}
function GridLines() {
  const lines: React.ReactNode[] = [];
  for (let i = -5; i <= 5; i++) {
    const vp = toSvg(i, 0), hp = toSvg(0, i), bold = i === 0;
    lines.push(
      <line key={`v${i}`} x1={vp.x} y1={0} x2={vp.x} y2={H} stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"} strokeWidth={bold ? 1.5 : 1} />,
      <line key={`h${i}`} x1={0} y1={hp.y} x2={W} y2={hp.y} stroke={bold ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.07)"} strokeWidth={bold ? 1.5 : 1} />,
    );
    if (i !== 0) {
      lines.push(
        <text key={`lv${i}`} x={vp.x} y={OY + 16} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">{i}</text>,
        <text key={`lh${i}`} x={OX - 14} y={hp.y + 3.5} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">{i}</text>,
      );
    }
  }
  return <>{lines}</>;
}
function DragHandle({ x, y, color, svgRef, onDrag }: DragHandleProps) {
  const dragging = useRef(false);
  const p = toSvg(x, y);
  return <circle cx={p.x} cy={p.y} r={10} fill={color} fillOpacity={0.9} stroke="white" strokeWidth={2}
    style={{ cursor: "grab", filter: `drop-shadow(0 0 6px ${color})` }}
    onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); }}
    onPointerMove={(e) => { if (!dragging.current || !svgRef.current) return; const r = svgRef.current.getBoundingClientRect(); const g = toGrid(((e.clientX-r.left)/r.width)*W, ((e.clientY-r.top)/r.height)*H); onDrag(clamp(g.x), clamp(g.y)); }}
    onPointerUp={(e) => { dragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }} />;
}
function NodeCircle({ node, color, active, onDrag, svgRef }: { node: Node; color: string; active: boolean; onDrag: (x:number,y:number)=>void; svgRef: React.RefObject<SVGSVGElement|null> }) {
  const p = toSvg(node.x, node.y);
  return <g>
    <circle cx={p.x} cy={p.y} r={16} fill={active ? color : "#15151b"} stroke={color} strokeWidth={2.5} />
    <text x={p.x} y={p.y+5} textAnchor="middle" fill={active ? "#0a0a0c" : color} fontSize="12" fontWeight="bold">{node.id}</text>
    <DragHandle x={node.x} y={node.y} color={color} svgRef={svgRef} onDrag={onDrag} />
  </g>;
}
const baseNodes: Node[] = [
  {id:"S",x:-3,y:1.8},{id:"A",x:-1,y:3},{id:"B",x:-1,y:0.5},{id:"C",x:1,y:2.2},{id:"D",x:1,y:-0.8},{id:"E",x:3,y:1.4},{id:"F",x:3,y:-1.8}
];
const edges: Edge[] = [
  {from:"S",to:"A",weight:1},{from:"S",to:"B",weight:1},{from:"A",to:"C",weight:1},{from:"B",to:"C",weight:1},{from:"B",to:"D",weight:1},{from:"C",to:"E",weight:1},{from:"D",to:"E",weight:1},{from:"D",to:"F",weight:1},{from:"E",to:"F",weight:1}
];
function edgePath(nodes: Node[], e: Edge) { const a=nodes.find(n=>n.id===e.from)!, b=nodes.find(n=>n.id===e.to)!; const p=toSvg(a.x,a.y), q=toSvg(b.x,b.y); return {p,q}; }
function GraphEdges({ nodes, weighted, markerId }: {nodes:Node[]; weighted:boolean; markerId:string}) {
  return <>{edges.map((e,i)=>{ const {p,q}=edgePath(nodes,e); return <g key={i}><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#a78bfa" strokeOpacity={0.55} strokeWidth={2.4} markerEnd={`url(#${markerId})`} />{weighted && <text x={(p.x+q.x)/2} y={(p.y+q.y)/2-7} fill="#ffd166" fontSize="10" fontFamily="monospace">{e.weight}</text>}</g>;})}</>;
}
function StepBadge({ text }: {text:string}) { return <div className="text-[10px] font-mono uppercase tracking-widest text-[#a78bfa] border border-[#a78bfa]/30 bg-[#a78bfa]/10 rounded-full px-3 py-1 w-fit">{text}</div>; }

function HeroWidget({ title, hook, number }: {title:string;hook:string;number:string}) {
  return <header className="space-y-6">
    <div className="inline-block text-xs font-mono uppercase tracking-widest text-accent border border-accent/30 bg-accent/10 px-3 py-1 rounded-full mb-2">Graph Algorithms · Topic {number}</div>
    <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">What is <span className="bg-gradient-to-r from-[#ffd166] via-[#ff5f9e] to-[#a78bfa] bg-clip-text text-transparent">{title}?</span></h1>
    <div className="max-w-3xl space-y-4">
      <p className="text-lg text-foreground-muted leading-relaxed">{hook}</p>
      <p className="text-sm text-foreground-muted leading-relaxed">A <strong className="text-foreground">graph</strong> is a map of points and connections. The algorithm chooses which point to inspect next so a machine can systematically explore that map.</p>
      <p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-4">In AI, search over graphs shows up in planning, recommendation systems, routing, knowledge graphs, and learning over connected data.</p>
    </div>
  </header>;
}

function FirstIntuition({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) {
  const svgRef=useRef<SVGSVGElement>(null); const [focus,setFocus]=useState("S");
  const [nodes,setNodes]=useState<Node[]>(baseNodes.map(n=>({...n})));
  const orderBfs=["S","A","B","C","D","E","F"]; const orderDfs=["S","A","C","E","F","D","B"]; const active=mode==="bfs"?orderBfs.slice(0,orderBfs.indexOf(focus)+1):mode==="dfs"?orderDfs.slice(0,orderDfs.indexOf(focus)+1):["S",focus];
  const title=mode==="bfs"?"BFS explores in layers":mode==="dfs"?"DFS follows one branch": "Dijkstra grows the cheapest frontier";
  const copy=mode==="bfs"?"Think of a fire spreading from one room: it reaches all rooms one step away before it moves to rooms two steps away.":mode==="dfs"?"Think of exploring a maze by taking one corridor as far as you can, then backtracking when you hit a dead end.":"Think of a delivery driver who always chooses the cheapest unfinished route from the current map.";
  return <section className="space-y-6"><div><div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">1 · First Intuition</div><h2 className="text-2xl font-bold">{title}</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">{copy}</p><div className="mt-4"><MathBlock tex={mode==="bfs"?"Q\\leftarrow Q\\,\\cup\\,\\{v\\}":mode==="dfs"?"DFS(v)\\rightarrow DFS(u_1),\\dots,DFS(u_k)":"d(v)=\\min_{u\\in F}\\left(d(u)+w(u,v)\\right)"} /></div></div>
    <div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6"><div className="w-full lg:w-3/5"><div className="relative"><svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none touch-none cursor-crosshair" style={{maxWidth:"100%"}}><defs><ArrowMarker id={`${mode}-a`} color="#a78bfa" /></defs><GridLines/><GraphEdges nodes={baseNodes} weighted={mode==="dijkstra"} markerId={`${mode}-a`}/>{nodes.map(n=><NodeCircle key={n.id} node={n} color={active.includes(n.id)?"#ffd166":"#ff5f9e"} active={active.includes(n.id)} svgRef={svgRef} onDrag={(nx,ny)=>setNodes(old=>old.map(v=>v.id===n.id?{...v,x:nx,y:ny}:v))} />)}</svg><div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Drag a node · click a letter below to advance</div></div><div className="grid grid-cols-2 gap-3 mt-4"><div className="border rounded-xl p-3 bg-background/60 border-[#ffd166] text-[#ffd166]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Current node</div><div className="text-2xl font-bold font-mono mt-1">{focus}</div></div><div className="border rounded-xl p-3 bg-background/60 border-indigo-400 text-indigo-400"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Visited</div><div className="text-2xl font-bold font-mono mt-1">{active.length}</div></div></div></div>
    <div className="w-full lg:w-2/5 space-y-5"><h3 className="text-lg font-bold">Drive the algorithm</h3><p className="text-sm text-foreground-muted leading-relaxed">Choose the next node and watch the highlighted frontier grow. The graph is the same; only the decision rule changes.</p><div className="grid grid-cols-4 gap-2">{(mode==="bfs"?orderBfs:mode==="dfs"?orderDfs:["S","A","B","C","D","E","F"]).map((id,i)=><button key={id} onClick={()=>setFocus(id)} className={`px-3 py-2 rounded-lg border text-xs font-mono ${focus===id?"border-[#ffd166] bg-[#ffd166]/10 text-[#ffd166]":"border-border bg-background text-foreground-muted"}`}>{i+1}:{id}</button>)}</div><div className="bg-background border border-border rounded-xl p-4"><div className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest mb-2">Rule</div><p className="text-sm text-foreground-muted leading-relaxed">{mode==="bfs"?"Use a queue: first in, first out. That guarantees layer-by-layer exploration.":mode==="dfs"?"Use a stack or recursion: follow the newest path first, then backtrack.":"Keep tentative distances and lock in the smallest unfinished distance."}</p></div><p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">Notice how:</strong> the visited count and highlighted path change as you move the step control.</p></div></div></section>;
}

function DeeperMechanics({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) {
  const [depth,setDepth]=useState(2); const [queue,setQueue]=useState(3); const score=mode==="bfs"?Math.min(7,1+queue):mode==="dfs"?Math.min(7,1+depth*2):Math.min(7,2+queue);
  return <section className="space-y-6"><div><div className="text-xs font-mono text-[#ff5f9e] uppercase tracking-widest mb-2">2 · Deeper Mechanics</div><h2 className="text-2xl font-bold">Change the search strategy</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Imagine a game map with a branching set of rooms. One algorithm can spread outward, another can chase a branch, and a weighted algorithm can care about the cost of every step.</p><div className="mt-4"><MathBlock tex={mode==="bfs"?"O(V+E)":mode==="dfs"?"O(V+E)":"O((V+E)\\log V)"} /></div></div><div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6"><div className="w-full lg:w-3/5"><div className="bg-background border border-border rounded-xl p-6"><h3 className="text-lg font-bold mb-4">Explorer controls</h3><label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Move the branch-depth slider: {depth}</label><input type="range" min="1" max="3" step="1" value={depth} onChange={e=>setDepth(Number(e.target.value))} className="w-full"/><label className="block text-xs font-mono text-[#22e5c9] mt-6 mb-2">✦ Move the frontier slider: {queue}</label><input type="range" min="1" max="5" step="1" value={queue} onChange={e=>setQueue(Number(e.target.value))} className="w-full"/></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="border rounded-xl p-3 bg-background/60 border-[#ffd166] text-[#ffd166]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Nodes reached</div><div className="text-2xl font-bold font-mono mt-1">{score}</div></div><div className="border rounded-xl p-3 bg-background/60 border-indigo-400 text-indigo-400"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Work units</div><div className="text-2xl font-bold font-mono mt-1">{score*depth}</div></div></div></div><div className="w-full lg:w-2/5 space-y-5"><h3 className="text-lg font-bold">What changes?</h3><div className={`text-xs font-mono px-3 py-2 rounded-lg border ${score>=5?"border-[#22e5c9]/40 bg-[#22e5c9]/10 text-[#22e5c9]":"border-[#ff5f9e]/40 bg-[#ff5f9e]/10 text-[#ff5f9e]"}`}>{score>=5?"✓ Notice how a wider frontier discovers more nodes quickly.":"⚠️ A narrow frontier spends more steps on fewer nodes."}</div><p className="text-sm text-foreground-muted leading-relaxed">For {mode.toUpperCase()}, the control changes how aggressively the search explores the graph. In a real implementation, the data structure behind the scenes is what creates this behavior.</p></div></div></section>;
}

function NumberCrunchingLab({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) {
  const [v,setV]=useState(7); const [e,setE]=useState(9); const [w,setW]=useState(4); const value=mode==="bfs"||mode==="dfs"?v+e:Math.round((v+e)*Math.log2(w+1));
  const formula=mode==="bfs"||mode==="dfs"?`T(n)=${v}+${e}=${value}`:`T(n)≈(${v}+${e})log₂(${w+1})`;
  return <section className="space-y-6"><div><div className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest mb-2">3 · Number Crunching Lab</div><h2 className="text-2xl font-bold">Turn the graph into a cost estimate</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">A graph algorithm is also a counting problem: how many nodes, how many edges, and—when weights matter—how much extra bookkeeping is needed?</p><div className="mt-4"><MathBlock tex={mode==="bfs"?"T=O(V+E)":mode==="dfs"?"T=O(V+E)":"T=O((V+E)\\log V)"} /></div></div><div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6"><div className="w-full lg:w-1/2 space-y-5"><div className="bg-background border border-border rounded-xl p-5"><h3 className="text-lg font-bold mb-4">Graph controls</h3><label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Nodes V = {v}</label><input type="range" min="3" max="12" step="1" value={v} onChange={e=>setV(Number(e.target.value))} className="w-full"/><label className="block text-xs font-mono text-[#22e5c9] mt-6 mb-2">✦ Edges E = {e}</label><input type="range" min="4" max="16" step="1" value={e} onChange={e=>setE(Number(e.target.value))} className="w-full"/><label className="block text-xs font-mono text-[#ffd166] mt-6 mb-2">✦ Weight range = {w}</label><input type="range" min="1" max="9" step="1" value={w} onChange={e=>setW(Number(e.target.value))} className="w-full"/></div><div className="bg-background border border-border rounded-xl p-5"><div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted mb-2">Live calculation</div><div className="font-mono text-lg">{formula}</div><div className={`mt-4 text-4xl font-extrabold font-mono ${value%2===0?"text-[#34d399]":"text-[#6366f1]"}`}>{value}</div></div></div><div className="w-full lg:w-1/2 space-y-5"><div className={`border rounded-xl p-6 ${value<15?"border-[#34d399]/40 bg-[#34d399]/10":"border-[#fb923c]/40 bg-[#fb923c]/10"}`}><div className="text-[10px] font-mono uppercase tracking-widest text-foreground-muted">Complexity status</div><div className={`font-mono font-bold mt-2 ${value<15?"text-[#34d399]":"text-[#fb923c]"}`}>{value<15?"✓ Small graph — quick exploration":"⚠️ Larger graph — more work per run"}</div></div><p className="text-sm text-foreground-muted leading-relaxed">Notice how the estimate reacts immediately. This is why graph size matters in real systems: the map itself can become the bottleneck.</p></div></div></section>;
}

function ThreeDSpace({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) {
  const containerRef=useRef<HTMLDivElement>(null); const [x,setX]=useState(2); const [y,setY]=useState(2); const [z,setZ]=useState(mode==="dijkstra"?3:1);
  useEffect(()=>{ if(!containerRef.current)return; const container=containerRef.current; const scene=new THREE.Scene(); scene.background=new THREE.Color(0x080810); const width=container.clientWidth,height=420; const camera=new THREE.PerspectiveCamera(50,width/height,0.1,100); camera.position.set(6,6,7); const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false}); renderer.setSize(width,height); renderer.setPixelRatio(Math.min(window.devicePixelRatio,2)); container.appendChild(renderer.domElement); const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.dampingFactor=0.07; const grid=new THREE.GridHelper(10,10,0x444444,0x222222); scene.add(grid); const origin=new THREE.Vector3(0,0,0); scene.add(new THREE.ArrowHelper(new THREE.Vector3(1,0,0),origin,4,0xff5f9e),new THREE.ArrowHelper(new THREE.Vector3(0,1,0),origin,4,0x22e5c9),new THREE.ArrowHelper(new THREE.Vector3(0,0,1),origin,4,0xffd166)); const geo=new THREE.BufferGeometry(); const mat=new THREE.LineBasicMaterial({color:0xa78bfa}); const line=new THREE.Line(geo,mat); scene.add(line); const pgeo=new THREE.SphereGeometry(0.14,24,24); const pmat=new THREE.MeshBasicMaterial({color:0xffd166}); const point=new THREE.Mesh(pgeo,pmat); scene.add(point); const update=()=>{geo.setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(x,y,z)]);point.position.set(x,y,z)}; update(); let frame=0; const animate=()=>{frame=requestAnimationFrame(animate);update();controls.update();renderer.render(scene,camera)}; animate(); const onResize=()=>{const nw=container.clientWidth;camera.aspect=nw/height;camera.updateProjectionMatrix();renderer.setSize(nw,height)};window.addEventListener("resize",onResize);return()=>{cancelAnimationFrame(frame);window.removeEventListener("resize",onResize);controls.dispose();geo.dispose();mat.dispose();pgeo.dispose();pmat.dispose();renderer.dispose();if(renderer.domElement.parentNode===container)container.removeChild(renderer.domElement)}} ,[x,y,z]);
  const magnitude=Math.sqrt(x*x+y*y+z*z); return <section className="space-y-6"><div><div className="text-xs font-mono text-[#ffd166] uppercase tracking-widest mb-2">4 · 3D Space</div><h2 className="text-2xl font-bold">The graph can become a 3D state space</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Games, robots, and simulations often describe a state with several coordinates. Searching those states is the same big idea as exploring nodes in a graph—only now the map lives in a higher-dimensional space.</p></div><div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6"><div className="w-full lg:w-3/5"><div className="relative"><div ref={containerRef} className="rounded-xl overflow-hidden" style={{height:420}}/><div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">🖱️ Drag to orbit · Scroll to zoom</div></div></div><div className="w-full lg:w-2/5 space-y-5"><h3 className="text-lg font-bold">Move the state point</h3>{[{label:"X",value:x,setter:setX,color:"#ff5f9e"},{label:"Y",value:y,setter:setY,color:"#22e5c9"},{label:"Z",value:z,setter:setZ,color:"#ffd166"}].map(a=><div key={a.label}><div className="text-xs font-mono mb-2" style={{color:a.color}}>✦ Move {a.label}: {a.value.toFixed(1)}</div><input type="range" min="-4" max="4" step="0.5" value={a.value} onChange={e=>a.setter(Number(e.target.value))} className="w-full"/></div>)}<div className="bg-background border border-border rounded-xl p-4"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">State vector</div><div className="font-mono text-xl mt-2">[{x.toFixed(1)}, {y.toFixed(1)}, {z.toFixed(1)}]</div><div className="text-sm text-foreground-muted mt-2">magnitude = {magnitude.toFixed(2)}</div></div></div></div></section>;
}

function RealWorldData({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) {
  const svgRef=useRef<SVGSVGElement>(null);
  const [nodes,setNodes]=useState<Node[]>(baseNodes.map(n=>({...n})));
  const features=mode==="bfs"?["friends","groups","shared clubs","mutual follows"]:mode==="dfs"?["maze turns","visited rooms","backtracks","dead ends"]:["distance","traffic","tolls","road type"];
  const [enabled,setEnabled]=useState(features.slice(0,2)); return <section className="space-y-6"><div><div className="text-xs font-mono text-[#34d399] uppercase tracking-widest mb-2">5 · Real-World Object as Data</div><h2 className="text-2xl font-bold">A real system becomes a graph</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Social apps, games, maps, and robot planners all turn messy reality into nodes plus connections. The algorithm only sees the structure you give it.</p></div><div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6"><div className="w-full lg:w-3/5"><div className="relative"><svg ref={svgRef} width={W} height={H} className="rounded-xl bg-[#0a0a0c] select-none" style={{maxWidth:"100%"}}><defs><ArrowMarker id={`${mode}-real`} color="#22e5c9"/></defs><GridLines/><GraphEdges nodes={baseNodes} weighted={mode==="dijkstra"} markerId={`${mode}-real`}/>{nodes.map((n,i)=><NodeCircle key={n.id} node={n} color={i<enabled.length?"#34d399":"#15151b"} active={i<enabled.length} svgRef={svgRef} onDrag={(nx,ny)=>setNodes(old=>old.map(v=>v.id===n.id?{...v,x:nx,y:ny}:v))}/>)}</svg><div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur text-[10px] text-foreground-muted px-2 py-1 rounded font-mono">✦ Toggle features to change the data representation</div></div></div><div className="w-full lg:w-2/5 space-y-5"><h3 className="text-lg font-bold">Feature switches</h3><div className="grid grid-cols-2 gap-2">{features.map(f=><button key={f} onClick={()=>setEnabled(old=>old.includes(f)?old.filter(x=>x!==f):[...old,f])} className={`px-3 py-2 rounded-lg border text-xs font-mono ${enabled.includes(f)?"border-[#34d399] bg-[#34d399]/10 text-[#34d399]":"border-border bg-background text-foreground-muted"}`}>{enabled.includes(f)?"✓":"○"} {f}</button>)}</div><div className="bg-background border border-border rounded-xl p-4"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Data vector</div>{enabled.length===0?<div className="font-mono text-xl mt-2">[ ]</div>:<div className="font-mono text-xl mt-2">[{enabled.map((f,i)=>`${i+1}${i<enabled.length-1?", ":""}`)}]</div>}<p className="text-sm text-foreground-muted mt-2">{enabled.length} active features</p></div><p className="text-sm text-foreground-muted leading-relaxed">This is the same trick used across AI: turn a real object into structured data, then let an algorithm operate on that structure.</p></div></div></section>;
}

function ClassicAI({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) {
  const [a,setA]=useState(mode==="bfs"?3:2),[b,setB]=useState(mode==="dfs"?4:3),[c,setC]=useState(2); const output=mode==="bfs"?a+b+c:mode==="dfs"?a*b+c:a+b*2+c*3; const model=mode==="bfs"?"State-Space Search":mode==="dfs"?"Backtracking Search":"A* Search";
  return <section className="space-y-6"><div><StepBadge text="6 · Classic AI"/><h2 className="text-2xl font-bold mt-3">{mode==="bfs"?"BFS in Classic AI — State-Space Search":mode==="dfs"?"DFS in Classic AI — Backtracking Search":"Dijkstra in Classic AI — A* Search"}</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Think about a puzzle solver. The machine needs a rule for deciding which possible state to inspect next. Your sliders below change that search signal live.</p><MathBlock tex={mode==="bfs"?"score = depth + branch + goal":mode==="dfs"?"score = branch\\cdot depth + goal":"f(n)=g(n)+h(n)"}/></div><div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6"><div className="w-full lg:w-3/5 bg-background border border-border rounded-xl p-6"><h3 className="text-lg font-bold mb-4">Search simulator</h3>{[{label:"A",value:a,setter:setA,color:"#ff5f9e"},{label:"B",value:b,setter:setB,color:"#22e5c9"},{label:"C",value:c,setter:setC,color:"#ffd166"}].map(s=><div key={s.label} className="mb-5"><div className="text-xs font-mono mb-2" style={{color:s.color}}>✦ Adjust {s.label}: {s.value}</div><input type="range" min="0" max="6" step="1" value={s.value} onChange={e=>s.setter(Number(e.target.value))} className="w-full"/></div>)}<div className="text-4xl font-extrabold font-mono text-[#6366f1]">{output}</div></div><div className="w-full lg:w-2/5 space-y-5"><div className={`text-xs font-mono px-3 py-2 rounded-lg border ${output>=10?"border-[#34d399]/40 bg-[#34d399]/10 text-[#34d399]":"border-[#fb923c]/40 bg-[#fb923c]/10 text-[#fb923c]"}`}>{output>=10?"✓ Search signal is strong enough to continue":"✗ Search signal is weak — explore more states"}</div><p className="text-sm text-foreground-muted leading-relaxed">{model} is a classic search idea: represent possible situations as states, then expand the next state according to a rule. The exact rule differs, but the graph-search mindset is the same.</p><p className="text-sm text-foreground-muted leading-relaxed"><strong className="text-foreground">This is what happens inside {model}</strong> when a game agent solves a puzzle, chooses a move, or searches through possible actions.</p></div></div></section>;
}

function DeepAI({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) {
  const [temperature,setTemperature]=useState(0.5),[spread,setSpread]=useState(0.7); const size=5; const matrix=Array.from({length:size},(_,i)=>Array.from({length:size},(_,j)=>Math.exp(-Math.abs(i-j)*(1.4-temperature))*(0.5+spread*Math.abs(Math.sin((i+1)*(j+2)))))); const flat=matrix.flat(); const max=Math.max(...flat),arg=flat.indexOf(max); const row=Math.floor(arg/size),col=arg%size; const model=mode==="bfs"?"Graph Neural Network message passing":mode==="dfs"?"Graph Transformer": "Neural Combinatorial Optimization";
  return <section className="space-y-6"><div><StepBadge text="7 · Deep Learning"/><h2 className="text-2xl font-bold mt-3">{mode==="bfs"?"BFS ideas in Deep Learning — Graph Neural Networks":mode==="dfs"?"DFS ideas in Deep Learning — Graph Transformers":"Dijkstra ideas in Deep Learning — Neural Routing"}</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3 max-w-3xl">Modern models still need to decide which connected information matters. Here the grid acts like a tiny learned routing map: each cell shows a connection strength.</p><MathBlock tex={mode==="bfs"?"h_v^{(k+1)}=\\sigma\\left(W_1h_v^{(k)}+W_2\\sum_{u\\in N(v)}h_u^{(k)}\\right)":mode==="dfs"?"A=softmax\\left(\\frac{QK^\\top}{\\sqrt{d_k}}\\right)":"P(\\pi|G)=\\mathrm{softmax}(s_\\theta(G))"}/></div><div className="flex flex-col lg:flex-row gap-8 items-start bg-surface border border-border rounded-2xl p-6"><div className="w-full lg:w-3/5"><div className="bg-background border border-border rounded-xl p-5"><div className="text-xs font-mono text-foreground-muted uppercase tracking-widest mb-3">Live connection map</div><div className="grid grid-cols-5 gap-1">{matrix.map((r,i)=>r.map((val,j)=><div key={`${i}-${j}`} className="relative aspect-square rounded" style={{backgroundColor:"#6366f1",opacity:Math.max(0.08,Math.min(1,val))}}><span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white">{val.toFixed(2)}</span></div>))}</div></div><div className="grid grid-cols-3 gap-3 mt-4"><div className="border rounded-xl p-3 bg-background/60 border-[#ffd166] text-[#ffd166]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Max</div><div className="text-xl font-bold font-mono">{max.toFixed(2)}</div></div><div className="border rounded-xl p-3 bg-background/60 border-indigo-400 text-indigo-400"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Argmax</div><div className="text-xl font-bold font-mono">{row},{col}</div></div><div className="border rounded-xl p-3 bg-background/60 border-[#22e5c9] text-[#22e5c9]"><div className="text-[10px] uppercase tracking-widest text-foreground-muted">Cells</div><div className="text-xl font-bold font-mono">25</div></div></div></div><div className="w-full lg:w-2/5 space-y-5"><label className="block text-xs font-mono text-[#ff5f9e] mb-2">✦ Change focus temperature: {temperature.toFixed(2)}</label><input type="range" min="0.1" max="0.9" step="0.1" value={temperature} onChange={e=>setTemperature(Number(e.target.value))} className="w-full"/><label className="block text-xs font-mono text-[#22e5c9] mt-6 mb-2">✦ Change spread: {spread.toFixed(2)}</label><input type="range" min="0.2" max="1" step="0.1" value={spread} onChange={e=>setSpread(Number(e.target.value))} className="w-full"/><p className="text-sm text-foreground-muted leading-relaxed border-l-2 border-[#6366f1] pl-3"><strong className="text-foreground">Why does this matter?</strong> Modern graph and routing models repeatedly score connections. The exact architecture changes, but the core idea—choose useful neighbors and propagate information—comes directly from graph thinking.</p><p className="text-sm text-foreground-muted leading-relaxed">This exact kind of operation runs inside {model} when a model reasons over connected entities, paths, or candidate routes.</p></div></div></section>;
}

function ConceptMap({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) {
  const lastA=mode==="bfs"?"Graph Neural Networks":mode==="dfs"?"Graph Transformers":"Neural Combinatorial Optimization"; const lastB=mode==="bfs"?"GraphSAGE":mode==="dfs"?"Graphormer":"Attention Model";
  const nodes:ConceptNode[]=[
    {label:mode.toUpperCase(),desc:"The core graph-search idea",color:"#ffd166"},
    {label:"Frontier",desc:"Which nodes are waiting",color:"#ff5f9e"},
    {label:"Expansion",desc:"Inspect neighbors next",color:"#22e5c9"},
    {label:"Search Cost",desc:"How much work is done",color:"#a78bfa"},
    {label:"State Space",desc:"A real problem as a graph",color:"#34d399"},
    {label:"Classic AI",desc:"Search and planning",color:"#fb923c"},
    {label:lastA,desc:"Modern graph learning use",color:"#6366f1"},
    {label:lastB,desc:"A concrete modern architecture",color:"#ffd166"},
  ]; return <section className="space-y-6"><div><div className="text-xs font-mono text-[#6366f1] uppercase tracking-widest mb-2">8 · Concept Map</div><h2 className="text-2xl font-bold">See the whole journey</h2><p className="text-sm text-foreground-muted leading-relaxed mt-3">Start with one search rule, then connect it to algorithms, real data, and modern AI.</p></div><div className="bg-surface border border-border rounded-2xl p-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{nodes.map(n=><div key={n.label} className="bg-background border rounded-xl p-3 flex flex-col gap-1 hover:scale-[1.03] transition-transform cursor-default" style={{borderColor:n.color+"55"}}><div className="text-xs font-bold font-mono" style={{color:n.color}}>{n.label}</div><div className="text-[10px] text-foreground-muted leading-relaxed">{n.desc}</div></div>)}</div></div></section>;
}

function Footer({ mode }: {mode:"bfs"|"dfs"|"dijkstra"}) { const takeaway=mode==="bfs"?"BFS feels like a wave spreading outward—simple, predictable, and perfect when every edge has the same cost.":mode==="dfs"?"DFS feels like exploring a maze—go deep, remember where you have been, and backtrack when needed.":"Dijkstra feels like a delivery planner—always lock in the cheapest known route before moving on."; return <footer className="border-t border-border pt-10 flex items-center justify-between flex-wrap gap-4"><p className="text-foreground-muted text-sm max-w-lg">{takeaway}</p><Link href="/graph-algorithms" className="px-5 py-2.5 bg-surface border border-border hover:bg-surface-hover hover:border-accent font-semibold rounded-xl text-sm transition-all">← Graph Algorithms</Link></footer>; }

export default function Page() {
  return (
    <div className="relative min-h-screen text-foreground px-4 md:px-10 py-16 max-w-5xl mx-auto overflow-x-hidden space-y-24">
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent/6 blur-[160px]" />
        <div className="absolute right-0 top-1/2 h-[28rem] w-[28rem] rounded-full bg-[#ffd166]/5 blur-[130px]" />
        <div className="absolute left-1/4 bottom-0 h-[28rem] w-[28rem] rounded-full bg-[#ff5f9e]/5 blur-[130px]" />
      </div>
      <HeroWidget title="BFS" number="1" hook={`Imagine you are looking for a friend in a school by asking people one level at a time. BFS explores every node one step away before it checks nodes two steps away. That makes it a natural way to find the shortest path when every connection costs the same.`} />
      <FirstIntuition mode="bfs" />
      <DeeperMechanics mode="bfs" />
      <NumberCrunchingLab mode="bfs" />
      <ThreeDSpace mode="bfs" />
      <RealWorldData mode="bfs" />
      <ClassicAI mode="bfs" />
      <DeepAI mode="bfs" />
      <ConceptMap mode="bfs" />
      <Footer mode="bfs" />
    </div>
  );
}
