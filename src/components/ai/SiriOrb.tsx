"use client";

/**
 * SiriOrb — thin forwardRef wrapper around the official smoothui/siri-orb.
 *
 * The outer div is what's ref'd so the audio rAF loop can write:
 *   --orb-scale  (1.0 → 1.22)  → transform: scale()  via 0.15s transition
 *   --orb-shadow               → box-shadow glow
 *
 * The smoothui orb inside runs its own rotation/fluid animation untouched.
 */
import { forwardRef } from 'react'
import SmoothSiriOrb from '@/components/smoothui/siri-orb/index'

// Sun palette — deep red bg → vivid red → saturated orange → warm golden-white
const SUN_COLORS = {
  bg: 'oklch(14% 0.16 27)',   // deep saturated red base
  c1: 'oklch(54% 0.32 22)',   // vivid crimson-red
  c2: 'oklch(71% 0.28 42)',   // saturated orange
  c3: 'oklch(89% 0.19 72)',   // warm golden-white highlight
}

// Ocean palette — deep blue bg → vivid blue → cyan → white (for mini)
const OCEAN_COLORS = {
  bg: 'oklch(20% 0.15 260)',  // deep ocean blue base
  c1: 'oklch(50% 0.25 250)',  // vivid blue
  c2: 'oklch(70% 0.20 200)',  // cyan
  c3: 'oklch(90% 0.10 180)',  // white-cyan highlight
}

// Emerald palette — Gemini Flash (deep green → vivid green → lime → white)
const EMERALD_COLORS = {
  bg: 'oklch(18% 0.12 155)',  // deep forest green base
  c1: 'oklch(52% 0.28 148)',  // vivid emerald
  c2: 'oklch(72% 0.24 132)',  // bright lime-green
  c3: 'oklch(91% 0.14 118)',  // golden-green highlight
}

// Violet palette — Gemini Flash Lite (deep purple → vivid violet → lavender → white)
const VIOLET_COLORS = {
  bg: 'oklch(18% 0.14 300)',  // deep purple base
  c1: 'oklch(52% 0.28 295)',  // vivid violet
  c2: 'oklch(70% 0.22 320)',  // magenta-lavender
  c3: 'oklch(90% 0.12 340)',  // pale pink highlight
}

const PALETTE = {
  sun:     SUN_COLORS,
  ocean:   OCEAN_COLORS,
  emerald: EMERALD_COLORS,
  violet:  VIOLET_COLORS,
}

const GLOW = {
  sun:     'var(--orb-shadow, 0 0 55px rgba(220,70,0,0.38), 0 0 100px rgba(200,50,0,0.16))',
  ocean:   'var(--orb-shadow, 0 0 55px rgba(0,100,200,0.38), 0 0 100px rgba(0,80,180,0.16))',
  emerald: 'var(--orb-shadow, 0 0 55px rgba(0,180,80,0.38), 0 0 100px rgba(0,150,60,0.16))',
  violet:  'var(--orb-shadow, 0 0 55px rgba(160,60,220,0.38), 0 0 100px rgba(130,40,200,0.16))',
}

const TALK_COLOR = {
  sun:     ['rgba(245,158,11,0.6)', 'rgba(245,158,11,0.4)', 'rgba(245,158,11,0.3)'],
  ocean:   ['rgba(59,130,246,0.6)', 'rgba(59,130,246,0.4)', 'rgba(59,130,246,0.3)'],
  emerald: ['rgba(34,197,94,0.6)',  'rgba(34,197,94,0.4)',  'rgba(34,197,94,0.3)'],
  violet:  ['rgba(167,139,250,0.6)','rgba(167,139,250,0.4)','rgba(167,139,250,0.3)'],
}

interface SiriOrbProps {
  size?: number
  className?: string
  variant?: 'sun' | 'ocean' | 'emerald' | 'violet'
  isTalking?: boolean
}

const SiriOrb = forwardRef<HTMLDivElement, SiriOrbProps>(
  ({ size = 192, className = '', variant = 'sun', isTalking = false }, ref) => {
    const colors = PALETTE[variant] ?? SUN_COLORS

    return (
      <div
        ref={ref}
        className={className}
        style={{
          display: 'inline-flex',
          borderRadius: '50%',
          transform: 'scale(var(--orb-scale, 1))',
          transition: 'transform 0.15s ease-out',
          boxShadow: GLOW[variant] ?? GLOW.sun,
          willChange: 'transform, box-shadow',
          position: 'relative',
        }}
      >
        {/* Talking animation rings */}
        {isTalking && (
          <>
            <div
              className="absolute inset-[-30%] rounded-full"
              style={{
                background: `radial-gradient(circle, ${(TALK_COLOR[variant] ?? TALK_COLOR.sun)[0]} 0%, transparent 60%)`,
                animation: 'siriOrbPulse 0.8s ease-out infinite',
                filter: 'blur(8px)',
              }}
            />
            <div
              className="absolute inset-[-40%] rounded-full"
              style={{
                background: `radial-gradient(circle, ${(TALK_COLOR[variant] ?? TALK_COLOR.sun)[1]} 0%, transparent 50%)`,
                animation: 'siriOrbPulse 0.8s ease-out infinite 0.2s',
                filter: 'blur(6px)',
              }}
            />
            <div
              className="absolute inset-[-50%] rounded-full"
              style={{
                background: `radial-gradient(circle, ${(TALK_COLOR[variant] ?? TALK_COLOR.sun)[2]} 0%, transparent 40%)`,
                animation: 'siriOrbPulse 0.8s ease-out infinite 0.4s',
                filter: 'blur(4px)',
              }}
            />
          </>
        )}
        <div
          style={{
            animation: isTalking ? 'siriOrbMorph 0.6s ease-in-out infinite' : 'none',
          }}
        >
          <SmoothSiriOrb
            size={`${size}px`}
            animationDuration={variant === 'ocean' || variant === 'violet' ? 12 : 18}
            colors={colors}
          />
        </div>
        {isTalking ? (
          <style>{`
            @keyframes siriOrbPulse {
              0% { transform: scale(0.8); opacity: 1; }
              100% { transform: scale(2.5); opacity: 0; }
            }
            @keyframes siriOrbMorph {
              0%, 100% { transform: scale(1) rotate(0deg); }
              25% { transform: scale(1.15, 0.95) rotate(2deg); }
              50% { transform: scale(0.95, 1.15) rotate(-2deg); }
              75% { transform: scale(1.1, 0.9) rotate(1deg); }
            }
          `}</style>
        ) : null}
      </div>
    )
  }
)

SiriOrb.displayName = 'SiriOrb'
export default SiriOrb
