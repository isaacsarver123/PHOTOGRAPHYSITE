import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Certificate, Drone, Users, Target, ArrowRight, Star } from '@phosphor-icons/react';

const pilotImage = "/about-pilot.png";
const droneImage = "/about-equipment.jpeg";
const teamImage = "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80";

export default function About() {
  return (
    <main data-testid="about-page" className="pt-20">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">About SkyLine Media</p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-6">
                Elevating Real Estate<br />Photography Since 2019
              </h1>
              <p className="text-lg text-white/60 leading-relaxed mb-8">
                Founded by passionate drone enthusiasts and real estate professionals, 
                SkyLine Media delivers stunning aerial imagery that helps 
                properties sell faster and for more.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-black">500+</p>
                  <p className="text-sm text-white/60">Properties</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center">
                  <p className="text-4xl font-black">50+</p>
                  <p className="text-sm text-white/60">Agents</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div className="text-center">
                  <p className="text-4xl font-black">5</p>
                  <p className="text-sm text-white/60">Years</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <img
                src={pilotImage}
                alt="Drone pilot operating equipment"
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white text-black p-6">
                <Certificate size={32} weight="fill" className="mb-2" />
                <p className="text-xs uppercase tracking-wider font-medium">Transport Canada</p>
                <p className="text-xs text-black/60">Licensed & Insured</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 md:py-32 bg-white text-black">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Target size={48} className="mb-6" />
              <h2 className="text-3xl font-bold tracking-tight mb-4">Our Mission</h2>
              <p className="text-black/60 leading-relaxed">
                To provide real estate professionals with breathtaking aerial 
                photography that captures the true essence and potential of every 
                property, helping sellers achieve the best possible outcomes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Star size={48} className="mb-6" />
              <h2 className="text-3xl font-bold tracking-tight mb-4">Our Promise</h2>
              <p className="text-black/60 leading-relaxed">
                Every shoot is handled with professionalism, creativity, and attention 
                to detail. We're not satisfied until you have imagery that makes your 
                listings stand out from the competition.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 md:py-32 bg-[#141414]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">Why Choose Us</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">The SkyLine Media Difference</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Certificate,
                title: 'Transport Canada Certified',
                description: 'All our pilots hold Transport Canada Advanced Operations certificates and maintain full liability insurance.'
              },
              {
                icon: Drone,
                title: 'Premium Equipment',
                description: 'We use only the latest DJI and FPV drones including the Mavic 3 Pro, Air 3, Avata 2, and Pavo 20 Pro for indoor flights.'
              },
              {
                icon: Users,
                title: 'Local Expertise',
                description: 'Based in Central Alberta, we know the area intimately and understand what makes Alberta properties special.'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="border border-white/10 p-8"
              >
                <item.icon size={40} className="mb-6 text-white/80" />
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipment */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <img
                src={droneImage}
                alt="DJI Professional Drone"
                className="w-full aspect-square object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">Our Equipment</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Powered by DJI
              </h2>
              <p className="text-white/60 leading-relaxed mb-8">
                We invest in the best equipment because your listings deserve nothing less. 
                Our fleet of DJI professional drones delivers stunning 4K video and high-resolution 
                photography that captures every detail of your property.
              </p>

              <div className="space-y-4">
                {[
                  { name: 'DJI Mavic 3 Pro', specs: '20MP / 5.1K Video / 46min flight' },
                  { name: 'DJI Air 3', specs: '48MP / 4K/100fps / Dual Camera' },
                  { name: 'DJI Avata 2', specs: '12MP / 4K/60fps / 155° FOV' },
                  { name: 'BetaFPV Pavo 20 Pro', specs: '4K Camera / Indoor FPV' }
                ].map((drone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-white/10">
                    <span className="font-medium">{drone.name}</span>
                    <span className="text-sm text-white/60">{drone.specs}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-24 md:py-32 bg-[#141414]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">Service Areas</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Where We Fly</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'Red Deer', 'Lacombe', 'Sylvan Lake', 'Blackfalds',
              'Ponoka', 'Innisfail', 'Olds', 'Penhold',
              'Edmonton (+$80)', 'Calgary (+$80)', 'Stettler', 'Rocky Mountain House'
            ].map((city, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="border border-white/10 p-4 text-center"
              >
                <span className="text-sm">{city}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-white/60 mt-8 text-sm">
            Serving Central Alberta & Red Deer Area • Edmonton & Calgary: +$80 CAD travel fee
          </p>
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
              Ready to Work Together?
            </h2>
            <p className="text-black/60 mb-10">
              Let's capture your property from a perspective that sells.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                data-testid="about-cta-book"
                className="bg-black text-white px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-black/80 transition-colors inline-flex items-center justify-center gap-2"
              >
                Book Now
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="border border-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-black/5 transition-colors inline-flex items-center justify-center"
              >
                Get in Touch
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
