import type { Metadata } from "next";
import "./globals.css";
import { Navigation, Footer } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "LPSE Tender Aggregator",
  description: "Dashboard untuk melihat dan mencari tender dari berbagai LPSE di Indonesia",
  keywords: ["LPSE", "tender", "pengadaan", "pemerintah", "Indonesia"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans antialiased">
        <div className="flex min-h-screen flex-col">
          <Navigation />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
