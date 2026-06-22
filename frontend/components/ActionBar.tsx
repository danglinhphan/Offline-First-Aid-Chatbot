'use client'

import { Volume2, RotateCcw, Settings } from 'lucide-react'
import { MicrophoneButton } from './MicrophoneButton'

interface ActionBarProps {
  isListening: boolean
  onMicPress: () => void
  onMicRelease: () => void
  onPlayAudio: () => void
  onReset: () => void
  onSettings: () => void
  recognitionError: string | null
}

export function ActionBar({
  isListening,
  onMicPress,
  onMicRelease,
  onPlayAudio,
  onReset,
  onSettings,
  recognitionError,
}: ActionBarProps) {
  return (
    <div className="bg-slate-800/40 border-t border-slate-700/50 p-4 flex flex-col gap-4 w-full justify-center">
      
      {/* Thông báo lỗi Microphone nếu có */}
      {recognitionError && (
        <div className="text-center text-xs text-rose-400 font-bold bg-rose-950/40 py-1.5 px-3 rounded-lg border border-rose-800/30">
          ⚠️ {recognitionError}
        </div>
      )}

      {/* Khu vực nút bấm xúc giác lớn */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
        
        {/* Nút Micro đặt bên trái hoặc chính giữa */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start">
          <MicrophoneButton
            isListening={isListening}
            onPress={onMicPress}
            onRelease={onMicRelease}
          />
          <div className="text-left hidden xs:block">
            <div className="text-sm font-bold text-white">
              {isListening ? '🎙️ Đang nghe...' : '🎙️ Nhấn giữ để nói'}
            </div>
            <div className="text-xs text-gray-400">
              {isListening ? 'Thả tay để hoàn tất' : 'Nói rõ triệu chứng y tế'}
            </div>
          </div>
        </div>

        {/* Các nút chức năng bổ trợ bên phải */}
        <div className="grid grid-cols-3 gap-2 w-full sm:w-auto flex-1 max-w-sm sm:max-w-none">
          <button
            onClick={onPlayAudio}
            className="bg-slate-700/60 hover:bg-slate-600 text-white font-black py-4 px-3 rounded-xl transition-all border-2 border-slate-600 flex flex-col items-center justify-center gap-1.5 min-h-[72px]"
            aria-label="Phát lại giọng nói"
          >
            <Volume2 size={24} className="text-emerald-400" />
            <span className="text-xs tracking-wide">Nghe lại</span>
          </button>

          <button
            onClick={onReset}
            className="bg-slate-700/60 hover:bg-slate-600 text-white font-black py-4 px-3 rounded-xl transition-all border-2 border-slate-600 flex flex-col items-center justify-center gap-1.5 min-h-[72px]"
            aria-label="Xóa cuộc hội thoại"
          >
            <RotateCcw size={24} className="text-rose-400" />
            <span className="text-xs tracking-wide">Xóa chat</span>
          </button>

          <button
            onClick={onSettings}
            className="bg-slate-700/60 hover:bg-slate-600 text-white font-black py-4 px-3 rounded-xl transition-all border-2 border-slate-600 flex flex-col items-center justify-center gap-1.5 min-h-[72px]"
            aria-label="Cài đặt trợ năng"
          >
            <Settings size={24} className="text-teal-400" />
            <span className="text-xs tracking-wide">Trợ năng</span>
          </button>
        </div>
      </div>
    </div>
  )
}

