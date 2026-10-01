const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export async function requestAiAgent({ message, orderId, customer, confirmedProductId, quantity }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${AI_SERVICE_URL}/agent/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.AI_SERVICE_TOKEN
          ? { "X-AI-Service-Token": process.env.AI_SERVICE_TOKEN }
          : {}),
      },
      body: JSON.stringify({
        message,
        customer_id: customer?.userId ? Number(customer.userId) : null,
        order_id: orderId ? Number(orderId) : null,
        confirmed_product_id: confirmedProductId
          ? Number(confirmedProductId)
          : null,
        quantity: quantity ? Number(quantity) : 1,
      }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(`AI service returned HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    if (!payload || typeof payload.message !== "string") {
      throw new Error("AI service returned an invalid response.");
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}
