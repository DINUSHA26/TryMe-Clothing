import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NotificationToast } from "@/components/notifications/NotificationToast";
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
        {children}
        <Toaster />
        <NotificationToast />
      </body>
    </html>
  );
}
