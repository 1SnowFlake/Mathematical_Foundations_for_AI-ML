"use client";

import MathBlock from "@/components/primitives/MathBlock";
import NNOrthogonalityLabInline from "./NNOrthogonalityLabInline";
import QRExplorerInline from "./QRExplorerInline";

export default function Chapter7() {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-accent/10 text-accent font-semibold rounded-md text-xs uppercase tracking-wider">
          Chapter 7 🤖
        </span>
        <h2 className="text-2xl font-bold m-0">Gram–Schmidt in Neural Networks</h2>
      </div>

      <p className="text-foreground-muted leading-relaxed text-sm max-w-3xl">
        Why do many neural networks prefer orthogonal weight matrices, and how does Gram–Schmidt help create them?
      </p>

      {/* Interactive Neural Network Orthogonality Laboratory */}
      <NNOrthogonalityLabInline />

      {/* Interactive QR Factorization Explorer */}
      <QRExplorerInline />

      <h3 className="text-xl font-bold mt-10 mb-4">Comprehensive AI &amp; ML Application Breakdown</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        <div className="bg-surface border border-border p-4 rounded-xl">
          <h4 className="font-semibold text-accent mb-2">1. Linear Regression &amp; QR Factorization</h4>
          <p className="text-xs text-foreground-muted">
            Correlated feature columns cause normal equations <MathBlock tex="X^T X \hat{\beta} = X^T y" inline /> to become ill-conditioned. QR decomposition converts feature matrix <MathBlock tex="X = QR" inline /> into an orthonormal basis <MathBlock tex="Q" inline /> and upper triangular <MathBlock tex="R" inline />, solving <MathBlock tex="R \hat{\beta} = Q^T y" inline /> stably.
          </p>
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl">
          <h4 className="font-semibold text-accent mb-2">2. Least Squares Subspace Projection</h4>
          <p className="text-xs text-foreground-muted">
            Least squares projects target vector <MathBlock tex="y" inline /> directly onto the column space subspace of features. Gram–Schmidt constructs the exact orthogonal basis required for stable subspace projection.
          </p>
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl">
          <h4 className="font-semibold text-accent mb-2">3. Principal Component Analysis (PCA)</h4>
          <p className="text-xs text-foreground-muted">
            PCA computes orthogonal principal components of maximum variance across high-dimensional feature datasets, eliminating redundant correlation.
          </p>
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl">
          <h4 className="font-semibold text-accent mb-2">4. Word Embeddings &amp; Semantic Separation</h4>
          <p className="text-xs text-foreground-muted">
            Vector representations of words in LLMs require distinct concepts to remain distinct. Near-orthogonal embeddings maximize semantic separation in latent space.
          </p>
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl">
          <h4 className="font-semibold text-accent mb-2">5. Neural Network Weight Matrices</h4>
          <p className="text-xs text-foreground-muted">
            Orthogonal weight initializations preserve gradient magnitude across hundreds of deep layers, directly mitigating exploding and vanishing gradient problems.
          </p>
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl">
          <h4 className="font-semibold text-accent mb-2">6. Computer Vision &amp; Feature Compression</h4>
          <p className="text-xs text-foreground-muted">
            Image compression transforms raw pixel vectors into orthogonal basis components (such as Discrete Cosine Transform / Wavelets), discarding redundant frequencies.
          </p>
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl">
          <h4 className="font-semibold text-accent mb-2">7. Signal Processing</h4>
          <p className="text-xs text-foreground-muted">
            Orthogonal basis decomposition isolates clean signal channels from noisy environment interference.
          </p>
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl">
          <h4 className="font-semibold text-accent mb-2">8. Robotics &amp; Spatial Transforms</h4>
          <p className="text-xs text-foreground-muted">
            Robotics kinematics relies on rotation matrices. Orthogonal matrices preserve lengths and angles during spatial rigid-body transformations.
          </p>
        </div>

        <div className="bg-surface border border-border p-4 rounded-xl col-span-1 md:col-span-2">
          <h4 className="font-semibold text-accent mb-2">9. Scientific Computing &amp; Matrix Factorization</h4>
          <p className="text-xs text-foreground-muted">
            High-performance linear algebra libraries (BLAS/LAPACK/PyTorch/Eigen) use orthogonal matrix factorizations to ensure maximum numerical precision and stability.
          </p>
        </div>
      </div>
    </section>
  );
}
