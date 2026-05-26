import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WishlistStore {
    items: string[];
    addItem: (productId: string) => void;
    removeItem: (productId: string) => void;
    toggleItem: (productId: string) => void;
    clearItems: () => void;
    isInWishlist: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (productId) =>
                set((state) => ({
                    items: [...new Set([...state.items, productId])],
                })),
            removeItem: (productId) =>
                set((state) => ({
                    items: state.items.filter((id) => id !== productId),
                })),
            toggleItem: (productId) => {
                const { items } = get();
                if (items.includes(productId)) {
                    get().removeItem(productId);
                } else {
                    get().addItem(productId);
                }
            },
            clearItems: () => set({ items: [] }),
            isInWishlist: (productId) => get().items.includes(productId),
        }),
        {
            name: "fashiondora-wishlist",
            storage: createJSONStorage(() => localStorage),
        }
    )
);
