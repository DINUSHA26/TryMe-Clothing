"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronRight, Loader2, Camera, Save, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { compressImage } from "@/lib/utils/image";

export default function ProfilePage() {
  const { user, isAuthenticated, setUser, _hasHydrated } = useAuthStore();
  const authLoading = !_hasHydrated;
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Please login to view your profile.");
      router.push("/login?returnUrl=/profile");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setAvatar((user as any).avatar || "");
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file);

      // Validate size (max 5MB)
      if (compressedFile.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        const newAvatar = result.data.secure_url || result.data.url;
        setAvatar(newAvatar);
        if (user) {
          setUser({ ...user, avatar: newAvatar });
        }
        toast.success("Profile photo uploaded successfully!");
      } else {
        toast.error(result.error || "Failed to upload image.");
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      toast.error("An error occurred during file upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          avatar: avatar,
        }),
      });

      const result = await res.json();
      if (result.success) {
        // Update local auth store user
        setUser(result.data.user);
        toast.success("Profile updated successfully!");
        router.push("/");
      } else {
        toast.error(result.error || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-xs text-muted-foreground mt-2 font-medium">Loading profile...</p>
      </div>
    );
  }

  const userInitials = firstName
    ? firstName.charAt(0).toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-semibold">My Profile</span>
      </nav>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Update your public profile name and photo for storefront and chat reviews.
        </p>
      </div>

      <form onSubmit={handleSaveChanges} className="space-y-6">
        <Card className="shadow-md border border-slate-100 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-bold uppercase tracking-tight">Personal Information</CardTitle>
            <CardDescription>Configure your personal profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-slate-200 dark:border-slate-700 shadow-md">
                  <AvatarImage src={avatar} alt={`${firstName} ${lastName}`} />
                  <AvatarFallback className="bg-primary text-white text-3xl font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 items-center sm:items-start">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Profile Image</h4>
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  Supports JPG, PNG or GIF. Max size 5MB.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Label
                    htmlFor="avatar-upload"
                    className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs font-bold uppercase tracking-wider bg-white dark:bg-slate-900 border-slate-200 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    Change Image
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading || isSaving}
                    className="hidden"
                  />
                  {avatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAvatar("");
                        if (user) {
                          setUser({ ...user, avatar: null });
                        }
                      }}
                      className="text-red-500 hover:text-red-600 font-bold text-xs uppercase tracking-wider rounded-full"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">First Name</Label>
                <Input
                  id="first-name"
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-slate-50/50 dark:bg-slate-900/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Last Name</Label>
                <Input
                  id="last-name"
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-slate-50/50 dark:bg-slate-900/50"
                  required
                />
              </div>
            </div>

            {/* Read-Only Account Details */}
            <div className="pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{user.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-muted-foreground">Account Role</span>
                <span className="font-semibold uppercase text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {user.role}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 bg-slate-50/30 dark:bg-slate-800/20 border-t py-4 px-6">
            <Button
              type="submit"
              disabled={isSaving || isUploading}
              className="bg-[#FF6600] hover:bg-[#E65C00] text-white font-bold uppercase tracking-wider text-xs rounded-full px-6"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
