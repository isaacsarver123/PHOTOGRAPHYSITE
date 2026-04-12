import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, getAuthHeaders, StatusBadge } from './helpers';

export function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchContacts(); }, [filter]);

  const fetchContacts = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`${API}/admin/contacts${params}`, { headers: getAuthHeaders() });
      setContacts(response.data);
    } catch (error) { toast.error('Failed to load contacts'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (contactId, status) => {
    try {
      await axios.put(`${API}/admin/contacts/${contactId}/status?status=${status}`, {}, { headers: getAuthHeaders() });
      toast.success('Status updated');
      fetchContacts();
    } catch (error) { toast.error('Failed to update status'); }
  };

  return (
    <div data-testid="admin-contacts">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight">Contact Requests</h1>
        <div className="flex gap-2">
          {['all', 'new', 'contacted', 'closed'].map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 text-sm capitalize ${filter === status ? 'bg-white text-black' : 'border border-white/20 hover:border-white/40'}`}>{status}</button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 animate-pulse" />) :
         contacts.length === 0 ? <div className="border border-white/10 p-8 text-center"><p className="text-white/60">No contact requests found</p></div> :
         contacts.map((contact) => (
          <div key={contact.id} className="border border-white/10 p-6 bg-[#141414]">
            <div className="flex justify-between items-start mb-4">
              <div><p className="font-bold">{contact.name}</p><p className="text-sm text-white/60">{contact.email} &bull; {contact.phone || 'No phone'}</p></div>
              <StatusBadge status={contact.status} />
            </div>
            <div className="mb-4"><p className="text-xs text-white/40 mb-1">Service: {contact.service_type}</p><p className="text-sm">{contact.message}</p></div>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <p className="text-xs text-white/40">{new Date(contact.created_at).toLocaleString()}</p>
              <div className="flex gap-2">
                {contact.status !== 'contacted' && <button onClick={() => updateStatus(contact.id, 'contacted')} className="text-xs px-3 py-1 border border-white/20 hover:border-white/40">Mark Contacted</button>}
                {contact.status !== 'closed' && <button onClick={() => updateStatus(contact.id, 'closed')} className="text-xs px-3 py-1 border border-white/20 hover:border-white/40">Close</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
