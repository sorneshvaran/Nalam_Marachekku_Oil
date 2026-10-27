import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nalam - Natural Wood-Pressed Oils & Foods",
  description: "Traditional Indian wood-pressed oils and natural food products. Cold-pressed groundnut, gingelly, coconut, castor, neem, and mahua oils alongside jaggery and rock salt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased` }>
      <body className="min-h-full flex flex-col bg-cream-50 text-earth-900">
        {children}
      </body>
    </html>
  );
}