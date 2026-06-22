'use client'

import { WifiOff, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StatusBarProps {
  isOffline: boolean
}

export function StatusBar({ isOffline }: StatusBarProps) {
  const [timeStr, setTimeStr] = useState('')

  // Đồng bộ thời gian theo giây trên client-side để tránh lỗi HydrationMismatch của Next.js
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTimeStr(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      )
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-slate-900/80 border-b border-slate-700/50 px-4 py-3 flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {isOffline ? (
          <>
            <WifiOff 
              size={20} 
              className="text-amber-400 animate-pulse"
              aria-label="Chế độ ngoại tuyến"
            />
            <span className="text-amber-400 font-bold text-sm tracking-wider uppercase">
              CHẾ ĐỘ NGOẠI TUYẾN
            </span>
          </>
        ) : (
          <>
            <ShieldCheck 
              size={20} 
              className="text-emerald-400"
              aria-label="Đang kết nối an toàn"
            />
            <span className="text-emerald-400 font-bold text-sm tracking-wider uppercase">
              HỆ THỐNG AN TOÀN
            </span>
          </>
        )}
      </div>
      
      {/* Dynamic Digital Clock */}
      <div className="text-slate-300 font-mono text-sm tracking-widest font-bold">
        ⏱️ {timeStr || '--:--:--'}
      </div>
    </div>
  )
}
