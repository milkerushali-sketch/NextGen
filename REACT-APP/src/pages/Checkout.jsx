import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiEndpoints, apiUrl, authHeaders } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { items, total, clearCart } = useCart();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const tax = total * 0.08;

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(apiUrl(apiEndpoints.orders), {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to place your order.");
      clearCart();
      navigate("/orders", { state: { message: data.message } });
    } catch (requestError) {
      setError(requestError.message || "Unable to place your order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Secure checkout
        </div>
        <h1 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">
          Review your order
        </h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section aria-label="Order items" className="space-y-4">
            {items.length ? items.map((item) => (
              <div key={item.id} className="flex justify-between gap-4 border-b border-slate-200 pb-3 dark:border-slate-800">
                <span>{item.name} × {item.quantity}</span>
                <span>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
              </div>
            )) : (
              <p className="text-slate-500">Your cart is empty. Add products before checkout.</p>
            )}
          </section>
          <form
            onSubmit={placeOrder}
            className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/70"
          >
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Order total</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
              <div className="flex justify-between"><span>Estimated tax</span><span>₹{tax.toFixed(2)}</span></div>
            </div>
            <div className="mt-6 flex justify-between border-t border-slate-200 pt-4 text-xl font-black dark:border-slate-800">
              <span>Total</span><span>₹{(total + tax).toFixed(2)}</span>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Payment remains pending until completed through the secure payment provider. Do not enter card details in chat.
            </p>
            {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !items.length}
              className="mt-8 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400"
            >
              {submitting ? "Creating order..." : "Place order"}
            </button>
            <Link
              to="/cart"
              className="mt-4 block text-center text-sm font-semibold text-violet-600 dark:text-violet-400"
            >
              Return to cart
            </Link>
          </form>
        </div>
      </div>
    </main>
  );
}
