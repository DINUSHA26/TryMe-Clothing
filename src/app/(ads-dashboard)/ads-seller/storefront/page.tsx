"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Image as ImageIcon,
  MapPin,
  Globe,
  Plus,
  Trash,
  Edit,
  Save,
  Loader2,
  ExternalLink,
  FileText,
} from "lucide-react";

export default function StorefrontBuilderPage() {
  const { toast } = useToast();

  // Storefront settings state
  const [sellerId, setSellerId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [aboutContent, setAboutContent] = useState("");
  const [slug, setSlug] = useState("");
  const [contactInfo, setContactInfo] = useState({
    logo: "",
    banner: "",
    whatsapp: "",
    phone: "",
    facebook: "",
    instagram: "",
    mapEmbedUrl: "",
  });

  // Services Pages state
  const [pages, setPages] = useState<any[]>([]);
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Dialog / Modal state for page CRUD
  const [isPageDialogOpen, setIsPageDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pageImageUrl, setPageImageUrl] = useState("");
  const [isSavingPage, setIsSavingPage] = useState(false);

  const fetchStorefrontSettings = async () => {
    try {
      setIsSettingsLoading(true);
      const res = await fetch("/api/ads/seller/storefront");
      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        setSellerId(d.id);
        setBusinessName(d.businessName || "");
        setPhone(d.phone || "");
        setAboutContent(d.aboutContent || "");
        setSlug(d.slug || "");
        const info = d.contactInfo || {};
        setContactInfo({
          logo: info.logo || "",
          banner: info.banner || "",
          whatsapp: info.whatsapp || "",
          phone: info.phone || "",
          facebook: info.facebook || "",
          instagram: info.instagram || "",
          mapEmbedUrl: info.mapEmbedUrl || "",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load storefront settings.",
      });
    } finally {
      setIsSettingsLoading(false);
    }
  };

  const fetchCustomPages = async () => {
    try {
      setIsPagesLoading(true);
      const res = await fetch("/api/ads/seller/storefront/pages");
      const result = await res.json();
      if (result.success && result.data) {
        setPages(result.data);
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load service pages.",
      });
    } finally {
      setIsPagesLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefrontSettings();
    fetchCustomPages();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "storefronts");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        const imageUrl = result.data.url;
        setContactInfo((prev) => ({ ...prev, [field]: imageUrl }));
        toast({
          title: "Success",
          description: `${field === "logo" ? "Logo" : "Banner"} uploaded successfully!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: result.error || "Failed to upload image",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during file upload.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/ads/seller/storefront", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          phone,
          aboutContent,
          contactInfo,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Storefront customization saved successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save storefront customization",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while saving details.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // CRUD page handlers
  const handleOpenAddPage = () => {
    setEditingPage(null);
    setPageTitle("");
    setPageContent("");
    setPageImageUrl("");
    setIsPageDialogOpen(true);
  };

  const handleOpenEditPage = (page: any) => {
    setEditingPage(page);
    setPageTitle(page.title);
    setPageContent(page.content);
    setPageImageUrl(page.imageUrl || "");
    setIsPageDialogOpen(true);
  };

  const handleServiceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "storefronts");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        setPageImageUrl(result.data.url);
        toast({
          title: "Success",
          description: "Service image uploaded successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: result.error || "Failed to upload image",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during file upload.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePage = async () => {
    if (!pageTitle.trim() || !pageContent.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please specify both a title and content for this page.",
      });
      return;
    }

    setIsSavingPage(true);
    try {
      const url = editingPage
        ? `/api/ads/seller/storefront/pages/${editingPage.id}`
        : "/api/ads/seller/storefront/pages";
      const method = editingPage ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pageTitle,
          content: pageContent,
          imageUrl: pageImageUrl || null,
        }),
      });
      const result = await res.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Page ${editingPage ? "updated" : "created"} successfully!`,
        });
        setIsPageDialogOpen(false);
        fetchCustomPages();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to save page.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while saving the page.",
      });
    } finally {
      setIsSavingPage(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this custom page?")) return;

    try {
      const res = await fetch(`/api/ads/seller/storefront/pages/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Page deleted successfully!",
        });
        fetchCustomPages();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete page.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting the page.",
      });
    }
  };

  if (isSettingsLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
          <p className="text-sm">Loading storefront builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Storefront Builder & Customization
          </h1>
          <p className="text-sm text-gray-500">
            Configure your brand details, cover pictures, contact forms, and custom pages.
          </p>
        </div>
        {slug && (
          <Button asChild variant="outline" className="border-gray-200 hover:bg-gray-50 rounded-xl font-bold flex items-center gap-1.5 self-start md:self-auto">
            <a href={`/marketplace/sellers/${slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 text-[#FF6600]" />
              <span>View Public Storefront</span>
            </a>
          </Button>
        )}
      </div>

      {/* Main Tabs Layout */}
      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="branding" className="rounded-lg font-bold text-xs">
            <Store className="h-3.5 w-3.5 mr-1.5" />
            Branding & About
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg font-bold text-xs">
            <MapPin className="h-3.5 w-3.5 mr-1.5" />
            Contact & Location
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-lg font-bold text-xs">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Services Page CRUD
          </TabsTrigger>
        </TabsList>

        {/* Branding & About Tab Content */}
        <TabsContent value="branding" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Branding Uploads */}
            <Card className="md:col-span-2 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-800">
                  Logo & Cover Banner
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload visual assets representing your store identity.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Shop Logo upload */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-gray-700">Shop Logo (Square Image)</Label>
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center text-gray-400 shrink-0 relative">
                      {contactInfo.logo ? (
                        <img src={contactInfo.logo} alt="Logo preview" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleImageUpload(e, "logo")}
                        className="text-xs max-w-xs border-gray-200 cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Recommended size: 200x200 pixels. Max file size: 5MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold text-gray-700">Store Banner (Landscape Image)</Label>
                  <div className="space-y-3">
                    <div className="w-full h-[120px] rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center text-gray-400 relative">
                      {contactInfo.banner ? (
                        <img src={contactInfo.banner} alt="Banner preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="h-8 w-8 text-gray-300" />
                          <span className="text-[11px] text-gray-400">No cover image uploaded</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        onChange={(e) => handleImageUpload(e, "banner")}
                        className="text-xs max-w-xs border-gray-200 cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 leading-normal">
                        Recommended ratio: 16:9 or 3:1. Max size: 5MB.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Display details / Preview */}
            <Card className="md:col-span-1 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-800">
                  Basic Information
                </CardTitle>
                <CardDescription className="text-xs">
                  Display name and shop categorization.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName" className="text-xs font-bold text-gray-700">
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Dinusha Mobiles"
                    className="border-gray-200 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Shop URL Slug</Label>
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-[11px] text-gray-500 font-mono select-all">
                    /marketplace/sellers/{slug || "slug-pending"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Us Description */}
            <Card className="md:col-span-3 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-800">
                  About Us (Business Description)
                </CardTitle>
                <CardDescription className="text-xs">
                  Introduce your background, services, credibility, and operational details.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  value={aboutContent}
                  onChange={(e) => setAboutContent(e.target.value)}
                  placeholder="Welcome to our shop! We provide premium mobile items, accessories, and certified repair services..."
                  rows={8}
                  className="border-gray-200 text-xs rounded-xl focus-visible:ring-[#FF6600]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSettings}
              disabled={isSavingSettings || isUploading}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md px-6 py-5 text-sm"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Customization...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Branding & About</span>
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Contact & Location Tab Content */}
        <TabsContent value="contact" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contact details */}
            <Card className="md:col-span-1 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-800">
                  Contact Coordinates
                </CardTitle>
                <CardDescription className="text-xs">
                  Add telephone numbers and chat methods for customers.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-xs font-bold text-gray-700">
                    Display Phone Number
                  </Label>
                  <Input
                    id="contactPhone"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="+94 77 123 4567"
                    className="border-gray-200 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-gray-400">Shown in the contacts directory and reveal button.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-xs font-bold text-gray-700">
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsapp"
                    value={contactInfo.whatsapp}
                    onChange={(e) =>
                      setContactInfo((prev) => ({ ...prev, whatsapp: e.target.value }))
                    }
                    placeholder="94771234567"
                    className="border-gray-200 text-xs rounded-xl"
                  />
                  <p className="text-[10px] text-gray-400">Include country code, no spaces or special symbols (e.g. 94771234567).</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-xs font-bold text-gray-700">
                    Facebook URL
                  </Label>
                  <Input
                    id="facebook"
                    value={contactInfo.facebook}
                    onChange={(e) =>
                      setContactInfo((prev) => ({ ...prev, facebook: e.target.value }))
                    }
                    placeholder="https://facebook.com/yourshop"
                    className="border-gray-200 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-xs font-bold text-gray-700">
                    Instagram URL
                  </Label>
                  <Input
                    id="instagram"
                    value={contactInfo.instagram}
                    onChange={(e) =>
                      setContactInfo((prev) => ({ ...prev, instagram: e.target.value }))
                    }
                    placeholder="https://instagram.com/yourshop"
                    className="border-gray-200 text-xs rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Google Maps embed URL */}
            <Card className="md:col-span-2 border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-sm font-bold text-gray-800">
                  Google Map Location Embed
                </CardTitle>
                <CardDescription className="text-xs">
                  Display a map of your physical location on your storefront website.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mapEmbed" className="text-xs font-bold text-gray-700">
                    Google Maps Embed URL (iframe src)
                  </Label>
                  <Input
                    id="mapEmbed"
                    value={contactInfo.mapEmbedUrl}
                    onChange={(e) =>
                      setContactInfo((prev) => ({ ...prev, mapEmbedUrl: e.target.value }))
                    }
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    className="border-gray-200 text-xs rounded-xl"
                  />
                  <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3.5 text-[11px] text-gray-600 space-y-1">
                    <p className="font-bold text-[#FF6600]">How to get this URL:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Open Google Maps and search for your storefront location.</li>
                      <li>Click the <strong>Share</strong> button.</li>
                      <li>Select the <strong>Embed a map</strong> tab.</li>
                      <li>Copy the URL value inside the <code>src="..."</code> attribute of the iframe code snippet.</li>
                    </ol>
                  </div>
                </div>

                {/* Map Preview */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-700">Live Map Preview</Label>
                  {contactInfo.mapEmbedUrl ? (
                    <div className="w-full h-[180px] rounded-xl overflow-hidden border border-gray-200">
                      <iframe
                        src={contactInfo.mapEmbedUrl}
                        className="w-full h-full border-0"
                        allowFullScreen
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-[180px] bg-gray-50 border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                      Configure maps URL to render preview
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSettings}
              disabled={isSavingSettings || isUploading}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md px-6 py-5 text-sm"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Customization...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Contact & Location</span>
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Custom Service Pages CRUD Content */}
        <TabsContent value="services" className="space-y-6 outline-none">
          <Card className="border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-gray-800">
                  Custom Services Pages
                </CardTitle>
                <CardDescription className="text-xs">
                  Create pages detailing specialized services (e.g. Phone Repair, Software Flashing).
                </CardDescription>
              </div>
              <Button
                onClick={handleOpenAddPage}
                className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl flex items-center gap-1 text-xs py-2 px-3 shadow"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Page</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {isPagesLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#FF6600]" />
                </div>
              ) : pages.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No service pages configured yet. Add your first service description page!
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-bold text-gray-700 text-xs w-[220px]">Title</TableHead>
                        <TableHead className="font-bold text-gray-700 text-xs">Slug</TableHead>
                        <TableHead className="font-bold text-gray-700 text-xs w-[120px]">Status</TableHead>
                        <TableHead className="font-bold text-gray-700 text-xs text-right w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((p) => (
                        <TableRow key={p.id} className="hover:bg-gray-50/50">
                          <TableCell className="font-semibold text-gray-900 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-150 overflow-hidden flex items-center justify-center shrink-0">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-gray-300" />
                                )}
                              </div>
                              <span className="truncate max-w-[160px]">{p.title}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 text-xs font-mono">{p.slug}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                p.isPublished
                                  ? "bg-green-50 text-green-600 border-green-200 text-[10px] font-bold"
                                  : "bg-gray-50 text-gray-500 border-gray-200 text-[10px] font-bold"
                              }
                            >
                              {p.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenEditPage(p)}
                                className="h-7 w-7 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeletePage(p.id)}
                                className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* dialog / Modal for Adding/Editing custom services page */}
      <Dialog open={isPageDialogOpen} onOpenChange={setIsPageDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white border border-gray-100 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-gray-900">
              {editingPage ? "Edit Service Page" : "Add Service Page"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Detail a specific service you offer to your storefront website visitors.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pageTitle" className="text-xs font-bold text-gray-700">
                Service Page Title
              </Label>
              <Input
                id="pageTitle"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Software Flashing & OS Installation"
                className="border-gray-200 text-xs rounded-xl"
              />
            </div>

            {/* Service Image Upload */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">Service Image</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center text-gray-400 shrink-0 relative">
                  {pageImageUrl ? (
                    <img src={pageImageUrl} alt="Service preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={isUploading || isSavingPage}
                    onChange={handleServiceImageUpload}
                    className="text-xs border-gray-200 cursor-pointer"
                  />
                  <p className="text-[9px] text-gray-400 leading-normal">
                    Square or landscape image. Max file size: 5MB.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pageContent" className="text-xs font-bold text-gray-700">
                Page Content
              </Label>
              <Textarea
                id="pageContent"
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                placeholder="Provide details about the service, turnaround times, and pricing models..."
                rows={6}
                className="border-gray-200 text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              disabled={isSavingPage}
              onClick={() => setIsPageDialogOpen(false)}
              className="border-gray-200 text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePage}
              disabled={isSavingPage}
              className="bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl text-xs"
            >
              {isSavingPage ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  <span>Saving Page...</span>
                </>
              ) : (
                <span>Save Page</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
