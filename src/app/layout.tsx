import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "QiraCheck — AI Quran Recitation Practice",
  description: "Practice Quran recitation with transcript-based feedback.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="ml"><body>{children}</body></html>;
}
