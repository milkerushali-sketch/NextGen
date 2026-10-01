import { useState } from "react";
import { apiUrl, authHeaders } from "../config/api";
import { useAuth } from "../context/AuthContext";
import PolicyCard from "../components/PolicyCard";

export default function SupportPage() {
  const { token } = useAuth();
  const [form, setForm] = useState({ subject: "", description: "" });
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    const response = await fetch(apiUrl("/api/agent/tickets"), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setMessage(response.ok ? `Ticket #${data.id} created.` : data.message);
    if (response.ok) setForm({ subject: "", description: "" });
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 md:grid-cols-2">
      <section>
        <h1 className="text-3xl font-black">Customer support</h1>
        <p className="mt-2 text-slate-500">Tell us what happened and our agent will route it.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input className="w-full rounded-xl border p-3 dark:bg-slate-900" required placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea className="min-h-36 w-full rounded-xl border p-3 dark:bg-slate-900" required placeholder="Describe the issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white">Create ticket</button>
          {message && <p className="text-sm">{message}</p>}
        </form>
      </section>
      <div className="space-y-4">
        <PolicyCard title="Returns">Share your order number. Keep items unused and in original packaging where possible.</PolicyCard>
        <PolicyCard title="Privacy">Never share passwords, full card numbers, CVVs, or OTPs with support.</PolicyCard>
      </div>
    </main>
  );
}

