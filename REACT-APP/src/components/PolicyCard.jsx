export default function PolicyCard({ title, children }) {
  return (
    <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
      <h3 className="font-bold text-indigo-800 dark:text-indigo-200">{title}</h3>
      <p className="mt-2 text-sm text-indigo-700 dark:text-indigo-300">{children}</p>
    </article>
  );
}

