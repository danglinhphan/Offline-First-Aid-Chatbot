'use client'

import { AlertOctagon, X } from 'lucide-react'

interface SafetyBannerProps {
  isVisible: boolean
  onDismiss: () => void
  textScale: 'normal' | 'large' | 'extra'
}

export function SafetyBanner({ isVisible, onDismiss, textScale }: SafetyBannerProps) {
  if (!isVisible) return null

  return (
    <div className="bg-rose-750 border-b-4 border-rose-900 px-4 py-4 flex items-start justify-between gap-3 text-white">
      <div className="flex items-start gap-3 flex-1">
        <AlertOctagon 
          size={32}
          className="text-white flex-shrink-0 mt-1 animate-bounce"
          aria-label="Cảnh báo nguy hiểm"
        />
        <div>
          <div className="accessibility-title text-white font-black mb-1">
            🚨 ĐÂY KHÔNG PHẢI LÀ SỰ THAY THẾ CHO CẤP CỨU 115
          </div>
          <p className="accessibility-text text-white/95 leading-relaxed font-semibold">
            Nếu đang gặp các tình trạng nguy kịch như: đau ngực dữ dội, suy hô hấp khó thở, mất ý thức, chấn thương sọ não, hoặc chảy máu xối xả không cầm được, hãy <strong>GỌI NGAY CẤP CỨU 115</strong> hoặc đưa nạn nhân đến phòng cấp cứu gần nhất!
          </p>
        </div>
      </div>
      
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-2 hover:bg-rose-900 rounded-lg transition-colors border-2 border-white/20 min-h-12 min-w-12 flex items-center justify-center"
        aria-label="Đóng cảnh báo an toàn"
      >
        <X size={24} className="text-white" />
      </button>
    </div>
  )
}
