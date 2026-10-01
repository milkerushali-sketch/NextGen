import { Link } from "react-router-dom";

const orders = [
  {
    id: "#10042",
    item: "Aero X Headphones",
    amount: "₹249",
    status: "Delivered",
  },
  { id: "#10051", item: "Nova Smartwatch", amount: "₹199", status: "Shipped" },
  {
    id: "#10065",
    item: "Beam Pro Speaker",
    amount: "₹179",
    status: "Processing",
  },
];

export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">
            Orders
          </div>
          <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-white">
            Order history
          </h1>
        </div>
        <Link
          to="/"
          className="rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Continue shopping
        </Link>
      </div>

      <div className="mt-10 space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {order.item}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Order {order.id}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {order.amount}
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
