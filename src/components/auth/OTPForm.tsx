"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, Smartphone } from "lucide-react";

import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

// Regex for basic phone validation
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

  // Invisible reCAPTCHA verifier ref — component unmount unama clear karanawa
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const identifierForm = useForm<IdentifierFormData>({
    resolver: zodResolver(identifierSchema),
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Component unmount unama reCAPTCHA clean up karanawa
  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // ================================================================
  // reCAPTCHA helpers — INVISIBLE size use karanawa (production best practice)
  // Meka Firebase recommended approach ekay. User checkbox tick karanna
  // onane naha. Firebase automatically verify karanawa.
  // ================================================================
  const clearRecaptcha = () => {
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    } catch (e) {
      // Ignore clear errors
    }
    recaptchaVerifierRef.current = null;

    if (typeof document !== "undefined") {
      const wrapper = document.getElementById("recaptcha-wrapper");
      if (wrapper) {
        wrapper.innerHTML = '<div id="recaptcha-container"></div>';
      }
      try {
        if ((window as any).grecaptcha) {
          (window as any).grecaptcha.reset();
        }
      } catch (e) {}
    }
  };

  const getRecaptchaVerifier = (): RecaptchaVerifier => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    if (typeof document !== "undefined") {
      let container = document.getElementById("recaptcha-container");
      if (!container) {
        const wrapper = document.getElementById("recaptcha-wrapper");
        if (wrapper) {
          wrapper.innerHTML = '<div id="recaptcha-container"></div>';
          container = document.getElementById("recaptcha-container");
        }
      }
      if (container) {
        const verifier = new RecaptchaVerifier(auth, container, {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            clearRecaptcha();
          },
        });
        recaptchaVerifierRef.current = verifier;
        return verifier;
      }
    }

    const fallbackVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {
        clearRecaptcha();
      },
    });

    recaptchaVerifierRef.current = fallbackVerifier;
    return fallbackVerifier;
  };

  // ================================================================
  // Phone number format helper — E.164 format ekata convert karanawa
  // +94+94... double prefix bug fix included
  // ================================================================
  const formatPhoneNumber = (raw: string): string => {
    const cleaned = raw.trim().replace(/[\s\-\(\)]/g, "");

    if (cleaned.startsWith("+94")) {
      // Already E.164 format — leave as is (prevents +94+94... bug)
      return cleaned;
    } else if (cleaned.startsWith("0")) {
      // e.g. 0779044825 → +94779044825
      return "+94" + cleaned.substring(1);
    } else {
      // e.g. 779044825 → +94779044825
      return "+94" + cleaned;
    }
  };

  // ================================================================
  // Send OTP
  // ================================================================
  const onSendOTP = async (data: IdentifierFormData) => {
    setIsLoading(true);

    const type = inputMode;
    setIdentifierType(type);

    try {
      if (type === "email") {
        // Email OTP — server API eke yawanawa
        const response = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.identifier }),
        });

        const result = await response.json();

        if (!result.success) {
          toast.error(result.error || "Failed to send OTP");
          setIsLoading(false);
          return;
        }
      } else {
        // Phone OTP via Firebase
        const formattedPhone = formatPhoneNumber(data.identifier);

        let appVerifier = getRecaptchaVerifier();

        try {
          const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
          setConfirmationResult(result);
        } catch (err: any) {
          console.error("Firebase phone auth error:", err);

          // Clear and recreate fresh verifier on any recaptcha/credential error
          clearRecaptcha();

          // Auto-retry once with fresh DOM element node verifier
          try {
            console.warn("Attempting auto-retry with fresh reCAPTCHA instance...");
            const freshVerifier = getRecaptchaVerifier();
            const retryResult = await signInWithPhoneNumber(auth, formattedPhone, freshVerifier);
            setConfirmationResult(retryResult);
            setIdentifier(data.identifier);
            setStep("otp");
            setResendTimer(60);
            toast.success(`OTP sent to your ${type}!`);
            setIsLoading(false);
            return;
          } catch (retryErr: any) {
            console.error("Retry Firebase phone auth failed:", retryErr);
            err = retryErr;
          }

          clearRecaptcha();

          if (err.code === "auth/operation-not-allowed") {
            toast.error("Phone authentication is not enabled in Firebase Console. Please contact support.");
          } else if (err.code === "auth/invalid-phone-number") {
            toast.error("Invalid phone number. Please check and try again.");
          } else if (err.code === "auth/too-many-requests") {
            toast.error("Too many attempts. Please wait a few minutes and try again.");
          } else if (err.code === "auth/invalid-app-credential") {
            toast.error("Security verification failed. Please refresh the page and try again.");
          } else if (err.code === "auth/captcha-check-failed") {
            toast.error("reCAPTCHA check failed. Please refresh the page and try again.");
          } else {
            toast.error(`Failed to send SMS: ${err.message || err.code || "Unknown error"}`);
          }

          setIsLoading(false);
          return;
        }
      }

          // reCAPTCHA error unama clear karanawa — next try eke fresh one use wenawa
          clearRecaptcha();

          if (err.code === "auth/operation-not-allowed") {
            toast.error("Phone authentication is not enabled in Firebase Console. Please contact support.");
          } else if (err.code === "auth/invalid-phone-number") {
            toast.error("Invalid phone number. Please check and try again.");
          } else if (err.code === "auth/too-many-requests") {
            toast.error("Too many attempts. Please wait a few minutes and try again.");
          } else if (err.code === "auth/invalid-app-credential") {
            toast.error("Security verification failed. Please refresh the page and try again.");
          } else if (err.code === "auth/captcha-check-failed") {
            toast.error("reCAPTCHA check failed. Please refresh the page and try again.");
          } else {
            toast.error(`Failed to send SMS: ${err.message || err.code || "Unknown error"}`);
          }

          setIsLoading(false);
          return;
        }
      }

      setIdentifier(data.identifier);
      setStep("otp");
      setResendTimer(60);
      toast.success(`OTP sent to your ${type}!`);
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("An error occurred while sending OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ================================================================
  // Verify OTP
  // ================================================================
  const onVerifyOTP = async (data: OTPFormData) => {
    setIsLoading(true);

    try {
      let result;

      if (identifierType === "email") {
        const response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier, code: data.code }),
        });
        result = await response.json();
      } else {
        // Firebase phone verification
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
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
          result = await response.json();
        } catch (err: any) {
          if (err.code === "auth/invalid-verification-code") {
            toast.error("Invalid verification code. Please check and try again.");
          } else if (err.code === "auth/code-expired") {
            toast.error("OTP has expired. Please request a new one.");
          } else {
            toast.error("Invalid verification code. Please try again.");
          }
          setIsLoading(false);
          return;
        }
      }

      if (!result.success) {
        toast.error(result.error || "Invalid OTP");
        return;
      }

      // Auth data store karanawa
      setAuth(result.data.user, result.data.accessToken, result.data.refreshToken);

      toast.success("Login successful!");

      // Guest cart merge karanawa
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

      // Redirect
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
    clearRecaptcha();
  };

  return (
    <>
      {step === "identifier" ? (
        <form onSubmit={identifierForm.handleSubmit(onSendOTP)} className="space-y-6">
          {/* Tabs */}
          <div className="flex w-full mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => {
                setInputMode("email");
                identifierForm.reset();
                clearRecaptcha();
              }}
              className={`flex-1 pb-3 text-center text-sm font-medium transition-colors relative ${
                inputMode === "email" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
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
              onClick={() => {
                setInputMode("phone");
                identifierForm.reset();
                clearRecaptcha();
              }}
              className={`flex-1 pb-3 text-center text-sm font-medium transition-colors relative ${
                inputMode === "phone" ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
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

          {/* Invisible reCAPTCHA wrapper — prevents "reCAPTCHA has already been rendered" DOM conflict */}
          <div id="recaptcha-wrapper">
            <div id="recaptcha-container" />
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

          <Button
            type="submit"
            className="w-full bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200"
            disabled={isLoading}
          >
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
    </>
  );
}
