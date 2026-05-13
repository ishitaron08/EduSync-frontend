import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduSync",
  description: "Smart academic scheduling and goal optimization"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <NoiseOverlay />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
