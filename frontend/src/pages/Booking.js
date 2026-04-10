import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from '../components/ui/calendar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CalendarBlank, Clock, MapPin, Check } from '@phosphor-icons/react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const timeSlots = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const propertyTypes = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land/Development' },
  { value: 'construction', label: 'Construction' }
];

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(searchParams.get('package') || '');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    property_address: '',
    property_type: '',
    scheduled_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/packages`);
      setPackages(response.data);
      if (!selectedPackage && response.data.length > 0) {
        const popular = response.data.find(p => p.popular);
        setSelectedPackage(popular?.id || response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPackage || !selectedDate || !formData.scheduled_time) {
      toast.error('Please select a package, date, and time');
      return;
    }

    setSubmitting(true);

    try {
      // Create booking
      const bookingResponse = await axios.post(`${API}/bookings`, {
        ...formData,
        package_id: selectedPackage,
        property_type: formData.property_type,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_time: formData.scheduled_time
      });

      const bookingId = bookingResponse.data.id;

      // Create checkout session
      const checkoutResponse = await axios.post(`${API}/payments/checkout`, {
        booking_id: bookingId,
        origin_url: window.location.origin
      });

      // Redirect to Stripe
      window.location.href = checkoutResponse.data.url;
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
      setSubmitting(false);
    }
  };

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <main data-testid="booking-page" className="pt-20">
      {/* Hero */}
      <section className="py-16 md:py-24 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-4">Book Your Shoot</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-6">
              Schedule Your<br />Drone Session
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Select your package, pick a date, and complete your booking in minutes.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-[#141414] border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {[
              { num: 1, label: 'Package' },
              { num: 2, label: 'Details' },
              { num: 3, label: 'Payment' }
            ].map((s, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-white' : 'text-white/40'}`}>
                  <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${
                    step > s.num ? 'bg-white text-black' : step === s.num ? 'border-2 border-white' : 'border border-white/40'
                  }`}>
                    {step > s.num ? <Check size={16} /> : s.num}
                  </div>
                  <span className="text-sm hidden md:block">{s.label}</span>
                </div>
                {idx < 2 && <div className={`w-12 md:w-24 h-px ${step > s.num ? 'bg-white' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 md:py-24 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Package Selection */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold mb-8">Select Your Package</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      data-testid={`select-package-${pkg.id}`}
                      className={`cursor-pointer border p-6 transition-colors ${
                        selectedPackage === pkg.id 
                          ? 'border-white bg-white/5' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <h3 className="font-bold mb-2">{pkg.name}</h3>
                      <p className="text-2xl font-black mb-2">${pkg.price}</p>
                      <p className="text-sm text-white/60">{pkg.description}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedPackage}
                  data-testid="next-step-1"
                  className="bg-white text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left: Calendar & Time */}
                  <div>
                    <h2 className="text-2xl font-bold mb-8">Select Date & Time</h2>
                    
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarBlank size={20} className="text-white/60" />
                        <span className="text-sm text-white/60">Choose a date</span>
                      </div>
                      <div className="border border-white/10 p-4 inline-block bg-[#141414]">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={isDateDisabled}
                          className="rounded-none"
                          data-testid="booking-calendar"
                        />
                      </div>
                    </div>

                    {selectedDate && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Clock size={20} className="text-white/60" />
                          <span className="text-sm text-white/60">Choose a time</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setFormData({ ...formData, scheduled_time: time })}
                              data-testid={`time-slot-${time.replace(/\s/g, '-')}`}
                              className={`px-4 py-3 text-sm border transition-colors ${
                                formData.scheduled_time === time
                                  ? 'border-white bg-white text-black'
                                  : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Contact Info */}
                  <div>
                    <h2 className="text-2xl font-bold mb-8">Your Details</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          data-testid="input-name"
                          className="mt-2 bg-[#141414] border-white/20 focus:border-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          data-testid="input-email"
                          className="mt-2 bg-[#141414] border-white/20 focus:border-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                          data-testid="input-phone"
                          className="mt-2 bg-[#141414] border-white/20 focus:border-white"
                        />
                      </div>

                      <div>
                        <Label htmlFor="property_address">Property Address</Label>
                        <Input
                          id="property_address"
                          name="property_address"
                          value={formData.property_address}
                          onChange={handleInputChange}
                          required
                          data-testid="input-address"
                          className="mt-2 bg-[#141414] border-white/20 focus:border-white"
                        />
                      </div>

                      <div>
                        <Label>Property Type</Label>
                        <Select 
                          value={formData.property_type}
                          onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                        >
                          <SelectTrigger data-testid="select-property-type" className="mt-2 bg-[#141414] border-white/20">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-white/20">
                            {propertyTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="notes">Special Instructions (Optional)</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          rows={3}
                          data-testid="input-notes"
                          className="mt-2 bg-[#141414] border-white/20 focus:border-white"
                          placeholder="Any specific shots, access codes, or requests..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-12">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="border border-white/30 px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !formData.scheduled_time || !formData.name || !formData.email || !formData.phone || !formData.property_address || !formData.property_type}
                    data-testid="next-step-2"
                    className="bg-white text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    Review & Pay
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review & Payment */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold mb-8">Review Your Booking</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <div className="border border-white/10 p-6">
                      <h3 className="font-bold mb-4">Booking Details</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">Package</span>
                          <span>{selectedPkg?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Date</span>
                          <span>{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Time</span>
                          <span>{formData.scheduled_time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Property Type</span>
                          <span className="capitalize">{formData.property_type}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-white/10 p-6">
                      <h3 className="font-bold mb-4">Contact Information</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/60">Name</span>
                          <span>{formData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Email</span>
                          <span>{formData.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Phone</span>
                          <span>{formData.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-white/10 p-6">
                      <h3 className="font-bold mb-4 flex items-center gap-2">
                        <MapPin size={18} />
                        Property Address
                      </h3>
                      <p className="text-sm">{formData.property_address}</p>
                    </div>
                  </div>

                  <div>
                    <div className="border border-white/10 p-6 bg-[#141414]">
                      <h3 className="font-bold mb-6">Order Summary</h3>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between">
                          <span>{selectedPkg?.name}</span>
                          <span>${selectedPkg?.price}</span>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>${selectedPkg?.price}</span>
                        </div>
                      </div>

                      <p className="text-xs text-white/40 mt-4">
                        You'll be redirected to Stripe for secure payment.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 mt-12">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="border border-white/30 px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/10 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    data-testid="submit-booking"
                    className="bg-white text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? 'Processing...' : `Pay $${selectedPkg?.price}`}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
