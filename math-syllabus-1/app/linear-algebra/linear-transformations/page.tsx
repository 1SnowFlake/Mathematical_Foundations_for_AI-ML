"use client";

export default function LinearTransformationsPage() {
  return (
    <div
      style={{
        height: "calc(100vh - var(--nav-height, 64px))",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <iframe
        src="/linear-transformations.html"
        title="Linear Transformations — Interactive Visual Guide"
        style={{
          flex: 1,
          border: "none",
          width: "100%",
          height: "100%",
          display: "block",
        }}
        allow="accelerometer; autoplay"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}
