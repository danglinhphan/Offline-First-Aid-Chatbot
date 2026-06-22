'use client'

import { Mic, MicOff } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface MicrophoneButtonProps {
  isListening: boolean
  onPress: () => void
  onRelease: () => void
}

export function MicrophoneButton({ isListening, onPress, onRelease }: MicrophoneButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      onPress()
    }
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      onRelease()
    }
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      onPress()
    }
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      onRelease()
    }

    const btn = buttonRef.current
    if (!btn) return

    btn.addEventListener('mousedown', handleMouseDown)
    btn.addEventListener('mouseup', handleMouseUp)
    btn.addEventListener('touchstart', handleTouchStart)
    btn.addEventListener('touchend', handleTouchEnd)

    return () => {
      btn.removeEventListener('mousedown', handleMouseDown)
      btn.removeEventListener('mouseup', handleMouseUp)
      btn.removeEventListener('touchstart', handleTouchStart)
      btn.removeEventListener('touchend', handleTouchEnd)
    }
  }, [onPress, onRelease])

  return (
    <div className="relative">
      {/* Ripple animation - Hiệu ứng sóng lan tỏa */}
      {isListening && (
        <>
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-pulse opacity-50 scale-125" />
          <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75 scale-150" />
        </>
      )}
      
      <button
        ref={buttonRef}
        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 font-bold text-white border-4 cursor-pointer select-none active:scale-95 ${
          isListening
            ? 'bg-emerald-500 border-emerald-300 shadow-xl shadow-emerald-500/50'
            : 'bg-slate-700 border-slate-650 hover:bg-slate-600'
        }`}
        aria-label={isListening ? 'Dừng nhận giọng nói' : 'Nhấn giữ để nói bằng tiếng Việt'}
        aria-pressed={isListening}
      >
        {isListening ? (
          <Mic size={40} className="text-white" />
        ) : (
          <MicOff size={40} className="text-gray-400" />
        )}
      </button>
    </div>
  )
}
