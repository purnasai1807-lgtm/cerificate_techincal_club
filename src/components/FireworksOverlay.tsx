import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, X, Volume2, VolumeX, Flame } from 'lucide-react';

export interface CelebrationInfo {
  id: string;
  eventId?: string;
  eventTitle: string;
  message?: string;
  adminName?: string;
  triggeredAt?: number;
  durationMs?: number;
}

interface FireworksOverlayProps {
  celebration: CelebrationInfo | null;
  onDismiss: () => void;
}

// Sound effects using Web Audio API (safe, no external files required)
class CelebrationSound {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 220, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio autoplay policy handled silently
    }
  }

  playChime() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const now = this.ctx!.currentTime + i * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch {
      // Audio autoplay policy handled silently
    }
  }
}

const soundManager = new CelebrationSound();

export const FireworksOverlay: React.FC<FireworksOverlayProps> = ({
  celebration,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundActive, setSoundActive] = useState(true);
  const [fireworkWaves, setFireworkWaves] = useState(1);

  // Toggle sound
  const handleToggleSound = () => {
    soundManager.enabled = !soundActive;
    setSoundActive(!soundActive);
  };

  // Trigger immediate confetti burst
  const triggerConfettiWave = () => {
    soundManager.playPop();
    // Burst from both corners + middle
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { x: 0.15, y: 0.7 },
      colors: ['#06b6d4', '#8b5cf6', '#d946ef', '#10b981', '#f59e0b'],
      zIndex: 99999,
    });
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { x: 0.85, y: 0.7 },
      colors: ['#06b6d4', '#8b5cf6', '#d946ef', '#10b981', '#f59e0b'],
      zIndex: 99999,
    });
    confetti({
      particleCount: 90,
      spread: 120,
      origin: { x: 0.5, y: 0.4 },
      colors: ['#ffffff', '#f43f5e', '#38bdf8', '#fbbf24', '#a855f7'],
      zIndex: 99999,
    });
  };

  useEffect(() => {
    if (!celebration) return;

    soundManager.playChime();

    // 1. Launch initial grand salute with canvas-confetti
    triggerConfettiWave();

    // 2. Periodic confetti burst intervals
    const confettiInterval = setInterval(() => {
      const randomX = Math.random() * 0.8 + 0.1;
      const randomY = Math.random() * 0.4 + 0.15;
      confetti({
        particleCount: 45,
        spread: 360,
        startVelocity: 35,
        ticks: 70,
        origin: { x: randomX, y: randomY },
        colors: ['#22d3ee', '#c084fc', '#f472b6', '#34d399', '#facc15', '#f87171'],
        zIndex: 99999,
      });
      soundManager.playPop();
    }, 450);

    // 3. Canvas particle engine for rising rockets & exploding stars
    const canvas = canvasRef.current;
    if (!canvas) return () => clearInterval(confettiInterval);

    const ctx = canvas.getContext('2d');
    if (!ctx) return () => clearInterval(confettiInterval);

    let animationFrameId: number;
    let isRunning = true;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Rocket {
      x: number;
      y: number;
      targetY: number;
      speed: number;
      color: string;
      trail: { x: number; y: number }[];
    }

    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      decay: number;
      size: number;
    }

    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];
    const colorPalette = ['#00f5d4', '#7b2cbf', '#ff007f', '#fee440', '#00bbf9', '#ff5400', '#f15bb5'];

    const spawnRocket = () => {
      if (!canvas) return;
      rockets.push({
        x: Math.random() * (canvas.width - 200) + 100,
        y: canvas.height,
        targetY: Math.random() * (canvas.height * 0.5) + canvas.height * 0.1,
        speed: Math.random() * 5 + 9,
        color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
        trail: [],
      });
    };

    const explode = (x: number, y: number, color: string) => {
      const count = Math.floor(Math.random() * 35) + 45;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 1.5;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          decay: Math.random() * 0.015 + 0.012,
          size: Math.random() * 2.5 + 1.5,
        });
      }
    };

    // Initial rockets
    for (let i = 0; i < 3; i++) {
      spawnRocket();
    }

    let lastRocketTime = Date.now();

    const loop = () => {
      if (!isRunning || !ctx || !canvas) return;

      // Dark translucent clearing for trail motion blur
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      const now = Date.now();
      if (now - lastRocketTime > 550) {
        spawnRocket();
        lastRocketTime = now;
      }

      // Update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();

        r.y -= r.speed;

        // Draw trail
        ctx.beginPath();
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 2.5;
        for (let j = 0; j < r.trail.length; j++) {
          const pt = r.trail[j];
          if (j === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        if (r.y <= r.targetY) {
          explode(r.x, r.y, r.color);
          soundManager.playPop();
          rockets.splice(i, 1);
        }
      }

      // Update sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.07; // gravity
        s.vx *= 0.98;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fillStyle = s.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      isRunning = false;
      clearInterval(confettiInterval);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [celebration, fireworkWaves]);

  if (!celebration) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden select-none">
      {/* Full screen canvas for fireworks physics */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Floating Celebratory Top HUD Banner */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-full max-w-xl px-4 pointer-events-auto transition-all animate-bounce-short">
        <div className="relative rounded-3xl bg-slate-900/95 border-2 border-fuchsia-500/80 p-4 sm:p-5 shadow-2xl shadow-fuchsia-500/30 backdrop-blur-xl">
          {/* Glowing accent border pulse */}
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-amber-500 opacity-30 blur-sm -z-10 animate-pulse" />

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/40 shrink-0">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                    <span>Live Website Celebration</span>
                  </span>
                  {celebration.adminName && (
                    <span className="text-[11px] text-cyan-300 font-mono hidden sm:inline">
                      by {celebration.adminName}
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5 leading-snug">
                  🎉 {celebration.eventTitle} 🎉
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mt-0.5">
                  {celebration.message || 'Technical Event Milestone Achieved! The entire community is celebrating!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleToggleSound}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
                title={soundActive ? 'Mute Celebration Sound' : 'Enable Celebration Sound'}
              >
                {soundActive ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={onDismiss}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors"
                title="Dismiss Fireworks"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              🎆 Fireworks active across website
            </span>

            <button
              onClick={() => {
                setFireworkWaves((prev) => prev + 1);
                triggerConfettiWave();
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 shadow-md shadow-fuchsia-500/25 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch More Fireworks!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
