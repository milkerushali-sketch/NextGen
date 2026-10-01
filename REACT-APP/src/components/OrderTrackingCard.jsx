export default function OrderTrackingCard({ order }) {
  const expectedDelivery = order.expectedDelivery || order.expected_delivery;
  const trackingId = order.trackingId || order.tracking_id;
  const shipmentStatus = order.shipmentStatus || order.shipment_status || order.deliveryStatus;
  const paymentStatus = order.paymentStatus || order.payment_status;

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
      {shipmentStatus && <p className="mt-2 text-sm">Shipment: {shipmentStatus}</p>}
      {trackingId && <p className="mt-1 text-sm">Tracking ID: {trackingId}</p>}
      {order.carrier && <p className="mt-1 text-sm">Carrier: {order.carrier}</p>}
      {expectedDelivery && (
        <p className="mt-1 text-sm">Expected delivery: {new Date(expectedDelivery).toLocaleDateString()}</p>
      )}
      {paymentStatus && <p className="mt-1 text-sm">Payment: {paymentStatus}</p>}
      {order.refundStatus && <p className="mt-1 text-sm">Refund: {order.refundStatus}</p>}
      {order.total !== undefined && <p className="mt-2 font-semibold">Total: ₹{Number(order.total).toFixed(2)}</p>}
    </article>
  );
}
