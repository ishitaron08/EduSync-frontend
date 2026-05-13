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
      className="h-full overflow-hidden antialiased"
    >
      <body className="flex h-full flex-col overflow-hidden" suppressHydrationWarning>
        <NoiseOverlay />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
