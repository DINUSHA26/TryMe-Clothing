import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Help Center | Try Me",
  description: "Find answers to common questions about ordering, shipping, returns, payments, and your Try Me account.",
};

const faqs = [
  {
    category: "Orders",
    items: [
      {
        q: "How do I place an order?",
        a: "Browse products, add items to your cart, then proceed to checkout. You will need to be logged in with your email OTP to complete a purchase. At checkout you can select a delivery address, apply a coupon, and review your order before paying.",
      },
      {
        q: "Can I cancel my order?",
        a: 'Yes. You can cancel an order within 24 hours of placing it, provided it has not yet been shipped. Go to My Orders, open the order, and click "Cancel Order". A full refund will be credited to your Try Me wallet.',
      },
      {
        q: "How do I track my order?",
        a: "Go to My Orders in your account. Each order shows its current status: Payment Confirmed → Processing → Shipped → Delivered. If the vendor has provided a tracking number it will appear on the order details page.",
      },
      {
        q: "My order contains items from multiple vendors — will they arrive together?",
        a: "No. Each vendor ships independently, so you may receive separate packages at different times. Shipping costs for each vendor are shown separately at checkout.",
      },
    ],
  },
  {
    category: "Payments",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "We accept Visa and Mastercard via PayHere, Sri Lanka's secure payment gateway. Your card details are entered directly on PayHere's encrypted page — Try Me never sees or stores your card number.",
      },
      {
        q: "Is my payment secure?",
        a: "Yes. All payments are processed through PayHere with SSL encryption. Try Me uses an escrow model — your money is held safely until you confirm delivery of your order.",
      },
      {
        q: "When does the vendor receive my payment?",
        a: "Vendor funds are only released after you confirm delivery. This protects you as a buyer. If you never confirm delivery, funds remain held and you can raise a dispute.",
      },
      {
        q: "I was charged but my order shows Payment Failed. What should I do?",
        a: "This can happen if the payment gateway timed out. Please wait a few minutes and check your order status again. If your bank was charged but the order remains in a failed state, contact us at support@tryme.lk with your order number.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      {
        q: "How long does delivery take?",
        a: "Estimated delivery times: Colombo & suburbs 1–3 business days, other major cities 2–5 business days, outstation/rural areas 3–7 business days. These are estimates and may vary by vendor and carrier.",
      },
      {
        q: "How much does shipping cost?",
        a: "Shipping costs are set by each vendor and shown clearly at checkout before you confirm your order. Some vendors offer free shipping above a minimum order amount.",
      },
      {
        q: "Can I change my delivery address after ordering?",
        a: "Address changes after order placement cannot be guaranteed. Contact the vendor via the order chat as soon as possible. For future orders, ensure your address is correct before confirming.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    items: [
      {
        q: "Can I return an item?",
        a: 'Yes, within 24 hours of confirming delivery. Go to My Orders, open the order, and click "Request Return". See our Returns & Exchanges Policy for eligible reasons and non-returnable items.',
      },
      {
        q: "How are refunds processed?",
        a: "Approved refunds are credited to your Try Me wallet. Wallet funds can be used for future purchases on the platform. Refunds back to your original card are not currently supported.",
      },
      {
        q: "Who pays for return shipping?",
        a: "Return shipping is paid by the customer unless the return is due to a vendor error (wrong item, damaged on arrival). In that case the vendor is responsible for return shipping costs.",
      },
    ],
  },
  {
    category: "Account",
    items: [
      {
        q: "How do I log in?",
        a: "Try Me uses passwordless login for customers. Enter your email address and we will send you a one-time PIN (OTP) via email. Enter the PIN to log in — no password needed.",
      },
      {
        q: "How do I manage my delivery addresses?",
        a: "Go to your account and open the Address section. You can add, edit, or remove addresses. You can also set a default address that will be pre-selected at checkout.",
      },
      {
        q: "How do I view my wallet balance?",
        a: "After logging in, go to your account to see your wallet balance. Your wallet shows your available balance (ready to use at checkout) and any pending refunds.",
      },
    ],
  },
  {
    category: "Disputes",
    items: [
      {
        q: "What if I have a problem with my order?",
        a: "First, try contacting the vendor using the chat on your order details page. If the issue is not resolved, you can open a formal dispute within 7 days of confirming delivery. Go to My Orders → Order Details → Open Dispute.",
      },
      {
        q: "How long does a dispute take to resolve?",
        a: "Our admin team aims to review and resolve disputes as quickly as possible. You will receive a notification when a decision is made. You can add comments and evidence to your dispute at any time while it is open.",
      },
    ],
  },
];

export default function HelpCenterPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Help Center</h1>
      <p className="text-muted-foreground text-sm mb-2">
        Find answers to the most common questions below.
      </p>
      <p className="text-sm mb-6">
        Can&apos;t find what you&apos;re looking for?{" "}
        <Link href="/contact" className="text-primary underline underline-offset-4">
          Contact us
        </Link>{" "}
        and we&apos;ll be happy to help.
      </p>
      <Separator className="mb-10" />

      <div className="space-y-10">
        {faqs.map((section) => (
          <section key={section.category}>
            <h2 className="text-xl font-semibold mb-4">{section.category}</h2>
            <div className="space-y-5">
              {section.items.map((item) => (
                <div key={item.q} className="space-y-1">
                  <p className="font-medium text-sm">{item.q}</p>
                  <p className="text-sm text-muted-foreground leading-7">{item.a}</p>
                </div>
              ))}
            </div>
            <Separator className="mt-8" />
          </section>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-lg border bg-muted/40 text-sm text-center space-y-1">
        <p className="font-medium">Still need help?</p>
        <p className="text-muted-foreground">
          Email us at{" "}
          <a
            href="mailto:support@tryme.lk"
            className="text-primary underline underline-offset-4"
          >
            support@tryme.lk
          </a>
        </p>
      </div>
    </div>
  );
}
