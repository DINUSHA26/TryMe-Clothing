import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CartItem,
  GuestCartItem,
  AddToCartResponse,
  CartResponse,
  MergeCartResponse,
} from "@/types/cart";
import { generateCartItemId } from "@/lib/utils/cart";

interface CartState {
  // State
  items: CartItem[];
  isLoading: boolean;
  error: string | null;

  // Guest cart actions (localStorage)
  addToGuestCart: (item: CartItem) => void;
  updateGuestCartItem: (itemId: string, quantity: number) => void;
  removeGuestCartItem: (itemId: string) => void;
  clearGuestCart: () => void;
  getGuestCartItems: () => GuestCartItem[];

  // Logged-in cart actions (API)
  fetchCart: () => Promise<void>;
  addToCart: (
    productId: string,
    quantity: number,
    variantId?: string | null
  ) => Promise<boolean>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;

  // Drawer state
  isOpen: boolean;
  setOpen: (open: boolean) => void;

  // Promo code (Auto-apply)
  promoCode: string | null;
  setPromoCode: (code: string | null) => void;
  clearPromoCode: () => void;

  // Utility
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  getItemQuantity: (productId: string, variantId?: string | null) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isLoading: false,
      error: null,
      isOpen: false,
      promoCode: null,

      // Drawer actions
      setOpen: (open) => set({ isOpen: open }),

      // Guest cart actions
      addToGuestCart: (item) => {
        const { items } = get();
        const itemId = generateCartItemId(item.productId, item.variantId);

        const existingIndex = items.findIndex((i) => i.id === itemId);

        if (existingIndex !== -1) {
          // Update existing item
          const newItems = [...items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + item.quantity,
          };
          set({ items: newItems, isOpen: true });
        } else {
          // Add new item
          set({
            items: [...items, { ...item, id: itemId }],
            isOpen: true
          });
        }
      },

      updateGuestCartItem: (itemId, quantity) => {
        const { items } = get();

        if (quantity === 0) {
          // Remove item
          set({ items: items.filter((item) => item.id !== itemId) });
        } else {
          // Update quantity
          const newItems = items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          );
          set({ items: newItems });
        }
      },

      removeGuestCartItem: (itemId) => {
        const { items } = get();
        set({ items: items.filter((item) => item.id !== itemId) });
      },

      clearGuestCart: () => {
        set({ items: [] });
      },

      getGuestCartItems: () => {
        const { items } = get();
        return items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId || null,
        }));
      },

      // Logged-in cart actions
      fetchCart: async () => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch("/api/cart", {
            credentials: "include",
          });

          // Silently ignore 401 — user is not a customer (vendor/admin browsing storefront)
          if (response.status === 401 || response.status === 403) {
            set({ isLoading: false });
            return;
          }

          const data: CartResponse = await response.json();

          if (data.success && data.data) {
            set({ items: data.data.cart.items as any, isLoading: false });
          } else {
            set({ error: data.error || "Failed to fetch cart", isLoading: false });
          }
        } catch (error) {
          console.error("Error fetching cart:", error);
          set({ error: "Failed to fetch cart", isLoading: false });
        }
      },

      addToCart: async (productId, quantity, variantId) => {
        set({ isLoading: true, error: null });

        // Optimistic update
        const previousItems = get().items;

        try {
          const response = await fetch("/api/cart", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ productId, quantity, variantId }),
          });

          const data: AddToCartResponse = await response.json();

          if (data.success && data.data) {
            set({
              items: data.data.cart.items as any,
              isLoading: false,
              isOpen: true
            });
            return true;
          } else {
            // Rollback
            set({
              items: previousItems,
              error: data.error || "Failed to add to cart",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.error("Error adding to cart:", error);
          // Rollback
          set({
            items: previousItems,
            error: "Failed to add to cart",
            isLoading: false,
          });
          return false;
        }
      },

      updateCartItem: async (itemId, quantity) => {
        set({ isLoading: true, error: null });

        // Optimistic update
        const previousItems = get().items;
        const newItems =
          quantity === 0
            ? previousItems.filter((item) => item.id !== itemId)
            : previousItems.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            );

        set({ items: newItems });

        try {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ quantity }),
          });

          const data: CartResponse = await response.json();

          if (data.success && data.data) {
            set({ items: data.data.cart.items as any, isLoading: false });
          } else {
            // Rollback
            set({
              items: previousItems,
              error: data.error || "Failed to update cart",
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error updating cart item:", error);
          // Rollback
          set({
            items: previousItems,
            error: "Failed to update cart",
            isLoading: false,
          });
        }
      },

      removeCartItem: async (itemId) => {
        set({ isLoading: true, error: null });

        // Optimistic update
        const previousItems = get().items;
        set({ items: previousItems.filter((item) => item.id !== itemId) });

        try {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: "DELETE",
            credentials: "include",
          });

          const data: CartResponse = await response.json();

          if (data.success && data.data) {
            set({ items: data.data.cart.items as any, isLoading: false });
          } else {
            // Rollback
            set({
              items: previousItems,
              error: data.error || "Failed to remove item",
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error removing cart item:", error);
          // Rollback
          set({
            items: previousItems,
            error: "Failed to remove item",
            isLoading: false,
          });
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null });

        // Optimistic update
        const previousItems = get().items;
        set({ items: [] });

        try {
          const response = await fetch("/api/cart/clear", {
            method: "DELETE",
            credentials: "include",
          });

          const data: CartResponse = await response.json();

          if (data.success) {
            set({ items: [], isLoading: false });
          } else {
            // Rollback
            set({
              items: previousItems,
              error: data.error || "Failed to clear cart",
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error clearing cart:", error);
          // Rollback
          set({
            items: previousItems,
            error: "Failed to clear cart",
            isLoading: false,
          });
        }
      },

      mergeGuestCart: async () => {
        set({ isLoading: true, error: null });

        const guestCartItems = get().getGuestCartItems();

        try {
          const response = await fetch("/api/cart/merge", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({ guestCartItems }),
          });

          const data: MergeCartResponse = await response.json();

          if (data.success && data.data) {
            set({ items: data.data.cart.items as any, isLoading: false });

            // Log merge stats
            console.log("Cart merged:", data.data.merged);

            // Clear guest cart after successful merge
            // Note: This will be handled by persistence layer
          } else {
            set({
              error: data.error || "Failed to merge cart",
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error merging cart:", error);
          set({ error: "Failed to merge cart", isLoading: false });
        }
      },

      // Utility
      setError: (error) => set({ error }),

      setLoading: (loading) => set({ isLoading: loading }),

      getItemQuantity: (productId, variantId) => {
        const { items } = get();
        const itemId = generateCartItemId(productId, variantId);
        const item = items.find((i) => i.id === itemId);
        return item?.quantity || 0;
      },
      
      setPromoCode: (code) => set({ promoCode: code }),

      clearPromoCode: () => set({ promoCode: null }),
    }),
    {
      name: "guest-cart-storage", // localStorage key
      partialize: (state) => ({
        // Persist guest cart items and promo code
        items: state.items,
        promoCode: state.promoCode,
      }),
    }
  )
);
