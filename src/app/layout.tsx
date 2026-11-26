import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { AppInstallProvider } from "@/components/install-app";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Billora — All Your Billing, One Place",
  description: "Fast, dependable billing and inventory for restaurants and small shops.",
  icons: { icon: "/icons/billora-192.png", apple: "/icons/billora-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#087747",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>
        <WorkspaceProvider>
          <AppInstallProvider>{children}</AppInstallProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
