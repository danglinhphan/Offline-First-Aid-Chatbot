'use client'

import { useEffect, useRef } from 'react'

interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  text: string
  timestamp: Date
}

interface ChatWindowProps {
  messages: ChatMessage[]
  isPlayingVoice: boolean
  textScale: 'normal' | 'large' | 'extra'
  activeWordRange: { start: number; length: number; word: string } | null
}

const textSizeMap = {
  normal: 'text-base',
  large: 'text-lg',
  extra: 'text-xl',
}

export function ChatWindow({ messages, isPlayingVoice, textScale, activeWordRange }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Tự động cuộn xuống dưới cùng khi có tin nhắn mới hoặc khi đang đọc
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, activeWordRange])

  // Hàm render Karaoke Highlight đồng bộ hóa từ đang đọc
  const renderKaraokeText = (text: string, isLatestBot: boolean) => {
    if (!isLatestBot || !isPlayingVoice || !activeWordRange) {
      return text
    }

    const { start, length, word } = activeWordRange
    
    // Tìm vị trí của từ trong văn bản gốc gần với chỉ số charIndex nhất
    let bestIdx = text.toLowerCase().indexOf(word.toLowerCase())
    if (bestIdx === -1) return text

    let minDiff = Math.abs(bestIdx - start)
    let idx = bestIdx
    
    // Quét tìm tất cả các vị trí trùng lặp để tìm từ khớp vị trí nhất
    while (idx !== -1) {
      const nextIdx = text.toLowerCase().indexOf(word.toLowerCase(), idx + 1)
      if (nextIdx === -1) break
      const diff = Math.abs(nextIdx - start)
      if (diff < minDiff) {
        minDiff = diff
        bestIdx = nextIdx
      }
      idx = nextIdx
    }

    const before = text.substring(0, bestIdx)
    const match = text.substring(bestIdx, bestIdx + word.length)
    const after = text.substring(bestIdx + word.length)

    return (
      <>
        {before}
        <span className="word-active">{match}</span>
        {after}
      </>
    )
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 bg-slate-900/60 overflow-y-auto p-4 space-y-4 min-h-0 accessibility-text scrollbar-thin scrollbar-thumb-slate-800"
      aria-label="Cửa sổ hội thoại sơ cứu"
      role="log"
    >
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center p-6">
          <div className="max-w-xs">
            <div className="accessibility-title text-emerald-400 mb-2">
              👋 Sẵn sàng hỗ trợ
            </div>
            <div className="text-gray-400 text-sm">
              Mô tả triệu chứng hoặc yêu cầu hướng dẫn sơ cứu khẩn cấp (bằng giọng nói hoặc gõ chữ).
            </div>
          </div>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isLatestBot = msg.type === 'bot' && index === messages.length - 1
          
          return (
            <div 
              key={msg.id}
              className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl shadow-md transition-all duration-200 ${
                  msg.type === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none border border-emerald-500/20'
                    : isLatestBot && isPlayingVoice
                    ? 'bg-slate-800 text-white border-2 border-emerald-400 rounded-bl-none shadow-emerald-500/10'
                    : 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/5'
                }`}
                role={msg.type === 'bot' ? 'status' : undefined}
                aria-label={msg.type === 'user' ? 'Tin nhắn của bạn' : 'Phản hồi từ trợ lý'}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {renderKaraokeText(msg.text, isLatestBot)}
                </div>
                
                <div className="text-[10px] text-gray-400 mt-2 text-right font-mono opacity-80 select-none">
                  ⏱️ {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
