/**
 * NotificationPreferencesDialog Component
 * Settings modal for notification preferences
 */

"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { NotificationCategory } from "@/types/notification";

interface CategoryPreferences {
  email: boolean;
  inApp: boolean;
}

interface Preferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  preferences: Record<NotificationCategory, CategoryPreferences>;
}

export function NotificationPreferencesDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState<Preferences>({
    emailEnabled: true,
    inAppEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: 22,
    quietHoursEnd: 7,
    preferences: {
      [NotificationCategory.ORDER]: { email: true, inApp: true },
      [NotificationCategory.DISPUTE]: { email: true, inApp: true },
      [NotificationCategory.PAYOUT]: { email: true, inApp: true },
      [NotificationCategory.CHAT]: { email: false, inApp: true },
      [NotificationCategory.SYSTEM]: { email: true, inApp: true },
    },
  });

  // Fetch preferences when dialog opens
  useEffect(() => {
    if (open) {
      fetchPreferences();
    }
  }, [open]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications/preferences");
      const data = await response.json();

      if (data.success) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      const data = await response.json();

      if (data.success) {
        setOpen(false);
      } else {
        alert(data.error || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const updateCategoryPreference = (
    category: NotificationCategory,
    field: "email" | "inApp",
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [category]: {
          ...prev.preferences[category],
          [field]: value,
        },
      },
    }));
  };

  const categories: { key: NotificationCategory; label: string }[] = [
    { key: NotificationCategory.ORDER, label: "Orders" },
    { key: NotificationCategory.DISPUTE, label: "Disputes" },
    { key: NotificationCategory.PAYOUT, label: "Payouts" },
    { key: NotificationCategory.CHAT, label: "Chat" },
    { key: NotificationCategory.SYSTEM, label: "System" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Preferences
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification Preferences</DialogTitle>
          <DialogDescription>
            Customize how you receive notifications across the platform.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Global settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Global Settings
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailEnabled">Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="emailEnabled"
                  checked={preferences.emailEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      emailEnabled: checked,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="inAppEnabled">In-App Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Show notifications in the app
                  </p>
                </div>
                <Switch
                  id="inAppEnabled"
                  checked={preferences.inAppEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, inAppEnabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="quietHours">Quiet Hours</Label>
                  <p className="text-sm text-gray-500">
                    No notifications from {preferences.quietHoursStart}:00 to{" "}
                    {preferences.quietHoursEnd}:00
                  </p>
                </div>
                <Switch
                  id="quietHours"
                  checked={preferences.quietHoursEnabled}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      quietHoursEnabled: checked,
                    }))
                  }
                />
              </div>
            </div>

            {/* Category preferences */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">
                Notification Types
              </h3>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        In-App
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.key}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {category.label}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={
                              preferences.preferences[category.key].email
                            }
                            onCheckedChange={(checked) =>
                              updateCategoryPreference(
                                category.key,
                                "email",
                                checked
                              )
                            }
                            disabled={!preferences.emailEnabled}
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={
                              preferences.preferences[category.key].inApp
                            }
                            onCheckedChange={(checked) =>
                              updateCategoryPreference(
                                category.key,
                                "inApp",
                                checked
                              )
                            }
                            disabled={!preferences.inAppEnabled}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
