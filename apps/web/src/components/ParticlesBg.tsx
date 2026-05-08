'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

/**
 * Background particle field using tsParticles (slim preset).
 * Hover: nearby particles repel + get "grabbed" by a glowing gold line toward cursor.
 */
export function ParticlesBg() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: 'transparent' },
      fpsLimit: 60,
      detectRetina: true,
      particles: {
        number: { value: 90, density: { enable: true, width: 1200, height: 800 } },
        color: { value: ['#ffffff', '#fef3c7', '#fbbf24', '#f59e0b'] },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.35, max: 0.85 },
          animation: { enable: true, speed: 0.8, sync: false },
        },
        size: { value: { min: 0.6, max: 2.1 } },
        move: {
          enable: true,
          speed: 0.55,
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'out' },
        },
        links: {
          enable: true,
          distance: 130,
          color: '#fbbf24',
          opacity: 0.32,
          width: 0.6,
        },
      },
      interactivity: {
        detectsOn: 'window',
        events: {
          onHover: { enable: true, mode: ['grab', 'repulse'] },
        },
        modes: {
          grab: {
            distance: 170,
            links: { opacity: 0.75, color: '#fbbf24' },
          },
          repulse: { distance: 90, duration: 0.35, factor: 1.2 },
        },
      },
    }),
    []
  );

  if (!ready) return null;

  return (
    <Particles
      id="hero-particles"
      options={options}
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
