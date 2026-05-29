import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Givly",
  description: "Transparent donations with milestone-based fund release",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <nav className="border-b px-6 py-4 flex justify-between items-center">
          <a href="/" className="font-semibold text-lg">Givly</a>
          <a href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
            Admin
          </a>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}