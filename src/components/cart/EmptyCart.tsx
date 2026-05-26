import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <ShoppingCart className="w-12 h-12 text-gray-400" />
      </div>

      <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>

      <p className="text-muted-foreground text-center mb-8 max-w-md">
        Looks like you haven't added any items to your cart yet. Start shopping to
        fill it up!
      </p>

      <Link href="/products">
        <Button size="lg">
          Browse Products
        </Button>
      </Link>
    </div>
  );
}
