import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Return & Exchanges Policy | Try Me",
  description: "Try Me's return and exchange policy — learn about the 24-hour return window, eligibility, and refund process.",
};

export default function ReturnsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Return &amp; Exchanges Policy</h1>
      <p className="text-muted-foreground text-sm mb-6">Last updated: February 2026</p>
      <Separator className="mb-8" />

      <div className="space-y-8 text-sm leading-7">

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Overview</h2>
          <p>
            We want you to be completely satisfied with your purchase. If you are not happy with
            an item, you may request a return within the timeframe outlined below. Returns are
            subject to eligibility criteria and must be initiated through your Try Me account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Return Window</h2>
          <p>
            You have <strong>24 hours</strong> from the time you confirm delivery of your order
            to submit a return request. After this window, return requests will no longer be
            accepted for that order.
          </p>
          <p>
            Delivery confirmation is recorded when you click <strong>"Confirm Delivery"</strong>{" "}
            in your order details. Please inspect your items carefully before confirming delivery.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Eligible Reasons for Return</h2>
          <p>Returns are accepted for the following reasons:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Item arrived damaged or defective</li>
            <li>Wrong item was sent (different from what was ordered)</li>
            <li>Item does not match the description or photos on the listing</li>
            <li>Item was not received (use with dispute process)</li>
            <li>Significant quality issue</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Non-Returnable Items</h2>
          <p>The following items are not eligible for return:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Perishable goods (food, beverages, flowers)</li>
            <li>Digital products and downloadable content</li>
            <li>Intimate apparel and hygiene products (for health and safety reasons)</li>
            <li>Items that have been used, washed, or altered by the customer</li>
            <li>Items without original packaging (where packaging is part of the product)</li>
            <li>Customised or personalised items made to order</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. How to Request a Return</h2>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-2">
            <li>Go to <strong>My Orders</strong> in your account</li>
            <li>Select the order and find the item you want to return</li>
            <li>Click <strong>"Request Return"</strong> within 24 hours of confirming delivery</li>
            <li>Select the reason and provide a brief description</li>
            <li>Submit your return request</li>
          </ol>
          <p>
            Once submitted, the vendor and our support team will review your request. You will
            receive a notification with the outcome.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Return Shipping</h2>
          <p>
            Return shipping costs are the responsibility of the customer, unless the return is
            due to a vendor error (e.g. wrong item sent, damaged on arrival). In cases of vendor
            error, the vendor is responsible for arranging or reimbursing return shipping.
          </p>
          <p>
            Please do not send items back before your return request is approved. Unapproved
            returns may not be accepted.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Refund Process</h2>
          <p>
            Once the returned item is received and inspected by the vendor, your refund will
            be processed. Approved refunds are credited to your <strong>Try Me wallet</strong>.
            Wallet funds can be used for future purchases on the platform.
          </p>
          <p>
            If a dispute is raised (e.g. vendor denies the return), our admin team will review
            the case and may issue a refund to your wallet based on the evidence provided.
          </p>
          <p>
            Refunds to original payment method (card) are not currently supported. All refunds
            are issued to the Try Me wallet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Exchanges</h2>
          <p>
            We do not currently support direct item exchanges. If you wish to exchange an item:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-2">
            <li>Request a return for the original item (within the 24-hour window)</li>
            <li>Once the refund is credited to your wallet, place a new order for the replacement item</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Disputes</h2>
          <p>
            If you are unable to resolve a return issue with the vendor, you can open a formal
            dispute from your order details page. Disputes must be raised within <strong>7 days</strong>{" "}
            of delivery confirmation. Our admin team will review all evidence and make a final
            decision.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Contact Us</h2>
          <p>
            For return and refund queries, please contact us at{" "}
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
