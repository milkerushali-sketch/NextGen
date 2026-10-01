import { useState } from "react";
import { FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { apiUrl } from "../config/api";

export default function WishlistButton({ product, className = "" }) {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { items, addToWishlist, removeFromWishlist } = useWishlist();
  const [isSaving, setIsSaving] = useState(false);

  const isWishlisted = items.some((item) => item.id === product.id);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(apiUrl("/api/wishlist"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, product }),
      });

      if (!response.ok) {
        throw new Error("Unable to save wishlist item");
      }

      addToWishlist(product);
    } catch (error) {
      console.error(error);
      addToWishlist(product);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSaving}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
        isWishlisted
          ? "bg-pink-500 text-white"
          : "bg-white/80 text-slate-900 hover:bg-pink-100"
      } ${className}`}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <FaHeart className={isSaving ? "animate-pulse" : ""} />
    </button>
  );
}
