import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle2, 
  Download, 
  Share2, 
  Calendar, 
  Printer, 
  Copy, 
  Check, 
  QrCode, 
  ExternalLink,
  Sparkles,
  Award,
  Linkedin,
  Twitter,
  MessageCircle,
  Send,
  PartyPopper,
  Trophy
} from 'lucide-react';
import { StudentRegistration } from '../types';

interface RegistrationSuccessModalProps {
  registration: StudentRegistration | null;
  onClose: () => void;
  onOpenPortal?: () => void;
}

export const RegistrationSuccessModal: React.FC<RegistrationSuccessModalProps> = ({
  registration,
  onClose,
  onOpenPortal,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharedPlatform, setSharedPlatform] = useState<string | null>(null);
  const [celebrationCount, setCelebrationCount] = useState(0);

  // Trigger festive confetti cannon sequence
  const launchConfetti = () => {
    // Corner Cannon 1 (Left)
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 65,
      origin: { x: 0.1, y: 0.8 },
      colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
      zIndex: 99999,
    });

    // Corner Cannon 2 (Right)
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 65,
      origin: { x: 0.9, y: 0.8 },
      colors: ['#06b6d4', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'],
      zIndex: 99999,
    });

    // Center starburst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        shapes: ['circle', 'square'],
        colors: ['#38bdf8', '#c084fc', '#f472b6', '#fbbf24'],
        zIndex: 99999,
      });
    }, 250);

    setCelebrationCount((c) => c + 1);
  };

  // Automatically trigger celebratory confetti on mount
  useEffect(() => {
    if (registration) {
      launchConfetti();
      // Gentle chime using Web Audio API
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const now = ctx.currentTime + idx * 0.09;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
          });
        }
      } catch {
        // Audio policy ignore
      }
    }
  }, [registration?.id]);

  if (!registration) return null;

  const shareTitle = `I just registered for ${registration.eventTitle} with Synapse Club × WiDS ACEEC!`;
  const shareText = `Excited to attend ${registration.eventTitle}! My Registration ID is ${registration.registrationId}. Connect with me at ACE Engineering College. #WiDS #SynapseClub #ACEEC #DataScience`;
  const appUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${shareText}\n${appUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(url, '_blank');
    setSharedPlatform('Twitter');
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}&summary=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    setSharedPlatform('LinkedIn');
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${appUrl}`)}`;
    window.open(url, '_blank');
    setSharedPlatform('WhatsApp');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
    setSharedPlatform('Telegram');
  };

  const handlePrint = () => {
    window.print();
  };

  // Google Calendar Link
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    registration.eventTitle
  )}&dates=20260917T040000Z/20260918T110000Z&details=${encodeURIComponent(
    `Registration ID: ${registration.registrationId}\nAttendee: ${registration.fullName}\nRoll Number: ${registration.rollNumber}`
  )}&location=${encodeURIComponent('ACE Engineering College, CSD Lab 4')}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden my-6">
        {/* Header Accent */}
        <div className="p-6 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-cyan-950/50 border-b border-slate-800 text-center relative overflow-hidden">
          {/* Subtle animated celebratory background glows */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none animate-pulse" />

          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lottie-Style Animated Celebratory Badge */}
          <div className="relative w-20 h-20 mx-auto mb-3 flex items-center justify-center">
            {/* Pulsing Concentric Rings */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-60" />
            <div className="absolute -inset-2 rounded-full border border-cyan-400/40 animate-spin" style={{ animationDuration: '8s' }} />
            <div className="absolute -inset-1 rounded-full border border-dashed border-emerald-400/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '12s' }} />

            {/* Glowing Trophy / Badge Centerpiece */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-0.5 shadow-xl shadow-emerald-500/30">
              <div className="w-full h-full rounded-[14px] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-emerald-300 animate-bounce" />
              </div>
            </div>

            {/* Orbiting Sparkles */}
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-cyan-300 absolute -bottom-1 -left-1 animate-pulse" />
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
              Confirmed & Verified
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Registration Successful!
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            You are officially registered for the WiDS ACEEC × Synapse Club event.
          </p>

          {/* Celebratory Interactive Confetti Trigger Pill */}
          <div className="mt-3.5 flex items-center justify-center">
            <button
              onClick={launchConfetti}
              className="px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Click to blast more celebratory confetti!"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Blast Confetti! 🎉</span>
              {celebrationCount > 1 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-950 text-[10px] font-mono text-emerald-400">
                  ×{celebrationCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Digital Ticket Pass Card */}
        <div className="p-6 space-y-5">
          <div className="relative p-5 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-slate-700/80 shadow-inner">
            {/* Cutout notch visuals */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0b0f17] border-r border-slate-700" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0b0f17] border-l border-slate-700" />

            <div className="flex items-start justify-between gap-4 border-b border-dashed border-slate-700 pb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                  Official Attendee Pass
                </span>
                <h4 className="text-base font-bold text-white leading-snug">
                  {registration.eventTitle}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  ACE Engineering College • CSD Department
                </p>
              </div>
              <div className="p-2 rounded-xl bg-white text-slate-900 shrink-0">
                <QrCode className="w-12 h-12" />
              </div>
            </div>

            {/* Registration ID Banner (As emphasized on PDF Page 3) */}
            <div className="my-3.5 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Unique Registration ID
                </span>
                <span className="text-lg font-mono font-extrabold text-cyan-300 tracking-wider">
                  {registration.registrationId}
                </span>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Student Name</span>
                <span className="font-bold text-slate-200 truncate block">{registration.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Roll Number</span>
                <span className="font-mono font-bold text-cyan-400">{registration.rollNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Year & Sec</span>
                <span className="text-slate-200 font-medium">{registration.year} ({registration.section})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Pass Tier</span>
                <span className="font-mono text-emerald-400 font-semibold">{registration.ticketTier}</span>
              </div>
            </div>
          </div>

          {/* Social Sharing Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                Share Your Participation
              </span>
              <span className="text-[11px] text-slate-400">Let your peers know!</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleShareLinkedIn}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-[#0077b5]/20 hover:text-[#0077b5] text-slate-300 border border-slate-700 hover:border-[#0077b5]/50 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-[#0077b5]" />
                <span className="text-[10px]">LinkedIn</span>
              </button>

              <button
                onClick={handleShareTwitter}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-sky-500/20 hover:text-sky-400 text-slate-300 border border-slate-700 hover:border-sky-500/50 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
              >
                <Twitter className="w-4 h-4 text-sky-400" />
                <span className="text-[10px]">Twitter / X</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 border border-slate-700 hover:border-emerald-500/50 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px]">WhatsApp</span>
              </button>

              <button
                onClick={handleShareTelegram}
                className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-300 border border-slate-700 hover:border-cyan-500/50 text-xs font-medium flex flex-col items-center gap-1 transition-colors"
              >
                <Send className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px]">Telegram</span>
              </button>
            </div>
          </div>

          {/* Quick Action Utilities */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add to Google Cal</span>
            </a>

            <button
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          {/* Dismiss Button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              Done & Return to Events
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
