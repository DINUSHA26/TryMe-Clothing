"use client";

import { useState } from "react";
import { Copy, Check, KeyRound, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VendorCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  email: string;
  tempPassword: string;
  isReset?: boolean;
}

export function VendorCredentialsDialog({
  open,
  onOpenChange,
  businessName,
  email,
  tempPassword,
  isReset = false,
}: VendorCredentialsDialogProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const copyToClipboard = async (text: string, field: "email" | "password") => {
    await navigator.clipboard.writeText(text);
    if (field === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-500" />
            {isReset ? "Password Reset Successful" : "Vendor Account Created"}
          </DialogTitle>
          <DialogDescription>
            {isReset
              ? `A new temporary password has been generated for ${businessName}. Share these credentials with the vendor manually.`
              : `The welcome email could not be sent to ${businessName}. Please share these credentials with the vendor manually.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning banner */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Save these credentials now — they will not be shown again.
            </p>
          </div>

          {/* Credentials */}
          <div className="space-y-2">
            {/* Email */}
            <div className="flex items-center justify-between bg-muted rounded-lg border px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Login Email</p>
                <p className="text-sm font-mono">{email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(email, "email")}
                className="shrink-0 ml-2"
              >
                {copiedEmail ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between bg-muted rounded-lg border px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Temporary Password</p>
                <p className="text-sm font-mono font-bold tracking-wider">{tempPassword}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(tempPassword, "password")}
                className="shrink-0 ml-2"
              >
                {copiedPassword ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            The vendor will be required to change this password on their first login.
          </p>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              I've Saved the Credentials
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
