import { Metadata } from "next";
import { PosRegisterClient } from "@/components/pos/PosRegisterClient";

export const metadata: Metadata = {
  title: "POS System - Ads Seller Dashboard",
  description: "Point of Sale register for walk-in retail sales of advertised items and real-time inventory management",
};

export default function AdsSellerPosPage() {
  return (
    <PosRegisterClient
      apiEndpoint="/api/ads-seller/pos"
      dashboardRole="ads-seller"
      initialStoreName="Ads Seller Store"
    />
  );
}

