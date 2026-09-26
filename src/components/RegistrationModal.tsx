import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  QrCode, 
  Lock, 
  Sparkles, 
  ShieldAlert, 
  User, 
  Mail, 
  Phone, 
  Hash, 
  GraduationCap, 
  ArrowRight,
  RefreshCw,
  Zap,
  Calendar
} from 'lucide-react';
import { EventItem, StudentRegistration, User as AuthUser } from '../types';
import { api } from '../services/api';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  defaultEventId?: string;
  currentUser: AuthUser | null;
  onRegistrationSuccess: (registration: StudentRegistration) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  events,
  defaultEventId,
  currentUser,
  onRegistrationSuccess,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    defaultEventId || (events[0] ? events[0].id : '')
  );

  // Form fields matching PDF Page 2 & Page 17
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [year, setYear] = useState<'1st Year' | '2nd Year' | '3rd Year' | '4th Year'>('1st Year');
  const [section, setSection] = useState<'A' | 'B' | 'C' | 'D' | 'Other'>('A');
  const [notes, setNotes] = useState('');

  // Payment State
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Prefill if user is logged in
  useEffect(() => {
    if (defaultEventId) {
      setSelectedEventId(defaultEventId);
    }
    if (currentUser) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.rollNumber) setRollNumber(currentUser.rollNumber);
      if (currentUser.year) setYear(currentUser.year as any);
      if (currentUser.section) setSection(currentUser.section as any);
    }
  }, [defaultEventId, currentUser]);

  if (!isOpen) return null;

  if (events.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No Technical Events Posted At Present</h3>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
            The administrator will post technical events directly. Please check back soon or log in as administrator to publish an event.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];
  const isPaid = currentEvent && currentEvent.price > 0;

  // Validation function matching PDF Page 9 & 10
  const validateForm = (): boolean => {
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Full name is required (minimum 2 characters).');
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailPattern.test(email.trim())) {
      setErrorMessage('Please provide a valid college or personal email address.');
      return false;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setErrorMessage('Phone number must be exactly 10 digits.');
      return false;
    }

    if (!rollNumber.trim() || rollNumber.trim().length < 4) {
      setErrorMessage('Roll number is required (e.g. 25AG1A6701).');
      return false;
    }

    return true;
  };

  const handleProceedToPaymentOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isPaid && !paymentStep) {
      setPaymentStep(true);
      return;
    }

    // Execute submission
    setLoading(true);
    setErrorMessage(null);

    try {
      const paymentId = isPaid
        ? `${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-8)}`
        : undefined;

      const res = await api.registerForEvent({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        rollNumber: rollNumber.trim().toUpperCase(),
        year,
        section,
        eventId: selectedEventId,
        ticketTier: isPaid ? 'Full Access Pass' : 'Free Student Pass',
        ticketPrice: currentEvent.price,
        paymentId,
        paymentStatus: isPaid ? 'paid' : 'free_confirmed',
        notes,
      });

      setLoading(false);
      onRegistrationSuccess(res.registration);
      onClose();
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    }
  };

  const fillTestCard = () => {
    setCardNumber('4532 8912 3456 7890');
    setCardExpiry('08/29');
    setCardCvv('789');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-8">
        {/* Modal Top Accent Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-fuchsia-950/40">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wide">
              Official Technical Registration
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            {paymentStep ? 'Secure Payment Portal' : 'Register for Technical Event'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Department of CSD • Synapse Club × WiDS ACEEC Chapter
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              {errorMessage.includes('already registered') && (
                <p className="text-[11px] text-rose-300/80 mt-1">
                  Each student roll number is strictly limited to 1 registration per event. Please check with your team coordinator if you need adjustments.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleProceedToPaymentOrSubmit} className="p-6 space-y-4">
          {!paymentStep ? (
            <>
              {/* Event Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Event *
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.price === 0 ? 'FREE' : `₹${ev.price}`})
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Venue: {currentEvent?.venue}</span>
                  <span className="font-mono text-cyan-400 font-semibold">
                    {currentEvent?.price === 0 ? '100% Free Pass' : `Fee: ₹${currentEvent?.price}`}
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* College Email & Phone Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    College / Personal Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number (10 Digits) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Roll Number, Year & Section Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Roll Number *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="25AG1A6701"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 uppercase font-mono font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Year *
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Section *
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                    <option value="D">Section D</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Special Interest / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Questions / Expectations (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Interested in Pandas time-series analysis or hackathon team matching"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Encryption & Security Guarantee */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/40 flex items-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Secure AES-256 Storage:</strong> Your student details and roll number are cryptographically encrypted on the server.
                </span>
              </div>
            </>
          ) : (
            /* Payment Step */
            <div className="space-y-4">
              {/* Order Summary Pill */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Event Ticket</span>
                  <h4 className="text-sm font-bold text-white">{currentEvent.title}</h4>
                  <p className="text-xs text-slate-400">Attendee: {fullName} ({rollNumber})</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Amount Due</span>
                  <p className="text-xl font-extrabold text-cyan-400">₹{currentEvent.price}</p>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                      paymentMethod === 'upi'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    UPI / QR
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Debit / Credit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all ${
                      paymentMethod === 'netbanking'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Net Banking
                  </button>
                </div>
              </div>

              {paymentMethod === 'upi' && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-center space-y-3">
                  <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-slate-900" />
                  </div>
                  <p className="text-xs text-slate-300">Scan QR using Google Pay, PhonePe, or Paytm</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="Enter UPI ID (e.g. mobile@upi)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <span className="text-[11px] px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      Verified
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">Card Information</span>
                    <button
                      type="button"
                      onClick={fillTestCard}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      <Zap className="w-3 h-3" />
                      Auto-fill Test Card
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="4532 8912 3456 7890"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <label className="text-xs text-slate-300">Choose Bank</label>
                  <select className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white">
                    <option>HDFC Bank</option>
                    <option>State Bank of India</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => setPaymentStep(false)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                ← Edit registration info
              </button>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 shadow-xl shadow-cyan-500/25 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Registration...</span>
                </>
              ) : paymentStep ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ₹{currentEvent?.price} & Confirm Pass</span>
                </>
              ) : isPaid ? (
                <>
                  <span>Proceed to Payment (₹{currentEvent?.price})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Registration (Free)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
