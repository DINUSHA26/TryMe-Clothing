import { Metadata } from "next";
import { PosRegisterClient } from "@/components/pos/PosRegisterClient";

export const metadata: Metadata = {
  title: "POS System - Vendor Dashboard",
  description: "Point of Sale register for walk-in retail sales and real-time inventory management",
};

export default function VendorPosPage() {
  return (
    <PosRegisterClient
      apiEndpoint="/api/vendor/pos"
      dashboardRole="vendor"
      initialStoreName="Vendor Store"
    />
  );
}

