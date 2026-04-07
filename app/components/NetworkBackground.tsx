'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

interface Bubble {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  targetAlpha: number;
}

export default function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const stateRef = useRef({
    bubbles: [] as Bubble[],
    width: 0,
    height: 0,
    mouse: { x: -1000, y: -1000 },
    animationFrame: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const config = {
      bubbleCount: 50,
      minRadius: 20,
      maxRadius: 100,
      baseSpeed: 0.2,
      colors:
        theme === 'dark-orange'
          ? ['255, 76, 51', '255, 178, 51', '255, 51, 76'] // Dark theme RGB
          : ['59, 130, 246', '96, 165, 250', '147, 197, 253'], // Light theme RGB
    };

    const resize = () => {
      // Use window dimensions for fixed background
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stateRef.current.width = width;
      stateRef.current.height = height;
      initBubbles(width, height);
    };

    const initBubbles = (width: number, height: number) => {
      const bubbles: Bubble[] = [];
      const count = Math.floor((width * height) / 40000); // Responsive count - fewer bubbles

      for (let i = 0; i < count; i++) {
        bubbles.push(createBubble(width, height));
      }
      stateRef.current.bubbles = bubbles;
    };

    const createBubble = (width: number, height: number): Bubble => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius:
          config.minRadius +
          Math.random() * (config.maxRadius - config.minRadius),
        vx: (Math.random() - 0.5) * config.baseSpeed,
        vy: (Math.random() - 0.5) * config.baseSpeed,
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        alpha: 0,
        targetAlpha: 0.15 + Math.random() * 0.1, // Deeper color
      };
    };

    const animate = () => {
      ctx.clearRect(0, 0, stateRef.current.width, stateRef.current.height);

      const bubbles = stateRef.current.bubbles;
      const mouse = stateRef.current.mouse;

      bubbles.forEach(b => {
        // Move
        b.x += b.vx;
        b.y += b.vy;

        // Fade in
        if (b.alpha < b.targetAlpha) {
          b.alpha += 0.002;
        }

        // Wrap around edges
        if (b.x < -b.radius) b.x = stateRef.current.width + b.radius;
        if (b.x > stateRef.current.width + b.radius) b.x = -b.radius;
        if (b.y < -b.radius) b.y = stateRef.current.height + b.radius;
        if (b.y > stateRef.current.height + b.radius) b.y = -b.radius;

        // Mouse interaction (repulsion)
        const dx = mouse.x - b.x;
        const dy = mouse.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 300;

        if (dist < interactionRadius) {
          const force = (interactionRadius - dist) / interactionRadius;
          const angle = Math.atan2(dy, dx);
          b.vx -= Math.cos(angle) * force * 0.05;
          b.vy -= Math.sin(angle) * force * 0.05;
        }

        // Limit speed
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        const maxSpeed = config.baseSpeed * 3;
        if (speed > maxSpeed) {
          b.vx = (b.vx / speed) * maxSpeed;
          b.vy = (b.vy / speed) * maxSpeed;
        } else if (speed < config.baseSpeed) {
          // Gently accelerate back to base speed if too slow
          b.vx *= 1.01;
          b.vy *= 1.01;
        }

        // Draw bubble (Bokeh effect)
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

        // Create radial gradient for soft look
        const gradient = ctx.createRadialGradient(
          b.x,
          b.y,
          0,
          b.x,
          b.y,
          b.radius
        );
        gradient.addColorStop(0, `rgba(${b.color}, ${b.alpha})`);
        gradient.addColorStop(1, `rgba(${b.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.fill();
      });

      stateRef.current.animationFrame = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      stateRef.current.mouse.x = e.clientX;
      stateRef.current.mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      stateRef.current.mouse.x = -1000;
      stateRef.current.mouse.y = -1000;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    resize();
    animate();

    const currentAnimation = stateRef.current.animationFrame;

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(currentAnimation);
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
