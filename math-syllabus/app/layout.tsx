import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/layout/Providers";
import Sidebar from "@/components/layout/Sidebar";
import { ProgressProvider } from "@/components/layout/ProgressProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interactive AI/Math/ML Syllabus",
  description:
    "Learn linear algebra, calculus, probability, graph theory, neural networks, transformers, and more through interactive visualizations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex">
        <Providers>
          <ProgressProvider>
            <Sidebar />
            <main className="flex-1 lg:ml-[280px] min-h-screen">
              <div className="mx-auto max-w-4xl px-6 py-12 lg:px-10">
                {children}
              </div>
            </main>
          </ProgressProvider>
        </Providers>
      </body>
    </html>
  );
}
