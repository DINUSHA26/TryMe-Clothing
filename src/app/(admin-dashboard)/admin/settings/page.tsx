"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Mail, Building } from "lucide-react";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to change password");
      }

      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully",
      });

      // Reset form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Could not change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [bankLoading, setBankLoading] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: "Seylan Bank",
    accountName: "Fashion Dora",
    accountNumber: "1230-13526365-001",
    branch: "Main Branch",
  });

  useEffect(() => {
    async function loadBankDetails() {
      try {
        const res = await fetch("/api/bank-details");
        const json = await res.json();
        if (json.success && json.data) {
          setBankForm({
            bankName: json.data.bankName || "",
            accountName: json.data.accountName || "",
            accountNumber: json.data.accountNumber || "",
            branch: json.data.branch || "",
          });
        }
      } catch (err) {
        console.error("Failed to load bank details:", err);
      }
    }
    loadBankDetails();
  }, []);

  const handleBankDetailsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankLoading(true);

    try {
      const res = await fetch("/api/admin/bank-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update bank details");
      }

      toast({
        title: "Bank Details Updated",
        description: "Official TryMe bank account details updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Could not update bank details",
        variant: "destructive",
      });
    } finally {
      setBankLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Official Bank Account Settings (Super Admin) */}
      <Card className="border-primary/20 bg-gradient-to-br from-white to-orange-50/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Building className="h-5 w-5" />
            Official Bank Account Details (Customer Checkout)
          </CardTitle>
          <CardDescription>
            Only Super Admins can update the official bank account shown to customers during Bank Transfer checkout.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBankDetailsSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  placeholder="e.g. Commercial Bank"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="accountName">Account Holder Name</Label>
                <Input
                  id="accountName"
                  value={bankForm.accountName}
                  onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                  placeholder="e.g. TryMe (Pvt) Ltd"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  placeholder="e.g. 1234567890"
                  required
                  className="mt-1.5 font-mono"
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={bankForm.branch}
                  onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                  placeholder="e.g. Colombo Main Branch"
                  required
                  className="mt-1.5"
                />
              </div>
            </div>

            <Button type="submit" disabled={bankLoading} className="bg-[#FF6600] hover:bg-[#e65c00]">
              {bankLoading ? "Saving Changes..." : "Save Official Bank Details"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            View your account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Input value="Admin" disabled className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value="admin@tryme.lk"
                disabled
                className="mt-1.5"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Contact system administrator to change email
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                required
                minLength={8}
                className="mt-1.5"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                required
                minLength={8}
                className="mt-1.5"
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Information</CardTitle>
          <CardDescription>
            View system configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Platform Name</Label>
              <Input value="Try Me" disabled className="mt-1.5" />
            </div>
            <div>
              <Label>Default Commission Rate</Label>
              <Input value="10%" disabled className="mt-1.5" />
              <p className="text-sm text-muted-foreground mt-1">
                Commission rates can be customized per vendor
              </p>
            </div>
            <div>
              <Label>Payment Gateway</Label>
              <Input
                value={`PayHere (${process.env.NEXT_PUBLIC_PAYHERE_MODE || "sandbox"} mode)`}
                disabled
                className="mt-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
