'use client'

import { useState, useCallback, useEffect } from 'react'

export type TextScale = 'normal' | 'large' | 'extra'

export interface AccessibilityState {
  isListening: boolean
  textScale: TextScale
  isPlayingVoice: boolean
  isSlowSpeed: boolean
  isHighContrast: boolean
  disclaimerVisible: boolean
  activeCase: 'cpr' | 'bleeding' | 'choking' | 'burns' | 'stroke' | 'snakebite' | 'psychological' | 'general'
  activeWordRange: { start: number; length: number; word: string } | null
}

const STORAGE_KEY = 'y_te_accessibility_settings'

export function useAccessibilityState() {
  const [state, setState] = useState<AccessibilityState>({
    isListening: false,
    textScale: 'normal',
    isPlayingVoice: false,
    isSlowSpeed: false,
    isHighContrast: false,
    disclaimerVisible: true,
    activeCase: 'general',
    activeWordRange: null,
  })

  // Đọc cài đặt đã lưu từ localStorage khi khởi chạy client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          setState(prev => ({
            ...prev,
            textScale: parsed.textScale ?? 'normal',
            isSlowSpeed: parsed.isSlowSpeed ?? false,
            isHighContrast: parsed.isHighContrast ?? false,
            disclaimerVisible: parsed.disclaimerVisible ?? true,
          }))
        }
      } catch (e) {
        console.error('Không thể đọc cài đặt trợ năng từ localStorage:', e)
      }
    }
  }, [])

  // Lưu cài đặt vào localStorage khi có thay đổi
  const saveSettings = useCallback((updates: Partial<AccessibilityState>) => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        const current = saved ? JSON.parse(saved) : {}
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...current,
            ...updates,
          })
        )
      } catch (e) {
        console.error('Không thể ghi cài đặt trợ năng vào localStorage:', e)
      }
    }
  }, [])

  const setIsListening = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, isListening: value }))
  }, [])

  const setTextScale = useCallback((value: TextScale) => {
    setState(prev => {
      const newState = { ...prev, textScale: value }
      saveSettings({ textScale: value } as any)
      return newState
    })
  }, [saveSettings])

  const setIsPlayingVoice = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, isPlayingVoice: value }))
  }, [])

  const setIsSlowSpeed = useCallback((value: boolean) => {
    setState(prev => {
      const newState = { ...prev, isSlowSpeed: value }
      saveSettings({ isSlowSpeed: value } as any)
      return newState
    })
  }, [saveSettings])

  const setIsHighContrast = useCallback((value: boolean) => {
    setState(prev => {
      const newState = { ...prev, isHighContrast: value }
      saveSettings({ isHighContrast: value } as any)
      return newState
    })
  }, [saveSettings])

  const setDisclaimerVisible = useCallback((value: boolean) => {
    setState(prev => {
      const newState = { ...prev, disclaimerVisible: value }
      saveSettings({ disclaimerVisible: value } as any)
      return newState
    })
  }, [saveSettings])

  const setActiveCase = useCallback((value: AccessibilityState['activeCase']) => {
    setState(prev => ({ ...prev, activeCase: value }))
  }, [])

  const setActiveWordRange = useCallback((range: AccessibilityState['activeWordRange']) => {
    setState(prev => ({ ...prev, activeWordRange: range }))
  }, [])

  const speechRate = state.isSlowSpeed ? 0.70 : 1.05

  return {
    ...state,
    speechRate,
    setIsListening,
    setTextScale,
    setIsPlayingVoice,
    setIsSlowSpeed,
    setIsHighContrast,
    setDisclaimerVisible,
    setActiveCase,
    setActiveWordRange,
  }
}
