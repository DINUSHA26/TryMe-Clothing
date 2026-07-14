"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Settings, Lock, User, Phone, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdsSellerSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState("");
  const [slug, setSlug] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const { toast } = useToast();
  const { user, accessToken } = useAuthStore();

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/ads/seller/storefront");
      const json = await response.json();
      if (json.success && json.data) {
        setBusinessName(json.data.businessName || "");
        setPhone(json.data.phone || "");
        setStatus(json.data.status || "");
        setPrimaryCategory(json.data.primaryCategory || "");
        setSlug(json.data.slug || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load seller profile settings",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/ads/seller/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          phone,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Your business details have been saved successfully.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New passwords do not match",
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
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully",
        });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        throw new Error(result.error || "Failed to change password");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-gray-900">SETTINGS</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account profile details and security preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl w-full sm:w-auto h-auto flex gap-1">
          <TabsTrigger value="profile" className="rounded-lg py-2.5 px-6 font-semibold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Account Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg py-2.5 px-6 font-semibold text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Details Tab */}
        <TabsContent value="profile" className="space-y-6 mt-0">
          <form onSubmit={handleProfileUpdate}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border border-gray-150 shadow-sm bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="border-b bg-gray-50/50 py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-gray-800">
                      <User className="h-4 w-4 text-[#FF6600]" />
                      Profile Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName" className="text-xs font-bold text-gray-600 uppercase tracking-wide">Business Name</Label>
                        <Input
                          id="businessName"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          className="bg-white border-gray-200 font-medium rounded-xl text-xs"
                          required
                          minLength={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold text-gray-600 uppercase tracking-wide">Contact Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-10 bg-white border-gray-200 font-medium rounded-xl text-xs"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border border-gray-150 shadow-sm bg-white rounded-2xl overflow-hidden">
                  <CardHeader className="border-b bg-gray-50/50 py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-800">Status & Info</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Primary Category</Label>
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-xs text-gray-700 font-semibold uppercase tracking-wider">
                        {primaryCategory || "Uncategorized"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">URL Slug</Label>
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-[10px] text-gray-500 font-mono select-all truncate">
                        {slug || "none"}
                      </div>
                    </div>
                    {status === "ACTIVE" && (
                      <div className="flex items-center gap-1.5 text-[#FF6600] font-bold text-xs uppercase tracking-wider mt-2 px-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified Ads Seller
                      </div>
                    )}
                    <Button type="submit" disabled={isLoading} className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold text-xs uppercase tracking-wider h-11 rounded-xl shadow-md mt-4">
                      {isLoading ? "Saving..." : "Save Settings"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-0">
          <Card className="max-w-2xl border border-gray-150 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-gray-800">
                <Lock className="h-4 w-4 text-[#FF6600]" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Current Password</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-xs font-bold text-[#FF6600] hover:underline uppercase tracking-wide"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                      className="border-gray-200 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        minLength={8}
                        className="border-gray-200 rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                        className="border-gray-200 rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold text-xs uppercase tracking-wider h-11 rounded-xl shadow-md mt-2">
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#FF6600]" />
              Forgot Current Password?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium">
              If you have forgotten your current password, you cannot update it directly from this panel for security reasons.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">What should you do?</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                Please contact the TryMe Administrator or Support team to request a temporary password reset.
              </p>
              <div className="space-y-1.5 pt-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
                <p>📧 Email: <span className="text-[#FF6600] hover:underline">support@tryme.lk</span></p>
                <p>📞 Phone: <span className="text-[#FF6600] hover:underline">+94 11 234 5678</span></p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsForgotModalOpen(false)} className="bg-[#FF6600] hover:bg-[#e65c00] text-white rounded-full px-6 font-bold">
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
