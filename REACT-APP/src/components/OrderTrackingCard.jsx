export default function OrderTrackingCard({ order }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Order #{order.id}</h3>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
          {order.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent order"}
      </p>
    </article>
  );
}

