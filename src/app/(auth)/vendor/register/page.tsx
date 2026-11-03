"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Store, ArrowLeft, AlertCircle, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const SL_PHONE_REGEX = /^(?:\+94|0)7[01245678]\d{7}$/;

const registerSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessEmail: z.string().email("Invalid email address"),
  businessPhone: z.string().regex(SL_PHONE_REGEX, "Invalid Sri Lankan phone number (e.g. 0771234567)"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function VendorRegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState<{
    message: string;
    email?: string;
    isExisting?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setRegistrationError(null);
    try {
      const response = await fetch("/api/auth/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Store
        </Link>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mb-4">
              <Store className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vendor Registration</h1>
            <p className="text-gray-500 text-sm mt-2 text-center">
              Join Try Me and start selling to thousands of customers.
            </p>
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
                    href={`/vendor/login?email=${encodeURIComponent(registrationError.email || "")}`}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
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
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
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

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
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

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
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

            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone</Label>
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

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
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
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold h-11 rounded-xl"
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
    </div>
  );
}
