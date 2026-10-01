import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OrderTrackingCard from "../components/OrderTrackingCard";
import { apiEndpoints, apiUrl, authHeaders } from "../config/api";
import { useAuth } from "../context/AuthContext";

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(apiUrl(apiEndpoints.orders), { headers: authHeaders(token) })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load your orders.");
        if (active) setOrders(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load your orders.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

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
        {loading && <p role="status" className="text-slate-500">Loading your orders...</p>}
        {error && <p role="alert" className="text-red-600">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <p className="text-slate-500">No orders have been placed yet.</p>
        )}
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <OrderTrackingCard order={order} />
            {Array.isArray(order.items) && order.items.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
