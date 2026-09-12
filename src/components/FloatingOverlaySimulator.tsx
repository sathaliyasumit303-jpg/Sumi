import React, { useState, useRef } from 'react';
import { OrbVisualState } from '../types';
import { OrbCanvas } from './OrbCanvas';
import { Mic, Phone, MessageSquare, Volume2, X, Maximize2, Move } from 'lucide-react';

interface FloatingOverlaySimulatorProps {
  orbState: OrbVisualState;
  amplitude: number;
  lastTranscript?: string;
  onTapOrb: () => void;
  onCloseOverlay: () => void;
}

export const FloatingOverlaySimulator: React.FC<FloatingOverlaySimulatorProps> = ({
  orbState,
  amplitude,
  lastTranscript,
  onTapOrb,
  onCloseOverlay,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 20,
    posY: 120,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 120, dragStartRef.current.posX + dx)),
      y: Math.max(10, Math.min(window.innerHeight - 120, dragStartRef.current.posY + dy)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const dx = Math.abs(e.clientX - dragStartRef.current.startX);
    const dy = Math.abs(e.clientY - dragStartRef.current.startY);

    // If movement was less than 8px, consider it a tap! (matching PayalOverlayService.kt touch threshold)
    if (dx < 8 && dy < 8) {
      onTapOrb();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      id="payal-floating-overlay-root"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      className="fixed z-50 select-none touch-none"
    >
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative group cursor-grab active:cursor-grabbing"
      >
        {/* Glow halo */}
        <div className="absolute -inset-2 bg-gradient-to-r from-red-600/30 to-purple-600/30 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity" />

        {/* Mini Orb View */}
        <div className="relative w-20 h-20 bg-neutral-950/90 rounded-full border border-neutral-700/80 shadow-2xl flex items-center justify-center overflow-hidden backdrop-blur-md">
          <OrbCanvas
            state={orbState}
            amplitude={amplitude}
            size={76}
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded-full">
            <Move className="w-4 h-4 text-white/80" />
          </div>
        </div>

        {/* State Badge */}
        <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-[9px] font-mono font-semibold tracking-wider uppercase text-neutral-200">
          {orbState}
        </div>
      </div>

      {/* Expanded Quick Bubble */}
      {isExpanded && (
        <div className="absolute top-22 left-0 w-64 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-xs space-y-2 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
            <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              PAYAL Overlay
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {lastTranscript ? (
            <p className="text-neutral-300 text-[11px] leading-relaxed italic bg-neutral-950/60 p-2 rounded-lg border border-neutral-800">
              &quot;{lastTranscript}&quot;
            </p>
          ) : (
            <p className="text-neutral-400 text-[11px]">
              Tap and say <span className="text-red-400">&quot;Hey Payal&quot;</span> or give any command.
            </p>
          )}

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={onTapOrb}
              className="py-1 px-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 flex items-center justify-center gap-1 font-medium"
            >
              <Mic className="w-3 h-3" /> Voice
            </button>
            <button
              onClick={onCloseOverlay}
              className="py-1 px-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 flex items-center justify-center gap-1 font-medium"
            >
              <X className="w-3 h-3" /> Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
