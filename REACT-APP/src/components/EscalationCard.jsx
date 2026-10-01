export default function EscalationCard({ reason, assignedTeam, ticketId }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <p>This request needs human review.</p>
      {assignedTeam && <p className="mt-1">Assigned team: {assignedTeam}</p>}
      {reason && <p className="mt-1">{reason}</p>}
      {ticketId
        ? <p className="mt-1">Support ticket: #{ticketId}</p>
        : <p className="mt-1">Sign in to create a support ticket if you have not already.</p>}
    </div>
  );
}
