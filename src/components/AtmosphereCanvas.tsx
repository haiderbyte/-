import React, { useEffect, useRef, useState, useCallback } from 'react';

export type AtmosphereMode = 'autumn' | 'dust' | 'both' | 'off';
export type AtmosphereDensity = 'gentle' | 'normal' | 'vivid';

interface AtmosphereCanvasProps {
  mode: AtmosphereMode;
  density?: AtmosphereDensity;
  theme: 'dark' | 'sepia';
  interactive?: boolean;
}

interface LeafParticle {
  type: 'maple' | 'ginkgo' | 'willow';
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotSpeed: number;
  flipAngle: number;
  flipSpeed: number;
  opacity: number;
  color: string;
  veinColor: string;
  swingPhase: number;
  swingSpeed: number;
  swingAmp: number;
}

interface DustParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  baseOpacity: number;
  pulseSpeed: number;
  pulsePhase: number;
  color: string;
}

export const AtmosphereCanvas: React.FC<AtmosphereCanvasProps> = ({
  mode,
  density = 'normal',
  theme,
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const mousePos = useRef<{ x: number; y: number; vx: number; vy: number; active: boolean }>({
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    active: false,
  });

  // Autumn leaf color palettes according to theme
  const getLeafColors = useCallback(() => {
    if (theme === 'dark') {
      return [
        { main: 'rgba(155, 45, 45, 0.72)', vein: 'rgba(215, 100, 100, 0.4)' }, // Crimson maple (Momiji)
        { main: 'rgba(184, 80, 40, 0.70)', vein: 'rgba(235, 140, 90, 0.4)' },  // Burnt autumn orange
        { main: 'rgba(160, 110, 45, 0.65)', vein: 'rgba(215, 170, 90, 0.35)' }, // Golden amber ginkgo
        { main: 'rgba(125, 55, 65, 0.68)', vein: 'rgba(190, 110, 125, 0.35)' }, // Dark plum/withered red
        { main: 'rgba(110, 75, 55, 0.60)', vein: 'rgba(165, 130, 110, 0.3)' },  // Dry cedar leaf
      ];
    }
    // Sepia theme
    return [
      { main: 'rgba(145, 55, 50, 0.68)', vein: 'rgba(185, 90, 80, 0.35)' },
      { main: 'rgba(170, 85, 45, 0.65)', vein: 'rgba(210, 125, 80, 0.35)' },
      { main: 'rgba(155, 115, 50, 0.60)', vein: 'rgba(195, 160, 90, 0.35)' },
      { main: 'rgba(105, 65, 45, 0.58)', vein: 'rgba(150, 110, 85, 0.3)' },
      { main: 'rgba(135, 75, 70, 0.62)', vein: 'rgba(180, 120, 110, 0.3)' },
    ];
  }, [theme]);

  // Dust color palettes according to theme
  const getDustColors = useCallback(() => {
    if (theme === 'dark') {
      return [
        'rgba(235, 215, 185, ', // warm paper moth dust
        'rgba(195, 140, 140, ', // faint crimson dusk ember
        'rgba(215, 190, 150, ', // amber glow
      ];
    }
    return [
      'rgba(120, 95, 75, ',   // sepia dust mote
      'rgba(165, 85, 75, ',   // warm terra cotta speck
      'rgba(100, 80, 65, ',   // ink shadow mote
    ];
  }, [theme]);

  useEffect(() => {
    if (mode === 'off') {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Counts based on density
    const countMultiplier = density === 'gentle' ? 0.5 : density === 'vivid' ? 1.6 : 1.0;
    const leafCount =
      mode === 'autumn' || mode === 'both'
        ? Math.max(8, Math.round((width < 640 ? 14 : 24) * countMultiplier))
        : 0;
    const dustCount =
      mode === 'dust' || mode === 'both'
        ? Math.max(20, Math.round((width < 640 ? 35 : 65) * countMultiplier))
        : 0;

    const leafPalettes = getLeafColors();
    const dustBases = getDustColors();

    // Initialize Leaves
    const leaves: LeafParticle[] = [];
    const leafTypes: ('maple' | 'ginkgo' | 'willow')[] = ['maple', 'ginkgo', 'willow'];

    for (let i = 0; i < leafCount; i++) {
      const palette = leafPalettes[Math.floor(Math.random() * leafPalettes.length)];
      leaves.push({
        type: leafTypes[Math.floor(Math.random() * leafTypes.length)],
        x: Math.random() * width,
        y: Math.random() * height * 1.2 - height * 0.2,
        size: Math.random() * 11 + 12, // 12px to 23px
        speedY: Math.random() * 0.8 + 0.5, // gentle float downward
        speedX: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        flipAngle: Math.random() * Math.PI * 2,
        flipSpeed: Math.random() * 0.025 + 0.01,
        opacity: Math.random() * 0.35 + 0.45,
        color: palette.main,
        veinColor: palette.vein,
        swingPhase: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.02 + 0.012,
        swingAmp: Math.random() * 1.5 + 0.8,
      });
    }

    // Initialize Dust Motes
    const dust: DustParticle[] = [];
    for (let i = 0; i < dustCount; i++) {
      const baseColor = dustBases[Math.floor(Math.random() * dustBases.length)];
      const baseOpacity = Math.random() * 0.35 + 0.15;
      dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.2 + 1.2,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.25 - 0.15, // gentle slow drift upwards/floating
        opacity: baseOpacity,
        baseOpacity,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        pulsePhase: Math.random() * Math.PI * 2,
        color: baseColor,
      });
    }

    // Helper: Draw Japanese Maple Leaf (Momiji 🍁)
    const drawMapleLeaf = (
      c: CanvasRenderingContext2D,
      size: number,
      color: string,
      veinColor: string
    ) => {
      c.save();
      c.fillStyle = color;
      c.strokeStyle = veinColor;
      c.lineWidth = 0.8;

      c.beginPath();
      // Draw 5-pointed classic Japanese momiji leaf silhouette
      c.moveTo(0, -size); // Top point
      c.quadraticCurveTo(size * 0.22, -size * 0.65, size * 0.4, -size * 0.7);
      c.lineTo(size * 0.85, -size * 0.4); // Right-upper lobe
      c.quadraticCurveTo(size * 0.45, -size * 0.2, size * 0.55, -size * 0.05);
      c.lineTo(size * 0.75, size * 0.25); // Right-lower lobe
      c.quadraticCurveTo(size * 0.3, size * 0.25, size * 0.15, size * 0.5);
      c.lineTo(0, size * 0.85); // Stem origin
      // Symmetrical left side
      c.lineTo(-size * 0.15, size * 0.5);
      c.quadraticCurveTo(-size * 0.3, size * 0.25, -size * 0.75, size * 0.25);
      c.lineTo(-size * 0.55, -size * 0.05);
      c.quadraticCurveTo(-size * 0.45, -size * 0.2, -size * 0.85, -size * 0.4);
      c.lineTo(-size * 0.4, -size * 0.7);
      c.quadraticCurveTo(-size * 0.22, -size * 0.65, 0, -size);
      c.closePath();
      c.fill();

      // Delicate veins
      c.beginPath();
      c.moveTo(0, size * 0.85);
      c.lineTo(0, -size * 0.7);
      c.moveTo(0, size * 0.3);
      c.lineTo(size * 0.55, -size * 0.2);
      c.moveTo(0, size * 0.3);
      c.lineTo(-size * 0.55, -size * 0.2);
      c.moveTo(0, size * 0.5);
      c.lineTo(size * 0.45, size * 0.2);
      c.moveTo(0, size * 0.5);
      c.lineTo(-size * 0.45, size * 0.2);
      c.stroke();

      // Leaf stem
      c.beginPath();
      c.moveTo(0, size * 0.85);
      c.quadraticCurveTo(size * 0.1, size * 1.1, size * 0.15, size * 1.25);
      c.stroke();

      c.restore();
    };

    // Helper: Draw Ginkgo Leaf (Fan leaf 🍂)
    const drawGinkgoLeaf = (
      c: CanvasRenderingContext2D,
      size: number,
      color: string,
      veinColor: string
    ) => {
      c.save();
      c.fillStyle = color;
      c.strokeStyle = veinColor;
      c.lineWidth = 0.8;

      c.beginPath();
      c.moveTo(0, size * 0.9); // Stem top
      c.quadraticCurveTo(size * 0.5, size * 0.3, size * 0.9, -size * 0.1);
      // Fan wavy top with slight central notch
      c.bezierCurveTo(size * 0.8, -size * 0.7, size * 0.2, -size * 0.9, 0, -size * 0.65);
      c.bezierCurveTo(-size * 0.2, -size * 0.9, -size * 0.8, -size * 0.7, -size * 0.9, -size * 0.1);
      c.quadraticCurveTo(-size * 0.5, size * 0.3, 0, size * 0.9);
      c.closePath();
      c.fill();

      // Delicate fan veins
      c.beginPath();
      for (let angle = -0.55; angle <= 0.55; angle += 0.22) {
        c.moveTo(0, size * 0.8);
        const vx = Math.sin(angle) * size * 0.75;
        const vy = -Math.cos(angle) * size * 0.6;
        c.lineTo(vx, vy);
      }
      c.stroke();

      // Stem
      c.beginPath();
      c.moveTo(0, size * 0.9);
      c.quadraticCurveTo(size * 0.1, size * 1.2, size * 0.05, size * 1.4);
      c.stroke();

      c.restore();
    };

    // Helper: Draw Willow / Classic Withered Oval Leaf
    const drawWillowLeaf = (
      c: CanvasRenderingContext2D,
      size: number,
      color: string,
      veinColor: string
    ) => {
      c.save();
      c.fillStyle = color;
      c.strokeStyle = veinColor;
      c.lineWidth = 0.8;

      c.beginPath();
      c.moveTo(0, -size);
      c.quadraticCurveTo(size * 0.45, -size * 0.2, 0, size);
      c.quadraticCurveTo(-size * 0.45, -size * 0.2, 0, -size);
      c.closePath();
      c.fill();

      // Central vein
      c.beginPath();
      c.moveTo(0, -size * 0.8);
      c.lineTo(0, size * 1.1);
      c.stroke();

      c.restore();
    };

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      const mx = mousePos.current.x;
      const my = mousePos.current.y;
      const mActive = mousePos.current.active;

      // 1. Render Dust Particles
      if (dust.length > 0) {
        for (let i = 0; i < dust.length; i++) {
          const p = dust[i];

          // Gentle movement
          p.x += p.speedX + Math.sin(tick * 0.01 + p.pulsePhase) * 0.25;
          p.y += p.speedY;

          // Mouse breeze influence
          if (mActive) {
            const dx = p.x - mx;
            const dy = p.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100 && dist > 0) {
              const force = (100 - dist) / 100;
              p.x += (dx / dist) * force * 1.2;
              p.y += (dy / dist) * force * 1.2;
            }
          }

          // Pulsing opacity
          const curOpacity =
            p.baseOpacity + Math.sin(tick * p.pulseSpeed + p.pulsePhase) * 0.15;

          // Wrap edges
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
          if (p.y < -10) p.y = height + 10;
          if (p.y > height + 10) p.y = -10;

          // Draw dust mote with subtle glow
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${Math.max(0.04, curOpacity)})`;
          ctx.shadowColor = `${p.color}0.4)`;
          ctx.shadowBlur = p.size * 2;
          ctx.fill();
          ctx.restore();
        }
      }

      // 2. Render Autumn Leaves
      if (leaves.length > 0) {
        for (let i = 0; i < leaves.length; i++) {
          const leaf = leaves[i];

          // Horizontal swaying
          const sway = Math.sin(tick * leaf.swingSpeed + leaf.swingPhase) * leaf.swingAmp;
          leaf.x += leaf.speedX + sway;
          leaf.y += leaf.speedY;

          // Rotation & 3D tumbling flip
          leaf.rotation += leaf.rotSpeed;
          leaf.flipAngle += leaf.flipSpeed;
          const scaleY = Math.cos(leaf.flipAngle); // creates 3D flip effect

          // Mouse breeze on leaves
          if (mActive) {
            const dx = leaf.x - mx;
            const dy = leaf.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120 && dist > 0) {
              const force = (120 - dist) / 120;
              leaf.x += (dx / dist) * force * 2.2;
              leaf.y += (dy / dist) * force * 1.5;
              leaf.rotSpeed += (Math.random() - 0.5) * 0.01;
            }
          }

          // Wrap around bottom
          if (leaf.y > height + leaf.size * 2) {
            leaf.y = -leaf.size * 2;
            leaf.x = Math.random() * width;
          }
          if (leaf.x < -leaf.size * 2) leaf.x = width + leaf.size * 2;
          if (leaf.x > width + leaf.size * 2) leaf.x = -leaf.size * 2;

          // Draw leaf with transformations
          ctx.save();
          ctx.translate(leaf.x, leaf.y);
          ctx.rotate(leaf.rotation);
          ctx.scale(1, Math.max(0.12, Math.abs(scaleY)));
          ctx.globalAlpha = leaf.opacity;

          if (leaf.type === 'maple') {
            drawMapleLeaf(ctx, leaf.size, leaf.color, leaf.veinColor);
          } else if (leaf.type === 'ginkgo') {
            drawGinkgoLeaf(ctx, leaf.size, leaf.color, leaf.veinColor);
          } else {
            drawWillowLeaf(ctx, leaf.size, leaf.color, leaf.veinColor);
          }

          ctx.restore();
        }
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    animFrameId.current = requestAnimationFrame(render);

    // Mouse & Touch movement tracking for interactive atmospheric breeze
    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      mousePos.current.active = true;
    };

    const handleMouseLeave = () => {
      mousePos.current.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      mousePos.current.x = e.touches[0].clientX;
      mousePos.current.y = e.touches[0].clientY;
      mousePos.current.active = true;
    };

    const handleTouchEnd = () => {
      mousePos.current.active = false;
    };

    // Pause on tab hidden to preserve 100% device battery & performance
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      } else {
        animFrameId.current = requestAnimationFrame(render);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [mode, density, theme, interactive, getLeafColors, getDustColors]);

  if (mode === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full opacity-90 transition-opacity duration-700"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    />
  );
};
