import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Cookie Policy | Try Me",
  description: "Learn how Try Me uses cookies and similar technologies on our platform.",
};

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
      <p className="text-muted-foreground text-sm mb-6">Last updated: February 2026</p>
      <Separator className="mb-8" />

      <div className="space-y-8 text-sm leading-7">

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files placed on your device by a website when you visit it.
            They are widely used to make websites work efficiently, remember your preferences,
            and provide information to site owners.
          </p>
          <p>
            Similar technologies include <strong>localStorage</strong> (browser storage) and
            <strong> session tokens</strong> (secure cookies used for authentication). This
            policy covers all such technologies used by Try Me.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. How We Use Cookies</h2>
          <p>Try Me uses cookies and similar technologies for the following purposes:</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold w-1/4">Name</th>
                  <th className="text-left py-2 pr-4 font-semibold w-1/4">Type</th>
                  <th className="text-left py-2 pr-4 font-semibold w-1/4">Purpose</th>
                  <th className="text-left py-2 font-semibold w-1/4">Expiry</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">accessToken</td>
                  <td className="py-2 pr-4">Authentication</td>
                  <td className="py-2 pr-4">Keeps you logged in during your session</td>
                  <td className="py-2">1 hour</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">refreshToken</td>
                  <td className="py-2 pr-4">Authentication</td>
                  <td className="py-2 pr-4">Automatically renews your session without re-login</td>
                  <td className="py-2">7 days</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">cart (localStorage)</td>
                  <td className="py-2 pr-4">Functional</td>
                  <td className="py-2 pr-4">Saves your shopping cart while browsing as a guest</td>
                  <td className="py-2">Until cleared</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Authentication Cookies</h2>
          <p>
            Our two authentication cookies (<code className="font-mono bg-muted px-1 rounded text-xs">accessToken</code> and{" "}
            <code className="font-mono bg-muted px-1 rounded text-xs">refreshToken</code>) are
            strictly necessary for the platform to function when you are logged in. They:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Are set as <strong>httpOnly</strong> — they cannot be accessed by JavaScript, protecting against XSS attacks</li>
            <li>Are set as <strong>Secure</strong> in production — only sent over HTTPS</li>
            <li>Are automatically deleted when you log out</li>
            <li>Contain a signed JWT token — no personal data is stored in the cookie itself</li>
          </ul>
          <p>
            Because these cookies are strictly necessary for authentication, they do not require
            your consent under applicable regulations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Guest Cart (localStorage)</h2>
          <p>
            When you browse Try Me without logging in and add items to your cart, those items
            are saved in your browser&apos;s <strong>localStorage</strong> — not on our servers.
            This data stays on your device until you clear your browser storage or log in
            (at which point it is merged with your account cart and cleared from localStorage).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Analytics &amp; Tracking Cookies</h2>
          <p>
            Try Me does <strong>not</strong> currently use any third-party analytics,
            advertising, or tracking cookies. We do not use Google Analytics, Facebook Pixel,
            or similar tools.
          </p>
          <p>
            If we introduce analytics cookies in the future, we will update this policy and
            request your consent where required by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Third-Party Cookies</h2>
          <p>
            When you make a payment through <strong>PayHere</strong>, you are redirected to
            PayHere&apos;s payment page. PayHere may set its own cookies during the payment
            process. We do not control these cookies — please refer to PayHere&apos;s privacy
            and cookie policy for details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Managing Cookies</h2>
          <p>
            You can control and delete cookies through your browser settings. Most browsers
            allow you to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>View cookies that are set</li>
            <li>Delete specific cookies or all cookies</li>
            <li>Block cookies from specific sites</li>
            <li>Block all cookies (note: this will prevent you from logging in)</li>
          </ul>
          <p>
            For instructions specific to your browser, visit its help documentation:
          </p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2">
            <li>Chrome: Settings → Privacy and security → Cookies</li>
            <li>Firefox: Settings → Privacy &amp; Security → Cookies</li>
            <li>Safari: Preferences → Privacy → Manage Website Data</li>
            <li>Edge: Settings → Cookies and site permissions</li>
          </ul>
          <p>
            To clear localStorage (guest cart), open your browser&apos;s DevTools
            (F12) → Application → Local Storage → right-click and clear.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Changes to This Policy</h2>
          <p>
            We may update this Cookie Policy when we introduce new technologies or change how
            we use existing ones. Changes will be posted on this page with an updated date.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Contact Us</h2>
          <p>
            If you have questions about our use of cookies, please contact us at{" "}
            <a
              href="mailto:support@tryme.lk"
              className="text-primary underline underline-offset-4"
            >
              support@tryme.lk
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  );
}

