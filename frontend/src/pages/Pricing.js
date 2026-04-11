import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Star, ArrowRight, Camera, Drone, VideoCamera, MapPin, Lightning } from '@phosphor-icons/react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const tierColors = {
  quick_aerial: { accent: '#22c55e', label: 'Quick Aerial', badge: 'bg-green-500/20 text-green-400 border-green-500/30' },
  aerial_plus: { accent: '#d4af37', label: 'Aerial Plus', badge: 'bg-[#d4af37]/20 text-[#d4af37] border-[#d4af37]/30' },
  fpv_showcase: { accent: '#3b82f6', label: 'FPV Showcase', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
};

export default function Pricing() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main data-testid="pricing-page" className="pt-20">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-[#d4af37] mb-4">Pricing</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-6">
              Simple, Transparent<br />Pricing
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Choose the package that fits your property and budget. 
              All packages include certified pilots and professional DJI equipment.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 md:py-24 bg-[#141414]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-[600px] bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg, idx) => {
                const tier = tierColors[pkg.id] || tierColors.aerial_plus;
                return (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    data-testid={`pricing-${pkg.id}`}
                    className={`relative border ${
                      pkg.popular 
                        ? 'border-[#d4af37] bg-[#1a1a1a]' 
                        : 'border-white/10 bg-[#0A0A0A]'
                    } hover:border-white/20 transition-colors`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black px-4 py-1 text-xs uppercase tracking-wider font-medium flex items-center gap-1">
                        <Star size={12} weight="fill" />
                        Most Popular
                      </div>
                    )}
                    
                    <div className="p-8">
                      {/* Tier badge */}
                      <div className={`inline-block px-3 py-1 text-xs font-medium border mb-4 ${tier.badge}`}>
                        {pkg.name}
                      </div>
                      
                      <p className="text-sm text-white/50 mb-6">{pkg.description}</p>
                      
                      <div className="mb-8">
                        <span className="text-5xl font-black">${pkg.price}</span>
                        <span className="text-white/60 ml-2">CAD</span>
                      </div>

                      <Link
                        to={`/booking?package=${pkg.id}`}
                        data-testid={`book-${pkg.id}`}
                        className={`block w-full py-4 text-center text-sm font-medium tracking-wide uppercase transition-colors ${
                          pkg.popular
                            ? 'bg-[#d4af37] text-black hover:bg-[#c4a030]'
                            : 'border border-white/30 hover:bg-white/10'
                        }`}
                      >
                        Request Booking
                      </Link>

                      <div className="mt-8 pt-8 border-t border-white/10">
                        <p className="text-xs uppercase tracking-wider text-white/40 mb-4">What's Included</p>
                        <ul className="space-y-3">
                          {pkg.features.map((feature, fidx) => (
                            <li key={fidx} className="flex items-start gap-3 text-sm">
                              <Check size={18} className="mt-0.5 flex-shrink-0" style={{ color: tier.accent }} />
                              <span className="text-white/80">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {pkg.notes && (
                        <div className="mt-4 p-3 bg-white/5 border border-white/10 text-xs text-white/50">
                          {pkg.notes}
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-white/40">
                          Best for: {pkg.recommended_for}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Travel fee notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            className="mt-8 p-6 border border-[#d4af37]/30 bg-[#d4af37]/5"
          >
            <div className="flex items-start gap-4">
              <MapPin size={24} className="text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-[#d4af37] mb-1">Service Area & Travel Fees</p>
                <p className="text-sm text-white/60">
                  Based in <strong className="text-white">Central Alberta (Red Deer & Area)</strong> — no travel fee. 
                  Edmonton & Calgary: <strong className="text-white">+$80 CAD</strong> travel fee. 
                  Other locations can be arranged via booking request.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking Flow Info */}
      <section className="py-16 md:py-24 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">How Booking Works</h2>
            <p className="text-white/60">Simple 4-step process to get your property photographed</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: '1', title: 'Submit Request', desc: 'Choose your package and preferred date' },
              { num: '2', title: 'We Review', desc: 'We check availability and confirm details' },
              { num: '3', title: 'Pay & Confirm', desc: 'Receive payment link once approved' },
              { num: '4', title: 'Get Photos', desc: 'Download within 24-48 hours of shoot' }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-[#d4af37] text-black font-black text-lg flex items-center justify-center mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-white/60">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16 md:py-24 bg-[#141414]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Optional Add-ons</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Twilight Photography', price: 149, desc: 'Golden hour & sunset shots' },
              { name: 'Rush Delivery', price: 99, desc: 'Same-day turnaround' },
              { name: 'Social Media Package', price: 79, desc: 'Vertical reels & optimized content' },
              { name: 'Travel Fee (Edm/Cgy)', price: 80, desc: 'For Edmonton or Calgary area shoots' }
            ].map((addon, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ delay: idx * 0.1 }}
                className="border border-white/10 p-6"
              >
                <h3 className="font-medium mb-1">{addon.name}</h3>
                <p className="text-sm text-white/60 mb-4">{addon.desc}</p>
                <p className="text-xl font-bold text-[#d4af37]">+${addon.price} CAD</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            className="mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently Asked</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { q: 'What areas do you serve?', a: 'We\'re based in Central Alberta (Red Deer area) with no travel fee. Edmonton and Calgary are available for an additional $80 CAD travel fee. Other locations can be arranged via booking request.' },
              { q: 'How does the booking approval work?', a: 'After you submit a request, we review availability and confirm details. Once approved, you\'ll receive a payment link via email.' },
              { q: 'Do you offer indoor FPV fly-throughs?', a: 'Yes! Our FPV Showcase package includes a full indoor fly-through using our BetaFPV Pavo 20 Pro drone. The Aerial Plus package also includes an optional simple indoor pass.' },
              { q: 'What if the weather is bad?', a: 'We monitor weather closely and will reschedule free of charge if conditions are unsafe for flying.' },
              { q: 'How long are photos available?', a: 'Photos are available for download for 30 days after your first download. Make sure to save them!' }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ delay: idx * 0.1 }}
                className="border-b border-white/10 pb-6"
              >
                <h3 className="font-medium mb-2">{faq.q}</h3>
                <p className="text-sm text-white/60">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-[#d4af37] text-black">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-6">
              Need a Custom Quote?
            </h2>
            <p className="text-black/60 mb-10">
              Have a unique project or multiple properties? Contact us for custom pricing.
            </p>
            <Link
              to="/contact"
              data-testid="pricing-contact-cta"
              className="bg-black text-white px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-black/80 transition-colors inline-flex items-center justify-center gap-2"
            >
              Get Custom Quote
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
