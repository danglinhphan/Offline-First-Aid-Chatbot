'use client'

import { X, Check } from 'lucide-react'
import type { TextScale } from '@/hooks/useAccessibilityState'

interface AccessibilityPanelProps {
  isOpen: boolean
  onClose: () => void
  textScale: TextScale
  setTextScale: (scale: TextScale) => void
  isSlowSpeed: boolean
  setIsSlowSpeed: (value: boolean) => void
  isHighContrast: boolean
  setIsHighContrast: (value: boolean) => void
}

export function AccessibilityPanel({
  isOpen,
  onClose,
  textScale,
  setTextScale,
  isSlowSpeed,
  setIsSlowSpeed,
  isHighContrast,
  setIsHighContrast,
}: AccessibilityPanelProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="accessibility-panel-title">
      <div className="w-full max-w-md bg-slate-900 border-2 border-emerald-500 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Tiêu đề bảng điều khiển */}
        <div className="flex items-center justify-between mb-5 border-b border-slate-800 pb-3">
          <h2 id="accessibility-panel-title" className="accessibility-title text-white font-black flex items-center gap-2">
            ⚙️ Cài Đặt Trợ Năng
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700 min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Đóng cài đặt"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <div className="space-y-4">
          
          {/* Cỡ chữ tăng cường */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <label className="block text-white font-black mb-3 accessibility-text">
              🔎 Kích thước chữ
            </label>
            <div className="flex gap-2">
              {[
                { value: 'normal', label: 'Thường' },
                { value: 'large', label: 'Lớn' },
                { value: 'extra', label: 'Rất lớn' }
              ].map((scale) => (
                <button
                  key={scale.value}
                  onClick={() => setTextScale(scale.value as TextScale)}
                  className={`flex-1 py-3 px-2 rounded-lg font-black transition-all border-2 text-sm ${
                    textScale === scale.value
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  aria-pressed={textScale === scale.value}
                >
                  {scale.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tốc độ đọc giọng nói */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSlowSpeed}
                onChange={(e) => setIsSlowSpeed(e.target.checked)}
                className="w-6 h-6 rounded border-2 border-slate-650 text-emerald-500 focus:ring-emerald-500 cursor-pointer min-h-11 min-w-11"
              />
              <span className="text-white font-black accessibility-text">🐢 Giảm tốc độ giọng đọc (Đọc chậm)</span>
            </label>
          </div>

          {/* Chế độ tương phản cao */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isHighContrast}
                onChange={(e) => setIsHighContrast(e.target.checked)}
                className="w-6 h-6 rounded border-2 border-slate-650 text-emerald-500 focus:ring-emerald-500 cursor-pointer min-h-11 min-w-11"
              />
              <span className="text-white font-black accessibility-text">👁️ Chế độ tương phản cao</span>
            </label>
          </div>

          {/* Hướng dẫn trợ năng nhanh */}
          <div className="bg-slate-900/60 p-4 rounded-xl text-xs leading-relaxed text-gray-400 border border-slate-800">
            <p className="mb-2">
              <strong>Kích thước chữ:</strong> Phóng to toàn bộ giao diện giúp dễ đọc hơn.
            </p>
            <p className="mb-2">
              <strong>🐢 Đọc chậm:</strong> Giọng đọc trợ lý sẽ chậm lại để người dùng nghe rõ hơn.
            </p>
            <p>
              <strong>Tương phản cao:</strong> Tối ưu hóa màu nền và viền sáng neon để phù hợp với người suy giảm thị lực.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
