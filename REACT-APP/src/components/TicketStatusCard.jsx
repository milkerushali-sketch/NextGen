export default function TicketStatusCard({ ticket }) {
  if (!ticket) return null;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">{ticket.subject || `Ticket #${ticket.id}`}</h3>
        <span className="text-xs font-semibold uppercase text-violet-500">
          {ticket.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-500">{ticket.description}</p>
      {ticket.priority && <p className="mt-3 text-xs text-slate-400">Priority: {ticket.priority}</p>}
    </article>
  );
}
