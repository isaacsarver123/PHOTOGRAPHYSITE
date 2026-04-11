import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, X } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { name: 'Services', path: '/services' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  return (
    <header 
      data-testid="main-header"
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10"
    >
      <nav className="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/" 
          data-testid="logo-link"
          className="flex items-center gap-3"
        >
          <img src="/logo.png" alt="SkyLine Media" className="h-12" />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              data-testid={`nav-${link.name.toLowerCase()}`}
              className={`text-sm tracking-wide transition-colors hover:text-white ${
                location.pathname === link.path ? 'text-white' : 'text-white/60'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link
              to="/dashboard"
              data-testid="dashboard-link"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              data-testid="login-btn"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Client Login
            </Link>
          )}
          <Link
            to="/booking"
            data-testid="book-now-btn"
            className="bg-[#d4af37] text-black px-6 py-3 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors"
          >
            Request Booking
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          data-testid="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2"
        >
          {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`mobile-nav-${link.name.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg ${
                    location.pathname === link.path ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-white/60"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-white/60">
                    Client Login
                  </Link>
                )}
                <Link
                  to="/booking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-[#d4af37] text-black px-6 py-3 text-sm font-medium tracking-wide uppercase text-center"
                >
                  Request Booking
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
