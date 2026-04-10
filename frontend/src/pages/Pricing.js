import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, Star, ArrowRight } from '@phosphor-icons/react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
      setPackages([
        {
          id: 'starter',
          name: 'Starter Package',
          price: 399,
          currency: 'CAD',
          description: 'Perfect for small residential properties',
          features: [
            'Up to 15 aerial photos',
            '1 property walkthrough video',
            'Basic color correction',
            '24-48 hour delivery',
            'Commercial usage rights'
          ],
          recommended_for: 'Single-family homes, condos'
        },
        {
          id: 'professional',
          name: 'Professional Package',
          price: 799,
          currency: 'CAD',
          description: 'Ideal for larger properties and real estate agents',
          features: [
            'Up to 30 aerial photos',
            '2 property videos (aerial + ground)',
            'Advanced color grading',
            'Before/After comparison shots',
            'Interactive virtual tour',
            '12-24 hour delivery',
            'Commercial usage rights'
          ],
          recommended_for: 'Large homes, estates, commercial properties',
          popular: true
        },
        {
          id: 'premium',
          name: 'Premium Package',
          price: 1299,
          currency: 'CAD',
          description: 'Complete coverage for luxury and commercial properties',
          features: [
            'Unlimited aerial photos',
            '4K cinematic video production',
            'Twilight/sunset shots',
            '3D property mapping',
            'Interactive virtual tour',
            'Social media ready content',
            'Same-day delivery available',
            'Full commercial rights'
          ],
          recommended_for: 'Luxury homes, commercial real estate, developments'
        }
      ]);
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
              All packages include certified pilots and professional equipment.
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
              {packages.map((pkg, idx) => (
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
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black px-4 py-1 text-xs uppercase tracking-wider font-medium flex items-center gap-1">
                      <Star size={12} weight="fill" />
                      Most Popular
                    </div>
                  )}
                  
                  <div className="p-8">
                    <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                    <p className="text-sm text-white/60 mb-6">{pkg.description}</p>
                    
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
                            <Check size={18} className="text-[#d4af37] mt-0.5 flex-shrink-0" />
                            <span className="text-white/80">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10">
                      <p className="text-xs text-white/40">
                        Recommended for: {pkg.recommended_for}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Booking Flow Info */}
      <section className="py-16 md:py-24 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
                viewport={{ once: true }}
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
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Optional Add-ons</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Twilight Photography', price: 199, desc: 'Golden hour & sunset shots' },
              { name: 'Rush Delivery', price: 149, desc: 'Same-day turnaround' },
              { name: '3D Matterport Tour', price: 299, desc: 'Interactive 3D walkthrough' },
              { name: 'Social Media Package', price: 99, desc: 'Optimized content for platforms' }
            ].map((addon, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Frequently Asked</h2>
          </motion.div>

          <div className="space-y-6">
            {[
              { q: 'What areas do you serve?', a: 'We serve Calgary, Edmonton, and surrounding areas within Alberta.' },
              { q: 'How does the booking approval work?', a: 'After you submit a request, we review availability and confirm details. Once approved, you\'ll receive a payment link via email.' },
              { q: 'What if the weather is bad?', a: 'We monitor weather closely and will reschedule free of charge if conditions are unsafe for flying.' },
              { q: 'How long are photos available?', a: 'Photos are available for download for 30 days after your first download. Make sure to save them!' }
            ].map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
            viewport={{ once: true }}
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
