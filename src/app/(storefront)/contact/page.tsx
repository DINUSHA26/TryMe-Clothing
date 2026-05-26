import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Mail, Clock, MessageSquare, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Contact Us | Try Me",
  description: "Get in touch with the Try Me support team. We're here to help with orders, payments, disputes, and general enquiries.",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-muted-foreground text-sm mb-6">
        We&apos;re here to help. Reach out using any of the options below.
      </p>
      <Separator className="mb-10" />

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">

        <div className="border rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Email Support</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            For general enquiries, order issues, and account questions.
          </p>
          <a
            href="mailto:support@tryme.lk"
            className="text-sm text-primary underline underline-offset-4 font-medium"
          >
            support@tryme.lk
          </a>
        </div>

        <div className="border rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Support Hours</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Monday – Friday: 9:00 AM – 6:00 PM (Sri Lanka time)
          </p>
          <p className="text-sm text-muted-foreground">
            Saturday: 9:00 AM – 1:00 PM
          </p>
          <p className="text-sm text-muted-foreground">
            Sunday &amp; public holidays: Closed
          </p>
        </div>

        <div className="border rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Order Chat</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            For questions about a specific order, use the built-in chat on your order details page to message the vendor directly.
          </p>
          <Link
            href="/orders"
            className="text-sm text-primary underline underline-offset-4 font-medium"
          >
            Go to My Orders →
          </Link>
        </div>

        <div className="border rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Open a Dispute</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            If you have a problem with a delivered order that the vendor has not resolved, open a formal dispute within 7 days of confirming delivery.
          </p>
          <Link
            href="/orders"
            className="text-sm text-primary underline underline-offset-4 font-medium"
          >
            Go to My Orders →
          </Link>
        </div>

      </div>

      <Separator className="mb-10" />

      {/* Before you contact us */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Before You Contact Us</h2>
        <p className="text-sm text-muted-foreground leading-7">
          You may find a faster answer in our{" "}
          <Link href="/help" className="text-primary underline underline-offset-4">
            Help Center
          </Link>
          , which covers the most common questions about orders, payments, shipping, and returns.
        </p>
        <p className="text-sm text-muted-foreground leading-7">
          When emailing us about an order, please include your <strong>order number</strong> (e.g.
          TM-20260101-001) so we can look it up quickly.
        </p>
      </section>

      <Separator className="my-10" />

      {/* Vendor enquiries */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Vendor Enquiries</h2>
        <p className="text-sm text-muted-foreground leading-7">
          Interested in selling on Try Me? Vendor accounts are created by our admin team.
          Email us at{" "}
          <a
            href="mailto:vendors@tryme.lk"
            className="text-primary underline underline-offset-4"
          >
            vendors@tryme.lk
          </a>{" "}
          with your business name and a brief description of what you sell. We will get back to you
          as soon as possible.
        </p>
      </section>

    </div>
  );
}
