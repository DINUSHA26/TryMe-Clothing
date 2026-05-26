/**
 * Admin Notifications Page
 * Allows admins to create system announcements and view notification history
 */

"use client";

import { useState } from "react";
import { Bell, Send, Users, UserCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { NotificationType } from "@/types/notification";

type AnnouncementTarget = "ALL" | "VENDOR" | "CUSTOMER";

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<AnnouncementTarget>("ALL");
  const [link, setLink] = useState("");

  const handleSendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and message are required",
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: title.trim(),
          message: message.trim(),
          link: link.trim() || undefined,
          recipientRole: target,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Announcement Sent",
          description: `Successfully sent to ${data.data.recipientCount} user(s)`,
        });

        // Reset form
        setTitle("");
        setMessage("");
        setLink("");
        setTarget("ALL");
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Send",
          description: data.error || "An error occurred",
        });
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send announcement",
      });
    } finally {
      setSending(false);
    }
  };

  const getTargetIcon = (target: AnnouncementTarget) => {
    switch (target) {
      case "ALL":
        return <Users className="h-4 w-4" />;
      case "VENDOR":
        return <Package className="h-4 w-4" />;
      case "CUSTOMER":
        return <UserCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Send announcements and manage system notifications
          </p>
        </div>
      </div>

      {/* Create Announcement Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create Announcement</CardTitle>
          <CardDescription>
            Send a system-wide announcement to all users, vendors, or customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Selection */}
          <div className="space-y-2">
            <Label htmlFor="target">Target Audience</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as AnnouncementTarget)}>
              <SelectTrigger id="target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>All Users</span>
                  </div>
                </SelectItem>
                <SelectItem value="VENDOR">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>Vendors Only</span>
                  </div>
                </SelectItem>
                <SelectItem value="CUSTOMER">
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    <span>Customers Only</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Platform Maintenance Scheduled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/255 characters
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter announcement message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/1000 characters
            </p>
          </div>

          {/* Link (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="link">Link (Optional)</Label>
            <Input
              id="link"
              placeholder="/admin/settings"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Internal link for users to navigate to (e.g., /help, /announcements)
            </p>
          </div>

          {/* Send Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSendAnnouncement}
              disabled={sending || !title.trim() || !message.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : "Send Announcement"}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getTargetIcon(target)}
              <span>
                Will send to {target === "ALL" ? "all users" : `${target.toLowerCase()}s`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Announcement Types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>System Announcement - General updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>Maintenance - Scheduled downtime</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Target Audiences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>• All Users - Everyone on the platform</div>
              <div>• Vendors - Business accounts only</div>
              <div>• Customers - Shopping accounts only</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Best Practices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>• Keep messages concise and clear</div>
              <div>• Include relevant links when needed</div>
              <div>• Target specific audiences appropriately</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
