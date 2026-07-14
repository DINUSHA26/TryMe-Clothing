"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  Lock,
  Mail,
  MapPin,
  Phone,
  CloudUpload,
  Loader2,
  Layout,
  Image as ImageIcon,
  CheckCircle2,
  Info,
  Eye,
  EyeOff
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { validateImage, compressImage } from "@/lib/utils/image";

interface VendorProfile {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string | null;
  description: string | null;
  logo: string | null;
  banner: string | null;
  commissionRate: number;
}

export default function VendorSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isUploading, setIsUploading] = useState<"logo" | "banner" | null>(null);
  const [profile, setProfile] = useState<VendorProfile>({
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    description: "",
    logo: null,
    banner: null,
    commissionRate: 10,
  });

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
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/vendor/profile");
      const json = await response.json();
      if (json.success) {
        setProfile(json.data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load vendor profile",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(type);
    try {
      const compressedFile = await compressImage(file);
      const error = await validateImage(compressedFile);
      if (error) {
        toast({ title: "Invalid Image", description: error, variant: "destructive" });
        setIsUploading(null);
        return;
      }

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", "vendors");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setProfile(prev => ({ ...prev, [type]: result.data.url }));
        toast({ title: "Success", description: `${type === "logo" ? "Logo" : "Banner"} uploaded successfully!` });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(null);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const result = await response.json();
      if (result.success) {
        toast({ title: "Profile Updated", description: "Your shop profile has been saved successfully." });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Password Mismatch", description: "New passwords do not match", variant: "destructive" });
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
        toast({ title: "Password Changed", description: "Your password has been updated successfully" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        throw new Error(result.error || "Failed to change password");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black tracking-tight">SHOP SETTINGS</h1>
        <p className="text-muted-foreground mt-1 font-medium italic">
          Customize your storefront and security preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-full sm:w-auto h-auto grid grid-cols-3 sm:flex">
          <TabsTrigger value="profile" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
            Shop Profile
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
            Contact Details
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg py-2.5 px-6 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
            Security
          </TabsTrigger>
        </TabsList>

        <form onSubmit={handleProfileUpdate}>
          {/* Shop Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-0 slide-in-from-left-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
                  <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50 py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Layout className="h-4 w-4 text-primary" />
                      Visual Branding
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Banner Section */}
                    <div className="relative group">
                      <div className="aspect-[21/9] sm:aspect-[3/1] bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                        {profile.banner ? (
                          <Image src={profile.banner} alt="Banner" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
                            <ImageIcon className="h-10 w-10" />
                            <span className="text-xs font-black uppercase tracking-widest">No Banner Set</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-full font-black uppercase text-[10px] tracking-widest h-9"
                            onClick={() => bannerInputRef.current?.click()}
                            disabled={isUploading === "banner"}
                          >
                            {isUploading === "banner" ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            ) : (
                              <CloudUpload className="h-3.5 w-3.5 mr-2" />
                            )}
                            Change Banner
                          </Button>
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={bannerInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "banner")}
                      />
                    </div>

                    {/* Logo Section - Absolute Position Over Banner */}
                    <div className="relative -mt-12 sm:-mt-16 ml-8 pb-6 flex items-end gap-6">
                      <div className="relative group/logo">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl border-4 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-900 shadow-xl overflow-hidden relative">
                          {profile.logo ? (
                            <Image src={profile.logo} alt="Logo" fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                              <Store className="h-8 w-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                            onClick={() => logoInputRef.current?.click()}>
                            {isUploading === "logo" ? (
                              <Loader2 className="h-5 w-5 animate-spin text-white" />
                            ) : (
                              <CloudUpload className="h-6 w-6 text-white" />
                            )}
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={logoInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "logo")}
                        />
                      </div>
                      <div className="mb-2">
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white drop-shadow-lg drop-shadow-black/50 sm:text-slate-900 sm:dark:text-slate-100 sm:drop-shadow-none">
                          {profile.businessName || "Your Shop Name"}
                        </h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified Vendor
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-slate-100 dark:border-slate-800 shadow-none bg-white/50 dark:bg-slate-950/50">
                  <CardHeader className="border-b py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      Store Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Textarea
                      placeholder="Tell customers about your brands, heritage, and what makes your store unique..."
                      className="min-h-[150px] resize-none border-2 transition-all focus:ring-0 focus:border-primary/50 text-sm font-medium leading-relaxed"
                      value={profile.description || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-2 border-slate-100 dark:border-slate-800 shadow-none bg-white/50 dark:bg-slate-950/50">
                  <CardHeader className="border-b bg-slate-50/10 py-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Store Identity</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Business Name</Label>
                      <Input
                        value={profile.businessName}
                        onChange={(e) => setProfile(prev => ({ ...prev, businessName: e.target.value }))}
                        className="bg-white dark:bg-slate-950 border-2 font-bold"
                        required
                        minLength={3}
                      />
                    </div>
                    <div className="pt-2 border-t mt-4 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">
                      <span>Commission Rate</span>
                      <span className="text-primary">{profile.commissionRate}%</span>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20">
                      {isLoading ? "Saving..." : "Save Profile Details"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contact Details Tab */}
          <TabsContent value="contact" className="space-y-6 mt-0 slide-in-from-right-2 duration-300">
            <Card className="max-w-3xl border-2 border-slate-100 dark:border-slate-800 shadow-none bg-white/50 dark:bg-slate-950/50">
              <CardHeader className="border-b py-4">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Public Contact Info
                </CardTitle>
                <CardDescription className="text-xs uppercase font-bold tracking-widest text-muted-foreground/60">Information visible to customers</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Business Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.businessEmail}
                        onChange={(e) => setProfile(prev => ({ ...prev, businessEmail: e.target.value }))}
                        className="pl-10 font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Business Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={profile.businessPhone}
                        onChange={(e) => setProfile(prev => ({ ...prev, businessPhone: e.target.value }))}
                        className="pl-10 font-bold"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Physical Address / Shipping Origin</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      value={profile.businessAddress || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, businessAddress: e.target.value }))}
                      className="pl-10 min-h-[100px] font-bold py-2.5"
                      placeholder="Street, City, Province, Zip..."
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isLoading} className="font-black uppercase tracking-widest text-xs h-11 px-8">
                    {isLoading ? "Updating..." : "Update Contact Info"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </form>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-0">
          <Card className="max-w-2xl border-2 border-slate-100 dark:border-slate-800 shadow-none bg-white/50 dark:bg-slate-950/50">
            <CardHeader className="border-b py-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Password</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(true)}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
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
                      className="font-bold pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        minLength={8}
                        className="font-bold pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                        className="font-bold pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full font-black uppercase tracking-widest text-xs h-12">
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
              <Lock className="h-5 w-5 text-primary" />
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
                <p>📧 Email: <span className="text-primary hover:underline">support@tryme.lk</span></p>
                <p>📞 Phone: <span className="text-primary hover:underline">+94 11 234 5678</span></p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsForgotModalOpen(false)} className="rounded-full px-6 font-bold">
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
