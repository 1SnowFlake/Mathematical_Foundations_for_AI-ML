import Link from "next/link";

export default function Page() {
  return (
    <div className="prose max-w-none px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🔗 Graph Theory</h1>
      <p className="text-foreground-muted mb-8">Select a topic from the sidebar or the list below to start learning.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <Link 
          key="bfs" 
          href="/graph-theory/bfs"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Breadth-First Search</h3>
        </Link>
        
        <Link 
          key="dfs" 
          href="/graph-theory/dfs"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Depth-First Search</h3>
        </Link>
        
        <Link 
          key="dijkstra" 
          href="/graph-theory/dijkstra"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Dijkstra's Algorithm</h3>
        </Link>
        
        <Link 
          key="mst" 
          href="/graph-theory/mst"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Minimum Spanning Tree</h3>
        </Link>
        
        <Link 
          key="coloring" 
          href="/graph-theory/coloring"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Graph Coloring</h3>
        </Link>
        
        <Link 
          key="euler-hamiltonian" 
          href="/graph-theory/euler-hamiltonian"
          className="p-5 rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-accent transition-all group"
        >
          <h3 className="font-semibold text-foreground m-0 group-hover:text-accent">Euler & Hamiltonian Paths</h3>
        </Link>
      </div>
    </div>
  );
}
