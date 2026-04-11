import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Drone, Camera, MapTrifold, Buildings, HouseSimple, Mountains, HardHat, Clock, Check } from '@phosphor-icons/react';

const services = [
  {
    id: 'residential',
    icon: HouseSimple,
    title: 'Residential Real Estate',
    description: 'Stunning aerial photography that showcases homes, yards, pools, and surrounding neighborhoods from captivating angles.',
    features: [
      'High-resolution aerial photos',
      '4K video walkthroughs',
      'Neighborhood context shots',
      'Pool and backyard highlights',
      'Sunset/twilight options'
    ],
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'
  },
  {
    id: 'commercial',
    icon: Buildings,
    title: 'Commercial Properties',
    description: 'Professional aerial imagery for office buildings, retail centers, industrial facilities, and commercial developments.',
    features: [
      'Building facade shots',
      'Parking and accessibility views',
      'Surrounding area context',
      'Multi-angle coverage',
      'Marketing-ready content'
    ],
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'
  },
  {
    id: 'land',
    icon: Mountains,
    title: 'Land & Development',
    description: 'Comprehensive aerial mapping and photography for undeveloped land, ranches, farms, and development sites.',
    features: [
      'Boundary documentation',
      'Topographical context',
      '2D/3D mapping options',
      'Acreage visualization',
      'Development potential views'
    ],
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'
  },
  {
    id: 'construction',
    icon: HardHat,
    title: 'Construction Progress',
    description: 'Regular aerial documentation of construction sites to track progress, create time-lapses, and document milestones.',
    features: [
      'Weekly/monthly updates',
      'Time-lapse compilations',
      'Safety documentation',
      'Investor updates',
      'As-built records'
    ],
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80'
  }
];

const equipment = [
  {
    name: 'DJI Mavic 3 Pro',
    description: 'Our flagship tri-camera drone with a 4/3 CMOS Hasselblad camera for stunning 20MP photos and 5.1K video.',
    specs: ['4/3" CMOS Sensor', '20MP Photos', '5.1K Video', '46min Flight Time']
  },
  {
    name: 'DJI Air 3',
    description: 'Dual-camera powerhouse delivering 48MP stills and 4K/100fps video in a portable, high-performance package.',
    specs: ['1/1.3" CMOS Dual Cam', '48MP Photos', '4K/100fps Video', '46min Flight Time']
  },
  {
    name: 'DJI Avata 2',
    description: 'Immersive FPV drone with ultra-wide 155° FOV, perfect for cinematic interior and exterior walkthroughs.',
    specs: ['1/1.7" CMOS', '12MP Photos', '4K/60fps Video', '155° Ultra-Wide FOV']
  }
];

export default function Services() {
  return (
    <main data-testid="services-page" className="pt-20">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">Our Services</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-6">
              Professional Drone<br />Photography Services
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              From residential homes to commercial developments, we provide comprehensive 
              aerial photography and videography services tailored to your needs.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section className="bg-[#141414]">
        {services.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className={`border-b border-white/10 ${idx === 0 ? 'border-t' : ''}`}
          >
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24">
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white/10 flex items-center justify-center">
                      <service.icon size={24} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{service.title}</h2>
                  </div>
                  <p className="text-white/60 leading-relaxed mb-8">
                    {service.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-center gap-3 text-sm">
                        <Check size={18} className="text-white/60" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/booking"
                    data-testid={`service-${service.id}-cta`}
                    className="inline-flex items-center gap-2 text-sm tracking-wide hover:text-white/70 transition-colors"
                  >
                    Book This Service
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className={idx % 2 === 1 ? 'md:order-1' : ''}>
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Equipment */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">Our Equipment</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">DJI Professional Drones</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {equipment.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="border border-white/10 p-8"
              >
                <Drone size={32} className="mb-6 text-white/80" />
                <h3 className="text-xl font-bold mb-3">{item.name}</h3>
                <p className="text-sm text-white/60 mb-6">{item.description}</p>
                <div className="grid grid-cols-2 gap-2">
                  {item.specs.map((spec, sidx) => (
                    <div key={sidx} className="text-xs px-3 py-2 bg-white/5 border border-white/10">
                      {spec}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 md:py-32 bg-[#141414]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple Process</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Book Online', desc: 'Choose your package and schedule a convenient time' },
              { num: '02', title: 'Pre-Flight Call', desc: 'Quick call to discuss property details and shot list' },
              { num: '03', title: 'Shoot Day', desc: 'Our FAA-certified pilot captures stunning footage' },
              { num: '04', title: 'Delivery', desc: 'Receive edited photos and videos within 24-48 hours' }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <span className="text-6xl font-black text-white/10">{step.num}</span>
                <h3 className="text-lg font-bold mt-4 mb-2">{step.title}</h3>
                <p className="text-sm text-white/60">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-white text-black">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-black/60 mb-10">
              Book your drone photography session today and elevate your property listings.
            </p>
            <Link
              to="/booking"
              data-testid="services-cta-book"
              className="bg-black text-white px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-black/80 transition-colors inline-flex items-center justify-center gap-2"
            >
              Book Now
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
