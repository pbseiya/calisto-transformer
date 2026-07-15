import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DGA Monitor - Dissolved Gas Analysis Dashboard",
  description: "Real-time DGA monitoring for power transformers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
