import { useState, useEffect } from 'react';
import { Users } from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, getAuthHeaders } from './helpers';

export function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/admin/clients`, { headers: getAuthHeaders() });
      setClients(response.data);
    } catch (error) { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  };

  return (
    <div data-testid="admin-clients">
      <h1 className="text-3xl font-black tracking-tight mb-8">Clients</h1>
      <div className="border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#141414]">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Client</th>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Email</th>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Bookings</th>
              <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="p-8 text-center text-white/60">Loading...</td></tr> :
             clients.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-white/60">No clients yet</td></tr> :
             clients.map((client) => (
              <tr key={client.user_id} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {client.picture ? <img src={client.picture} alt={client.name} className="w-10 h-10 rounded-full" /> :
                     <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"><Users size={20} /></div>}
                    <span className="font-medium">{client.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-white/60">{client.email}</td>
                <td className="p-4 text-sm">{client.booking_count}</td>
                <td className="p-4 text-sm text-white/60">{new Date(client.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
