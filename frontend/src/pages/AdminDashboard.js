import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  House, CalendarDots, Users, EnvelopeSimple, SignOut, ChartBar, 
  CaretRight, Check, X, Upload, Trash, Eye, Clock, CurrencyDollar, Gear, CheckCircle,
  NotePencil, Package
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
// Admin Site Content CMS
function AdminContent() {
  const [content, setContent] = useState({
    phone: '',
    email: '',
    main_location: '',
    service_areas: [],
    travel_fee_note: '',
    fleet: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchContent(); }, []);

  const fetchContent = async () => {
    try {
      const res = await axios.get(`${API}/admin/site-content`, { headers: getAuthHeaders() });
      setContent(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      toast.error('Failed to load site content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...content };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;
      await axios.put(`${API}/admin/site-content`, payload, { headers: getAuthHeaders() });
      toast.success('Site content updated');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const updateArea = (idx, field, value) => {
    const areas = [...content.service_areas];
    areas[idx] = { ...areas[idx], [field]: field === 'fee' ? parseInt(value) || 0 : value };
    setContent(c => ({ ...c, service_areas: areas }));
  };

  const addArea = () => setContent(c => ({ ...c, service_areas: [...c.service_areas, { name: '', fee: 0 }] }));
  const removeArea = (idx) => setContent(c => ({ ...c, service_areas: c.service_areas.filter((_, i) => i !== idx) }));

  const updateFleet = (idx, field, value) => {
    const fleet = [...content.fleet];
    fleet[idx] = { ...fleet[idx], [field]: value };
    setContent(c => ({ ...c, fleet }));
  };

  const addFleet = () => setContent(c => ({ ...c, fleet: [...c.fleet, { name: '', description: '', image: '' }] }));
  const removeFleet = (idx) => setContent(c => ({ ...c, fleet: c.fleet.filter((_, i) => i !== idx) }));

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-white/5" /></div>;

  const inputCls = "w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none";

  return (
    <div data-testid="admin-content">
      <h1 className="text-3xl font-black tracking-tight mb-8">Site Content</h1>

      {/* Contact Info */}
      <div className="border border-white/10 bg-[#141414] p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Phone Number</label>
            <input data-testid="content-phone" value={content.phone} onChange={e => setContent(c => ({ ...c, phone: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input data-testid="content-email" value={content.email} onChange={e => setContent(c => ({ ...c, email: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Main Location</label>
            <input data-testid="content-location" value={content.main_location} onChange={e => setContent(c => ({ ...c, main_location: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Travel Fee Note</label>
            <input value={content.travel_fee_note} onChange={e => setContent(c => ({ ...c, travel_fee_note: e.target.value }))} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Service Areas */}
      <div className="border border-white/10 bg-[#141414] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Service Areas</h2>
          <button onClick={addArea} className="text-sm text-[#d4af37] hover:text-[#c4a030]">+ Add Area</button>
        </div>
        <div className="space-y-3">
          {content.service_areas.map((area, idx) => (
            <div key={idx} className="flex gap-3 items-center">
              <input value={area.name} onChange={e => updateArea(idx, 'name', e.target.value)} placeholder="Area name" className={`${inputCls} flex-1`} />
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/40">$</span>
                <input type="number" value={area.fee} onChange={e => updateArea(idx, 'fee', e.target.value)} className={`${inputCls} w-24`} />
                <span className="text-sm text-white/40">fee</span>
              </div>
              <button onClick={() => removeArea(idx)} className="text-red-400 hover:text-red-300 p-2"><X size={16} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet */}
      <div className="border border-white/10 bg-[#141414] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Drone Fleet</h2>
          <button onClick={addFleet} className="text-sm text-[#d4af37] hover:text-[#c4a030]">+ Add Drone</button>
        </div>
        <div className="space-y-4">
          {content.fleet.map((drone, idx) => (
            <div key={idx} className="border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Drone #{idx + 1}</span>
                <button onClick={() => removeFleet(idx)} className="text-red-400 hover:text-red-300"><X size={16} /></button>
              </div>
              <input value={drone.name} onChange={e => updateFleet(idx, 'name', e.target.value)} placeholder="Drone name" className={inputCls} />
              <input value={drone.description} onChange={e => updateFleet(idx, 'description', e.target.value)} placeholder="Description" className={inputCls} />
              <input value={drone.image || ''} onChange={e => updateFleet(idx, 'image', e.target.value)} placeholder="Image URL (optional)" className={inputCls} />
            </div>
          ))}
        </div>
      </div>

      <button data-testid="content-save" onClick={handleSave} disabled={saving}
        className="bg-[#d4af37] text-black px-8 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Site Content'}
      </button>
    </div>
  );
}

// Admin Packages CMS
function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    try {
      const res = await axios.get(`${API}/admin/packages`, { headers: getAuthHeaders() });
      setPackages(res.data);
    } catch (error) {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin/packages`, { packages }, { headers: getAuthHeaders() });
      toast.success('Packages updated');
    } catch (error) {
      toast.error('Failed to save packages');
    } finally {
      setSaving(false);
    }
  };

  const updatePkg = (idx, field, value) => {
    const pkgs = [...packages];
    pkgs[idx] = { ...pkgs[idx], [field]: field === 'price' ? parseFloat(value) || 0 : value };
    setPackages(pkgs);
  };

  const updateFeature = (pkgIdx, featIdx, value) => {
    const pkgs = [...packages];
    pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: [...pkgs[pkgIdx].features] };
    pkgs[pkgIdx].features[featIdx] = value;
    setPackages(pkgs);
  };

  const addFeature = (pkgIdx) => {
    const pkgs = [...packages];
    pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: [...pkgs[pkgIdx].features, ''] };
    setPackages(pkgs);
  };

  const removeFeature = (pkgIdx, featIdx) => {
    const pkgs = [...packages];
    pkgs[pkgIdx] = { ...pkgs[pkgIdx], features: pkgs[pkgIdx].features.filter((_, i) => i !== featIdx) };
    setPackages(pkgs);
  };

  const togglePopular = (idx) => {
    const pkgs = packages.map((p, i) => ({ ...p, popular: i === idx ? !p.popular : false }));
    setPackages(pkgs);
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-white/5" /></div>;

  const inputCls = "w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none";

  return (
    <div data-testid="admin-packages">
      <h1 className="text-3xl font-black tracking-tight mb-8">Pricing Packages</h1>

      <div className="space-y-6">
        {packages.map((pkg, idx) => (
          <div key={idx} className={`border bg-[#141414] p-6 ${pkg.popular ? 'border-[#d4af37]' : 'border-white/10'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{pkg.name || `Package ${idx + 1}`}</h2>
              <button onClick={() => togglePopular(idx)} className={`text-xs px-3 py-1 border transition-colors ${pkg.popular ? 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30' : 'border-white/20 text-white/40 hover:text-white'}`}>
                {pkg.popular ? 'Popular' : 'Set Popular'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Package ID</label>
                <input value={pkg.id} onChange={e => updatePkg(idx, 'id', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Name</label>
                <input value={pkg.name} onChange={e => updatePkg(idx, 'name', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Price (CAD)</label>
                <input type="number" value={pkg.price} onChange={e => updatePkg(idx, 'price', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Description</label>
                <input value={pkg.description} onChange={e => updatePkg(idx, 'description', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Recommended For</label>
                <input value={pkg.recommended_for || ''} onChange={e => updatePkg(idx, 'recommended_for', e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Notes (optional)</label>
              <input value={pkg.notes || ''} onChange={e => updatePkg(idx, 'notes', e.target.value)} className={inputCls} />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white/60">Features</label>
                <button onClick={() => addFeature(idx)} className="text-xs text-[#d4af37]">+ Add Feature</button>
              </div>
              <div className="space-y-2">
                {pkg.features.map((feat, fidx) => (
                  <div key={fidx} className="flex gap-2 items-center">
                    <input value={feat} onChange={e => updateFeature(idx, fidx, e.target.value)} className={`${inputCls} flex-1`} />
                    <button onClick={() => removeFeature(idx, fidx)} className="text-red-400 hover:text-red-300 p-2"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button data-testid="packages-save" onClick={handleSave} disabled={saving}
        className="mt-6 bg-[#d4af37] text-black px-8 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : 'Save All Packages'}
      </button>
    </div>
  );
}

// Admin Settings
function AdminSettings() {
  const [settings, setSettings] = useState({
    photo_storage_path: '',
    photo_retention_days: 30,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    sender_email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/admin/settings`, { headers: getAuthHeaders() });
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...settings };
      if (payload.smtp_password === '***') delete payload.smtp_password;
      delete payload.id;
      delete payload.updated_at;
      await axios.put(`${API}/admin/settings`, payload, { headers: getAuthHeaders() });
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const res = await axios.post(`${API}/admin/test-email`, {}, { headers: getAuthHeaders() });
      if (res.data.status === 'mocked') {
        toast.info(res.data.message);
      } else {
        toast.success('Test email sent! Check your inbox.');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-64 bg-white/5" /></div>;

  return (
    <div data-testid="admin-settings">
      <h1 className="text-3xl font-black tracking-tight mb-8">Settings</h1>

      {/* Photo Storage */}
      <div className="border border-white/10 bg-[#141414] p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Photo Storage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Storage Path</label>
            <input
              data-testid="settings-storage-path"
              value={settings.photo_storage_path}
              onChange={e => setSettings(s => ({ ...s, photo_storage_path: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Retention Period (days)</label>
            <input
              data-testid="settings-retention-days"
              type="number"
              value={settings.photo_retention_days}
              onChange={e => setSettings(s => ({ ...s, photo_retention_days: parseInt(e.target.value) || 30 }))}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* SMTP Configuration */}
      <div className="border border-white/10 bg-[#141414] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Email (SMTP) Configuration</h2>
          <span className={`text-xs px-3 py-1 ${settings.smtp_host && settings.smtp_user ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {settings.smtp_host && settings.smtp_user ? 'Configured' : 'Not Configured'}
          </span>
        </div>
        <p className="text-sm text-white/40 mb-6">
          Configure SMTP to send real email notifications for booking updates, approvals, and photo delivery.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">SMTP Host</label>
            <input
              data-testid="settings-smtp-host"
              value={settings.smtp_host}
              onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))}
              placeholder="smtp.gmail.com"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">SMTP Port</label>
            <input
              data-testid="settings-smtp-port"
              type="number"
              value={settings.smtp_port}
              onChange={e => setSettings(s => ({ ...s, smtp_port: parseInt(e.target.value) || 587 }))}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">SMTP Username / Email</label>
            <input
              data-testid="settings-smtp-user"
              value={settings.smtp_user}
              onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))}
              placeholder="your-email@gmail.com"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">SMTP Password / App Password</label>
            <input
              data-testid="settings-smtp-password"
              type="password"
              value={settings.smtp_password}
              onChange={e => setSettings(s => ({ ...s, smtp_password: e.target.value }))}
              placeholder="App password"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-white/60 mb-2">Sender Email Address</label>
            <input
              data-testid="settings-sender-email"
              value={settings.sender_email}
              onChange={e => setSettings(s => ({ ...s, sender_email: e.target.value }))}
              placeholder="noreply@skylinemedia.ca"
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none placeholder:text-white/20"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            data-testid="settings-test-email"
            onClick={handleTestEmail}
            disabled={testing}
            className="px-4 py-2 text-sm border border-white/20 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            {testing ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        data-testid="settings-save"
        onClick={handleSave}
        disabled={saving}
        className="bg-[#d4af37] text-black px-8 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}

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
    { path: '/admin/dashboard/contacts', icon: EnvelopeSimple, label: 'Contacts' },
    { path: '/admin/dashboard/content', icon: NotePencil, label: 'Site Content' },
    { path: '/admin/dashboard/packages', icon: Package, label: 'Packages' },
    { path: '/admin/dashboard/settings', icon: Gear, label: 'Settings' }
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
            <img src="/logo.png" alt="SkyLine Media" className="h-10" />
            <div>
              <span className="font-bold tracking-tight block text-[#d4af37]">SkyLine Media</span>
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
                  ? 'bg-[#d4af37] text-black' 
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
          <Route path="content" element={<AdminContent />} />
          <Route path="packages" element={<AdminPackages />} />
          <Route path="settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
}
