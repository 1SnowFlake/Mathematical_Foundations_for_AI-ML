export default function HomePage() {
  return (
    <div className="relative min-h-screen text-foreground space-y-12 px-10 py-16">

      {/* Dynamic Background Glows */}
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[130px]" />
        <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-[#ffd166]/10 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-[#ff5f9e]/10 blur-[130px]" />
      </div>

      {/* Hero Banner */}
      <header className="animate-fade-in-up space-y-4 text-left">

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Mathematical Foundations <br />
          <span className="bg-gradient-to-r from-[#22e5c9] via-[#ffd166] to-[#ff5f9e] bg-clip-text text-transparent">
            for AI, ML &amp; Deep Learning
          </span>
        </h1>

        <p className="max-w-2xl text-base text-foreground-muted leading-relaxed sm:text-lg">
          Master the exact mathematical principles behind modern AI models — from linear
          algebra and calculus to probability, optimization, and search algorithms.
        </p>
      </header>

    </div>
  );
}
