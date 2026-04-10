import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Spinner, ArrowRight } from '@phosphor-icons/react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BookingSuccess() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('checking');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      const data = response.data;
      
      if (data.payment_status === 'paid') {
        setStatus('success');
        setPaymentData(data);
        return;
      } else if (data.status === 'expired') {
        setStatus('expired');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    }
  };

  return (
    <main data-testid="booking-success-page" className="pt-20 min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        {status === 'checking' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Spinner size={64} className="animate-spin mx-auto mb-6 text-white/60" />
            <h1 className="text-2xl font-bold mb-4">Processing Payment...</h1>
            <p className="text-white/60">Please wait while we confirm your payment.</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={48} weight="fill" className="text-green-500" />
            </div>
            <h1 className="text-3xl font-black mb-4">Booking Confirmed!</h1>
            <p className="text-white/60 mb-8">
              Thank you for your booking. We've sent a confirmation email with all the details.
              Our team will contact you within 24 hours to discuss your shoot.
            </p>
            
            <div className="border border-white/10 p-6 mb-8 text-left">
              <h3 className="font-bold mb-4">What's Next?</h3>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-start gap-3">
                  <span className="text-white">1.</span>
                  Check your email for booking confirmation
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white">2.</span>
                  Our pilot will call you to discuss shot requirements
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white">3.</span>
                  We'll arrive at your property at the scheduled time
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-white">4.</span>
                  Receive your edited photos & videos within 24-48 hours
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="border border-white/30 px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/10 transition-colors"
              >
                Back to Home
              </Link>
              <Link
                to="/dashboard"
                data-testid="go-to-dashboard"
                className="bg-white text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2"
              >
                View Dashboard
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}

        {(status === 'error' || status === 'expired' || status === 'timeout') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} weight="fill" className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black mb-4">
              {status === 'timeout' ? 'Payment Status Unknown' : 'Payment Failed'}
            </h1>
            <p className="text-white/60 mb-8">
              {status === 'timeout' 
                ? 'We couldn\'t confirm your payment status. Please check your email or contact us.'
                : 'Something went wrong with your payment. Please try again or contact us for assistance.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/booking"
                className="bg-white text-black px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/90 transition-colors"
              >
                Try Again
              </Link>
              <Link
                to="/contact"
                className="border border-white/30 px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-white/10 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
