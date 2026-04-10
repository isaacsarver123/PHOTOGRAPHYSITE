import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  House, CalendarDots, Users, EnvelopeSimple, SignOut, ChartBar, 
  CaretRight, Check, X, Upload, Trash, Eye, Clock, CurrencyDollar, Gear, CheckCircle
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Auth helper
const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Dashboard Overview
function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/bookings?limit=5`, { headers: getAuthHeaders() })
      ]);
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="border border-white/10 p-6 bg-[#141414]">
          <div className="flex items-center justify-between mb-4">
            <CalendarDots size={24} className="text-white/60" />
            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1">
              {stats?.pending_bookings} pending
            </span>
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
          <div className="flex items-center justify-between mb-4">
            <Users size={24} className="text-white/60" />
          </div>
          <p className="text-3xl font-black">{stats?.total_clients || 0}</p>
          <p className="text-sm text-white/60">Total Clients</p>
        </div>
        
        <div className="border border-white/10 p-6 bg-[#141414]">
          <div className="flex items-center justify-between mb-4">
            <EnvelopeSimple size={24} className="text-white/60" />
            <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1">
              {stats?.new_contacts} new
            </span>
          </div>
          <p className="text-3xl font-black">{stats?.total_contacts || 0}</p>
          <p className="text-sm text-white/60">Contact Requests</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Bookings</h2>
          <Link to="/admin/dashboard/bookings" className="text-sm text-white/60 hover:text-white">
            View all →
          </Link>
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
                  <td className="p-4">
                    <p className="font-medium">{booking.name}</p>
                    <p className="text-sm text-white/60">{booking.email}</p>
                  </td>
                  <td className="p-4 text-sm">{booking.scheduled_date}</td>
                  <td className="p-4 text-sm capitalize">{booking.package_id}</td>
                  <td className="p-4">
                    <StatusBadge status={booking.status} />
                  </td>
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

// Status Badge Component
function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-orange-500/20 text-orange-400',
    awaiting_payment: 'bg-orange-500/20 text-orange-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
    paid: 'bg-green-500/20 text-green-400',
    new: 'bg-purple-500/20 text-purple-400',
    contacted: 'bg-blue-500/20 text-blue-400',
    closed: 'bg-gray-500/20 text-gray-400'
  };
  
  return (
    <span className={`text-xs px-2 py-1 ${colors[status] || 'bg-white/10'}`}>
      {status}
    </span>
  );
}

// Bookings Management
function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`${API}/admin/bookings${params}`, { headers: getAuthHeaders() });
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(`${API}/admin/bookings/${bookingId}/status`, 
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      toast.success('Status updated');
      fetchBookings();
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div data-testid="admin-bookings">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight">Bookings</h1>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'confirmed', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm capitalize ${
                filter === status ? 'bg-[#d4af37] text-black' : 'border border-white/20 hover:border-white/40'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bookings List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 animate-pulse" />)
          ) : bookings.length === 0 ? (
            <div className="border border-white/10 p-8 text-center">
              <p className="text-white/60">No bookings found</p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className={`border p-4 cursor-pointer transition-colors ${
                  selectedBooking?.id === booking.id ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{booking.name}</p>
                    <p className="text-sm text-white/60">{booking.property_address}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <div className="flex gap-4 mt-4 text-sm text-white/60">
                  <span>{booking.scheduled_date}</span>
                  <span>{booking.scheduled_time}</span>
                  <span className="capitalize">{booking.package_id}</span>
                  <span className="text-white">${booking.total_amount}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Booking Details */}
        <div className="border border-white/10 p-6 bg-[#141414] h-fit sticky top-6">
          {selectedBooking ? (
            <BookingDetails 
              booking={selectedBooking} 
              onStatusUpdate={updateStatus}
              onPhotoUpload={() => fetchBookings()}
              onApprove={() => {
                fetchBookings();
                setSelectedBooking(null);
              }}
            />
          ) : (
            <div className="text-center py-12">
              <CalendarDots size={48} className="mx-auto mb-4 text-white/20" />
              <p className="text-white/60">Select a booking to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Booking Details Component
function BookingDetails({ booking, onStatusUpdate, onPhotoUpload, onApprove }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, [booking.id]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${API}/admin/bookings/${booking.id}`, { headers: getAuthHeaders() });
      setPhotos(response.data.photos || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this booking and send payment link to client?')) return;
    
    setApproving(true);
    try {
      await axios.post(`${API}/admin/bookings/${booking.id}/approve`, {}, { headers: getAuthHeaders() });
      toast.success('Booking approved! Payment link sent to client.');
      onApprove();
    } catch (error) {
      toast.error('Failed to approve booking');
    } finally {
      setApproving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      await axios.post(`${API}/admin/bookings/${booking.id}/photos`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photo uploaded');
      fetchPhotos();
      onPhotoUpload();
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId) => {
    if (!confirm('Delete this photo?')) return;
    
    try {
      await axios.delete(`${API}/admin/photos/${photoId}`, { headers: getAuthHeaders() });
      toast.success('Photo deleted');
      fetchPhotos();
    } catch (error) {
      toast.error('Failed to delete photo');
    }
  };

  return (
    <div>
      <h3 className="font-bold text-lg mb-4">Booking Details</h3>
      
      <div className="space-y-3 text-sm mb-6">
        <div className="flex justify-between">
          <span className="text-white/60">Client</span>
          <span>{booking.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Email</span>
          <span className="text-xs">{booking.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Phone</span>
          <span>{booking.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Area</span>
          <span className="capitalize">{booking.service_area || 'Calgary'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Date</span>
          <span>{booking.scheduled_date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Time</span>
          <span>{booking.scheduled_time}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Package</span>
          <span className="capitalize">{booking.package_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Amount</span>
          <span className="font-bold">${booking.total_amount} CAD</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/60">Payment</span>
          <StatusBadge status={booking.payment_status} />
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 mb-6">
        <p className="text-xs text-white/40 mb-2">Property Address</p>
        <p className="text-sm">{booking.property_address}</p>
      </div>

      {booking.notes && (
        <div className="border-t border-white/10 pt-4 mb-6">
          <p className="text-xs text-white/40 mb-2">Notes</p>
          <p className="text-sm">{booking.notes}</p>
        </div>
      )}

      {/* Approve Button for Pending Bookings */}
      {booking.status === 'pending' && (
        <div className="border-t border-white/10 pt-4 mb-6">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="w-full bg-[#d4af37] text-black py-3 text-sm font-medium uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {approving ? 'Approving...' : 'Approve & Send Payment Link'}
          </button>
          <p className="text-xs text-white/40 mt-2 text-center">
            Client will receive email with payment link
          </p>
        </div>
      )}

      {/* Status Actions */}
      <div className="border-t border-white/10 pt-4 mb-6">
        <p className="text-xs text-white/40 mb-3">Update Status</p>
        <div className="flex flex-wrap gap-2">
          {['pending', 'approved', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => onStatusUpdate(booking.id, status)}
              disabled={booking.status === status}
              className={`px-3 py-1 text-xs capitalize ${
                booking.status === status 
                  ? 'bg-white text-black' 
                  : 'border border-white/20 hover:border-white/40'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Photos Section */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-white/40">Client Photos ({photos.length})</p>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <span className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1">
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload'}
            </span>
          </label>
        </div>
        
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                <img src={`${process.env.REACT_APP_BACKEND_URL}${photo.url}`} alt={photo.title} className="w-full h-full object-cover" />
                <button
                  onClick={() => deletePhoto(photo.id)}
                  className="absolute top-1 right-1 p-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Clients Management
function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/admin/clients`, { headers: getAuthHeaders() });
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
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
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-white/60">Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-white/60">No clients yet</td></tr>
            ) : (
              clients.map((client) => (
                <tr key={client.user_id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {client.picture ? (
                        <img src={client.picture} alt={client.name} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                          <Users size={20} />
                        </div>
                      )}
                      <span className="font-medium">{client.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-white/60">{client.email}</td>
                  <td className="p-4 text-sm">{client.booking_count}</td>
                  <td className="p-4 text-sm text-white/60">
                    {new Date(client.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Contacts Management
function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchContacts();
  }, [filter]);

  const fetchContacts = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`${API}/admin/contacts${params}`, { headers: getAuthHeaders() });
      setContacts(response.data);
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (contactId, status) => {
    try {
      await axios.put(`${API}/admin/contacts/${contactId}/status?status=${status}`, {}, { headers: getAuthHeaders() });
      toast.success('Status updated');
      fetchContacts();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div data-testid="admin-contacts">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight">Contact Requests</h1>
        <div className="flex gap-2">
          {['all', 'new', 'contacted', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm capitalize ${
                filter === status ? 'bg-white text-black' : 'border border-white/20 hover:border-white/40'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 animate-pulse" />)
        ) : contacts.length === 0 ? (
          <div className="border border-white/10 p-8 text-center">
            <p className="text-white/60">No contact requests found</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="border border-white/10 p-6 bg-[#141414]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold">{contact.name}</p>
                  <p className="text-sm text-white/60">{contact.email} • {contact.phone || 'No phone'}</p>
                </div>
                <StatusBadge status={contact.status} />
              </div>
              
              <div className="mb-4">
                <p className="text-xs text-white/40 mb-1">Service: {contact.service_type}</p>
                <p className="text-sm">{contact.message}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <p className="text-xs text-white/40">
                  {new Date(contact.created_at).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  {contact.status !== 'contacted' && (
                    <button
                      onClick={() => updateStatus(contact.id, 'contacted')}
                      className="text-xs px-3 py-1 border border-white/20 hover:border-white/40"
                    >
                      Mark Contacted
                    </button>
                  )}
                  {contact.status !== 'closed' && (
                    <button
                      onClick={() => updateStatus(contact.id, 'closed')}
                      className="text-xs px-3 py-1 border border-white/20 hover:border-white/40"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Main Admin Dashboard Component
export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('admin_user');
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    } else {
      navigate('/admin');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: House, label: 'Overview', exact: true },
    { path: '/admin/dashboard/bookings', icon: CalendarDots, label: 'Bookings' },
    { path: '/admin/dashboard/clients', icon: Users, label: 'Clients' },
    { path: '/admin/dashboard/contacts', icon: EnvelopeSimple, label: 'Contacts' }
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path) && path !== '/admin/dashboard';
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="w-64 bg-[#141414] border-r border-white/10 fixed h-full">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white flex items-center justify-center">
              <span className="text-black font-black text-lg">SV</span>
            </div>
            <div>
              <span className="font-bold tracking-tight block">SKYVIEW</span>
              <span className="text-xs text-white/40">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`admin-nav-${item.label.toLowerCase()}`}
              className={`flex items-center gap-3 px-4 py-3 mb-1 transition-colors ${
                isActive(item.path, item.exact) || (item.exact && location.pathname === item.path)
                  ? 'bg-white text-black' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
              <Users size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{admin.name}</p>
              <p className="text-xs text-white/40 truncate">{admin.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="admin-logout"
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <SignOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="contacts" element={<AdminContacts />} />
        </Routes>
      </main>
    </div>
  );
}
