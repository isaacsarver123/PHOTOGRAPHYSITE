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
import { CalendarBlank, Clock, MapPin, Check, Info } from '@phosphor-icons/react';
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

const serviceAreas = [
  { value: 'central_alberta', label: 'Central Alberta (Red Deer & Area) - No travel fee' },
  { value: 'edmonton', label: 'Edmonton & Area (+$80 CAD travel fee)' },
  { value: 'calgary', label: 'Calgary & Area (+$80 CAD travel fee)' },
  { value: 'other', label: 'Other Location (arranged via request)' }
];

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(searchParams.get('package') || '');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    property_address: '',
    property_type: '',
    service_area: 'central_alberta',
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
      const response = await axios.post(`${API}/bookings`, {
        ...formData,
        package_id: selectedPackage,
        property_type: formData.property_type,
        service_area: formData.service_area,
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        scheduled_time: formData.scheduled_time
      });

      setSubmitted(true);
      toast.success('Booking request submitted!');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to submit booking request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (submitted) {
    return (
      <main data-testid="booking-page" className="pt-20 min-h-screen bg-[#0A0A0A]">
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 bg-[#d4af37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check size={48} weight="bold" className="text-[#d4af37]" />
            </div>
            <h1 className="text-3xl font-black mb-4">Request Submitted!</h1>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              Thank you for your booking request. We'll review your request and get back to you within 24 hours 
              with confirmation and a payment link.
            </p>
            
            <div className="border border-white/10 p-6 bg-[#141414] text-left mb-8">
              <h3 className="font-bold mb-4">What's Next?</h3>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] font-bold">1.</span>
                  We'll review your request and check availability
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] font-bold">2.</span>
                  You'll receive an email with confirmation and payment link
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] font-bold">3.</span>
                  Complete payment to confirm your booking
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#d4af37] font-bold">4.</span>
                  We'll arrive on the scheduled date for your shoot
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setStep(1);
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    property_address: '',
                    property_type: '',
                    service_area: 'central_alberta',
                    scheduled_time: '',
                    notes: ''
                  });
                  setSelectedDate(null);
                }}
                className="border border-white/30 px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/10 transition-colors"
              >
                Submit Another Request
              </button>
              <a
                href="/"
                className="bg-[#d4af37] text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors inline-flex items-center justify-center"
              >
                Back to Home
              </a>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

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
            <p className="text-xs tracking-[0.2em] uppercase text-[#d4af37] mb-4">Request a Booking</p>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-6">
              Schedule Your<br />Drone Session
            </h1>
            <p className="text-lg text-white/60 leading-relaxed">
              Submit your booking request and we'll confirm availability within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Info Banner */}
      <section className="bg-[#d4af37]/10 border-y border-[#d4af37]/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center gap-3 text-sm">
            <Info size={20} className="text-[#d4af37]" />
            <span className="text-white/80">
              <strong>How it works:</strong> Submit your request → We review & confirm → You pay → We shoot!
            </span>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-[#141414] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {[
              { num: 1, label: 'Package' },
              { num: 2, label: 'Details' },
              { num: 3, label: 'Review' }
            ].map((s, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-white' : 'text-white/40'}`}>
                  <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${
                    step > s.num ? 'bg-[#d4af37] text-black' : step === s.num ? 'border-2 border-[#d4af37]' : 'border border-white/40'
                  }`}>
                    {step > s.num ? <Check size={16} /> : s.num}
                  </div>
                  <span className="text-sm hidden md:block">{s.label}</span>
                </div>
                {idx < 2 && <div className={`w-12 md:w-24 h-px ${step > s.num ? 'bg-[#d4af37]' : 'bg-white/20'}`} />}
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
                          ? 'border-[#d4af37] bg-[#d4af37]/10' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {pkg.popular && (
                        <span className="text-xs bg-[#d4af37] text-black px-2 py-1 mb-2 inline-block">POPULAR</span>
                      )}
                      <h3 className="font-bold mb-2">{pkg.name}</h3>
                      <p className="text-2xl font-black mb-2">${pkg.price} <span className="text-sm font-normal text-white/60">CAD</span></p>
                      <p className="text-sm text-white/60">{pkg.description}</p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedPackage}
                  data-testid="next-step-1"
                  className="bg-[#d4af37] text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50"
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
                        <CalendarBlank size={20} className="text-[#d4af37]" />
                        <span className="text-sm text-white/60">Choose your preferred date</span>
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
                          <Clock size={20} className="text-[#d4af37]" />
                          <span className="text-sm text-white/60">Choose your preferred time</span>
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
                                  ? 'border-[#d4af37] bg-[#d4af37] text-black'
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
                          className="mt-2 bg-[#141414] border-white/20 focus:border-[#d4af37]"
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
                          className="mt-2 bg-[#141414] border-white/20 focus:border-[#d4af37]"
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
                          className="mt-2 bg-[#141414] border-white/20 focus:border-[#d4af37]"
                        />
                      </div>

                      <div>
                        <Label>Service Area</Label>
                        <Select 
                          value={formData.service_area}
                          onValueChange={(value) => setFormData({ ...formData, service_area: value })}
                        >
                          <SelectTrigger data-testid="select-service-area" className="mt-2 bg-[#141414] border-white/20">
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-white/20">
                            {serviceAreas.map((area) => (
                              <SelectItem key={area.value} value={area.value}>
                                {area.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          className="mt-2 bg-[#141414] border-white/20 focus:border-[#d4af37]"
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
                          className="mt-2 bg-[#141414] border-white/20 focus:border-[#d4af37]"
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
                    className="bg-[#d4af37] text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50"
                  >
                    Review Request
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h2 className="text-2xl font-bold mb-8">Review Your Request</h2>
                
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
                          <span className="text-white/60">Requested Date</span>
                          <span>{selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Requested Time</span>
                          <span>{formData.scheduled_time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Service Area</span>
                          <span className="capitalize">{formData.service_area}</span>
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
                    <div className="border border-[#d4af37]/30 p-6 bg-[#141414]">
                      <h3 className="font-bold mb-6">Request Summary</h3>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between">
                          <span>{selectedPkg?.name}</span>
                          <span>${selectedPkg?.price} CAD</span>
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4 mt-4">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Estimated Total</span>
                          <span className="text-[#d4af37]">${selectedPkg?.price} CAD</span>
                        </div>
                      </div>

                      <div className="mt-6 p-4 bg-[#d4af37]/10 border border-[#d4af37]/30">
                        <p className="text-sm text-white/80">
                          <strong>Note:</strong> This is a booking request. You'll receive a payment link via email once we confirm availability. Final pricing may vary based on specific requirements.
                        </p>
                      </div>
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
                    className="bg-[#d4af37] text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-[#c4a030] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
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
