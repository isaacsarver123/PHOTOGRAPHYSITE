import { useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Phone, EnvelopeSimple, MapPin, Clock, CheckCircle } from '@phosphor-icons/react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const serviceTypes = [
  { value: 'residential', label: 'Residential Real Estate' },
  { value: 'commercial', label: 'Commercial Property' },
  { value: 'land', label: 'Land/Development' },
  { value: 'construction', label: 'Construction Progress' },
  { value: 'other', label: 'Other' }
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    property_address: '',
    service_type: '',
    message: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API}/contact`, formData);
      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Contact error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main data-testid="contact-page" className="pt-20">
      {/* Hero */}
      <section className="py-24 md:py-32 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">Get in Touch</p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-6">
                Contact Us
              </h1>
              <p className="text-lg text-white/60 leading-relaxed mb-12">
                Have questions about our services or need a custom quote? 
                Fill out the form and we'll get back to you within 24 hours.
              </p>

              {/* Contact Info */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Phone size={24} />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Phone</p>
                    <a href="tel:+18259623425" className="text-white/60 hover:text-white transition-colors">
                      (825) 962-3425
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center flex-shrink-0">
                    <EnvelopeSimple size={24} />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Email</p>
                    <a href="mailto:info@skylinemedia.net" className="text-white/60 hover:text-white transition-colors">
                      info@skylinemedia.net
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Service Area</p>
                    <p className="text-white/60">Central Alberta (Red Deer & Area)<br />Edmonton & Calgary: +$80 CAD travel fee</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Business Hours</p>
                    <p className="text-white/60">Mon-Sat: 7am - 7pm<br />Sun: By appointment</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {submitted ? (
                <div className="border border-white/10 p-12 bg-[#141414] text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} weight="fill" className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Message Sent!</h2>
                  <p className="text-white/60 mb-8">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        property_address: '',
                        service_type: '',
                        message: ''
                      });
                    }}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="border border-white/10 p-8 bg-[#141414]">
                  <h2 className="text-xl font-bold mb-8">Request a Quote</h2>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          data-testid="contact-name"
                          className="mt-2 bg-[#0A0A0A] border-white/20 focus:border-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          data-testid="contact-email"
                          className="mt-2 bg-[#0A0A0A] border-white/20 focus:border-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          data-testid="contact-phone"
                          className="mt-2 bg-[#0A0A0A] border-white/20 focus:border-white"
                        />
                      </div>
                      <div>
                        <Label>Service Type *</Label>
                        <Select 
                          value={formData.service_type}
                          onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                          required
                        >
                          <SelectTrigger data-testid="contact-service-type" className="mt-2 bg-[#0A0A0A] border-white/20">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-white/20">
                            {serviceTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="property_address">Property Address</Label>
                      <Input
                        id="property_address"
                        name="property_address"
                        value={formData.property_address}
                        onChange={handleInputChange}
                        data-testid="contact-address"
                        className="mt-2 bg-[#0A0A0A] border-white/20 focus:border-white"
                        placeholder="Where is the property located?"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        data-testid="contact-message"
                        className="mt-2 bg-[#0A0A0A] border-white/20 focus:border-white"
                        placeholder="Tell us about your project..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      data-testid="contact-submit"
                      className="w-full bg-white text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
