export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5001" : "");

export const apiUrl = (path) =>
  API_BASE_URL ? `${API_BASE_URL}${path}` : path;

export const apiEndpoints = {
  agentQuery: "/assistant/query",
  cart: "/api/agent/cart",
  addToCart: "/api/agent/cart/add",
  orders: "/api/agent/orders",
  tickets: "/api/agent/tickets",
};

export const authHeaders = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});
