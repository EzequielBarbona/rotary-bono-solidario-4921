"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Cantidad total de figuras a dibujar. */
  total: number;
  /** Cuantas de esas figuras van coloreadas (el resto queda en gris). */
  filled: number;
  colorFilled?: string;
  colorEmpty?: string;
  className?: string;
};

function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  const headR = size * 0.16;
  const cx = x + size / 2;

  ctx.beginPath();
  ctx.arc(cx, y + headR, headR, 0, Math.PI * 2);
  ctx.fill();

  const bodyW = size * 0.6;
  const bodyH = size * 0.56;
  const bodyTop = y + headR * 2 + size * 0.05;

  ctx.beginPath();
  ctx.roundRect(cx - bodyW / 2, bodyTop, bodyW, bodyH, bodyW * 0.3);
  ctx.fill();
}

export function PersonPictogram({
  total,
  filled,
  colorFilled = "#f7a81b",
  colorEmpty = "#d8dbe0",
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || total <= 0) return;

    function render() {
      const containerWidth = container!.clientWidth;
      if (containerWidth === 0) return;

      const iconSize = total > 1200 ? 6 : total > 250 ? 10 : 18;
      const gap = iconSize <= 8 ? 1.5 : 3;
      const cols = Math.max(1, Math.floor((containerWidth + gap) / (iconSize + gap)));
      const rows = Math.ceil(total / cols);

      const dpr = window.devicePixelRatio || 1;
      const cssWidth = cols * (iconSize + gap) - gap;
      const cssHeight = rows * (iconSize + gap) - gap;

      canvas!.width = cssWidth * dpr;
      canvas!.height = cssHeight * dpr;
      canvas!.style.width = `${cssWidth}px`;
      canvas!.style.height = `${cssHeight}px`;

      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      for (let i = 0; i < total; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * (iconSize + gap);
        const y = row * (iconSize + gap);
        drawPerson(ctx, x, y, iconSize, i < filled ? colorFilled : colorEmpty);
      }
    }

    render();
    const observer = new ResizeObserver(() => render());
    observer.observe(container);
    return () => observer.disconnect();
  }, [total, filled, colorFilled, colorEmpty]);

  if (total <= 0) return null;

  return (
    <div ref={containerRef} aria-hidden className={className}>
      <canvas ref={canvasRef} />
    </div>
  );
}
