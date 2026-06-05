import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/lib/providers";

export const metadata: Metadata = {
  title: {
    default: "Care Diagnostics LIMS",
    template: "%s | Care Diagnostics",
  },
  description:
    "Professional Laboratory Information Management System — manage patients, samples, results, reports and invoices in one platform.",
  keywords: ["LIMS", "laboratory", "diagnostics", "healthcare", "pathology", "medical"],
  authors: [{ name: "Care Diagnostics" }],
  creator: "Care Diagnostics",
  robots: { index: false, follow: false }, // private app — no indexing
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#080D18",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
