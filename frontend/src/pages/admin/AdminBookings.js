import { useState, useEffect } from 'react';
import { CalendarDots, Check, Upload, Trash, CheckCircle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';
import { API, getAuthHeaders, StatusBadge } from './helpers';

function BookingDetails({ booking, onStatusUpdate, onPhotoUpload, onApprove, onDelete }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [approving, setApproving] = useState(false);

  useEffect(() => { fetchPhotos(); }, [booking.id]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${API}/admin/bookings/${booking.id}`, { headers: getAuthHeaders() });
      setPhotos(response.data.photos || []);
    } catch (error) { console.error('Error fetching photos:', error); }
  };

  const handleApprove = async () => {
    if (!confirm('Approve this booking and send payment link to client?')) return;
    setApproving(true);
    try {
      await axios.post(`${API}/admin/bookings/${booking.id}/approve`, {}, { headers: getAuthHeaders() });
      toast.success('Booking approved! Payment link sent to client.');
      onApprove();
    } catch (error) { toast.error('Failed to approve booking'); }
    finally { setApproving(false); }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    try {
      await axios.post(`${API}/admin/bookings/${booking.id}/photos`, formData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } });
      toast.success('Photo uploaded');
      fetchPhotos();
      onPhotoUpload();
    } catch (error) { toast.error('Failed to upload photo'); }
    finally { setUploading(false); }
  };

  const deletePhoto = async (photoId) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await axios.delete(`${API}/admin/photos/${photoId}`, { headers: getAuthHeaders() });
      toast.success('Photo deleted');
      fetchPhotos();
    } catch (error) { toast.error('Failed to delete photo'); }
  };

  return (
    <div>
      <h3 className="font-bold text-lg mb-4">Booking Details</h3>
      <div className="space-y-3 text-sm mb-6">
        <div className="flex justify-between"><span className="text-white/60">Client</span><span>{booking.name}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Email</span><span className="text-xs">{booking.email}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Phone</span><span>{booking.phone}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Area</span><span className="capitalize">{booking.service_area || 'Calgary'}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Date</span><span>{booking.scheduled_date}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Time</span><span>{booking.scheduled_time}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Package</span><span className="capitalize">{booking.package_id}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Amount</span><span className="font-bold">${booking.total_amount} CAD</span></div>
        <div className="flex justify-between"><span className="text-white/60">Payment</span><StatusBadge status={booking.payment_status} /></div>
      </div>
      <div className="border-t border-white/10 pt-4 mb-6"><p className="text-xs text-white/40 mb-2">Property Address</p><p className="text-sm">{booking.property_address}</p></div>
      {booking.notes && <div className="border-t border-white/10 pt-4 mb-6"><p className="text-xs text-white/40 mb-2">Notes</p><p className="text-sm">{booking.notes}</p></div>}

      {booking.status === 'pending' && (
        <div className="border-t border-white/10 pt-4 mb-6">
          <button onClick={handleApprove} disabled={approving} className="w-full bg-[#d4af37] text-black py-3 text-sm font-medium uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <CheckCircle size={18} />{approving ? 'Approving...' : 'Approve & Send Payment Link'}
          </button>
          <p className="text-xs text-white/40 mt-2 text-center">Client will receive email with payment link</p>
        </div>
      )}

      <div className="border-t border-white/10 pt-4 mb-6">
        <p className="text-xs text-white/40 mb-3">Update Status</p>
        <div className="flex flex-wrap gap-2">
          {['pending', 'approved', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button key={status} onClick={() => onStatusUpdate(booking.id, status)} disabled={booking.status === status}
              className={`px-3 py-1 text-xs capitalize ${booking.status === status ? 'bg-white text-black' : 'border border-white/20 hover:border-white/40'}`}>
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-white/40">Client Photos ({photos.length})</p>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <span className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1"><Upload size={14} />{uploading ? 'Uploading...' : 'Upload'}</span>
          </label>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                <img src={`${process.env.REACT_APP_BACKEND_URL}${photo.url}`} alt={photo.title} className="w-full h-full object-cover" />
                <button onClick={() => deletePhoto(photo.id)} className="absolute top-1 right-1 p-1 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash size={12} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-white/10 pt-4 mt-4">
        <button data-testid="delete-booking-detail" onClick={onDelete} className="w-full py-2.5 text-sm text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors flex items-center justify-center gap-2"><Trash size={16} />Delete Booking</button>
      </div>
    </div>
  );
}

export function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => { fetchBookings(); }, [filter]);

  const fetchBookings = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`${API}/admin/bookings${params}`, { headers: getAuthHeaders() });
      setBookings(response.data);
    } catch (error) { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  const updateStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(`${API}/admin/bookings/${bookingId}/status`, { status: newStatus }, { headers: getAuthHeaders() });
      toast.success('Status updated');
      fetchBookings();
      if (selectedBooking?.id === bookingId) setSelectedBooking({ ...selectedBooking, status: newStatus });
    } catch (error) { toast.error('Failed to update status'); }
  };

  const deleteBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to permanently delete this booking? This cannot be undone.')) return;
    try {
      await axios.delete(`${API}/admin/bookings/${bookingId}`, { headers: getAuthHeaders() });
      toast.success('Booking deleted');
      if (selectedBooking?.id === bookingId) setSelectedBooking(null);
      fetchBookings();
    } catch (error) { toast.error('Failed to delete booking'); }
  };

  return (
    <div data-testid="admin-bookings">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black tracking-tight">Bookings</h1>
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'confirmed', 'completed'].map((status) => (
            <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 text-sm capitalize ${filter === status ? 'bg-[#d4af37] text-black' : 'border border-white/20 hover:border-white/40'}`}>{status}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 animate-pulse" />) :
           bookings.length === 0 ? <div className="border border-white/10 p-8 text-center"><p className="text-white/60">No bookings found</p></div> :
           bookings.map((booking) => (
            <div key={booking.id} onClick={() => setSelectedBooking(booking)} className={`border p-4 cursor-pointer transition-colors ${selectedBooking?.id === booking.id ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'}`}>
              <div className="flex justify-between items-start">
                <div><p className="font-bold">{booking.name}</p><p className="text-sm text-white/60">{booking.property_address}</p></div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={booking.status} />
                  <button data-testid={`delete-booking-${booking.id}`} onClick={(e) => { e.stopPropagation(); deleteBooking(booking.id); }} className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete booking"><Trash size={16} /></button>
                </div>
              </div>
              <div className="flex gap-4 mt-4 text-sm text-white/60">
                <span>{booking.scheduled_date}</span><span>{booking.scheduled_time}</span><span className="capitalize">{booking.package_id}</span><span className="text-white">${booking.total_amount}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border border-white/10 p-6 bg-[#141414] h-fit sticky top-6">
          {selectedBooking ? (
            <BookingDetails booking={selectedBooking} onStatusUpdate={updateStatus} onPhotoUpload={() => fetchBookings()} onApprove={() => { fetchBookings(); setSelectedBooking(null); }} onDelete={() => deleteBooking(selectedBooking.id)} />
          ) : (
            <div className="text-center py-12"><CalendarDots size={48} className="mx-auto mb-4 text-white/20" /><p className="text-white/60">Select a booking to view details</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
