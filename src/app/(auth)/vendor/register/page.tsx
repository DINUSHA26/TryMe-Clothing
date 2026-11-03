"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Store,
  ArrowLeft,
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Search,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { CategoryPicker } from "@/components/ads/CategoryPicker";

const SL_PHONE_REGEX = /^(?:\+94|0)7[01245678]\d{7}$/;

const registerSchema = z
  .object({
    businessName: z.string().min(2, "Business name must be at least 2 characters"),
    businessEmail: z.string().email("Invalid email address"),
    businessPhone: z
      .string()
      .regex(SL_PHONE_REGEX, "Invalid Sri Lankan phone number (e.g. 0771234567)"),
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function VendorRegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categoryError, setCategoryError] = useState<string>("");

  const [registrationError, setRegistrationError] = useState<{
    message: string;
    email?: string;
    isExisting?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  // Fetch business categories from adsCategory for parity with ads seller
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/ads/public/categories");
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleNextStep = async () => {
    const isValid = await trigger();
    if (isValid) {
      setStep(2);
    }
  };

  const handleCategorySelect = (id: string, name: string) => {
    setSelectedCategory(name);
    setCategoryError("");
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!selectedCategory) {
      setCategoryError("Please select a primary business category for your store.");
      return;
    }

    setIsLoading(true);
    setRegistrationError(null);
    try {
      const response = await fetch("/api/auth/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          primaryCategory: selectedCategory,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        const isExisting =
          !!result.alreadyRegistered ||
          result.error?.toLowerCase().includes("already exists") ||
          result.error?.toLowerCase().includes("already been submitted");

        setRegistrationError({
          message: result.error || "Registration failed",
          email: data.businessEmail,
          isExisting,
        });
        toast.error(result.error || "Registration failed");
        setStep(1); // Return to step 1 so user can see and fix existing email/details
        return;
      }

      setAuth(result.data.user, result.data.accessToken, result.data.refreshToken);
      toast.success(result.message || "Registration successful!");
      router.push("/vendor");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An unexpected error occurred");
      setRegistrationError({
        message: "An unexpected network error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 py-8">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Link>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-4 shadow-sm">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Registration</h1>
            <p className="text-gray-500 text-sm mt-1 text-center">
              Join Try Me and start selling to thousands of customers across Sri Lanka.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Step {step} of 2: {step === 1 ? "Store Details" : "Business Category"}
              </span>
              <span className="text-xs font-semibold text-[#FF6600]">
                {step === 1 ? "50%" : "100%"}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#FF6600] h-full transition-all duration-300"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>
          </div>

          {/* Registration Error Banner */}
          {registrationError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  {registrationError.message}
                </p>
              </div>

              {registrationError.isExisting && (
                <div className="pt-2 border-t border-red-100 flex items-center justify-between">
                  <span className="text-[11px] text-red-600 font-medium">Already registered?</span>
                  <Link
                    href={`/vendor/login?email=${encodeURIComponent(
                      registrationError.email || ""
                    )}`}
                    className="inline-flex items-center text-xs font-bold text-red-700 hover:text-red-900 underline"
                  >
                    <span>Sign In Here</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName" className="text-xs font-semibold">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      {...register("firstName")}
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-red-500">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName" className="text-xs font-semibold">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      {...register("lastName")}
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-red-500">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessName" className="text-xs font-semibold">
                    Business Name *
                  </Label>
                  <Input
                    id="businessName"
                    placeholder="My Awesome Store"
                    {...register("businessName")}
                    disabled={isLoading}
                  />
                  {errors.businessName && (
                    <p className="text-xs text-red-500">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessEmail" className="text-xs font-semibold">
                    Business Email *
                  </Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    placeholder="vendor@example.com"
                    {...register("businessEmail")}
                    disabled={isLoading}
                  />
                  {errors.businessEmail && (
                    <p className="text-xs text-red-500">{errors.businessEmail.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessPhone" className="text-xs font-semibold">
                    Business Phone *
                  </Label>
                  <Input
                    id="businessPhone"
                    placeholder="0771234567"
                    {...register("businessPhone")}
                    disabled={isLoading}
                  />
                  {errors.businessPhone && (
                    <p className="text-xs text-red-500">{errors.businessPhone.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Password *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold">
                    Confirm Password *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold h-11 rounded-xl mt-2 flex items-center justify-center gap-2"
                >
                  <span>Continue to Category Selection</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="text-center">
                  <h2 className="text-base font-bold text-gray-900">
                    Select Your Business Category *
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the primary category for your vendor products and shop profile.
                  </p>
                </div>

                {/* Category Grid Matching Ads Seller */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.id, cat.name)}
                      className={`flex flex-col items-center justify-center p-3.5 border rounded-2xl text-center transition-all duration-200 cursor-pointer ${
                        selectedCategory === cat.name
                          ? "border-[#FF6600] bg-[#FF6600]/10 text-[#FF6600] font-bold shadow-xs scale-[1.02]"
                          : "border-gray-100 hover:border-gray-300 bg-gray-50/50 hover:bg-white text-gray-700"
                      }`}
                    >
                      <span className="text-3xl mb-2 flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
                        {cat.icon && (cat.icon.startsWith("/") || cat.icon.startsWith("http")) ? (
                          <img
                            src={cat.icon}
                            alt={cat.name}
                            className="w-10 h-10 object-contain"
                          />
                        ) : (
                          cat.icon || "📁"
                        )}
                      </span>
                      <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                    </button>
                  ))}

                  {/* More button opening CategoryPicker */}
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="flex flex-col items-center justify-center p-3.5 border border-dashed border-gray-300 rounded-2xl text-center bg-gray-50/20 hover:bg-white text-gray-500 hover:border-gray-400 transition-all duration-200 cursor-pointer"
                  >
                    <span className="text-2xl mb-2">🔍</span>
                    <span className="text-xs font-semibold">More...</span>
                  </button>
                </div>

                {selectedCategory && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs text-center font-bold border border-emerald-100 flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>
                      Selected: <strong>{selectedCategory}</strong>
                    </span>
                  </div>
                )}

                {categoryError && (
                  <p className="text-xs text-red-500 text-center font-semibold">
                    {categoryError}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="h-11 rounded-xl font-bold"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold h-11 rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Register as Vendor"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have a vendor account?{" "}
            <Link
              href="/vendor/login"
              className="font-medium text-gray-900 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>
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
