import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Kalorická polícia",
  description: "Odfoť jedlo, my vyšetríme kalórie. Hravý tracker kalórií a bielkovín.",
  applicationName: "Kalorická polícia",
  appleWebApp: { capable: true, title: "Kal. polícia", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#FBF7F0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className={nunito.variable} style={{ ["--kp-font" as string]: "var(--font-nunito), ui-rounded, system-ui, sans-serif" }}>
      <body>
        {/* Android: zachyť inštalačnú výzvu skôr, než sa načíta React. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__kpInstall=e;});",
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
