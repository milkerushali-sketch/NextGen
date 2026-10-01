import { Link } from "react-router-dom";

export default function Checkout() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
          Checkout
        </div>
        <h1 className="mt-3 text-4xl font-black text-slate-900 dark:text-white">
          Complete your order
        </h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Full name
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                defaultValue="Alex Morgan"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                defaultValue="alex@example.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Address
              </label>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
                defaultValue="12 Market Street, New York, NY"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950/70">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Payment
            </h2>
            <div className="mt-6 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>₹349</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Taxes</span>
                <span>₹27.92</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xl font-black text-slate-900 dark:border-slate-800 dark:text-white">
              <span>Total</span>
              <span>₹376.92</span>
            </div>
            <button
              type="button"
              className="mt-8 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-violet-500 dark:text-slate-950 dark:hover:bg-violet-400"
            >
              Place order
            </button>
            <Link
              to="/"
              className="mt-4 block text-center text-sm font-semibold text-violet-600 dark:text-violet-400"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
