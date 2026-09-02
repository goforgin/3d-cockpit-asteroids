import { Radar } from './Radar'
import { useGameStore } from '../../store/gameStore'
import { SHIELD_HITS_PER_SHIP } from '../../game/constants'
import { useEffect, useState } from 'react'

// Fixed constants
const RADAR_SIZE = 180
const BOTTOM_INSET = 16
const DASH_PAD = 16
const DASH_HEIGHT = BOTTOM_INSET + RADAR_SIZE + DASH_PAD

// Monitor dimensions
const MONITOR_WIDTH = 140
const MONITOR_HEIGHT = 90

// Camera monitor component - static bezel only (no live video)
const CameraMonitor = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center space-y-1">
    {/* Monitor bezel - dark CRT frame */}
    <div
      className="relative rounded-sm border border-cyan-700/50 shadow-[inset_0_0_8px_rgba(0,0,0,0.8)] overflow-hidden"
      style={{
        width: MONITOR_WIDTH,
        height: MONITOR_HEIGHT,
        backgroundColor: '#0a0a0a',
      }}
    >
      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0,255,136,0.05) 50%, rgba(0,255,136,0.05) 52%)',
          backgroundSize: '100% 4px',
        }}
      />
    </div>
    {/* Label */}
    <div
      className="text-[10px] tracking-widest text-cyan-400/80"
      style={{ fontFamily: "'Orbitron', monospace" }}
    >
      {label}
    </div>
  </div>
)

// Shield pips component (inline for right cluster)
const ShieldPips = () => {
  const shieldHitsLeft = useGameStore((state) => state.state.ship.shieldHitsLeft)
  const shieldActiveUntil = useGameStore((state) => state.state.ship.shieldActiveUntil)
  const now = Date.now()
  const isShieldActive = now < shieldActiveUntil
  
  // Track previous shield hits for flash effect
  const [previousHits, setPreviousHits] = useState(shieldHitsLeft)
  const [flashPip, setFlashPip] = useState<number | null>(null)
  
  // Detect when shield hits decrease and trigger flash
  useEffect(() => {
    if (shieldHitsLeft < previousHits) {
      setFlashPip(shieldHitsLeft)
      setTimeout(() => setFlashPip(null), 200)
    }
    setPreviousHits(shieldHitsLeft)
  }, [shieldHitsLeft, previousHits])
  
  return (
    <div className="pointer-events-none flex flex-col items-center space-y-1.5">
      <div
        className={`text-[10px] font-mono ${isShieldActive ? 'text-cyan-300' : 'text-cyan-500/70'}`}
        style={{ fontFamily: "'Orbitron', monospace" }}
      >
        SHIELDS
      </div>
      <div className="flex space-x-1">
        {[...Array(SHIELD_HITS_PER_SHIP)].map((_, i) => {
          const isChargeAvailable = i < shieldHitsLeft
          const isFlashing = flashPip === i
          
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-200 ${
                isChargeAvailable
                  ? isFlashing
                    ? 'bg-red-500 border-red-500 shadow-[0_0_8px_#ff0000]'
                    : isShieldActive
                    ? 'bg-cyan-400 shadow-[0_0_6px_#00ffff]'
                    : 'bg-cyan-500 shadow-[0_0_5px_#00aaff]'
                  : 'bg-transparent border-cyan-500/30'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}

// Left cluster: radio/comm controls
const LeftControls = () => (
  <div className="flex flex-col items-center space-y-3 w-56">
    {/* COMM label */}
    <div
      className="text-[10px] tracking-[0.2em] text-cyan-400/80"
      style={{ fontFamily: "'Orbitron', monospace" }}
    >
      COMM
    </div>
    
    {/* Fake monitor bezel with green readout */}
    <div className="relative w-20 h-12 bg-[#0a0a0a] rounded-sm border border-cyan-700/50 overflow-hidden">
      <div className="absolute inset-0 bg-[#001a00]" />
      <div
        className="absolute inset-0 flex items-center justify-center text-[10px] font-mono"
        style={{ fontFamily: "'Orbitron', monospace", color: '#00ffcc', textShadow: '0 0 4px #00ffcc' }}
      >
        COM 1  121.5
      </div>
    </div>
    
    {/* LED buttons row */}
    <div className="flex space-x-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-4.5 h-4.5 rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
          style={{
            backgroundColor: ['#00e5ff', '#00ff88', '#ffcc33', '#ff5566'][i],
            boxShadow: `0 0 6px ${['#00e5ff', '#00ff88', '#ffcc33', '#ff5566'][i]}`,
          }}
        />
      ))}
    </div>
    
    {/* Flip switches row */}
    <div className="flex space-x-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-3 h-6 bg-[#1a1d22] rounded-sm border border-[#3a3f46] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div
              className="absolute left-0.5 right-0.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: '#c0c5ce',
                top: i === 2 ? '3px' : '0px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
    
    {/* Knobs row */}
    <div className="flex space-x-4">
      {[
        { label: 'VOL', color: '#00ffcc' },
        { label: 'SQ', color: '#00ff88' },
      ].map((knob) => (
        <div key={knob.label} className="flex flex-col items-center">
          <div
            className="w-7 h-7 rounded-full relative"
            style={{
              background: `conic-gradient(from 180deg at 50% 50%, #2a2e34 0%, #1a1d22 100%)`,
              boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 0 4px rgba(0,0,0,0.8)',
            }}
          >
            <div
              className="absolute left-1/2 top-0.5 w-0.5 h-2.5 -translate-x-1/2"
              style={{ backgroundColor: '#c0c5ce', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }}
            />
          </div>
          <div
            className="text-[8px] mt-0.5 text-cyan-400/70"
            style={{ fontFamily: "'Orbitron', monospace" }}
          >
            {knob.label}
          </div>
        </div>
      ))}
    </div>
    
    {/* Speaker/SOUND indicator */}
    <div className="flex items-center gap-1.5 mt-1">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="#00ffcc" opacity="0.9" />
        <path d="M16 8.5a5 5 0 010 7M18.5 6a8 8 0 010 12" stroke="#00ffcc" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      <span
        className="text-[9px] tracking-widest text-cyan-400/80"
        style={{ fontFamily: "'Orbitron', monospace" }}
      >
        SOUND
      </span>
    </div>
  </div>
)

// Right cluster: shields + systems controls
const RightControls = () => (
  <div className="flex flex-col items-center space-y-3 w-56">
    {/* SYSTEMS label */}
    <div
      className="text-[10px] tracking-[0.2em] text-cyan-400/80"
      style={{ fontFamily: "'Orbitron', monospace" }}
    >
      SYSTEMS
    </div>
    
    {/* Shield pips */}
    <ShieldPips />
    
    {/* Fake monitor bezel with system status */}
    <div className="relative w-20 h-12 bg-[#0a0a0a] rounded-sm border border-cyan-700/50 overflow-hidden">
      <div className="absolute inset-0 bg-[#001a00]" />
      <div
        className="absolute inset-0 flex items-center justify-center text-[10px] font-mono"
        style={{ fontFamily: "'Orbitron', monospace", color: '#00ffcc', textShadow: '0 0 4px #00ffcc' }}
      >
        SHLD OK
      </div>
    </div>
    
    {/* Flip switches row */}
    <div className="flex space-x-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-3 h-6 bg-[#1a1d22] rounded-sm border border-[#3a3f46] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div
              className="absolute left-0.5 right-0.5 h-2.5 rounded-sm"
              style={{
                backgroundColor: '#c0c5ce',
                top: i >= 2 ? '3px' : '0px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
    
    {/* LED buttons row */}
    <div className="flex space-x-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-4.5 h-4.5 rounded-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
          style={{
            backgroundColor: ['#00e5ff', '#00ff88', '#ffcc33', '#ff5566'][i],
            boxShadow: `0 0 6px ${['#00e5ff', '#00ff88', '#ffcc33', '#ff5566'][i]}`,
          }}
        />
      ))}
    </div>
    
    {/* Power knob */}
    <div className="flex flex-col items-center mt-1">
      <div
        className="w-7 h-7 rounded-full relative"
        style={{
          background: `conic-gradient(from 180deg at 50% 50%, #2a2e34 0%, #1a1d22 100%)`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.6), inset 0 0 4px rgba(0,0,0,0.8)',
        }}
      >
        <div
          className="absolute left-1/2 top-0.5 w-0.5 h-2.5 -translate-x-1/2"
          style={{ backgroundColor: '#c0c5ce', boxShadow: '0 0 2px rgba(0,0,0,0.5)' }}
        />
      </div>
      <div
        className="text-[8px] mt-0.5 text-cyan-400/70"
        style={{ fontFamily: "'Orbitron', monospace" }}
      >
        PWR
      </div>
    </div>
  </div>
)

export const CockpitDash = () => {
  const gameState = useGameStore((state) => state.state.gameState)

  if (gameState !== 'playing') {
    return (
      <div
        className="pointer-events-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: DASH_HEIGHT,
          background: 'linear-gradient(180deg, #5a6068 0%, #2a2e34 18%, #1a1d22 100%)',
          borderTop: '2px solid #7a8088',
          boxShadow: 'inset 0 8px 16px rgba(0,0,0,0.45)',
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ backgroundColor: '#8a9098' }}
        />
      </div>
    )
  }

  return (
    <div
      className="pointer-events-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: DASH_HEIGHT,
        background: 'linear-gradient(180deg, #5a6068 0%, #2a2e34 18%, #1a1d22 100%)',
        borderTop: '2px solid #7a8088',
        boxShadow: 'inset 0 8px 16px rgba(0,0,0,0.45)',
      }}
    >
      {/* Thin highlight line at top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ backgroundColor: '#8a9098' }}
      />
      
      {/* Full-width flex row with 7 cells */}
      <div
        className="flex items-center justify-between h-full px-4"
        style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 10%, rgba(0,0,0,0) 90%, rgba(0,0,0,0.3) 100%)',
        }}
      >
        {/* Left camera monitor */}
        <CameraMonitor label="LEFT" />
        
        {/* Front camera monitor */}
        <CameraMonitor label="FRONT" />
        
        {/* Left controls (COMM) */}
        <div className="flex items-center">
          <LeftControls />
        </div>
        
        {/* Radar (centered) */}
        <div className="flex items-center">
          <Radar />
        </div>
        
        {/* Right controls (SYSTEMS) */}
        <div className="flex items-center">
          <RightControls />
        </div>
        
        {/* Back camera monitor */}
        <CameraMonitor label="BACK" />
        
        {/* Right camera monitor */}
        <CameraMonitor label="RIGHT" />
      </div>
    </div>
  )
}
