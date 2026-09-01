import { useEffect, useState } from 'react'
import { useGameStore } from '../../store/gameStore'

const SpeakerIcon = ({ muted }: { muted: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 9v6h4l5 4V5L8 9H4z"
      fill={muted ? '#ff5555' : '#00ffcc'}
      opacity="0.9"
    />
    {muted ? (
      <path
        d="M17 8l5 8M22 8l-5 8"
        stroke="#ff5555"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ) : (
      <path
        d="M16 8.5a5 5 0 010 7M18.5 6a8 8 0 010 12"
        stroke="#00ffcc"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    )}
  </svg>
)

export const AudioIndicator = () => {
  const muted = useGameStore((s) => s.muted)
  const muteFlashUntil = useGameStore((s) => s.muteFlashUntil)
  const [showToast, setShowToast] = useState(false)

  // Show the toast until muteFlashUntil, then auto-hide.
  useEffect(() => {
    const remaining = muteFlashUntil - Date.now()
    if (remaining > 0) {
      setShowToast(true)
      const t = setTimeout(() => setShowToast(false), remaining)
      return () => clearTimeout(t)
    }
    setShowToast(false)
  }, [muteFlashUntil])

  return (
    <>
      {/* Persistent speaker icon (bottom-left, above the radar) */}
      <div
        className="absolute left-8 bottom-40 z-50 pointer-events-none flex items-center gap-2"
        title={muted ? 'Muted (press M)' : 'Sound on (press M)'}
      >
        <SpeakerIcon muted={muted} />
        <span
          className="text-[10px] tracking-widest"
          style={{
            color: muted ? '#ff5555' : '#00ffcc',
            fontFamily: "'Orbitron', monospace",
            textShadow: muted
              ? '0 0 6px rgba(255,0,0,0.6)'
              : '0 0 6px rgba(0,255,204,0.5)',
          }}
        >
          {muted ? 'MUTED' : 'SOUND'}
        </span>
      </div>

      {/* Transient toast on toggle */}
      {showToast && (
        <div className="absolute inset-x-0 top-24 flex justify-center z-50 pointer-events-none">
          <div
            className="px-4 py-2 rounded-md text-lg font-bold tracking-widest"
            style={{
              color: muted ? '#ff5555' : '#00ffcc',
              border: `1px solid ${muted ? '#ff5555' : '#00ffcc'}`,
              background: 'rgba(0,0,0,0.55)',
              fontFamily: "'Orbitron', monospace",
              textShadow: muted
                ? '0 0 8px rgba(255,0,0,0.8)'
                : '0 0 8px rgba(0,255,204,0.7)',
            }}
          >
            {muted ? 'MUTED' : 'UNMUTED'}
          </div>
        </div>
      )}
    </>
  )
}
