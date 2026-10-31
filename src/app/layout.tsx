import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TINT | Traditional medicine knowledge",
  description: "Search reviewed AYUSH and traditional medicine knowledge.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
