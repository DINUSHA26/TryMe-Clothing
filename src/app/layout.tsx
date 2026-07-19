import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { NotificationToast, OneSignalInitializer } from "@/components/notifications";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Try Me | Sri Lanka's Premier Multi-Vendor Marketplace",
  description: "tryme.lk Fast & Free Delivery — Explore tryme.lk for premium online shopping in Sri Lanka. Shop now! Shop smarter with tryme.lk! Your premium online shopping destination for fashion, electronics, and daily essentials. 100% Authentic Products. Trusted Brands.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {children}
        <Toaster />
        <NotificationToast />
        <OneSignalInitializer />
      </body>
    </html>
  );
}

