import { AnimatePresence, motion } from "framer-motion";
import { FaShoppingCart, FaStar } from "react-icons/fa";
import {
  handleProductImageError,
  sanitizeProductImageUrl,
} from "../utils/productImage";

export default function CartModal({ product, isOpen, onClose, onConfirm }) {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-lg overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                  <FaShoppingCart />
                </div>
                <div>
                  <div className="text-lg font-black">Buy now</div>
                  <div className="text-xs text-violet-100">Secure checkout</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-xl text-violet-100"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <img
                  src={sanitizeProductImageUrl(product.image, product.name)}
                  alt={product.name}
                  onError={handleProductImageError}
                  className="h-28 w-24 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {product.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {product.category}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <FaStar className="text-yellow-400" />
                    {product.rating} ({product.reviews || 120})
                  </div>
                  <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                    ₹{product.price}
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{product.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated tax</span>
                  <span>₹{(product.price * 0.08).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-900 dark:border-slate-800 dark:text-white">
                <span>Total</span>
                <span>₹{(product.price * 1.08).toFixed(2)}</span>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400"
                >
                  Confirm order
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
