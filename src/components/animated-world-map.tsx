"use client";

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Dot {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  pulseDelay: number;
}

export function AnimatedWorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    // Generate random dots representing room locations
    const numDots = 50;
    const newDots: Dot[] = [];
    
    for (let i = 0; i < numDots; i++) {
      newDots.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        radius: Math.random() * 80 + 40, // Radius representation
        opacity: Math.random() * 0.5 + 0.4,
        pulseDelay: Math.random() * 3000
      });
    }
    
    dotsRef.current = newDots;

    // Animation
    let startTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Draw grid pattern (subtle)
      ctx.strokeStyle = 'rgba(100, 149, 237, 0.03)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x < canvas.offsetWidth; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.offsetHeight);
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.offsetHeight; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.offsetWidth, y);
        ctx.stroke();
      }

      // Draw connections between nearby dots
      const dots = dotsRef.current;
      dots.forEach((dot1, i) => {
        dots.slice(i + 1).forEach(dot2 => {
          const dx = dot2.x - dot1.x;
          const dy = dot2.y - dot1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            const opacity = (1 - distance / 200) * 0.2;
            ctx.strokeStyle = `rgba(147, 51, 234, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(dot1.x, dot1.y);
            ctx.lineTo(dot2.x, dot2.y);
            ctx.stroke();
          }
        });
      });

      // Draw dots with pulsing radius circles
      dots.forEach((dot) => {
        const pulsePhase = ((elapsed + dot.pulseDelay) % 3000) / 3000;
        const pulseScale = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.3;

        // Draw radius circle (pulsing)
        ctx.strokeStyle = `rgba(59, 130, 246, ${dot.opacity * 0.3 * (1 - pulsePhase)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius * pulseScale, 0, Math.PI * 2);
        ctx.stroke();

        // Draw smaller inner circle
        ctx.strokeStyle = `rgba(147, 51, 234, ${dot.opacity * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Draw center dot (glowing)
        const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, 8);
        gradient.addColorStop(0, `rgba(96, 165, 250, ${dot.opacity})`);
        gradient.addColorStop(0.5, `rgba(147, 51, 234, ${dot.opacity * 0.6})`);
        gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 8 * pulseScale, 0, Math.PI * 2);
        ctx.fill();

        // Core dot
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.opacity * 0.9})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Legend - Hidden on very small screens, compact on mobile */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="hidden xs:block absolute bottom-2 left-2 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 lg:bottom-8 lg:left-8 bg-slate-950/95 backdrop-blur-xl border border-slate-800/50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-6 space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4 shadow-2xl max-w-[180px] sm:max-w-[220px] md:max-w-xs"
      >
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 mb-1 sm:mb-2 md:mb-3 lg:mb-4">
          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-white truncate">Discovery</h3>
        </div>
        
        <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-3">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center flex-shrink-0">
              <div className="absolute w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border border-blue-500/40 animate-ping" />
              <div className="absolute w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border border-blue-500/60" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white truncate">Room Location</p>
              <p className="text-[8px] sm:text-[10px] md:text-xs text-slate-400 truncate">Active nearby</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center flex-shrink-0">
              <div className="absolute w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full border-2 border-purple-500/20" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white truncate">Redius</p>
              <p className="text-[8px] sm:text-[10px] md:text-xs text-slate-400 truncate">50-200m range</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3">
            <div className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" viewBox="0 0 40 40">
                <line x1="10" y1="20" x2="30" y2="20" stroke="rgba(147, 51, 234, 0.3)" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-white truncate">Connections</p>
              <p className="text-[8px] sm:text-[10px] md:text-xs text-slate-400 truncate">Linked rooms</p>
            </div>
          </div>
        </div>

        <div className="hidden sm:block pt-2 md:pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] md:text-xs">
            <span className="text-slate-400">Active</span>
            <span className="text-blue-400 font-semibold">50+</span>
          </div>
          <div className="flex items-center justify-between text-[10px] md:text-xs mt-0.5 md:mt-1">
            <span className="text-slate-400">Cities</span>
            <span className="text-purple-400 font-semibold">15</span>
          </div>
        </div>
      </motion.div>

      {/* Stats overlay */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 bg-slate-950/90 backdrop-blur-xl border border-slate-800/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-2xl max-w-[calc(100vw-2rem)] sm:max-w-xs"
      >
        <div className="space-y-2 sm:space-y-3 md:space-y-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                Real-Time
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400">Location Discovery</p>
            </div>
          </div>
          
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-slate-300">142 users online</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-slate-300">28 rooms active</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 animate-pulse flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-slate-300">8 system rooms</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
