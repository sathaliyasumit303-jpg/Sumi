import React, { useEffect, useRef } from 'react';
import { OrbVisualState } from '../types';

interface OrbCanvasProps {
  state: OrbVisualState;
  amplitude: number; // 0 to 1
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const OrbCanvas: React.FC<OrbCanvasProps> = ({
  state,
  amplitude,
  size = 260,
  className = '',
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation values state references
  const animRef = useRef<{
    pulseTime: number;
    rotationAngle: number;
    waveOffset: number;
    thinkingAngle: number;
    smoothedAmplitude: number;
  }>({
    pulseTime: 0,
    rotationAngle: 0,
    waveOffset: 0,
    thinkingAngle: 0,
    smoothedAmplitude: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      const stateValues = animRef.current;
      stateValues.pulseTime += 0.035;
      stateValues.rotationAngle = (stateValues.rotationAngle + 0.8) % 360;
      stateValues.waveOffset += 0.08;
      stateValues.thinkingAngle = (stateValues.thinkingAngle + 4) % 360;
      // Smooth amplitude lerp
      stateValues.smoothedAmplitude += (amplitude - stateValues.smoothedAmplitude) * 0.25;

      const dpr = window.devicePixelRatio || 1;
      const width = size;
      const height = size;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const pulseScale = 1.0 + Math.sin(stateValues.pulseTime) * 0.08;
      const baseRadius = (Math.min(width, height) / 2) * 0.42;
      const currentRadius = baseRadius * pulseScale;
      const glowAlpha = Math.min(0.85, Math.max(0.35, 0.45 + (pulseScale - 1.0) * 2.5));

      // Determine colors by state
      let c1 = '#B71C1C';
      let c2 = '#880E4F';

      if (state === 'listening' || state === 'active') {
        c1 = '#FF1744';
        c2 = '#D500F9';
      } else if (state === 'speaking') {
        c1 = '#E040FB';
        c2 = '#FF1744';
      } else if (state === 'thinking') {
        c1 = '#40C4FF';
        c2 = '#00B0FF';
      }

      const amp = stateValues.smoothedAmplitude;

      // ==========================================
      // Layer 1: Radial Glow (1.6x radius)
      // ==========================================
      const glowGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, currentRadius * 1.65);
      glowGrad.addColorStop(0, c1);
      glowGrad.addColorStop(0.65, c2);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.globalAlpha = glowAlpha;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius * 1.65, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // Layer 2: Core Orb (Sphere illusion)
      // ==========================================
      const coreGrad = ctx.createRadialGradient(
        cx - currentRadius * 0.28,
        cy - currentRadius * 0.28,
        0,
        cx,
        cy,
        currentRadius
      );
      coreGrad.addColorStop(0, c1);
      coreGrad.addColorStop(0.72, c2);
      coreGrad.addColorStop(1, '#050505');
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
      ctx.fill();

      // ==========================================
      // Layer 3: 3 Rotating Rings (dashed arcs)
      // ==========================================
      ctx.save();
      ctx.strokeStyle = c1;
      ctx.lineWidth = 2.4;
      for (let i = 1; i <= 3; i++) {
        const ringRadius = currentRadius * (1.12 + i * 0.16 + amp * 0.22);
        const direction = i % 2 === 0 ? 1 : -1;
        const ringAngle = ((stateValues.rotationAngle * direction + i * 45) * Math.PI) / 180;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ringAngle);
        ctx.setLineDash([14, 10]);
        ctx.globalAlpha = 0.4 + i * 0.18;
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // ==========================================
      // Layer 4: Wave Rings (Sine wave, amplitude-reactive)
      // ==========================================
      ctx.save();
      ctx.strokeStyle = c2;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = Math.min(1.0, 0.55 + amp * 0.45);
      ctx.beginPath();
      const waveBaseR = currentRadius * 1.28;
      for (let a = 0; a <= 360; a += 5) {
        const rad = (a * Math.PI) / 180;
        const offset = Math.sin(rad * 6 + stateValues.waveOffset) * (6 + amp * 26);
        const r = waveBaseR + offset;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // ==========================================
      // Layer 5: Thinking Arc (Only in Thinking state)
      // ==========================================
      if (state === 'thinking') {
        ctx.save();
        ctx.strokeStyle = '#00E5FF';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.95;
        const tRad = (stateValues.thinkingAngle * Math.PI) / 180;
        const thinkR = currentRadius * 1.4;

        ctx.beginPath();
        ctx.arc(cx, cy, thinkR, tRad, tRad + 1.6);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, thinkR, tRad + Math.PI, tRad + Math.PI + 1.0);
        ctx.stroke();
        ctx.restore();
      }

      // ==========================================
      // Layer 6: 12 Orbiting Particles (Active/Speaking/Listening)
      // ==========================================
      if (state === 'active' || state === 'speaking' || state === 'listening') {
        ctx.save();
        for (let p = 0; p < 12; p++) {
          const pAngle = ((stateValues.rotationAngle * 2 + p * 30) * Math.PI) / 180;
          const orbitR =
            currentRadius *
            (1.36 + 0.12 * Math.sin(p + stateValues.waveOffset) + amp * 0.15);
          const px = cx + orbitR * Math.cos(pAngle);
          const py = cy + orbitR * Math.sin(pAngle);

          ctx.fillStyle = '#FFFFFF';
          ctx.globalAlpha = Math.min(1.0, 0.6 + 0.4 * Math.sin(pAngle));
          ctx.beginPath();
          ctx.arc(px, py, 2.5 + amp * 3.0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ==========================================
      // Layer 7: Inner Highlight (Top-left Specular)
      // ==========================================
      const specGrad = ctx.createRadialGradient(
        cx - currentRadius * 0.35,
        cy - currentRadius * 0.35,
        0,
        cx - currentRadius * 0.35,
        cy - currentRadius * 0.35,
        currentRadius * 0.52
      );
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      specGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(
        cx - currentRadius * 0.35,
        cy - currentRadius * 0.35,
        currentRadius * 0.52,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();
      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [state, amplitude, size]);

  return (
    <canvas
      ref={canvasRef}
      id="payal-orb-canvas"
      style={{ width: size, height: size }}
      className={`cursor-pointer transition-transform duration-200 active:scale-95 ${className}`}
      onClick={onClick}
    />
  );
};
