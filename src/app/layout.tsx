import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QiraCheck — AI Quran Recitation Practice",
  description: "Practice Quran recitation with transcript-based feedback.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ml"><body>{children}</body></html>;
}
