import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  House, Images, CalendarDots, Receipt, SignOut, User, Download, List, X 
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
      <h1 className="text-3xl font-black tracking-tight mb-8">
        Welcome back, {user?.name?.split(' ')[0] || 'there'}!
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <div className="border border-white/10 p-6 bg-[#141414]">
          <p className="text-4xl font-black">{stats.total_bookings}</p>
          <p className="text-sm text-white/60">Total Bookings</p>
        </div>
        <div className="border border-white/10 p-6 bg-[#141414]">
          <p className="text-4xl font-black">{stats.completed_bookings}</p>
          <p className="text-sm text-white/60">Completed Shoots</p>
        </div>
        <div className="border border-white/10 p-6 bg-[#141414]">
          <p className="text-4xl font-black">{stats.total_photos}</p>
          <p className="text-sm text-white/60">Photos Available</p>
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Bookings</h2>
        {bookings.length === 0 ? (
          <div className="border border-white/10 p-8 text-center bg-[#141414]">
            <p className="text-white/60 mb-4">No bookings yet</p>
            <Link
              to="/booking"
              className="bg-white text-black px-6 py-3 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors inline-block"
            >
              Book Your First Shoot
            </Link>
          </div>
        ) : (
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#141414]">
                <tr>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Date</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Package</th>
                  <th className="text-left p-4 text-xs uppercase tracking-wider text-white/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-white/10">
                    <td className="p-4">{booking.scheduled_date}</td>
                    <td className="p-4 capitalize">{booking.package_id}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 ${
                        booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
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
      <h1 className="text-3xl font-black tracking-tight mb-8">My Photos</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="aspect-square bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="border border-white/10 p-12 text-center bg-[#141414]">
          <Images size={48} className="mx-auto mb-4 text-white/40" />
          <p className="text-white/60 mb-4">No photos available yet</p>
          <p className="text-sm text-white/40">
            Photos will appear here after your shoot is completed
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden border border-white/10">
              <img
                src={photo.thumbnail_url}
                alt={photo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a
                  href={photo.download_url}
                  download
                  className="p-3 bg-white text-black hover:bg-white/90 transition-colors"
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
        <h1 className="text-3xl font-black tracking-tight">My Bookings</h1>
        <Link
          to="/booking"
          className="bg-white text-black px-6 py-3 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors"
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
        <div className="border border-white/10 p-12 text-center bg-[#141414]">
          <CalendarDots size={48} className="mx-auto mb-4 text-white/40" />
          <p className="text-white/60 mb-4">No bookings yet</p>
          <Link
            to="/booking"
            className="bg-white text-black px-6 py-3 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors inline-block"
          >
            Book Your First Shoot
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="border border-white/10 p-6 bg-[#141414]">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <p className="font-bold mb-1">{booking.property_address}</p>
                  <p className="text-sm text-white/60">
                    {booking.scheduled_date} at {booking.scheduled_time}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-3 py-1 ${
                    booking.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    booking.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                    booking.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-4 text-sm">
                <span className="text-white/60">Package: <span className="text-white capitalize">{booking.package_id}</span></span>
                <span className="text-white/60">Type: <span className="text-white capitalize">{booking.property_type}</span></span>
                <span className="text-white/60">Total: <span className="text-white">${booking.total_amount}</span></span>
              </div>
            </div>
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
            <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-full" />
          ) : (
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="text-white/60">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between py-3 border-b border-white/10">
            <span className="text-white/60">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between py-3 border-b border-white/10">
            <span className="text-white/60">Member Since</span>
            <span>{new Date(user?.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <button
          onClick={logout}
          data-testid="logout-btn"
          className="mt-8 flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
        >
          <SignOut size={20} />
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
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user data was passed from AuthCallback
  const passedUser = location.state?.user;

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user && !passedUser) {
      login();
    }
  }, [loading, user, passedUser, login]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const currentUser = user || passedUser;

  if (!currentUser) {
    return null;
  }

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
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white flex items-center justify-center">
              <span className="text-black font-black text-lg">SV</span>
            </div>
            <span className="font-bold tracking-tight">SKYVIEW</span>
          </Link>
        </div>

        <nav className="p-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={`flex items-center gap-3 px-4 py-3 mb-1 transition-colors ${
                isActive(item.path, item.exact) 
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
          <Link
            to="/booking"
            className="block w-full bg-white text-black px-4 py-3 text-sm font-medium tracking-wide uppercase text-center hover:bg-white/90 transition-colors"
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
          <button onClick={() => setSidebarOpen(true)} className="p-2">
            <List size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white flex items-center justify-center">
              <span className="text-black font-black text-sm">SV</span>
            </div>
          </Link>
          <div className="w-10" />
        </div>

        <div className="p-6 md:p-12">
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
