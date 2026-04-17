import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NavigationPanel from "../components/NavigationPanel";
import BottomNav from "../components/BottomNav";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CrowdControl | Precision Management",
  description: "Next-generation crowd intelligence and venue safety platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
      >
        {children}
        <NavigationPanel />
        <BottomNav />
      </body>
    </html>
  );
}
