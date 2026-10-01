const getDeliveryLocation = (order) => {
  const location = order.deliveryLocation || order.delivery_location;
  if (location) return location;
  if (String(order.id || "").startsWith("DEMO-")) {
    return {
      city: "Nagpur, Maharashtra",
      latitude: 21.1458,
      longitude: 79.0882,
      source: "demo",
    };
  }
  return null;
};

export default function OrderTrackingCard({ order }) {
  const expectedDelivery = order.expectedDelivery || order.expected_delivery;
  const trackingId = order.trackingId || order.tracking_id;
  const shipmentStatus = order.shipmentStatus || order.shipment_status || order.deliveryStatus;
  const paymentStatus = order.paymentStatus || order.payment_status;
  const refundStatus = order.refundStatus || order.refund_status;
  const returnStatus = order.returnStatus || order.return_status;
  const deliveryLocation = getDeliveryLocation(order);
  const latitude = Number(deliveryLocation?.latitude ?? deliveryLocation?.lat);
  const longitude = Number(deliveryLocation?.longitude ?? deliveryLocation?.lon ?? deliveryLocation?.lng);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapBounds = hasCoordinates
    ? `${longitude - 0.025}%2C${latitude - 0.018}%2C${longitude + 0.025}%2C${latitude + 0.018}`
    : "";
  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapBounds}&layer=mapnik&marker=${latitude}%2C${longitude}`
    : "";
  const isDemoLocation = deliveryLocation?.source === "demo";

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
      {refundStatus && <p className="mt-1 text-sm">Refund: {refundStatus}</p>}
      {returnStatus && <p className="mt-1 text-sm">Return: {returnStatus}</p>}
      {order.total !== undefined && <p className="mt-2 font-semibold">Total: ₹{Number(order.total).toFixed(2)}</p>}
      {hasCoordinates && (
        <section className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700" aria-label="Delivery location">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-semibold">Delivery location</h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {deliveryLocation.city || "Current delivery area"}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDemoLocation ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"}`}>
              {isDemoLocation ? "Demo GPS" : "Driver GPS"}
            </span>
          </div>
          <iframe
            title={`Delivery location for order ${order.id}`}
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="mt-3 h-56 w-full rounded-xl border-0 bg-slate-100"
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {isDemoLocation
              ? "Demo location near Nagpur; this is not connected to a delivery person's live GPS."
              : `Location coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${deliveryLocation.updatedAt ? ` · Updated ${new Date(deliveryLocation.updatedAt).toLocaleString()}` : ""}`}
          </p>
        </section>
      )}
    </article>
  );
}
