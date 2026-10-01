import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
<<<<<<< HEAD
import { apiUrl } from "../config/api";
import {
  handleProductImageError,
  sanitizeProductImageUrl,
} from "../utils/productImage";
=======
import { apiEndpoints, apiUrl, authHeaders } from "../config/api";
import { handleProductImageError } from "../utils/productImage";
>>>>>>> fc728442fa7418242f93a91e9e06235a9a7ed00a
import CartModal from "./CartModal";
import Product3DView from "./Product3DView";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const { addToCart } = useCart();
  const { items } = useWishlist();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [cartError, setCartError] = useState("");
  const isWishlisted = items.some((item) => item.id === product.id);

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setCartError("");
    setIsCartOpen(true);
  };

  const handleConfirmAdd = async () => {
    setIsAdding(true);
    setCartError("");
    try {
      const response = await fetch(apiUrl(apiEndpoints.addToCart), {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Unable to add this product to your cart.");
      }
      addToCart(product);
      setIsCartOpen(false);
      navigate("/cart");
    } catch (error) {
      setCartError(error.message || "Unable to add this product to your cart.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <motion.article
        whileHover={{ y: -8 }}
        className="product-card group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="relative overflow-hidden">
          <img
            src={sanitizeProductImageUrl(product.image, product.name)}
            alt={product.name}
            onError={handleProductImageError}
            className="h-72 w-full object-cover"
          />
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              whileHover={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/30 bg-slate-950/75 p-4 text-white shadow-lg backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-black">{product.name}</div>
                  <div className="mt-1 text-xs text-slate-200">{product.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black">₹{product.price}</div>
                  <div className="flex items-center gap-1 text-xs text-amber-300">
                    <FaStar /> {product.rating}
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-slate-200">
                {product.description}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900">
            {product.category}
          </div>
          <div className="absolute right-4 top-4 flex gap-2">
            <WishlistButton
              product={product}
              className={
                isWishlisted
                  ? "bg-pink-500 text-white"
                  : "bg-white/80 text-slate-900"
              }
            />
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {product.name}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                <FaStar className="text-yellow-400" />
                {product.rating} ({product.reviews || 120})
              </div>
            </div>
            <button
              type="button"
              onClick={handleBuyNow}
              className="rounded-full bg-violet-500 p-3 text-white transition hover:bg-violet-400"
              aria-label={`Add ${product.name} to cart`}
            >
              <FaShoppingCart />
            </button>
          </div>
          <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{product.price}
              </span>
              <span className="text-sm text-slate-400 line-through">
                ₹{product.oldPrice || product.price + 30}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
            >
              View 3D
            </button>
          </div>
        </div>
      </motion.article>
      <CartModal
        product={product}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onConfirm={handleConfirmAdd}
        isLoading={isAdding}
        error={cartError}
      />
      <Product3DView
        product={product}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
