import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDots, CurrencyDollar, Users, EnvelopeSimple } from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, getAuthHeaders, StatusBadge } from './helpers';

export function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/bookings?limit=5`, { headers: getAuthHeaders() })
      ]);
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5" />)}
      </div>
    </div>;
  }

  return (
    <div data-testid="admin-overview">
      <h1 className="text-3xl font-black tracking-tight mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="border border-white/10 p-6 bg-[#141414]">
          <div className="flex items-center justify-between mb-4">
            <CalendarDots size={24} className="text-white/60" />
            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1">{stats?.pending_bookings} pending</span>
          </div>
          <p className="text-3xl font-black">{stats?.total_bookings || 0}</p>
          <p className="text-sm text-white/60">Total Bookings</p>
        </div>
        <div className="border border-white/10 p-6 bg-[#141414]">
          <div className="flex items-center justify-between mb-4">
            <CurrencyDollar size={24} className="text-white/60" />
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1">Revenue</span>
          </div>
          <p className="text-3xl font-black">${stats?.total_revenue?.toLocaleString() || 0}</p>
          <p className="text-sm text-white/60">Total Revenue (CAD)</p>
        </div>
        <div className="border border-white/10 p-6 bg-[#141414]">
          <div className="flex items-center justify-between mb-4"><Users size={24} className="text-white/60" /></div>
          <p className="text-3xl font-black">{stats?.total_clients || 0}</p>
          <p className="text-sm text-white/60">Total Clients</p>
        </div>
        <div className="border border-white/10 p-6 bg-[#141414]">
          <div className="flex items-center justify-between mb-4">
            <EnvelopeSimple size={24} className="text-white/60" />
            <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1">{stats?.new_contacts} new</span>
          </div>
          <p className="text-3xl font-black">{stats?.total_contacts || 0}</p>
          <p className="text-sm text-white/60">Contact Requests</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Bookings</h2>
          <Link to="/admin/dashboard/bookings" className="text-sm text-white/60 hover:text-white">View all &rarr;</Link>
        </div>
        <div className="border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#141414]">
              <tr>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Client</th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Date</th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Package</th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Status</th>
                <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4"><p className="font-medium">{booking.name}</p><p className="text-sm text-white/60">{booking.email}</p></td>
                  <td className="p-4 text-sm">{booking.scheduled_date}</td>
                  <td className="p-4 text-sm capitalize">{booking.package_id}</td>
                  <td className="p-4"><StatusBadge status={booking.status} /></td>
                  <td className="p-4 font-medium">${booking.total_amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
