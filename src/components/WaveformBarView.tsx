import React, { useEffect, useRef } from 'react';

interface WaveformBarViewProps {
  amplitude: number; // 0..1
  width?: number;
  height?: number;
  className?: string;
}

export const WaveformBarView: React.FC<WaveformBarViewProps> = ({
  amplitude,
  width = 200,
  height = 40,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const barCount = 20;
  const barHeightsRef = useRef<Float32Array>(new Float32Array(barCount).fill(0.12));
  const targetHeightsRef = useRef<Float32Array>(new Float32Array(barCount).fill(0.12));

  // Update targets when amplitude changes
  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, amplitude));
    const targets = targetHeightsRef.current;
    for (let i = 0; i < barCount; i++) {
      // Bell-curve shape across bars
      const factor = Math.sin((i / (barCount - 1)) * Math.PI);
      // Add slight organic variation
      const noise = Math.sin(Date.now() * 0.01 + i * 0.6) * 0.15;
      targets[i] = Math.max(0.08, Math.min(1.0, 0.12 + (clamped * factor * 0.85 + Math.abs(noise) * clamped * 0.2)));
    }
  }, [amplitude]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const barWidth = (width / barCount) * 0.65;
      const space = (width / barCount) * 0.35;
      const currentHeights = barHeightsRef.current;
      const targetHeights = targetHeightsRef.current;

      for (let i = 0; i < barCount; i++) {
        // Exact Lerp: barHeights[i] += (target - current) * 0.3f
        currentHeights[i] += (targetHeights[i] - currentHeights[i]) * 0.3;
        const curH = Math.max(4, currentHeights[i] * height);
        const x = i * (barWidth + space) + space / 2;
        const yTop = (height - curH) / 2;
        const yBottom = yTop + curH;

        // Alpha varying by height (150..255)
        const alpha = Math.min(1.0, Math.max(0.58, 0.58 + currentHeights[i] * 0.42));
        ctx.fillStyle = `rgba(255, 23, 68, ${alpha})`;

        const r = barWidth / 2;
        ctx.beginPath();
        ctx.roundRect(x, yTop, barWidth, curH, r);
        ctx.fill();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      id="payal-waveform-view"
      style={{ width, height }}
      className={`block ${className}`}
    />
  );
};
