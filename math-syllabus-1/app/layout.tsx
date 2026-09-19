import "./globals.css";
import Providers from "@/components/layout/Providers";
import Sidebar from "@/components/layout/Sidebar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:pl-[280px]">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

