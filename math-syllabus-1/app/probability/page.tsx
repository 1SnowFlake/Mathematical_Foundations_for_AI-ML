import Link from "next/link";

export default function Page() {
  return (
    <div className="prose max-w-none px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🎲 Probability</h1>
      <p className="text-foreground-muted mb-8">Select a topic from the sidebar or the list below to start learning.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <Link 
          key="distributions" 
          href="/probability/distributions"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Distributions</h3>
        </Link>
        
        <Link 
          key="bayes-theorem" 
          href="/probability/bayes-theorem"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Bayes' Theorem</h3>
        </Link>
        
        <Link 
          key="expected-value" 
          href="/probability/expected-value"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Expected Value</h3>
        </Link>
      </div>
    </div>
  );
}
