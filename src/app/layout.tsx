import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/AuthContext";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Billora POS",
    template: "%s | Billora POS",
  },
  description: "A fast, responsive point-of-sale system for food businesses.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f8f4e",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
