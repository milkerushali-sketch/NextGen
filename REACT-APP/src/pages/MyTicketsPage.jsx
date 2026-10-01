import { useEffect, useState } from "react";
import TicketStatusCard from "../components/TicketStatusCard";
import { apiUrl, authHeaders } from "../config/api";
import { useAuth } from "../context/AuthContext";

export default function MyTicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetch(apiUrl("/api/agent/tickets"), { headers: authHeaders(token) })
      .then((response) => response.json())
      .then(setTickets)
      .catch(() => setTickets([]));
  }, [token]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">My support tickets</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {tickets.length ? tickets.map((ticket) => <TicketStatusCard key={ticket.id} ticket={ticket} />) : <p className="text-slate-500">No support tickets yet.</p>}
      </div>
    </main>
  );
}

