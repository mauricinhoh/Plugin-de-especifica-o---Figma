import React, { useEffect, useRef } from "react";

/**
 * Confete da tela "Tagueamento pronto" (redesign 03/10/2026): uma explosão só,
 * saindo de trás do selo de check. Canvas 420×420 centralizado no selo,
 * ajustado ao devicePixelRatio. Com "reduzir movimento", desenha um quadro
 * parado. Só aparência.
 */

const SIZE = 420;
const COLORS = ["#E53935", "#FDD835", "#43A047", "#1E88E5"];
const FADE_START = 2500;
const FADE_END = 3300;
const STOP_AT = 3400;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  wob: number;
  vw: number;
  shape: 0 | 1 | 2;
  w: number;
  h: number;
  color: string;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeParticles(): Particle[] {
  const list: Particle[] = [];
  for (let i = 0; i < 90; i++) {
    const angle = -Math.PI / 2 + rand(-0.85, 0.85) * Math.PI;
    const speed = rand(3.5, 11);
    const shape = (i % 3) as 0 | 1 | 2;
    list.push({
      x: SIZE / 2,
      y: SIZE / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.175, 0.175),
      wob: rand(0, Math.PI * 2),
      vw: rand(0.08, 0.2),
      shape,
      w: shape === 1 ? rand(5, 10) : shape === 2 ? 3.2 : 0,
      h: shape === 1 ? rand(3, 6) : shape === 2 ? rand(10, 20) : rand(3, 5),
      color: COLORS[i % COLORS.length]
    });
  }
  return list;
}

function step(particles: Particle[]) {
  for (const p of particles) {
    p.vx *= 0.975;
    p.vy = p.vy * 0.975 + 0.17;
    p.x += p.vx + Math.sin(p.wob) * 0.4;
    p.y += p.vy;
    p.rot += p.vr;
    p.wob += p.vw;
  }
}

function draw(ctx: CanvasRenderingContext2D, particles: Particle[], alpha: number) {
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.globalAlpha = alpha;
  for (const p of particles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    if (p.shape === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, p.h * 0.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 1) {
      ctx.scale(1, Math.cos(p.wob));
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else {
      ctx.scale(Math.cos(p.wob), 1);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = SIZE * ratio;
    canvas.height = SIZE * ratio;
    ctx.scale(ratio, ratio);

    const particles = makeParticles();
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      for (let i = 0; i < 40; i++) step(particles);
      draw(ctx, particles, 1);
      return;
    }

    let frame = 0;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      if (elapsed >= STOP_AT || !ctx) {
        ctx?.clearRect(0, 0, SIZE, SIZE);
        return;
      }
      step(particles);
      const alpha = elapsed < FADE_START ? 1 : Math.max(0, 1 - (elapsed - FADE_START) / (FADE_END - FADE_START));
      draw(ctx, particles, alpha);
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="tag-confetti"
      aria-hidden="true"
      style={{ width: SIZE, height: SIZE, left: "50%", top: "50%", marginLeft: -SIZE / 2, marginTop: -SIZE / 2 }}
    />
  );
}
