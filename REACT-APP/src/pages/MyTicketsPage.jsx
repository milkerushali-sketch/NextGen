import { useEffect, useState } from "react";
import TicketStatusCard from "../components/TicketStatusCard";
import { apiEndpoints, apiUrl, authHeaders } from "../config/api";
import { useAuth } from "../context/AuthContext";

export default function MyTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(apiUrl(apiEndpoints.tickets), { headers: authHeaders(token) })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Unable to load support tickets.");
        if (active) setTickets(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Unable to load support tickets.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">My support tickets</h1>
      {loading && <p role="status" className="mt-4 text-slate-500">Loading tickets...</p>}
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {!loading && !error && tickets.length === 0 && <p className="text-slate-500">No support tickets yet.</p>}
        {tickets.map((ticket) => <TicketStatusCard key={ticket.id} ticket={ticket} />)}
      </div>
    </main>
  );
}
