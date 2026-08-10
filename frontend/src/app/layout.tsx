import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "TerraSense AI — Smart Soil Intelligence System",
  description: "AI-powered soil health scoring, nutrient analysis, crop recommendations and explainable ML.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="app-bg min-h-screen">
        <ThemeProvider>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 min-w-0">
              <Header />
              <main className="px-4 py-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto animate-fade-in">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
