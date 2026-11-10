import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, getEffectiveVendor } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications/notificationService";
import { NotificationType } from "@/types/notification";

export async function GET(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        if (!user || user.role !== "VENDOR") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const effective = await getEffectiveVendor(user.userId);
        if (!effective) {
            return NextResponse.json({ success: false, error: "Vendor profile not found" }, { status: 404 });
        }
        const vendor = effective.vendor;

        return NextResponse.json({ success: true, data: vendor });
    } catch (error) {
        console.error("GET Vendor Profile Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = getAuthUser(req);
        if (!user || user.role !== "VENDOR") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { businessName, businessEmail, businessPhone, businessAddress, description, logo, banner, isShopOpen } = body;

        if (businessName !== undefined && businessName.trim() === "") {
            return NextResponse.json({ success: false, error: "Business name cannot be empty" }, { status: 400 });
        }

        // Get current vendor profile to check for changes
        const effective = await getEffectiveVendor(user.userId);
        if (!effective) {
            return NextResponse.json({ success: false, error: "Vendor not found" }, { status: 404 });
        }
        const currentVendor = effective.vendor;

        if (isShopOpen === true && currentVendor.status !== "ACTIVE") {
            return NextResponse.json({
                success: false,
                error: "Shop cannot be opened while vendor account is inactive or pending approval."
            }, { status: 400 });
        }

        const oldName = currentVendor.businessName;
        const isNameChanged = businessName !== undefined && oldName !== businessName;
        const isStatusChanged = isShopOpen !== undefined && currentVendor.isShopOpen !== isShopOpen;
        const hasOtherChanges = businessEmail !== undefined || businessPhone !== undefined || businessAddress !== undefined || description !== undefined || logo !== undefined || banner !== undefined;

        const updatedVendor = await prisma.vendor.update({
            where: { id: currentVendor.id },
            data: {
                ...(businessName && { businessName }),
                ...(businessEmail && { businessEmail }),
                ...(businessPhone && { businessPhone }),
                ...(businessAddress !== undefined && { businessAddress }),
                ...(description !== undefined && { description }),
                ...(logo !== undefined && { logo }),
                ...(banner !== undefined && { banner }),
                ...(isShopOpen !== undefined && { isShopOpen }),
            },
        });

        // Notify admins if name changed or other profile details changed (exclude shop status toggle for now to avoid spam)
        if (isNameChanged || hasOtherChanges) {
            const admins = await prisma.user.findMany({
                where: { role: "ADMIN", isActive: true },
                select: { id: true }
            });

            for (const admin of admins) {
                await createNotification({
                    userId: admin.id,
                    type: NotificationType.VENDOR_PROFILE_UPDATED,
                    metadata: {
                        vendorName: businessName || oldName,
                        oldBusinessName: oldName,
                        newBusinessName: businessName || oldName,
                        recipientRole: "ADMIN"
                    }
                });
            }
        }

        return NextResponse.json({ success: true, data: updatedVendor });
    } catch (error: any) {
        console.error("PATCH Vendor Profile Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to update profile"
        }, { status: 500 });
    }
}
