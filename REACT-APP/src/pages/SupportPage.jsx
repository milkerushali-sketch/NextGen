import { useState } from "react";
import { Link } from "react-router-dom";
import { apiEndpoints, apiUrl, authHeaders } from "../config/api";
import { useAuth } from "../context/AuthContext";

export default function SupportPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({ subject: "", description: "" });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl(apiEndpoints.tickets), {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(form),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to create your ticket.");
      setMessage(`Ticket #${data.id} created.`);
      setForm({ subject: "", description: "" });
    } catch (error) {
      setMessage(error.message || "Unable to create your ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
      <section>
        <h1 className="text-3xl font-black">Customer support</h1>
        <p className="mt-2 text-slate-500">Tell our support team what happened. Please do not include passwords, card numbers, CVVs, or one-time codes.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-xl border p-3 dark:bg-slate-900" required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea className="min-h-36 w-full rounded-xl border p-3 dark:bg-slate-900" required placeholder="Describe the issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button disabled={isSubmitting} className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white disabled:opacity-50">
            {isSubmitting ? "Submitting..." : "Create ticket"}
          </button>
          {message && <p role="status" className="text-sm">{message}</p>}
        </form>
      </section>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold">Policy questions</h2>
        <p className="mt-2 text-sm text-slate-500">
          Ask NovaAssistant for a policy answer. It uses approved policy documents when available and will not invent policy terms.
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("open-nova-assistant"))}
          className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Ask NovaAssistant
        </button>
        <Link to="/tickets" className="mt-4 block text-sm font-semibold text-violet-600">
          View my tickets
        </Link>
      </div>
    </main>
  );
}
