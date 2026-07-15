"use client";

import { ThemeProvider } from "next-themes";

/**
 * Client-side providers wrapper.
 * Separated from the root layout to keep the layout as a server component.
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
