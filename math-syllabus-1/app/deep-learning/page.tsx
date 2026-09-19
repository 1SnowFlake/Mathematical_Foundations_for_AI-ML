import Link from "next/link";

export default function Page() {
  return (
    <div className="prose max-w-none px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🏗️ Deep Learning</h1>
      <p className="text-foreground-muted mb-8">Select a topic from the sidebar or the list below to start learning.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <Link 
          key="cnns" 
          href="/deep-learning/cnns"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Convolutional Neural Networks</h3>
        </Link>
        
        <Link 
          key="regularization" 
          href="/deep-learning/regularization"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Regularization</h3>
        </Link>
        
        <Link 
          key="optimization" 
          href="/deep-learning/optimization"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Optimization</h3>
        </Link>
      </div>
    </div>
  );
}
