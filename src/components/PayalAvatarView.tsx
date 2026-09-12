import React from 'react';
import { OrbVisualState } from '../types';
import payalBaseImg from '../assets/images/payal_real_video_girl_1789232781846.jpg';

interface PayalAvatarViewProps {
  state: OrbVisualState;
  amplitude: number; // 0 to 1
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const getPayalImage = (): string => payalBaseImg;

export const PayalAvatarView: React.FC<PayalAvatarViewProps> = ({
  state,
  amplitude,
  size = 280,
  className = '',
  onClick,
}) => {
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const normAmp = Math.min(Math.max(amplitude, 0), 1);

  return (
    <div
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center select-none cursor-pointer group ${className}`}
      title="पायल से बात करने के लिए टैप करें"
    >
      {/* Outer audio energy wave pulses when speaking or listening */}
      {isSpeaking && (
        <>
          <div
            className="absolute rounded-full border-2 border-sky-400/60 animate-ping pointer-events-none"
            style={{
              width: size * 1.08 + normAmp * 26,
              height: size * 1.08 + normAmp * 26,
              animationDuration: '1.1s',
            }}
          />
          <div
            className="absolute rounded-full bg-gradient-to-tr from-sky-500/35 via-blue-500/25 to-rose-400/25 blur-xl pointer-events-none transition-all duration-100"
            style={{
              width: size * 1.25 + normAmp * 38,
              height: size * 1.25 + normAmp * 38,
            }}
          />
        </>
      )}

      {isListening && (
        <>
          <div
            className="absolute rounded-full border-2 border-rose-500/80 animate-ping pointer-events-none"
            style={{
              width: size * 1.08 + normAmp * 22,
              height: size * 1.08 + normAmp * 22,
              animationDuration: '1.0s',
            }}
          />
          <div
            className="absolute rounded-full bg-rose-600/25 blur-xl pointer-events-none"
            style={{
              width: size * 1.18,
              height: size * 1.18,
            }}
          />
        </>
      )}

      {isThinking && (
        <div
          className="absolute rounded-full border-2 border-dashed border-amber-400/90 animate-spin pointer-events-none"
          style={{
            width: size * 1.08,
            height: size * 1.08,
            animationDuration: '2.4s',
          }}
        />
      )}

      {/* Dynamic Outer Glowing Frame */}
      <div
        className={`relative rounded-full p-1.5 transition-all duration-300 shadow-2xl ${
          isSpeaking
            ? 'bg-gradient-to-tr from-sky-500 via-blue-500 to-rose-400 shadow-blue-950/90 ring-4 ring-sky-400/50 scale-102'
            : isListening
            ? 'bg-gradient-to-tr from-rose-600 to-pink-600 shadow-rose-950/90 ring-4 ring-rose-500/50 animate-pulse'
            : isThinking
            ? 'bg-gradient-to-tr from-amber-500 to-orange-500 ring-2 ring-amber-400/40'
            : 'bg-gradient-to-tr from-sky-900/60 via-neutral-800 to-rose-900/50 hover:from-sky-500 hover:to-rose-500 ring-1 ring-white/15'
        }`}
      >
        {/* Animated Inner Container - Smooth natural floating and swaying movement only */}
        <div
          className="relative rounded-full overflow-hidden bg-black shadow-2xl transition-all duration-200 ease-out"
          style={{
            width: size - 14,
            height: size - 14,
            animation: isSpeaking
              ? 'avatarSpeakingSway 1.8s ease-in-out infinite'
              : 'avatarIdleFloat 4.5s ease-in-out infinite',
            transform: isSpeaking
              ? `scale(${1.01 + normAmp * 0.035})`
              : isListening
              ? 'scale(1.02) translateY(-2px)'
              : undefined,
          }}
        >
          {/* Simple, Pristine, Single Real Image of the Girl */}
          <img
            src={payalBaseImg}
            alt="Payal - AI Assistant"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center pointer-events-none select-none transition-transform duration-300"
          />

          {/* Natural subtle vignette and gentle lighting highlight */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Live Status Pill at bottom */}
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none">
          <div
            className={`px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-2xl border ${
              isSpeaking
                ? 'bg-sky-950/95 text-sky-200 border-sky-400 shadow-sky-950/90 animate-pulse ring-2 ring-sky-400/30'
                : isListening
                ? 'bg-rose-950/95 text-rose-200 border-rose-500 shadow-rose-950/90 ring-2 ring-rose-500/30'
                : isThinking
                ? 'bg-amber-950/95 text-amber-200 border-amber-500 shadow-amber-950/90'
                : 'bg-neutral-900/95 text-neutral-300 border-neutral-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSpeaking
                  ? 'bg-sky-400 animate-ping'
                  : isListening
                  ? 'bg-rose-400 animate-ping'
                  : isThinking
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-emerald-400'
              }`}
            />
            <span>
              {isSpeaking
                ? 'बोल रही हैं (Live)'
                : isListening
                ? 'सुन रही हैं...'
                : isThinking
                ? 'सोच रही हैं...'
                : 'PAYAL • LIVE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
