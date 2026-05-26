import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Terms & Conditions | Fashion Dora",
  description: "Read Fashion Dora's Terms & Conditions governing the use of our multi-vendor e-commerce platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
      <p className="text-muted-foreground text-sm mb-6">Last updated: February 2026</p>
      <Separator className="mb-8" />

      <div className="space-y-8 text-sm leading-7">

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            Welcome to Fashion Dora (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By accessing or using
            our website at <strong>fashiondora.lk</strong>, you agree to be bound by these Terms &amp;
            Conditions. If you do not agree, please do not use our platform.
          </p>
          <p>
            Fashion Dora is a multi-vendor e-commerce marketplace operating in Sri Lanka, connecting
            customers with independent vendors selling fashion and lifestyle products.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. User Roles</h2>
          <p>The platform has three types of users:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
            <li>
              <strong>Customers</strong> — individuals who browse and purchase products. Customers
              register via email OTP (no password required).
            </li>
            <li>
              <strong>Vendors</strong> — businesses or individuals who sell products on the
              platform. Vendor accounts are created by the Admin only.
            </li>
            <li>
              <strong>Admin</strong> — the platform owner with full control over users, orders,
              disputes, and payouts.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Account Responsibilities</h2>
          <p>By creating an account, you agree to:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Provide accurate and truthful information</li>
            <li>Keep your login credentials confidential</li>
            <li>Notify us immediately of any unauthorised access to your account</li>
            <li>Be responsible for all activity that occurs under your account</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Ordering &amp; Payments</h2>
          <p>
            All prices on Fashion Dora are listed in Sri Lankan Rupees (LKR). When you place an
            order, payment is processed through <strong>PayHere</strong>, our payment gateway.
            We accept Visa, Mastercard, and other methods supported by PayHere.
          </p>
          <p>
            Payments are held in <strong>escrow</strong> by Fashion Dora until you confirm delivery
            of your order. Vendor funds are not released until delivery is confirmed by the customer.
          </p>
          <p>
            By completing a purchase, you agree that:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>You are authorised to use the payment method provided</li>
            <li>The information you submit is accurate</li>
            <li>We may cancel orders we reasonably suspect are fraudulent</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Order Cancellation</h2>
          <p>
            Customers may cancel an order within <strong>24 hours</strong> of placing it,
            provided the order has not yet been shipped. Cancellation requests can be made
            from the order details page in your account.
          </p>
          <p>
            If an order is cancelled, any payment made will be refunded to your Fashion Dora wallet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Returns &amp; Refunds</h2>
          <p>
            Returns must be requested within <strong>24 hours</strong> of confirming delivery.
            Please refer to our{" "}
            <a href="/returns" className="text-primary underline underline-offset-4">
              Return &amp; Exchanges Policy
            </a>{" "}
            for full details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Vendor Terms</h2>
          <p>Vendors on Fashion Dora agree to the following:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>List only products they are legally authorised to sell</li>
            <li>Provide accurate product descriptions, images, and pricing</li>
            <li>
              Pay the platform commission (default 10%, as set by Admin) on each successful
              sale — deducted automatically from earnings
            </li>
            <li>Dispatch orders promptly after receiving confirmation</li>
            <li>Respond to customer queries and dispute requests in a timely manner</li>
            <li>Not share personal contact details with customers outside the platform</li>
          </ul>
          <p>
            Vendor payouts are processed weekly upon admin approval. The minimum payout amount
            is Rs. 1,000.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Prohibited Conduct</h2>
          <p>Users must not:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Share personal contact details (phone numbers, email, social media) in chat messages</li>
            <li>Attempt to conduct transactions outside the Fashion Dora platform</li>
            <li>Post false, misleading, or defamatory content</li>
            <li>Sell counterfeit, illegal, or prohibited goods</li>
            <li>Engage in fraudulent orders, chargebacks, or abuse of the dispute system</li>
            <li>Attempt to reverse-engineer, scrape, or disrupt the platform</li>
          </ul>
          <p>
            Violation of these rules may result in immediate account suspension and legal action.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Dispute Resolution</h2>
          <p>
            If you have a dispute with a vendor, you may open a formal dispute through your
            order details page within <strong>7 days</strong> of confirming delivery. Our admin
            team will review the case and make a final binding decision.
          </p>
          <p>
            For platform-related disputes, please contact us at{" "}
            <a
              href="mailto:support@fashiondora.lk"
              className="text-primary underline underline-offset-4"
            >
              support@fashiondora.lk
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Intellectual Property</h2>
          <p>
            All content on Fashion Dora — including logos, design, text, and software — is the
            property of Fashion Dora or its licensors. You may not reproduce, distribute, or create
            derivative works without our prior written consent.
          </p>
          <p>
            Vendors retain ownership of their product content but grant Fashion Dora a non-exclusive
            licence to display it on the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Limitation of Liability</h2>
          <p>
            Fashion Dora acts as a marketplace intermediary. We are not the seller of record for
            any product listed by vendors. To the fullest extent permitted by law, Fashion Dora
            is not liable for:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Product quality, accuracy of descriptions, or vendor conduct</li>
            <li>Delays or losses caused by third-party carriers</li>
            <li>Indirect, incidental, or consequential damages</li>
          </ul>
          <p>
            Our maximum liability to any customer shall not exceed the amount paid for the
            specific order in question.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Privacy</h2>
          <p>
            Your use of Fashion Dora is also governed by our{" "}
            <a href="/privacy" className="text-primary underline underline-offset-4">
              Privacy Policy
            </a>
            , which is incorporated into these terms by reference.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">13. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms &amp; Conditions at any time. Changes will
            be posted on this page with an updated date. Continued use of the platform after
            changes constitutes your acceptance of the updated terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">14. Governing Law</h2>
          <p>
            These Terms &amp; Conditions are governed by the laws of the <strong>Democratic
            Socialist Republic of Sri Lanka</strong>. Any disputes shall be subject to the
            exclusive jurisdiction of the courts of Sri Lanka.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">15. Contact Us</h2>
          <p>
            If you have any questions about these terms, please contact us at{" "}
            <a
              href="mailto:support@fashiondora.lk"
              className="text-primary underline underline-offset-4"
            >
              support@fashiondora.lk
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  );
}

