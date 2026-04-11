import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  House, Images, CalendarDots, SignOut, User, Download, List, X, ArrowRight, Camera
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Dashboard Overview
function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total_bookings: 0, completed_bookings: 0, total_photos: 0 });
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        axios.get(`${API}/client/stats`, { withCredentials: true }),
        axios.get(`${API}/bookings`, { withCredentials: true })
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div data-testid="dashboard-overview">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-[#d4af37] mb-1">Welcome back</p>
        <h1 className="text-3xl font-black tracking-tight mb-8">
          {user?.name?.split(' ')[0] || 'there'}
        </h1>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {[
          { value: stats.total_bookings, label: 'Total Bookings', color: 'border-[#d4af37]/30' },
          { value: stats.completed_bookings, label: 'Completed Shoots', color: 'border-green-500/30' },
          { value: stats.total_photos, label: 'Photos Available', color: 'border-blue-500/30' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`border ${stat.color} bg-[#141414] p-6`}
          >
            <p className="text-4xl font-black">{stat.value}</p>
            <p className="text-sm text-white/50 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <Link to="/booking" className="border border-white/10 bg-[#141414] p-6 group hover:border-[#d4af37]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold mb-1">Book a Shoot</p>
              <p className="text-sm text-white/50">Schedule your next aerial photography session</p>
            </div>
            <ArrowRight size={20} className="text-white/30 group-hover:text-[#d4af37] transition-colors" />
          </div>
        </Link>
        <Link to="/dashboard/photos" className="border border-white/10 bg-[#141414] p-6 group hover:border-[#d4af37]/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold mb-1">View Photos</p>
              <p className="text-sm text-white/50">Browse and download your aerial shots</p>
            </div>
            <ArrowRight size={20} className="text-white/30 group-hover:text-[#d4af37] transition-colors" />
          </div>
        </Link>
      </div>

      {/* Recent Bookings */}
      <div>
        <h2 className="text-lg font-bold mb-4">Recent Bookings</h2>
        {bookings.length === 0 ? (
          <div className="border border-dashed border-white/20 p-12 text-center">
            <Camera size={40} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/50 mb-4">No bookings yet</p>
            <Link
              to="/booking"
              data-testid="first-booking-btn"
              className="bg-[#d4af37] text-black px-6 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors inline-block"
            >
              Book Your First Shoot
            </Link>
          </div>
        ) : (
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Date</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Package</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-white/40">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4 text-sm">{booking.scheduled_date}</td>
                    <td className="p-4 text-sm capitalize">{booking.package_id?.replace('_', ' ')}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 ${
                        booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                        booking.status === 'approved' ? 'bg-[#d4af37]/20 text-[#d4af37]' :
                        booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// My Photos
function MyPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${API}/client/photos`, { withCredentials: true });
      setPhotos(response.data);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="dashboard-photos">
      <h1 className="text-3xl font-black tracking-tight mb-2">My Photos</h1>
      <p className="text-sm text-white/40 mb-8">Photos are available for download for 30 days after your first download.</p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="aspect-square bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="border border-dashed border-white/20 p-16 text-center">
          <Images size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-2">No photos available yet</p>
          <p className="text-sm text-white/30">
            Photos will appear here after your shoot is completed and edited
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden border border-white/10">
              <img
                src={photo.thumbnail_url}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a
                  href={photo.download_url}
                  download
                  className="p-3 bg-[#d4af37] text-black hover:bg-[#c4a030] transition-colors"
                >
                  <Download size={20} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// My Bookings
function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`, { withCredentials: true });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="dashboard-bookings">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">My Bookings</h1>
          <p className="text-sm text-white/40 mt-1">Track all your aerial photography sessions</p>
        </div>
        <Link
          to="/booking"
          data-testid="new-booking-btn"
          className="bg-[#d4af37] text-black px-6 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors"
        >
          New Booking
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-24 bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-dashed border-white/20 p-16 text-center">
          <CalendarDots size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/50 mb-4">No bookings yet</p>
          <Link
            to="/booking"
            className="bg-[#d4af37] text-black px-6 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors inline-block"
          >
            Book Your First Shoot
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-white/10 p-6 bg-[#141414] hover:border-white/20 transition-colors"
            >
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <p className="font-bold mb-1">{booking.property_address}</p>
                  <p className="text-sm text-white/50">
                    {booking.scheduled_date} at {booking.scheduled_time}
                  </p>
                </div>
                <span className={`text-xs px-3 py-1 ${
                  booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                  booking.status === 'approved' ? 'bg-[#d4af37]/20 text-[#d4af37]' :
                  booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                  'bg-white/10 text-white/60'
                }`}>
                  {booking.status}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-6 text-sm">
                <span className="text-white/40">Package: <span className="text-white/80 capitalize">{booking.package_id?.replace('_', ' ')}</span></span>
                <span className="text-white/40">Type: <span className="text-white/80 capitalize">{booking.property_type}</span></span>
                {booking.total_amount && (
                  <span className="text-white/40">Total: <span className="text-white/80">${booking.total_amount} CAD</span></span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Profile
function Profile() {
  const { user, logout } = useAuth();

  return (
    <div data-testid="dashboard-profile">
      <h1 className="text-3xl font-black tracking-tight mb-8">Profile</h1>

      <div className="border border-white/10 p-8 bg-[#141414] max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-16 h-16 rounded-full border-2 border-[#d4af37]/30" />
          ) : (
            <div className="w-16 h-16 bg-[#d4af37]/10 rounded-full flex items-center justify-center border-2 border-[#d4af37]/30">
              <User size={28} className="text-[#d4af37]" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-white/50 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-0">
          <div className="flex justify-between py-4 border-b border-white/5">
            <span className="text-white/40 text-sm">Email</span>
            <span className="text-sm">{user?.email}</span>
          </div>
          <div className="flex justify-between py-4 border-b border-white/5">
            <span className="text-white/40 text-sm">Member Since</span>
            <span className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        <button
          onClick={logout}
          data-testid="logout-btn"
          className="mt-8 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          <SignOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const passedUser = location.state?.user;

  useEffect(() => {
    if (!loading && !user && !passedUser) {
      login();
    }
  }, [loading, user, passedUser, login]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  const currentUser = user || passedUser;
  if (!currentUser) return null;

  const navItems = [
    { path: '/dashboard', icon: House, label: 'Overview', exact: true },
    { path: '/dashboard/photos', icon: Images, label: 'My Photos' },
    { path: '/dashboard/bookings', icon: CalendarDots, label: 'Bookings' },
    { path: '/dashboard/profile', icon: User, label: 'Profile' }
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex" data-testid="client-dashboard">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#141414] border-r border-white/10 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform`}>
        <div className="p-5 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="SkyLine Media" className="h-10 w-auto" />
            <div>
              <span className="font-bold tracking-tight text-sm block leading-tight">SKYLINE</span>
              <span className="text-[10px] text-white/40 tracking-[0.15em] uppercase">Media</span>
            </div>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                isActive(item.path, item.exact) 
                  ? 'bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]' 
                  : 'text-white/50 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <item.icon size={18} weight={isActive(item.path, item.exact) ? 'fill' : 'regular'} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            to="/booking"
            data-testid="sidebar-new-booking"
            className="block w-full bg-[#d4af37] text-black px-4 py-3 text-sm font-medium tracking-wide uppercase text-center hover:bg-[#c4a030] transition-colors"
          >
            New Booking
          </Link>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#0A0A0A]">
          <button onClick={() => setSidebarOpen(true)} className="p-2" data-testid="mobile-menu-btn">
            <List size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="SkyLine Media" className="h-8 w-auto" />
          </Link>
          <div className="w-10" />
        </div>

        <div className="p-6 md:p-12 max-w-6xl">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="photos" element={<MyPhotos />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
