import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Pagination from '../components/Pagination';
import { ErrorMessage, LoadingState } from '../components/Feedback';
interface Contact { _id: string; name: string; email: string; subject: string; message: string; status: 'new' | 'handled'; createdAt: string; }
interface Subscription { _id: string; email: string; active: boolean; consentedAt: string; }
export default function PublicInboxPage() {
  const [tab, setTab] = useState<'contact' | 'newsletter'>('contact');
  const [status, setStatus] = useState('new'); const [page, setPage] = useState(1);
  const [contacts, setContacts] = useState<Contact[]>([]); const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState('');
  const limit = 20;
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await api.get(tab === 'contact' ? '/admin/contact-submissions' : '/admin/newsletter-subscriptions', { params: { page, limit, ...(tab === 'contact' ? { status } : { active: status === 'inactive' ? 'false' : 'true' }) } });
      setContacts(response.data.data.submissions || []); setSubscriptions(response.data.data.subscriptions || []); setTotal(response.data.data.total);
      if (page > Math.max(1, response.data.data.pages)) setPage(Math.max(1, response.data.data.pages));
    } catch { setError('Impossible de charger les messages. Réessayez.'); }
    finally { setLoading(false); }
  }, [tab, page, status]);
  useEffect(() => { void load(); }, [load]);
  async function markHandled(id: string) {
    setBusy(id); setError('');
    try { await api.put(`/admin/contact-submissions/${id}/handled`); await load(); }
    catch { setError('Le message n’a pas pu être marqué comme traité.'); }
    finally { setBusy(''); }
  }
  return <AdminLayout subtitle="Messages et newsletter"><h2 className="text-2xl font-bold text-gray-900 mb-6">Messages et newsletter</h2>
    <div className="flex flex-wrap gap-3 mb-6">
      <button aria-pressed={tab === 'contact'} className="border rounded-lg p-3 text-gray-800" onClick={() => { setTab('contact'); setStatus('new'); setPage(1); }}>Messages</button>
      <button aria-pressed={tab === 'newsletter'} className="border rounded-lg p-3 text-gray-800" onClick={() => { setTab('newsletter'); setStatus('active'); setPage(1); }}>Newsletter</button>
      <label className="text-gray-800">Statut<select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="ml-2 p-3 border rounded-lg bg-white">
        {tab === 'contact' ? <><option value="new">À traiter</option><option value="handled">Traités</option><option value="">Tous</option></> : <><option value="active">Actifs</option><option value="inactive">Désinscrits</option></>}
      </select></label>
    </div>
    {error && <ErrorMessage message={error} />}
    {loading ? <LoadingState /> : <>
      {tab === 'contact' ? <div className="space-y-4">{contacts.map(contact => <article className="bg-white p-5 rounded-xl border border-gray-200 break-words" key={contact._id}>
        <h3 className="font-semibold text-lg text-gray-900">{contact.subject}</h3><p className="text-sm text-gray-700">{contact.name} · {contact.email} · {new Date(contact.createdAt).toLocaleDateString('fr-FR')}</p>
        <p className="whitespace-pre-wrap text-gray-800 my-4">{contact.message}</p>
        {contact.status === 'new' ? <button disabled={busy === contact._id} onClick={() => void markHandled(contact._id)} className="rounded-lg bg-blue-700 text-white px-4 py-2 disabled:opacity-60">{busy === contact._id ? 'Enregistrement…' : 'Marquer comme traité'}</button> : <p className="text-green-800">Traité</p>}
      </article>)}</div> : <ul className="space-y-3">{subscriptions.map(subscription => <li key={subscription._id} className="rounded-lg border bg-white p-4 break-words text-gray-800">{subscription.email}<span className="block text-sm text-gray-700">Consentement : {new Date(subscription.consentedAt).toLocaleDateString('fr-FR')}</span></li>)}</ul>}
      {total === 0 && <p className="text-gray-700">Aucun résultat.</p>}<Pagination page={page} limit={limit} total={total} onChange={setPage} />
    </>}
  </AdminLayout>;
}
