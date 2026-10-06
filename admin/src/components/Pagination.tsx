export default function Pagination({ page, limit, total, onChange }: { page: number; limit: number; total: number; onChange: (page: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return <nav aria-label="Pagination" className="mt-6 flex flex-wrap gap-3 items-center justify-between text-sm text-gray-700">
    <p>{(page - 1) * limit + 1}–{Math.min(page * limit, total)} sur {total}</p>
    <div className="flex flex-wrap gap-2 items-center">
      <button className="border rounded-lg px-3 py-2 disabled:opacity-50" disabled={page === 1} onClick={() => onChange(page - 1)}>Précédent</button>
      <span aria-live="polite">Page {page} sur {pages}</span>
      <button className="border rounded-lg px-3 py-2 disabled:opacity-50" disabled={page >= pages} onClick={() => onChange(page + 1)}>Suivant</button>
    </div>
  </nav>;
}
