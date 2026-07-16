"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { Loader2, Mail, Phone, Smartphone } from "lucide-react";

import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

// Regex for basic phone validation (e.g., +94771234567 or 0771234567)
const phoneRegex = /^\+?[0-9\s\-]{9,15}$/;

const identifierSchema = z.object({
  identifier: z.string().refine(
    (val) => {
      const isEmail = z.string().email().safeParse(val).success;
      const isPhone = phoneRegex.test(val);
      return isEmail || isPhone;
    },
    { message: "Must be a valid email or phone number" }
  ),
});

const otpSchema = z.object({
  code: z.string().length(6, "OTP must be 6 digits"),
});

type IdentifierFormData = z.infer<typeof identifierSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

interface OTPFormProps {
  redirectUrl?: string;
}

export function OTPForm({ redirectUrl }: OTPFormProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { mergeGuestCart, items: cartItems } = useCartStore();
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [step, setStep] = useState<"identifier" | "otp">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<"email" | "phone">("email");
  const [inputMode, setInputMode] = useState<"email" | "phone">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const identifierForm = useForm<IdentifierFormData>({
    resolver: zodResolver(identifierSchema),
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = undefined;
        } catch (e) {
          console.error("Error clearing recaptcha", e);
        }
      }
    };
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const initRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: () => {
          // reCAPTCHA solved
        },
        "expired-callback": () => {
           toast.error("reCAPTCHA expired. Please verify again.");
           if ((window as any).recaptchaVerifier) {
              (window as any).recaptchaVerifier.clear();
              (window as any).recaptchaVerifier = undefined;
           }
        }
      });
    }
  };

  const onSendOTP = async (data: IdentifierFormData) => {
    setIsLoading(true);

    const type = inputMode;
    setIdentifierType(type);

    try {
      if (type === "email") {
        const response = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: data.identifier }),
        });

        const result = await response.json();

        if (!result.success) {
          toast.error(result.error || "Failed to send OTP");
          setIsLoading(false);
          return;
        }
      } else {
        // Phone Auth
        initRecaptcha();
        const appVerifier = (window as any).recaptchaVerifier;
        // Format phone number to E.164
        // Since LK +94 is shown as static prefix in UI, user enters local number only
        let formattedPhone = data.identifier.trim().replace(/[\s\-\(\)]/g, "");
        if (!formattedPhone.startsWith("+")) {
          if (formattedPhone.startsWith("0")) {
            // e.g. 0771234567 → +94771234567
            formattedPhone = "+94" + formattedPhone.substring(1);
          } else {
            // e.g. 771234567 → +94771234567 (user typed local number without leading 0)
            formattedPhone = "+94" + formattedPhone;
          }
        }

        try {
          const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
          setConfirmationResult(result);
        } catch (err: any) {
          console.error("Firebase phone auth error:", err);

          if (err.code === 'auth/operation-not-allowed') {
            toast.error("Firebase SMS not enabled. Please configure it in Firebase Console.");
          } else if (err.code === 'auth/invalid-phone-number') {
            toast.error("Invalid phone number format.");
          } else if (err.code === 'auth/too-many-requests') {
            toast.error("SMS quota exceeded. Please try again later or upgrade Firebase billing.");
          } else {
            // Show exact error for easier debugging
            toast.error(`Firebase Error: ${err.message || err.code || "Failed to send SMS"}`);
          }

          // Reset the recaptcha widget so the user can try again safely
          if ((window as any).recaptchaVerifier) {
            try {
              (window as any).recaptchaVerifier.render().then((widgetId: any) => {
                (window as any).grecaptcha?.reset(widgetId);
              }).catch(() => {
                // If render fails, clear and let it be recreated next time
                (window as any).recaptchaVerifier.clear();
                (window as any).recaptchaVerifier = undefined;
              });
            } catch (e) {
              (window as any).recaptchaVerifier = undefined;
            }
          }

          setIsLoading(false);
          return;
        }
      }

      setIdentifier(data.identifier);
      setStep("otp");
      setResendTimer(60); // 60 seconds cooldown
      toast.success(`OTP sent to your ${type}!`);
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("An error occurred while sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async (data: OTPFormData) => {
    setIsLoading(true);

    try {
      let result;

      if (identifierType === "email") {
        const response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: identifier,
            code: data.code,
          }),
        });
        result = await response.json();
      } else {
        // Verify via Firebase
        if (!confirmationResult) {
          toast.error("Session expired. Please request a new OTP.");
          setIsLoading(false);
          return;
        }

        try {
          const fbUserCredential = await confirmationResult.confirm(data.code);
          const idToken = await fbUserCredential.user.getIdToken();

          const response = await fetch("/api/auth/otp/verify-phone", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          });
          result = await response.json();
        } catch (err: any) {
          toast.error("Invalid verification code");
          setIsLoading(false);
          return;
        }
      }

      if (!result.success) {
        toast.error(result.error || "Invalid OTP");
        return;
      }

      // Store auth data
      setAuth(
        result.data.user,
        result.data.accessToken,
        result.data.refreshToken
      );

      toast.success("Login successful!");

      // Merge guest cart if there are items
      if (itemCount > 0) {
        try {
          await mergeGuestCart();
          if (itemCount > 1) {
            toast.success(`${itemCount} items merged into your cart`);
          }
        } catch (error) {
          console.error("Failed to merge cart:", error);
        }
      }

      // Redirect - Use window.location to force full reload and apply cookies correctly
      if (redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
        window.location.href = redirectUrl;
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("An error occurred while verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    await onSendOTP({ identifier });
  };

  const handleChangeIdentifier = () => {
    setStep("identifier");
    otpForm.reset();

    // Clear recaptcha so it can be cleanly re-initialized if they switch back
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = undefined;
      } catch (e) { }
    }
  };

  return (
    <>
      {step === "identifier" ? (
        <form
          onSubmit={identifierForm.handleSubmit(onSendOTP)}
          className="space-y-6"
        >
          {/* Tabs */}
          <div className="flex w-full mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => { setInputMode("email"); identifierForm.reset(); }}
              className={`flex-1 pb-3 text-center text-sm font-medium transition-colors relative ${inputMode === "email"
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
                }`}
            >
              Email
              {inputMode === "email" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900" />
              )}
            </button>
            <div className="w-px h-5 bg-gray-200 self-center" />
            <button
              type="button"
              onClick={() => { setInputMode("phone"); identifierForm.reset(); }}
              className={`flex-1 pb-3 text-center text-sm font-medium transition-colors relative ${inputMode === "phone"
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-600"
                }`}
            >
              Phone Number
              {inputMode === "phone" && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            {inputMode === "phone" ? (
              <div className="flex gap-2 items-center">
                <div className="flex h-10 items-center justify-center px-4 border border-gray-200 dark:border-gray-300 rounded-md bg-gray-50 dark:bg-white text-sm font-medium text-gray-900 dark:text-black whitespace-nowrap">
                  <span className="text-gray-500 text-xs mr-1">LK</span>+94
                </div>
                <Input
                  id="identifier"
                  type="tel"
                  placeholder="Please enter your phone number"
                  {...identifierForm.register("identifier")}
                  disabled={isLoading}
                  className="flex-1 bg-white dark:bg-white text-black dark:text-black placeholder:text-gray-400 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-300 focus-visible:ring-[#FF6600]"
                />
              </div>
            ) : (
              <Input
                id="identifier"
                type="email"
                placeholder="Please enter your email"
                {...identifierForm.register("identifier")}
                disabled={isLoading}
                className="w-full bg-white dark:bg-white text-black dark:text-black placeholder:text-gray-400 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-300 focus-visible:ring-[#FF6600]"
              />
            )}
            {identifierForm.formState.errors.identifier && (
              <p className="text-sm text-red-500">
                {identifierForm.formState.errors.identifier.message}
              </p>
            )}
          </div>


          <Button
            type="submit"
            className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending code...
              </>
            ) : inputMode === "phone" ? (
              <>
                <Smartphone className="mr-2 h-4 w-4" />
                Send code via SMS
              </>
            ) : (
              "Send code via Email"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              maxLength={6}
              {...otpForm.register("code")}
              disabled={isLoading}
              className="text-center text-2xl font-mono tracking-widest bg-white dark:bg-white text-black dark:text-black placeholder:text-gray-400 dark:placeholder:text-gray-400 border border-gray-300 dark:border-gray-300 focus-visible:ring-[#FF6600]"
            />
            {otpForm.formState.errors.code && (
              <p className="text-sm text-red-500">
                {otpForm.formState.errors.code.message}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium">{identifier}</span>
            </p>
          </div>

          <Button type="submit" className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Sign In"
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleChangeIdentifier}
              className="text-blue-600 hover:text-blue-700 hover:underline"
              disabled={isLoading}
            >
              Change email or phone
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isLoading || resendTimer > 0}
              className="text-blue-600 hover:text-blue-700 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
            </button>
          </div>
        </form>
      )}
      {/* Invisible Recaptcha container must always be present to avoid remount issues */}
      <div id="recaptcha-container"></div>
    </>
  );
}
