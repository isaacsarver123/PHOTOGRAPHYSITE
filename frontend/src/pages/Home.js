import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Drone, Certificate, Timer, Star } from '@phosphor-icons/react';

const heroImage = "https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=1920&q=80";
const equipmentImage = "/equipment-image.png";
const complianceImage = "/compliance-image.png";
const fleetImage = "https://images.unsplash.com/photo-1768571845597-38f066307f1e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzZ8MHwxfHNlYXJjaHwzfHxESkklMjBkcm9uZSUyMGZseWluZyUyMGFlcmlhbCUyMHBob3RvZ3JhcGh5fGVufDB8fHx8MTc3NTg4Mjc1Nnww&ixlib=rb-4.1.0&q=85";

const services = [
  {
    title: "Residential",
    description: "Showcase homes with stunning aerial perspectives",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
    span: "md:col-span-7"
  },
  {
    title: "Commercial",
    description: "Professional imagery for commercial properties",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
    span: "md:col-span-5"
  },
  {
    title: "Land & Development",
    description: "Aerial mapping and survey photography",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80",
    span: "md:col-span-5"
  },
  {
    title: "Construction Progress",
    description: "Document your build with regular aerial updates",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    span: "md:col-span-7"
  }
];

const stats = [
  { value: "500+", label: "Properties Shot" },
  { value: "50+", label: "Real Estate Agents" },
  { value: "24hr", label: "Average Delivery" },
  { value: "100%", label: "Client Satisfaction" }
];

export default function Home() {
  return (
    <main data-testid="home-page">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center" data-testid="hero-section">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Aerial view of luxury property" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-[#d4af37] mb-6">
              Calgary & Edmonton, Alberta
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-6">
              Elevate Your<br />
              Real Estate<br />
              Listings
            </h1>
            <p className="text-lg text-white/70 max-w-xl mb-10 leading-relaxed">
              Stunning aerial photography and videography that showcases properties 
              from perspectives that captivate buyers and close deals faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/booking"
                data-testid="hero-cta-button"
                className="bg-[#d4af37] text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors inline-flex items-center justify-center gap-2"
              >
                Request a Booking
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/portfolio"
                data-testid="hero-portfolio-link"
                className="border border-white/30 px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/10 transition-colors inline-flex items-center justify-center"
              >
                View Portfolio
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-[#d4af37] rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#141414] border-y border-white/10 py-12" data-testid="stats-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-black tracking-tighter text-white">{stat.value}</p>
                <p className="text-sm text-white/50 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]" data-testid="services-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-[#d4af37] mb-4">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Services</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {services.map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`${service.span} group relative overflow-hidden h-[300px] md:h-[400px] border border-white/10`}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                  <p className="text-sm text-white/60">{service.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <Link
              to="/services"
              data-testid="services-cta"
              className="inline-flex items-center gap-2 text-sm tracking-wide text-[#d4af37] hover:text-[#c4a030] transition-colors"
            >
              View All Services
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* About Teaser */}
      <section className="py-24 md:py-32 bg-[#141414]" data-testid="about-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src={complianceImage}
                alt="DJI Mavic 3 Pro - Transport Canada Compliant"
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute -bottom-6 -right-6 md:-bottom-8 md:-right-8 bg-[#d4af37] text-black p-6 md:p-8">
                <Certificate size={32} weight="fill" className="mb-2" />
                <p className="text-xs uppercase tracking-wider font-medium">Transport Canada</p>
                <p className="text-xs text-black/60">Compliant</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs tracking-[0.2em] uppercase text-[#d4af37] mb-4">About SkyLine Media</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Professional Aerial<br />Photography Experts
              </h2>
              <p className="text-white/60 leading-relaxed mb-8">
                Serving Calgary and Edmonton, we deliver exceptional aerial photography 
                that helps real estate professionals stand out in a competitive market. 
                Our fleet of DJI drones captures every angle with precision and artistry.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 border border-white/10">
                  <Drone size={28} className="mx-auto mb-2 text-[#d4af37]" />
                  <p className="text-xs text-white/60">DJI Fleet</p>
                </div>
                <div className="text-center p-4 border border-white/10">
                  <Certificate size={28} className="mx-auto mb-2 text-[#d4af37]" />
                  <p className="text-xs text-white/60">Certified</p>
                </div>
                <div className="text-center p-4 border border-white/10">
                  <Timer size={28} className="mx-auto mb-2 text-[#d4af37]" />
                  <p className="text-xs text-white/60">Fast Delivery</p>
                </div>
              </div>

              <Link
                to="/about"
                data-testid="about-cta"
                className="inline-flex items-center gap-2 text-sm tracking-wide text-[#d4af37] hover:text-[#c4a030] transition-colors"
              >
                Learn More About Us
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Equipment Section */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]" data-testid="equipment-section">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs tracking-[0.2em] uppercase text-[#d4af37] mb-4">Our Equipment</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Powered by DJI
              </h2>
              <p className="text-white/60 leading-relaxed mb-8">
                We use only the finest DJI drones and cameras to ensure stunning 
                4K video and high-resolution photography that makes your listings 
                stand out.
              </p>

              <img
                src={equipmentImage}
                alt="Our Professional Equipment"
                className="w-full rounded-lg"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-xs tracking-[0.2em] uppercase text-[#d4af37] mb-6">Our Fleet</p>
              <div className="space-y-4">
                {[
                  { name: "DJI Mavic 3 Pro", desc: "Flagship tri-camera system with 4/3 CMOS Hasselblad, 5.1K video & 46-min flight time" },
                  { name: "DJI Air 3", desc: "Dual-camera powerhouse with 48MP photos, 4K/100fps video & 46-min flight time" },
                  { name: "DJI Avata 2", desc: "Immersive FPV drone with 4K/60fps, ultra-wide 155° FOV & motion controller" }
                ].map((drone, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 border border-white/10 hover:border-[#d4af37]/30 transition-colors">
                    <Star size={20} weight="fill" className="text-[#d4af37] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{drone.name}</p>
                      <p className="text-sm text-white/60">{drone.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <img
                  src={fleetImage}
                  alt="DJI Drone in flight"
                  className="w-full aspect-video object-cover border border-white/10"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 bg-[#d4af37] text-black" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter mb-6">
              Ready to Elevate<br />Your Listings?
            </h2>
            <p className="text-black/60 max-w-xl mx-auto mb-10">
              Get stunning aerial photography that sells properties faster. 
              Request a booking today and receive your images within 24-48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                data-testid="footer-cta-book"
                className="bg-black text-white px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-black/80 transition-colors inline-flex items-center justify-center gap-2"
              >
                Request Booking
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/pricing"
                data-testid="footer-cta-pricing"
                className="border border-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-black/5 transition-colors inline-flex items-center justify-center"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
