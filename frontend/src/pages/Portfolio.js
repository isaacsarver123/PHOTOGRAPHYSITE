import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ArrowRight, MapPin } from '@phosphor-icons/react';
import axios from 'axios';
import BeforeAfterSlider from '../components/BeforeAfterSlider';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { id: 'all', name: 'All' },
  { id: 'residential', name: 'Residential' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'land', name: 'Land' },
  { id: 'construction', name: 'Construction' }
];

export default function Portfolio() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await axios.get(`${API}/portfolio`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      // Fallback data
      setItems([
        {
          id: '1',
          title: 'Modern Lakefront Estate',
          description: 'Stunning aerial views showcasing waterfront property with private dock',
          category: 'residential',
          image_url: 'https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=1200',
          before_image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
          after_image_url: 'https://images.unsplash.com/photo-1606586243531-92e25ac0c0aa?w=800',
          location: 'Lake Austin, TX'
        },
        {
          id: '2',
          title: 'Downtown Commercial Complex',
          description: 'Multi-story commercial building aerial photography for marketing',
          category: 'commercial',
          image_url: 'https://images.unsplash.com/photo-1669003153246-cb591207e66e?w=1200',
          location: 'Austin, TX'
        },
        {
          id: '3',
          title: 'Luxury Suburban Home',
          description: 'Beautiful aerial shots highlighting landscaping and pool',
          category: 'residential',
          image_url: 'https://images.unsplash.com/photo-1641441371947-47dd2f4a4276?w=1200',
          before_image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
          after_image_url: 'https://images.unsplash.com/photo-1641441371947-47dd2f4a4276?w=800',
          location: 'Westlake Hills, TX'
        },
        {
          id: '4',
          title: 'Agricultural Land Survey',
          description: 'Comprehensive aerial mapping for 500-acre ranch property',
          category: 'land',
          image_url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200',
          location: 'Hill Country, TX'
        },
        {
          id: '5',
          title: 'New Development Progress',
          description: 'Construction progress documentation for residential development',
          category: 'construction',
          image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200',
          location: 'Round Rock, TX'
        },
        {
          id: '6',
          title: 'Twilight Property Showcase',
          description: 'Premium twilight aerial photography for luxury listing',
          category: 'residential',
          image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
          location: 'Barton Creek, TX'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.category === selectedCategory);

  return (
    <main data-testid="portfolio-page" className="pt-20">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">Our Work</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-6">
              Portfolio
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Browse our collection of aerial photography projects showcasing 
              residential, commercial, and land properties across Texas.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filter */}
      <section className="bg-[#141414] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex flex-wrap gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                data-testid={`filter-${cat.id}`}
                className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                  selectedCategory === cat.id 
                    ? 'bg-white text-black' 
                    : 'border border-white/20 text-white/60 hover:text-white hover:border-white/40'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 md:py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="aspect-[4/3] bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                    data-testid={`portfolio-item-${item.id}`}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden border border-white/10">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-xs uppercase tracking-wider text-white/60 mb-1">{item.category}</p>
                        <h3 className="font-bold">{item.title}</h3>
                        <div className="flex items-center gap-1 mt-2 text-sm text-white/60">
                          <MapPin size={14} />
                          {item.location}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full bg-[#141414] border border-white/10"
              onClick={(e) => e.stopPropagation()}
              data-testid="portfolio-modal"
            >
              <button
                onClick={() => setSelectedItem(null)}
                data-testid="modal-close"
                className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-[4/3] md:aspect-auto md:h-full">
                  {selectedItem.before_image_url && selectedItem.after_image_url ? (
                    <BeforeAfterSlider
                      beforeImage={selectedItem.before_image_url}
                      afterImage={selectedItem.after_image_url}
                      className="h-full"
                    />
                  ) : (
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-8">
                  <p className="text-xs uppercase tracking-wider text-white/60 mb-2">{selectedItem.category}</p>
                  <h2 className="text-2xl font-bold mb-4">{selectedItem.title}</h2>
                  <div className="flex items-center gap-2 text-white/60 mb-6">
                    <MapPin size={18} />
                    {selectedItem.location}
                  </div>
                  <p className="text-white/60 leading-relaxed mb-8">
                    {selectedItem.description}
                  </p>
                  {selectedItem.before_image_url && (
                    <p className="text-sm text-white/40 mb-8">
                      Use the slider to compare before and after color grading
                    </p>
                  )}
                  <Link
                    to="/booking"
                    onClick={() => setSelectedItem(null)}
                    className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors"
                  >
                    Book Similar Shoot
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-white text-black">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tighter mb-6">
              Want Your Property<br />In Our Portfolio?
            </h2>
            <p className="text-black/60 mb-10">
              Join hundreds of satisfied clients who have elevated their listings with SkyView.
            </p>
            <Link
              to="/booking"
              data-testid="portfolio-cta"
              className="bg-black text-white px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-black/80 transition-colors inline-flex items-center justify-center gap-2"
            >
              Book Your Shoot
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
