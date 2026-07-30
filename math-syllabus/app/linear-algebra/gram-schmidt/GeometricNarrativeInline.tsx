import { useState, useEffect } from "react";
import MathBlock from "@/components/primitives/MathBlock";
import { normalize3, sub3, proj3, iso } from "./vectorMath3d";
import IsoVector from "./IsoVector";

export default function GeometricNarrativeInline() {
  const [scene, setScene] = useState(0);
  const [subStep, setSubStep] = useState(0);

  useEffect(() => { setSubStep(0); }, [scene]);

  const a1 = { x: 2, y: 1, z: 0 };
  const a2 = { x: 1, y: 2.5, z: 1 };
  const a3 = { x: -1, y: 1.5, z: 2 };

  const q1 = normalize3(a1);
  const p1 = proj3(a2, q1);
  const u2 = sub3(a2, p1);
  const q2 = normalize3(u2);
  const p2_1 = proj3(a3, q1);
  const p2_2 = proj3(a3, q2);
  const u3 = sub3(sub3(a3, p2_1), p2_2);
  const q3 = normalize3(u3);

  const render3D = () => {
    return (
      <svg width="100%" height="350" viewBox="0 0 600 350" className="bg-surface/30 rounded-xl border border-border">
        {/* Axes */}
        <line x1={iso(0,0,0).x} y1={iso(0,0,0).y} x2={iso(4,0,0).x} y2={iso(4,0,0).y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
        <line x1={iso(0,0,0).x} y1={iso(0,0,0).y} x2={iso(0,4,0).x} y2={iso(0,4,0).y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
        <line x1={iso(0,0,0).x} y1={iso(0,0,0).y} x2={iso(0,0,4).x} y2={iso(0,0,4).y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />

        {/* Scene 0: All A vectors */}
        {scene === 0 && (
          <>
            <IsoVector v={a1} color="#6366f1" label="a₁" />
            <IsoVector v={a2} color="#ec4899" label="a₂" />
            <IsoVector v={a3} color="#f59e0b" label="a₃" />
          </>
        )}

        {/* Scene 1: Step 1 */}
        {scene === 1 && (
          <>
            <IsoVector v={a1} color="#6366f1" label="a₁" opacity={subStep === 0 ? 1 : 0.3} />
            <IsoVector v={q1} color="#10b981" label="q₁" opacity={subStep > 0 ? 1 : 0} width={4} />
          </>
        )}

        {/* Scene 2: Step 2 */}
        {scene === 2 && (
          <>
            <IsoVector v={q1} color="#10b981" label="q₁" width={4} opacity={0.6} />
            <IsoVector v={a2} color="#ec4899" label="a₂" opacity={subStep < 2 ? 1 : 0.3} />
            
            {subStep >= 1 && <IsoVector v={p1} color="#f59e0b" label="proj_q1(a2)" dashed opacity={subStep < 2 ? 1 : 0} />}
            {subStep >= 1 && <IsoVector v={u2} color="#ef4444" label="u₂" opacity={subStep < 3 ? 1 : 0} />}
            {subStep >= 3 && <IsoVector v={q2} color="#10b981" label="q₂" width={4} />}
            {subStep === 3 && <text x="150" y="50" fill="#10b981" fontSize="16" fontWeight="bold">q₁ ⟂ q₂</text>}
          </>
        )}

        {/* Scene 3: Step 3 */}
        {scene === 3 && (
          <>
            <IsoVector v={q1} color="#10b981" label="q₁" width={4} opacity={0.5} />
            <IsoVector v={q2} color="#10b981" label="q₂" width={4} opacity={0.5} />
            {/* Draw a subtle plane for q1 q2 */}
            <polygon points={`${iso(0,0,0).x},${iso(0,0,0).y} ${iso(q1.x*3, q1.y*3, q1.z*3).x},${iso(q1.x*3, q1.y*3, q1.z*3).y} ${iso(q1.x*3 + q2.x*3, q1.y*3 + q2.y*3, q1.z*3 + q2.z*3).x},${iso(q1.x*3 + q2.x*3, q1.y*3 + q2.y*3, q1.z*3 + q2.z*3).y} ${iso(q2.x*3, q2.y*3, q2.z*3).x},${iso(q2.x*3, q2.y*3, q2.z*3).y}`} fill="#10b981" opacity="0.1" />

            <IsoVector v={a3} color="#f59e0b" label="a₃" opacity={subStep < 2 ? 1 : 0.3} />
            
            {subStep >= 1 && <IsoVector v={p2_1} color="#6366f1" label="proj_q1" dashed opacity={subStep < 2 ? 1 : 0} />}
            {subStep >= 1 && <IsoVector v={p2_2} color="#ec4899" label="proj_q2" dashed opacity={subStep < 2 ? 1 : 0} />}
            
            {subStep >= 1 && <IsoVector v={u3} color="#ef4444" label="u₃" opacity={subStep < 3 ? 1 : 0} />}
            {subStep >= 3 && <IsoVector v={q3} color="#10b981" label="q₃" width={4} />}
            {subStep === 3 && <text x="150" y="50" fill="#10b981" fontSize="16" fontWeight="bold">q₁ ⟂ q₂, q₂ ⟂ q₃, q₁ ⟂ q₃</text>}
          </>
        )}

        {/* Scene 4: Final Geometry */}
        {scene === 4 && (
          <>
            {subStep === 0 ? (
              <>
                <IsoVector v={a1} color="#6366f1" label="a₁" opacity={0.8} />
                <IsoVector v={a2} color="#ec4899" label="a₂" opacity={0.8} />
                <IsoVector v={a3} color="#f59e0b" label="a₃" opacity={0.8} />
                <polygon points={`${iso(a1.x, a1.y, a1.z).x},${iso(a1.x, a1.y, a1.z).y} ${iso(a1.x+a2.x, a1.y+a2.y, a1.z+a2.z).x},${iso(a1.x+a2.x, a1.y+a2.y, a1.z+a2.z).y} ${iso(a2.x, a2.y, a2.z).x},${iso(a2.x, a2.y, a2.z).y} ${iso(0,0,0).x},${iso(0,0,0).y}`} fill="#6366f1" opacity="0.1" />
                <text x="50" y="50" fill="#6366f1" fontSize="16" fontWeight="bold">Skewed Coordinate System</text>
              </>
            ) : (
              <>
                <IsoVector v={q1} color="#10b981" label="q₁" width={4} />
                <IsoVector v={q2} color="#10b981" label="q₂" width={4} />
                <IsoVector v={q3} color="#10b981" label="q₃" width={4} />
                <polygon points={`${iso(q1.x, q1.y, q1.z).x},${iso(q1.x, q1.y, q1.z).y} ${iso(q1.x+q2.x, q1.y+q2.y, q1.z+q2.z).x},${iso(q1.x+q2.x, q1.y+q2.y, q1.z+q2.z).y} ${iso(q2.x, q2.y, q2.z).x},${iso(q2.x, q2.y, q2.z).y} ${iso(0,0,0).x},${iso(0,0,0).y}`} fill="#10b981" opacity="0.1" />
                <text x="50" y="50" fill="#10b981" fontSize="16" fontWeight="bold">Orthonormal Coordinate System</text>
              </>
            )}
          </>
        )}
      </svg>
    )
  }

  const scenes = [
    {
      title: "Introduction",
      content: (
        <div className="space-y-4">
          <p>
            From a geometric perspective, the <strong>Gram–Schmidt orthogonalization process</strong> transforms a set of linearly independent vectors into a new set of mutually orthogonal unit vectors. 
          </p>
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl">
            <p className="m-0 text-accent font-medium">
              The important point is that <strong>the new vectors span exactly the same space as the original vectors</strong>, but they provide a much cleaner coordinate system for computation.
            </p>
          </div>
          <MathBlock tex="A = [a_1 \mid a_2 \mid a_3]" />
        </div>
      ),
      maxSub: 0
    },
    {
      title: "Step 1 — First Vector",
      content: (
        <div className="space-y-4">
          <p>We begin with the first non-zero vector <MathBlock inline tex="a_1" />. Since there are no previous vectors to compare it with, it already represents a unique direction in space. We simply keep this direction as our first basis vector.</p>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setSubStep(0)} className={`px-3 py-1 text-xs rounded ${subStep===0?'bg-accent text-white':'bg-surface border border-border'}`}>1. Show a₁</button>
            <button onClick={() => setSubStep(1)} className={`px-3 py-1 text-xs rounded ${subStep===1?'bg-accent text-white':'bg-surface border border-border'}`}>2. Normalize to q₁</button>
          </div>
          {subStep === 1 && (
            <div className="p-4 bg-surface border border-border rounded-xl animate-in fade-in zoom-in duration-300">
              <MathBlock tex="q_1 = \frac{a_1}{\|a_1\|}" />
              <p className="m-0 text-sm mt-2 text-foreground-muted">We normalize the vector so it has unit length. This makes future computations easier while preserving its direction.</p>
            </div>
          )}
        </div>
      ),
      maxSub: 1
    },
    {
      title: "Step 2 — Second Vector",
      content: (
        <div className="space-y-4">
          <p>The second vector <MathBlock inline tex="a_2" /> contains two kinds of information. One part points along the direction we already know (<MathBlock inline tex="q_1" />). The remaining part points in a completely new direction.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setSubStep(0)} className={`px-3 py-1 text-xs rounded ${subStep===0?'bg-accent text-white':'bg-surface border border-border'}`}>1. Bring a₂</button>
            <button onClick={() => setSubStep(1)} className={`px-3 py-1 text-xs rounded ${subStep===1?'bg-accent text-white':'bg-surface border border-border'}`}>2. Find Projection</button>
            <button onClick={() => setSubStep(2)} className={`px-3 py-1 text-xs rounded ${subStep===2?'bg-accent text-white':'bg-surface border border-border'}`}>3. Remove Redundancy (u₂)</button>
            <button onClick={() => setSubStep(3)} className={`px-3 py-1 text-xs rounded ${subStep===3?'bg-accent text-white':'bg-surface border border-border'}`}>4. Normalize to q₂</button>
          </div>
          {subStep >= 1 && (
            <div className="p-4 bg-surface border border-border rounded-xl animate-in fade-in zoom-in duration-300">
              <MathBlock tex="a_2 = \underbrace{\text{proj}_{q_1}(a_2)}_{\text{Already explained}} + \underbrace{u_2}_{\text{New information}}" />
              {subStep >= 2 && <p className="m-0 text-sm mt-2 text-foreground-muted">By subtracting the projection, we remove the redundant information and keep only the unique direction.</p>}
              {subStep === 3 && <MathBlock tex="q_2 = \frac{u_2}{\|u_2\|}" />}
            </div>
          )}
        </div>
      ),
      maxSub: 3
    },
    {
      title: "Step 3 — Third Vector",
      content: (
        <div className="space-y-4">
          <p>The third vector <MathBlock inline tex="a_3" /> generally has components along both previously discovered directions. It also contains a completely new component that points outside the plane formed by <MathBlock inline tex="q_1" /> and <MathBlock inline tex="q_2" />.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => setSubStep(0)} className={`px-3 py-1 text-xs rounded ${subStep===0?'bg-accent text-white':'bg-surface border border-border'}`}>1. Bring a₃</button>
            <button onClick={() => setSubStep(1)} className={`px-3 py-1 text-xs rounded ${subStep===1?'bg-accent text-white':'bg-surface border border-border'}`}>2. Find Projections</button>
            <button onClick={() => setSubStep(2)} className={`px-3 py-1 text-xs rounded ${subStep===2?'bg-accent text-white':'bg-surface border border-border'}`}>3. Keep New (u₃)</button>
            <button onClick={() => setSubStep(3)} className={`px-3 py-1 text-xs rounded ${subStep===3?'bg-accent text-white':'bg-surface border border-border'}`}>4. Normalize to q₃</button>
          </div>
          {subStep >= 1 && (
            <div className="p-4 bg-surface border border-border rounded-xl animate-in fade-in zoom-in duration-300">
              <MathBlock tex="a_3 = \text{proj}_{q_1}(a_3) + \text{proj}_{q_2}(a_3) + u_3" />
              {subStep >= 2 && <p className="m-0 text-sm mt-2 text-foreground-muted">Remove both projections to isolate the unique 3D direction.</p>}
              {subStep === 3 && <MathBlock tex="q_3 = \frac{u_3}{\|u_3\|}" />}
            </div>
          )}
        </div>
      ),
      maxSub: 3
    },
    {
      title: "Final Geometry",
      content: (
        <div className="space-y-4">
          <p>Although the shapes look different, both sets of vectors span exactly the same three-dimensional space. Gram–Schmidt does not create new information. It reorganizes the existing information into independent, perpendicular directions that are much easier to work with.</p>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setSubStep(0)} className={`px-3 py-1 text-xs rounded ${subStep===0?'bg-accent text-white':'bg-surface border border-border'}`}>Original Basis</button>
            <button onClick={() => setSubStep(1)} className={`px-3 py-1 text-xs rounded ${subStep===1?'bg-accent text-white':'bg-surface border border-border'}`}>New Basis</button>
          </div>
          <div className="text-center font-bold text-accent text-lg">
            Same Space, Different Basis
          </div>
        </div>
      ),
      maxSub: 1
    },
    {
      title: "Transition to QR Factorization",
      content: (
        <div className="space-y-4">
          <p>The orthonormal vectors we just constructed become the columns of a new matrix called <strong>Q</strong>.</p>
          <MathBlock tex="A = [a_1 \mid a_2 \mid a_3] \quad \longrightarrow \quad Q = [q_1 \mid q_2 \mid q_3]" />
          
          <div className="p-4 bg-surface border border-border rounded-xl">
            <p className="font-semibold text-sm mb-2">If we replaced the original vectors with these new orthogonal vectors, how can we reconstruct the original matrix?</p>
            <MathBlock tex="A = QR" />
            <div className="flex flex-col items-center text-xs font-mono gap-1 text-foreground-muted my-4">
              <div>Original Matrix A</div>
              <div>↓</div>
              <div className="text-accent">Gram–Schmidt</div>
              <div>↓</div>
              <div className="font-bold text-emerald-400">Orthogonal Matrix Q</div>
              <div>+</div>
              <div className="font-bold text-amber-500">Coordinate Matrix R</div>
            </div>
            <p className="text-xs text-foreground-muted m-0">
              The matrix <strong>R</strong> stores the coefficients needed to express each original vector as a combination of the orthonormal basis vectors. Together, <strong>Q</strong> and <strong>R</strong> contain exactly the same information as the original matrix <strong>A</strong>, but in a form that is much easier for computers to use.
            </p>
          </div>
        </div>
      ),
      maxSub: 0
    },
    {
      title: "Transition to Neural Networks",
      content: (
        <div className="space-y-4">
          <MathBlock tex="y = Wx + b" />
          <p>A neural network weight matrix behaves just like the matrix <MathBlock inline tex="A" />. If many rows or columns point in similar directions, different neurons begin learning similar features. This creates redundancy and can make optimization more difficult.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface border border-border p-4 rounded-xl text-center">
              <div className="text-2xl font-bold mb-2 tracking-widest text-rose-400">↗ ↗ ↗</div>
              <div className="text-sm font-semibold">Random Weights</div>
              <div className="text-xs text-foreground-muted mt-1 px-2 py-1 bg-rose-500/10 rounded">High Feature Overlap</div>
            </div>
            <div className="bg-surface border border-border p-4 rounded-xl text-center">
              <div className="text-2xl font-bold mb-2 tracking-widest text-emerald-400">↑ → ⊙</div>
              <div className="text-sm font-semibold">Orthogonal Weights</div>
              <div className="text-xs text-foreground-muted mt-1 px-2 py-1 bg-emerald-500/10 rounded">Independent Feature Directions</div>
            </div>
          </div>
          <p className="text-sm text-foreground-muted">By constructing an orthogonal weight matrix—often using QR decomposition—the network starts with neurons that capture different directions of information. This improves information flow and leads to more stable training.</p>
        </div>
      ),
      maxSub: 0
    }
  ];

  const currentScene = scenes[scene];

  return (
    <div className="bg-background border border-border rounded-2xl p-4 md:p-6 shadow-sm my-8 not-prose">
      <div className="flex overflow-x-auto gap-2 pb-3 mb-4 border-b border-border">
        {scenes.map((s, idx) => (
          <button
            key={idx}
            onClick={() => { setScene(idx); setSubStep(0); }}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${scene === idx ? 'bg-accent text-white shadow' : 'bg-surface hover:bg-surface-hover text-foreground-muted'}`}
          >
            {idx + 1}. {s.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-4">{currentScene.title}</h3>
          {currentScene.content}
        </div>
        
        {scene < 5 && (
          <div className="flex items-center justify-center">
            {render3D()}
          </div>
        )}
        {scene >= 5 && (
          <div className="flex items-center justify-center p-6 bg-surface border border-border rounded-xl">
             <div className="text-center">
               <h4 className="text-lg font-bold text-accent mb-4">The Final Takeaway</h4>
               <p className="text-sm text-foreground-muted">
                 <strong>Gram–Schmidt begins as a geometric procedure for removing overlap between vectors. Those orthogonal vectors become the matrix Q in QR factorization. QR decomposition is then used to create orthogonal weight matrices for neural networks, solve least-squares problems, and build many of the numerically stable algorithms that modern AI relies on.</strong>
               </p>
               <p className="text-sm font-bold text-emerald-400 mt-4">The mathematics never changes—the application does.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
