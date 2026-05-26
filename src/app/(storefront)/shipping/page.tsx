import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Shipping Policy | Try Me",
  description: "Learn about Try Me's shipping policy, delivery timelines, and shipping costs across Sri Lanka.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Shipping Policy</h1>
      <p className="text-muted-foreground text-sm mb-6">Last updated: February 2026</p>
      <Separator className="mb-8" />

      <div className="space-y-8 text-sm leading-7">

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Overview</h2>
          <p>
            Try Me is a multi-vendor marketplace. Each product on our platform is sold and shipped
            directly by independent vendors. Shipping timelines, costs, and carriers are set by
            individual vendors. This policy explains how shipping works across all orders placed
            on Try Me.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Shipping Coverage</h2>
          <p>
            We currently deliver within Sri Lanka only. Vendors may restrict delivery to specific
            provinces or districts. You will see the available shipping options at checkout based
            on your delivery address.
          </p>
          <p>
            Delivery is available across all nine provinces of Sri Lanka:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Western Province</li>
            <li>Central Province</li>
            <li>Southern Province</li>
            <li>Northern Province</li>
            <li>Eastern Province</li>
            <li>North Western Province</li>
            <li>North Central Province</li>
            <li>Uva Province</li>
            <li>Sabaragamuwa Province</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Shipping Costs</h2>
          <p>
            Shipping fees are determined by each vendor and will be clearly displayed during
            checkout before you confirm your order. Costs may vary based on:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Product weight and dimensions</li>
            <li>Delivery location (city vs. outstation)</li>
            <li>Chosen shipping carrier</li>
          </ul>
          <p>
            Some vendors may offer free shipping on orders above a minimum amount.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Delivery Timelines</h2>
          <p>
            Estimated delivery times vary by vendor and delivery location:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li><strong>Colombo &amp; suburbs:</strong> 1–3 business days</li>
            <li><strong>Other major cities:</strong> 2–5 business days</li>
            <li><strong>Outstation / rural areas:</strong> 3–7 business days</li>
          </ul>
          <p>
            These are estimates only. Actual delivery times depend on vendor dispatch speed,
            carrier workload, and external factors such as public holidays or adverse weather.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Multi-Vendor Orders</h2>
          <p>
            If your cart contains items from multiple vendors, your order will be split into
            separate shipments — one per vendor. Each shipment is processed and dispatched
            independently. You may receive items at different times.
          </p>
          <p>
            Shipping costs for each vendor's portion of your order are calculated and charged
            separately at checkout.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Order Processing</h2>
          <p>
            Orders are processed after successful payment confirmation. You can track your
            order status through your account under <strong>My Orders</strong>. The order
            lifecycle is as follows:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li><strong>Payment Confirmed</strong> – Your payment has been received</li>
            <li><strong>Processing</strong> – Vendor is preparing your order</li>
            <li><strong>Shipped</strong> – Your order has been dispatched; tracking info (if any) will be provided</li>
            <li><strong>Delivered</strong> – You confirm receipt of your order</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Delays &amp; Lost Packages</h2>
          <p>
            Try Me is not responsible for delays caused by third-party carriers, customs,
            or circumstances beyond our or the vendor's control. If your order has not arrived
            within the estimated timeframe, please:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Check your order status in <strong>My Orders</strong></li>
            <li>Contact the vendor via the in-order chat</li>
            <li>If unresolved, open a dispute from the order details page</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Incorrect Delivery Address</h2>
          <p>
            Please ensure your delivery address is accurate before placing an order. Try Me
            and our vendors are not responsible for failed deliveries due to an incorrect or
            incomplete address provided by the customer. Address changes after order placement
            cannot be guaranteed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Contact Us</h2>
          <p>
            For shipping-related queries, please contact us at{" "}
            <a
              href="mailto:support@tryme.lk"
              className="text-primary underline underline-offset-4"
            >
              support@tryme.lk
            </a>.
          </p>
        </section>

      </div>
    </div>
  );
}

