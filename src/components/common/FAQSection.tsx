"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs: FAQItem[] = [
    {
      question: "What is TryMe.lk?",
      answer: "TryMe.lk is Sri Lanka's premier multi-vendor e-commerce platform. It connects buyers with trusted local sellers, ensuring a safe shopping experience with secure escrow payments."
    },
    {
      question: "Is TryMe.lk free to use?",
      answer: "Yes! Browsing and shopping on TryMe.lk is completely free for buyers. Sellers can also register and list their products, with standard transaction fees or subscription packages applying depending on their seller tier."
    },
    {
      question: "How do I sell on TryMe.lk?",
      answer: "Selling is easy! Click on the 'Become a Vendor' link in the footer or navigation, register your store, verify your vendor details, and you can start listing your products and receiving orders."
    },
    {
      question: "Is TryMe.lk available as a mobile app?",
      answer: "Currently, TryMe.lk is fully optimized as a responsive web application that works perfectly on all mobile devices. A native mobile app is in our roadmap and will be released soon!"
    },
    {
      question: "What categories can I shop in?",
      answer: "You can shop across a wide variety of categories including Men's Clothing, Women's Clothing, Kids' Wear, Accessories, Footwear, and even browse local classified ads in our Marketplace section."
    },
    {
      question: "Can I meet the buyer or seller in person?",
      answer: "For marketplace classified ads, you may coordinate meetup and inspection. However, for storefront purchases, we highly recommend utilizing our secure escrow system and delivery service to ensure safety and buyer protection."
    },
    {
      question: "Is it safe to shop on TryMe.lk?",
      answer: "Absolutely! TryMe.lk features a secure escrow payment system. Your payment is held safely until the order is successfully delivered and verified, protecting you from fraud and ensuring peace of mind."
    },
    {
      question: "Can I sell new items on TryMe.lk?",
      answer: "Yes, you can sell both brand-new items as a storefront vendor, and secondhand/pre-owned items via our classified marketplace section."
    }
  ];

  return (
    <section className="py-16 bg-white dark:bg-slate-950">
      <div className="container max-w-4xl px-4 md:px-6">
        {/* Title / Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-2">
            <span className="bg-[#FF6600] text-white px-4 py-1.5 rounded-2xl shadow-md transform -rotate-1 hover:rotate-0 transition-transform duration-300">
              TryMe
            </span>
            <span className="text-slate-800 dark:text-slate-100">FAQ'S</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-lg mx-auto font-medium leading-relaxed">
            We've answered the most common questions to help you shop with confidence on tryme.lk
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left focus:outline-none group"
                  aria-expanded={isOpen}
                >
                  <span className="text-base md:text-lg font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#FF6600] dark:group-hover:text-[#FF6600] transition-colors duration-200">
                    {faq.question}
                  </span>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#FF6600] transition-all duration-300 ${
                      isOpen
                        ? "bg-[#FF6600]/10 border-[#FF6600]/20 rotate-45"
                        : "bg-transparent group-hover:border-[#FF6600]/40 group-hover:bg-[#FF6600]/5"
                    }`}
                  >
                    <Plus className="w-5 h-5 transition-transform duration-300" />
                  </div>
                </button>

                {/* Smooth expansion panel */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[300px] border-t border-slate-50 dark:border-slate-800/50" : "max-h-0"
                  }`}
                >
                  <div className="p-5 md:p-6 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
