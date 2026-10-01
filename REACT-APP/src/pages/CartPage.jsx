import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { handleProductImageError } from "../utils/productImage";

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, total } = useCart();

  if (!items.length) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">
          Your cart is empty
        </h1>
        <p className="mt-4 text-slate-600 dark:text-slate-300">
          Add a few products to get started.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white"
        >
          Continue shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-black text-slate-900 dark:text-white">
        Shopping cart
      </h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row"
            >
              <img
                src={item.image}
                alt={item.name}
                onError={handleProductImageError}
                className="h-40 w-full rounded-2xl object-cover sm:w-40"
              />
              <div className="flex flex-1 flex-col justify-between gap-4">
                <div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {item.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                    {item.category}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 rounded-full border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="text-xl"
                    >
                      −
                    </button>
                    <span className="min-w-5 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="text-xl"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-sm font-semibold text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-right text-2xl font-black text-slate-900 dark:text-white">
                ₹{item.price * item.quantity}
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Order summary
          </h2>
          <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>₹{total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Tax</span>
              <span>₹{(total * 0.08).toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-black text-slate-900 dark:border-slate-800 dark:text-white">
            <span>Total</span>
            <span>₹{(total + total * 0.08).toFixed(2)}</span>
          </div>

          <Link
            to="/checkout"
            className="mt-6 block rounded-full bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400"
          >
            Proceed to checkout
          </Link>
        </aside>
      </div>
    </main>
  );
}
