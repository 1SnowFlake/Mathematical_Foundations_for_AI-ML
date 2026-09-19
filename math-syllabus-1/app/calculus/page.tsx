import Link from "next/link";

export default function Page() {
  return (
    <div className="prose max-w-none px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">∫ Calculus</h1>
      <p className="text-foreground-muted mb-8">Select a topic from the sidebar or the list below to start learning.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <Link 
          key="derivatives" 
          href="/calculus/derivatives"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Derivatives</h3>
        </Link>
        
        <Link 
          key="integrals" 
          href="/calculus/integrals"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Integrals</h3>
        </Link>
        
        <Link 
          key="partial-derivatives" 
          href="/calculus/partial-derivatives"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Partial Derivatives</h3>
        </Link>
        
        <Link 
          key="gradient" 
          href="/calculus/gradient"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Gradient</h3>
        </Link>
      </div>
    </div>
  );
}
