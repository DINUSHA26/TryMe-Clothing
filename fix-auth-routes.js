/**
 * Script to automatically fix authentication in API routes
 * Updates routes from old X-User-Role header pattern to new cookie-based auth
 */

const fs = require('fs');
const path = require('path');

// Files that need updating (from Grep results)
const filesToUpdate = [
  'src/app/api/vendor/reports/export/route.ts',
  'src/app/api/vendor/reports/earnings-breakdown/route.ts',
  'src/app/api/vendor/reports/top-products/route.ts',
  'src/app/api/vendor/reports/order-distribution/route.ts',
  'src/app/api/vendor/reports/sales-trends/route.ts',
  'src/app/api/vendor/reports/overview/route.ts',
  'src/app/api/admin/reports/export/route.ts',
  'src/app/api/admin/reports/sales/route.ts',
  'src/app/api/admin/reports/revenue-by-category/route.ts',
  'src/app/api/admin/reports/top-vendors/route.ts',
  'src/app/api/admin/reports/payment-methods/route.ts',
  'src/app/api/admin/payouts/[payoutId]/fail/route.ts',
  'src/app/api/admin/payouts/[payoutId]/complete/route.ts',
  'src/app/api/admin/payouts/[payoutId]/process/route.ts',
  'src/app/api/vendor/wallet/payouts/route.ts',
  'src/app/api/admin/orders/[orderId]/status/route.ts',
  'src/app/api/vendor/orders/items/[orderItemId]/status/route.ts',
  'src/app/api/admin/notifications/route.ts',
  'src/app/api/admin/chat/rooms/[roomId]/route.ts',
  'src/app/api/admin/chat/rooms/route.ts',
  'src/app/api/vendor/coupons/[couponId]/route.ts',
  'src/app/api/vendor/coupons/route.ts',
  'src/app/api/admin/coupons/[couponId]/route.ts',
  'src/app/api/admin/coupons/route.ts',
  'src/app/api/admin/payouts/[payoutId]/route.ts',
  'src/app/api/admin/payouts/route.ts',
  'src/app/api/vendor/wallet/payouts/[payoutId]/route.ts',
  'src/app/api/vendor/wallet/transactions/route.ts',
  'src/app/api/vendor/wallet/route.ts',
  'src/app/api/vendor/orders/route.ts',
  'src/app/api/vendor/products/[id]/variants/route.ts',
  'src/app/api/vendor/products/[id]/route.ts',
  'src/app/api/vendor/products/[id]/images/route.ts',
  'src/app/api/vendor/products/[id]/images/reorder/route.ts',
  'src/app/api/vendor/products/stock/[id]/route.ts',
  'src/app/api/vendor/products/route.ts',
];

function fixAuthInFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Skipping ${filePath} (not found)`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let changes = 0;

  // Detect if this is an admin or vendor route
  const isAdminRoute = filePath.includes('/api/admin/');
  const isVendorRoute = filePath.includes('/api/vendor/');
  const authFunction = isAdminRoute ? 'requireAdmin' : isVendorRoute ? 'requireVendor' : 'requireAuth';

  // Skip if already has the new auth helpers
  if (content.includes('@/lib/auth-helpers')) {
    console.log(`✅ Skipping ${filePath} (already updated)`);
    return false;
  }

  // 1. Remove old requireAdmin/requireVendor function
  const oldFunctionPatterns = [
    /async function requireAdmin\(request: NextRequest\): Promise<boolean> \{[\s\S]*?return userRole === UserRole\.ADMIN;\s*\}/g,
    /async function requireVendor\(request: NextRequest\): Promise<boolean> \{[\s\S]*?return userRole === UserRole\.VENDOR;\s*\}/g,
    /async function requireAdmin\(request: NextRequest\) \{[\s\S]*?return userId;\s*\}/g,
    /async function requireVendor\(request: NextRequest\) \{[\s\S]*?return userId;\s*\}/g,
  ];

  oldFunctionPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      changes++;
    }
  });

  // 2. Update imports - remove UserRole if only used for auth, add auth helpers
  if (content.includes('import { UserRole } from "@prisma/client"')) {
    // Check if UserRole is used elsewhere (not just in auth check)
    const userRoleUsages = content.match(/UserRole\.\w+/g) || [];
    const isUserRoleNeeded = userRoleUsages.length > 1; // More than just the auth check

    if (!isUserRoleNeeded) {
      content = content.replace(
        /import \{ UserRole \} from "@prisma\/client";?\n/,
        ''
      );
      changes++;
    }
  }

  // Add auth-helpers import
  const importPattern = /import \{ NextRequest, NextResponse \} from "next\/server";/;
  if (!content.includes('import { ' + authFunction)) {
    content = content.replace(
      importPattern,
      `import { NextRequest, NextResponse } from "next/server";\nimport { ${authFunction}, handleAuthError } from "@/lib/auth-helpers";`
    );
    changes++;
  }

  // 3. Update auth check in handlers
  const oldAuthPatterns = [
    /const isAdmin = await requireAdmin\(request\);\s*\n\s*if \(!isAdmin\) \{[\s\S]*?\}\s*\n/g,
    /const isVendor = await requireVendor\(request\);\s*\n\s*if \(!isVendor\) \{[\s\S]*?\}\s*\n/g,
    /const adminId = await requireAdmin\(request\);\s*\n\s*if \(!adminId\) \{[\s\S]*?\}\s*\n/g,
    /const vendorId = await requireVendor\(request\);\s*\n\s*if \(!vendorId\) \{[\s\S]*?\}\s*\n/g,
  ];

  oldAuthPatterns.forEach(pattern => {
    content = content.replace(
      pattern,
      `// Auth check\n    const user = ${authFunction}(request);\n\n    `
    );
  });

  // 4. Add auth error handling to catch blocks
  const catchPattern = /(\} catch \(error\) \{\s*\n\s*console\.error\([^)]+\);\s*\n)(\s*return NextResponse\.json)/g;
  content = content.replace(
    catchPattern,
    '$1\n    // Handle auth errors\n    const authError = handleAuthError(error);\n    if (authError) return authError;\n\n$2'
  );

  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    return true;
  }

  console.log(`⚠️  No changes needed for ${filePath}`);
  return false;
}

// Main execution
console.log('🔧 Starting authentication route fixes...\n');

let fixedCount = 0;
let skippedCount = 0;

filesToUpdate.forEach(file => {
  if (fixAuthInFile(file)) {
    fixedCount++;
  } else {
    skippedCount++;
  }
});

console.log(`\n✨ Complete!`);
console.log(`Fixed: ${fixedCount} files`);
console.log(`Skipped: ${skippedCount} files`);
console.log(`\n👉 Next steps:`);
console.log(`1. Restart your dev server: npm run dev:all`);
console.log(`2. Clear browser cookies (DevTools > Application > Clear site data)`);
console.log(`3. Login again at http://localhost:3000/admin/login`);
