import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function ClientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map(e => e.msg || JSON.stringify(e)).join(' '));
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6 pt-20" data-testid="client-login-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link to="/">
            <img src="/logo.png" alt="SkyLine Media" className="h-16 w-auto mx-auto mb-6" />
          </Link>
          <h1 className="text-3xl font-black tracking-tight">Client Login</h1>
          <p className="text-white/50 mt-2 text-sm">
            Access your photos and track your bookings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border border-white/10 bg-[#141414] p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 mb-6" data-testid="login-error">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm text-white/60 mb-2">Email</label>
            <input
              data-testid="client-login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none"
              placeholder="your@email.com"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm text-white/60 mb-2">Password</label>
            <input
              data-testid="client-login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm focus:border-[#d4af37] focus:outline-none"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="client-login-submit"
            className="w-full bg-[#d4af37] text-black py-4 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-white/40 text-sm">
            Don't have an account? <Link to="/booking" className="text-[#d4af37] hover:text-[#c4a030]">Book a shoot</Link> and we'll create one for you.
          </p>
        </div>
      </motion.div>
    </main>
  );
}
