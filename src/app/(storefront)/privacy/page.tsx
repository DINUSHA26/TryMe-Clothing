import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Privacy Policy | Try Me",
  description: "Read Try Me's Privacy Policy to understand how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm mb-6">Last updated: February 2026</p>
      <Separator className="mb-8" />

      <div className="space-y-8 text-sm leading-7">

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>
            Try Me (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy.
            This Privacy Policy explains what personal data we collect, how we use it, and your
            rights regarding that data when you use our platform at <strong>tryme.lk</strong>.
          </p>
          <p>
            By using Try Me, you consent to the data practices described in this policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Data We Collect</h2>
          <p>We collect the following categories of personal data:</p>

          <h3 className="font-medium mt-3">Account Information</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Full name</li>
            <li>Email address (used for OTP login and notifications)</li>
            <li>Phone number (stored with delivery addresses)</li>
            <li>Hashed password (for vendor and admin accounts)</li>
          </ul>

          <h3 className="font-medium mt-3">Order &amp; Transaction Data</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Delivery addresses (street, city, province, postal code)</li>
            <li>Order history and item details</li>
            <li>Payment status and transaction references (no card data is stored — handled by PayHere)</li>
            <li>Wallet balance and transaction history</li>
          </ul>

          <h3 className="font-medium mt-3">Usage Data</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Pages visited and products viewed</li>
            <li>Cart contents</li>
            <li>Chat messages (stored for dispute resolution)</li>
            <li>Device type and browser (via standard server logs)</li>
          </ul>

          <h3 className="font-medium mt-3">Vendor-Specific Data</h3>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Business name and shop details</li>
            <li>Bank account information (for payouts — stored securely)</li>
            <li>Product listings, images, and inventory</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. How We Use Your Data</h2>
          <p>We use your personal data to:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Process and fulfil your orders</li>
            <li>Send OTP verification codes and account notifications via email</li>
            <li>Communicate order status updates and shipping information</li>
            <li>Process payments and manage wallet balances</li>
            <li>Resolve disputes and support requests</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Improve the platform based on usage patterns</li>
            <li>Comply with legal obligations</li>
          </ul>
          <p>
            We do not sell your personal data to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Third-Party Services</h2>
          <p>
            To provide our services, we share data with trusted third-party providers:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
            <li>
              <strong>PayHere</strong> — payment processing. Your payment details are entered
              directly on PayHere&apos;s secure gateway. We never see or store card numbers.
              PayHere&apos;s privacy policy applies to payment data.
            </li>
            <li>
              <strong>Resend</strong> — transactional email delivery (OTP codes, order confirmations,
              notifications).
            </li>
            <li>
              <strong>Cloudinary</strong> — image storage and optimisation for product photos
              and dispute evidence.
            </li>
            <li>
              <strong>Supabase / PostgreSQL</strong> — secure database hosting for all platform
              data.
            </li>
            <li>
              <strong>Upstash Redis</strong> — temporary caching for OTP codes and session data.
            </li>
          </ul>
          <p>
            All third-party providers are selected for their security standards and are
            contractually required to handle your data appropriately.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Chat Message Monitoring</h2>
          <p>
            All chat messages between customers and vendors are stored and may be reviewed by
            our admin team, particularly in the context of dispute resolution. To protect user
            safety and prevent off-platform transactions, our system automatically filters and
            blocks messages containing personal contact information such as:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Phone numbers (Sri Lankan and international formats)</li>
            <li>Email addresses</li>
            <li>Social media usernames or links (WhatsApp, Instagram, Facebook, etc.)</li>
          </ul>
          <p>
            By using our chat feature, you acknowledge that messages are monitored and filtered.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Cookies &amp; Session Tokens</h2>
          <p>
            We use <strong>httpOnly cookies</strong> to store your authentication tokens
            (access token and refresh token) securely. These cookies are:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Not accessible by JavaScript (prevents XSS attacks)</li>
            <li>Automatically deleted when you log out</li>
            <li>Access tokens expire after 1 hour; refresh tokens after 7 days</li>
          </ul>
          <p>
            We do not currently use tracking or advertising cookies. We may use analytics
            cookies in the future and will update this policy accordingly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Data Retention</h2>
          <p>
            We retain your personal data for as long as your account is active or as needed
            to provide services and comply with legal requirements. Specifically:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Order records: retained for 7 years (legal/tax compliance)</li>
            <li>Notifications: auto-deleted after 90 days</li>
            <li>OTP codes: deleted immediately after use or expiry</li>
            <li>Chat messages: retained for dispute resolution purposes</li>
          </ul>
          <p>
            You may request deletion of your account and personal data at any time (see
            Section 9).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Data Security</h2>
          <p>
            We take the security of your data seriously. Our security measures include:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>HTTPS encryption for all data in transit</li>
            <li>httpOnly cookies for authentication tokens</li>
            <li>Bcrypt password hashing (cost factor 12+)</li>
            <li>Parameterised database queries (prevents SQL injection)</li>
            <li>Role-based access control for all API endpoints</li>
            <li>PayHere webhook signature verification</li>
          </ul>
          <p>
            No system is 100% secure. If you suspect a security breach, please contact us
            immediately at{" "}
            <a
              href="mailto:support@tryme.lk"
              className="text-primary underline underline-offset-4"
            >
              support@tryme.lk
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Your Rights</h2>
          <p>You have the following rights regarding your personal data:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
            <li><strong>Correction:</strong> Request correction of inaccurate data</li>
            <li>
              <strong>Deletion:</strong> Request deletion of your account and personal data
              (subject to legal retention requirements)
            </li>
            <li><strong>Objection:</strong> Object to certain uses of your data</li>
          </ul>
          <p>
            To exercise any of these rights, please email us at{" "}
            <a
              href="mailto:support@tryme.lk"
              className="text-primary underline underline-offset-4"
            >
              support@tryme.lk
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Children&apos;s Privacy</h2>
          <p>
            Try Me is not intended for children under the age of 16. We do not knowingly
            collect personal data from children. If you believe a child has provided us with
            personal data, please contact us and we will delete it promptly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on
            this page with an updated date. We encourage you to review this policy periodically.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Contact Us</h2>
          <p>
            If you have any questions or concerns about this Privacy Policy or how your data
            is handled, please contact us:
          </p>
          <p className="text-muted-foreground">
            Try Me<br />
            Email:{" "}
            <a
              href="mailto:support@tryme.lk"
              className="text-primary underline underline-offset-4"
            >
              support@tryme.lk
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}

