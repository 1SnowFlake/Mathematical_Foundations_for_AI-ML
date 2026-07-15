"use client";

interface EmbedFrameProps {
  /** URL to embed */
  src: string;
  /** Title displayed above the iframe */
  title: string;
  /** Attribution text and link for the embedded tool */
  attribution: {
    name: string;
    url: string;
  };
  /** Aspect ratio as width:height string, e.g. "16:9" */
  aspectRatio?: string;
  /** Optional CSS class */
  className?: string;
}

/**
 * Consistent iframe wrapper for third-party educational tools.
 * All external embeds (GeoGebra, Desmos, TF Playground, CNN Explainer, etc.)
 * go through this component to ensure consistent loading UX and attribution.
 */
export default function EmbedFrame({
  src,
  title,
  attribution,
  aspectRatio = "16:9",
  className = "",
}: EmbedFrameProps) {
  const [w, h] = aspectRatio.split(":").map(Number);
  const paddingPercent = ((h ?? 9) / (w ?? 16)) * 100;

  return (
    <div className={`widget-card ${className}`}>
      {/* Title bar */}
      <div className="widget-card__title flex items-center justify-between">
        <span>{title}</span>
        <a
          href={attribution.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-normal text-foreground-muted hover:text-accent transition-colors"
        >
          Powered by {attribution.name} ↗
        </a>
      </div>

      {/* Iframe container with fixed aspect ratio */}
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border bg-background-secondary"
        style={{ paddingBottom: `${paddingPercent}%` }}
      >
        {/* Loading skeleton */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-foreground-subtle">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground-subtle border-t-accent" />
            <span className="text-xs">Loading {title}…</span>
          </div>
        </div>

        {/* Iframe sits on top of skeleton, hides it once loaded */}
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 h-full w-full"
          style={{ border: "none" }}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
