import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import {
  handleProductImageError,
  sanitizeProductImageUrl,
} from "../utils/productImage";

export default function WishlistPage() {
  const { items, removeFromWishlist } = useWishlist();

  if (!items.length) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">
          Your wishlist is empty
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Save your favorite pieces for later.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-slate-900 dark:text-white">
        Wishlist
      </h1>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map((product) => (
          <div
            key={product.id}
            className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <img
              src={sanitizeProductImageUrl(product.image, product.name)}
              alt={product.name}
              onError={handleProductImageError}
              className="h-64 w-full rounded-2xl object-cover"
            />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {product.name}
                </h2>
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-300">
                  {product.category}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFromWishlist(product.id)}
                className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
              >
                Remove
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                ₹{product.price}
              </span>
              <Link
                to="/"
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
