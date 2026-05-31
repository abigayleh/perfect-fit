import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalAudio from "./GlobalAudio";
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
  title: "Perfect Fit",
  description: "A puzzle game where pieces must fit perfectly together",
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
    >
      <body className="min-h-full flex flex-col">
        <GlobalAudio />
        {children}
      </body>
    </html>
  );
}
