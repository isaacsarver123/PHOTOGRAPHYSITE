import { Link } from 'react-router-dom';
import { InstagramLogo, FacebookLogo, YoutubeLogo, LinkedinLogo } from '@phosphor-icons/react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer data-testid="main-footer" className="bg-[#0A0A0A] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="SkyLine Media" className="h-12" />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Professional drone aerial photography for real estate in Calgary & Edmonton, Alberta.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" data-testid="social-instagram" className="text-white/40 hover:text-[#d4af37] transition-colors">
                <InstagramLogo size={24} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" data-testid="social-facebook" className="text-white/40 hover:text-[#d4af37] transition-colors">
                <FacebookLogo size={24} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" data-testid="social-youtube" className="text-white/40 hover:text-[#d4af37] transition-colors">
                <YoutubeLogo size={24} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" data-testid="social-linkedin" className="text-white/40 hover:text-[#d4af37] transition-colors">
                <LinkedinLogo size={24} />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-6 text-[#d4af37]">Services</h4>
            <ul className="space-y-3">
              <li><Link to="/services" className="text-white/60 text-sm hover:text-white transition-colors">Residential</Link></li>
              <li><Link to="/services" className="text-white/60 text-sm hover:text-white transition-colors">Commercial</Link></li>
              <li><Link to="/services" className="text-white/60 text-sm hover:text-white transition-colors">Land Surveying</Link></li>
              <li><Link to="/services" className="text-white/60 text-sm hover:text-white transition-colors">Construction</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-6 text-[#d4af37]">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-white/60 text-sm hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/portfolio" className="text-white/60 text-sm hover:text-white transition-colors">Portfolio</Link></li>
              <li><Link to="/pricing" className="text-white/60 text-sm hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="text-white/60 text-sm hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-6 text-[#d4af37]">Contact</h4>
            <ul className="space-y-3 text-white/60 text-sm">
              <li>Calgary & Edmonton, Alberta</li>
              <li>info@skylinemedia.ca</li>
              <li>(403) 555-0123</li>
              <li className="pt-2">
                <span className="text-xs uppercase tracking-wider text-white/40">Transport Canada Compliant</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © {currentYear} SkyLine Media. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-white/40 text-sm hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="text-white/40 text-sm hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
