"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/layout/shared/Logo";
import { ArrowLeft, Check, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CategoryPicker } from "@/components/ads/CategoryPicker";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function AdsSellerRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    businessName: "",
    primaryCategory: "",
    primaryCategoryName: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories for direct selection in Step 3
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/ads/public/categories");
        const json = await response.json();
        if (json.success) {
          setCategories(json.data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep1 = () => {
    const stepErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) stepErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) stepErrors.lastName = "Last name is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      stepErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      stepErrors.email = "Invalid email address";
    }

    const slPhoneRegex = /^(?:\+94|94|0)?7[0-9]{8}$/;
    if (!formData.phone.trim()) {
      stepErrors.phone = "Phone number is required";
    } else if (!slPhoneRegex.test(formData.phone)) {
      stepErrors.phone = "Enter a valid Sri Lankan mobile number (e.g. 0771234567)";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep2 = () => {
    const stepErrors: Record<string, string> = {};
    if (!formData.password) {
      stepErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      stepErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      stepErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleCategorySelect = (id: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      primaryCategory: name, // We store the name or slug
      primaryCategoryName: name,
    }));
    if (errors.primaryCategory) {
      setErrors((prev) => ({ ...prev, primaryCategory: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.primaryCategory) {
      setErrors({ primaryCategory: "Please select a primary category for your business" });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/ads/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          businessName: formData.businessName || undefined,
          primaryCategory: formData.primaryCategory,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStep(4); // Success screen step
        toast.success("Account created successfully!");
      } else {
        toast.error(result.error || "Registration failed");
        setErrors({ submit: result.error });
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-pink-50 px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Back link */}
        {step < 4 && (
          <Link
            href="/staff/login"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Login
          </Link>
        )}

        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo variant="icon" size="lg" className="mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span>Become an Ads Seller</span>
            <Sparkles className="h-5 w-5 text-[#FF6600] animate-pulse" />
          </h1>
          <p className="text-gray-600">Register to publish classified ads on TryMe</p>
        </div>

        {/* Card */}
        <div className="border bg-white rounded-2xl shadow-xl p-8 border-gray-100 relative overflow-hidden">
          {/* Progress bar */}
          {step < 4 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Step {step} of 3
                </span>
                <span className="text-xs font-bold text-[#FF6600]">
                  {step === 1 ? "Personal Info" : step === 2 ? "Business & Security" : "Select Category"}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${
                      errors.firstName ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${
                      errors.lastName ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="name@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${
                    errors.phone ? "border-red-500" : "border-gray-200"
                  }`}
                  placeholder="e.g. 0771234567"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 mt-6 py-3 bg-[#FF6600] text-white rounded-xl text-sm font-semibold hover:bg-[#e65c00] transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business / Store Name <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600]"
                  placeholder="e.g. Dinusha Mobiles"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6600] text-white rounded-xl text-sm font-semibold hover:bg-[#e65c00] transition-colors"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3 text-center">
                  Select your primary sector / category *
                </label>
                
                {/* Category Grid for direct selection */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id, cat.name)}
                      className={`flex flex-col items-center justify-center p-4 border rounded-2xl text-center transition-all duration-200 ${
                        formData.primaryCategory === cat.name
                          ? "border-[#FF6600] bg-[#FF6600]/5 text-[#FF6600] font-semibold scale-[1.02]"
                          : "border-gray-100 hover:border-gray-300 bg-gray-50/50 hover:bg-white text-gray-700"
                      }`}
                    >
                      <span className="text-3xl mb-2 flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-50">
                        {cat.icon || "📁"}
                      </span>
                      <span className="text-xs">{cat.name}</span>
                    </button>
                  ))}
                  
                  {/* Or open picker */}
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-2xl text-center bg-gray-50/20 hover:bg-white text-gray-500 hover:border-gray-400 transition-all duration-200"
                  >
                    <span className="text-2xl mb-2">🔍</span>
                    <span className="text-xs font-semibold">More...</span>
                  </button>
                </div>
                
                {errors.primaryCategory && (
                  <p className="text-red-500 text-xs mt-3 text-center">{errors.primaryCategory}</p>
                )}

                {formData.primaryCategoryName && (
                  <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-xl text-sm text-center font-medium border border-green-100 flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Selected: <strong>{formData.primaryCategoryName}</strong></span>
                  </div>
                )}
              </div>

              {errors.submit && (
                <p className="text-red-500 text-xs text-center">{errors.submit}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF6600] text-white rounded-xl text-sm font-semibold hover:bg-[#e65c00] transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <span>Register</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <Check className="h-8 w-8" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900">Registration Received!</h2>
              
              <div className="text-sm text-gray-600 space-y-4 max-w-sm mx-auto">
                <p>
                  Thank you for registering to become an Ads Seller on TryMe. Your account is currently under review by our moderation team.
                </p>
                <p className="font-semibold text-gray-800">
                  You will receive an email confirmation once your account has been verified and activated (usually within 1-2 business days).
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-[#FF6600] text-white rounded-xl text-sm font-semibold hover:bg-[#e65c00] transition-colors"
                >
                  Return to Storefront
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Additional info */}
        {step < 4 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <Link href="/staff/login" className="text-[#FF6600] font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Category Picker Dialog */}
      <CategoryPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onlyParentCategory={true}
        onSelectParent={handleCategorySelect}
      />
    </div>
  );
}
