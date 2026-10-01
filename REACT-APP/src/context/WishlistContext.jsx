import { createContext, useContext, useEffect, useMemo, useState } from "react";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("novacart-wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("novacart-wishlist", JSON.stringify(items));
  }, [items]);

  const addToWishlist = (product) => {
    setItems((current) => {
      if (current.some((item) => item.id === product.id)) {
        return current;
      }

      return [...current, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setItems((current) => current.filter((item) => item.id !== productId));
  };

  const value = useMemo(
    () => ({
      items,
      addToWishlist,
      removeFromWishlist,
      itemCount: items.length,
    }),
    [items],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
}
