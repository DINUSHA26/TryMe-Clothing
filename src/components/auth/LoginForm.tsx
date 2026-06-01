"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectUrl?: string;
  userType: "admin" | "vendor" | "staff";
}

export function LoginForm({ redirectUrl, userType }: LoginFormProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Login failed");
        return;
      }

      // Validate that the logged-in user's role matches the login page
      const userRole = result.data.user.role;
      if (userType !== "staff") {
        const expectedRole = userType === "admin" ? "ADMIN" : "VENDOR";
        if (userRole !== expectedRole) {
          toast.error(
            `This account is not a ${userType}. Please use the ${userRole === "ADMIN" ? "Admin" : "Vendor"} login page.`
          );
          // Clear the cookies that were just set by the API
          await fetch("/api/auth/logout", { method: "POST" });
          return;
        }
      } else {
        if (userRole !== "ADMIN" && userRole !== "VENDOR" && userRole !== "ADS_SELLER") {
          toast.error("This is a staff-only portal. Customers should use the regular login page.");
          await fetch("/api/auth/logout", { method: "POST" });
          return;
        }
      }

      // Store auth data
      setAuth(
        result.data.user,
        result.data.accessToken,
        result.data.refreshToken
      );

      // Determine the app path based on role
      const rolePrefix = userRole.toLowerCase();

      // Check if user must change password
      if (result.data.user.mustChangePassword) {
        toast.info("Please change your password to continue");
        router.push(`/${rolePrefix}/change-password`);
        return;
      }

      // Success
      toast.success("Login successful!");

      // Redirect
      if (userRole === "ADS_SELLER") {
        const adsSeller = result.data.user.adsSeller;
        if (adsSeller?.status === "PENDING") {
          router.push("/ads-seller/pending");
        } else {
          router.push(redirectUrl || "/ads-seller");
        }
      } else {
        if (redirectUrl && redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
          router.push(redirectUrl);
        } else {
          router.push("/");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            {...register("password")}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
}
