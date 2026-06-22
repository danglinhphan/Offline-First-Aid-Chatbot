'use client'

import { useEffect, useState, useRef } from 'react'
import { useAccessibilityState } from '@/hooks/useAccessibilityState'
import { StatusBar } from '@/components/StatusBar'
import { SafetyBanner } from '@/components/SafetyBanner'
import { VisualGuide } from '@/components/VisualGuide'
import { ChatWindow } from '@/components/ChatWindow'
import { ActionBar } from '@/components/ActionBar'
import { AccessibilityPanel } from '@/components/AccessibilityPanel'
import { MessageSquareText, Send } from 'lucide-react'
import { generateResponse, stopSpeaking, speakText, getSpeechRecognition } from '@/lib/modelService'

interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  text: string
  timestamp: Date
}

export default function Home() {
  // 1. Khai báo tất cả các State & Refs trước
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [isOffline] = useState(true)
  const [recognitionError, setRecognitionError] = useState<string | null>(null)
  const [useBackendSTT, setUseBackendSTT] = useState(false)
  const accessibility = useAccessibilityState()
  const recognitionRef = useRef<any>(null)

  // 2. Định nghĩa tất cả các hàm xử lý (Handlers) trước các useEffect
  const triggerHaptic = (duration = 60) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration)
    }
  }

  // Xử lý gửi tin nhắn của chatbot
  const handleAddBotMessage = (text: string, caseKey: any) => {
    const newMessage: ChatMessage = {
      id: `bot-${Date.now()}`,
      type: 'bot',
      text,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, newMessage])
    accessibility.setActiveCase(caseKey)

    // Bắt đầu đọc tin nhắn mới sinh ra bằng giọng nói
    accessibility.setIsPlayingVoice(true)
    speakText(text, {
      rate: accessibility.speechRate,
      onWordBoundary: (charIndex, charLength, word) => {
        accessibility.setActiveWordRange({
          start: charIndex,
          length: charLength,
          word: word
        })
      },
      onEnd: () => {
        accessibility.setIsPlayingVoice(false)
        accessibility.setActiveWordRange(null)
      },
      onError: (err) => {
        console.error('Lỗi phát giọng nói:', err)
        accessibility.setIsPlayingVoice(false)
        accessibility.setActiveWordRange(null)
      }
    })
  }

  // Xử lý gửi tin nhắn của người dùng
  const handleAddUserMessage = async (text: string) => {
    if (!text || text.trim() === '') return

    stopSpeaking() // Dừng đọc bất kỳ âm thanh nào trước đó
    accessibility.setIsPlayingVoice(false)
    accessibility.setActiveWordRange(null)

    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])

    // Giả lập độ trễ xử lý offline của mô hình nhỏ (Qwen3-0.6B) khoảng 600ms
    setTimeout(async () => {
      const response = await generateResponse(text)
      handleAddBotMessage(response.text, response.caseKey)
    }, 600)
  }

  const handleMicPress = () => {
    triggerHaptic(50)
    stopSpeaking() // Dừng tiếng đang phát
    accessibility.setIsPlayingVoice(false)
    accessibility.setActiveWordRange(null)
    setRecognitionError(null)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        accessibility.setIsListening(true)
      } catch (e) {
        console.error('Không thể khởi chạy microphone:', e)
      }
    } else {
      // Nhập tay giả lập nếu trình duyệt không hỗ trợ Web Speech
      setRecognitionError('Trình duyệt không hỗ trợ micro. Đang mô phỏng...')
      accessibility.setIsListening(true)
      setTimeout(() => {
        accessibility.setIsListening(false)
        handleAddUserMessage('hướng dẫn ép tim lồng ngực')
      }, 2000)
    }
  }

  const handleMicRelease = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.error(e)
      }
    }
    accessibility.setIsListening(false)
  }

  // Phát lại tin nhắn cuối cùng của bot
  const handlePlayAudio = () => {
    triggerHaptic(50)
    const botMessages = messages.filter(m => m.type === 'bot')
    if (botMessages.length === 0) return
    
    const lastBotMessage = botMessages[botMessages.length - 1]

    accessibility.setIsPlayingVoice(true)
    speakText(lastBotMessage.text, {
      rate: accessibility.speechRate,
      onWordBoundary: (charIndex, charLength, word) => {
        accessibility.setActiveWordRange({
          start: charIndex,
          length: charLength,
          word: word
        })
      },
      onEnd: () => {
        accessibility.setIsPlayingVoice(false)
        accessibility.setActiveWordRange(null)
      },
      onError: (err) => {
        console.error(err)
        accessibility.setIsPlayingVoice(false)
        accessibility.setActiveWordRange(null)
      }
    })
  }

  // Reset cuộc trò chuyện
  const handleReset = () => {
    triggerHaptic(100)
    stopSpeaking()
    setMessages([
      {
        id: 'bot-welcome',
        type: 'bot',
        text: '👋 Cuộc trò chuyện đã được làm sạch. Tôi có thể hỗ trợ gì cho bạn ngay bây giờ?',
        timestamp: new Date()
      }
    ])
    accessibility.setIsListening(false)
    accessibility.setIsPlayingVoice(false)
    accessibility.setActiveWordRange(null)
    accessibility.setActiveCase('general')
  }

  const handleSettings = () => {
    triggerHaptic(50)
    setShowSettings(prev => !prev)
  }

  // 3. Khai báo các useEffect hooks ở đây để tránh lỗi Temporal Dead Zone (TDZ)
  
  // Khởi tạo Speech Recognition
  useEffect(() => {
    const rec = getSpeechRecognition({
      onResult: (text, isFinal) => {
        if (isFinal) {
          triggerHaptic(80)
          handleAddUserMessage(text)
        }
      },
      onEnd: () => {
        accessibility.setIsListening(false)
      },
      onError: (err: any) => {
        const errType = err.error || err.type || 'unknown'
        console.error('Chi tiết lỗi nhận dạng giọng nói:', errType, err)
        
        // Cơ chế TỰ ĐỘNG CHUYỂN MẠCH HÓNG sang Backend STT offline nếu Web Speech API lỗi mạng
        if (errType === 'network' && !useBackendSTT) {
          console.warn('Mất mạng hoặc trình duyệt không hỗ trợ Web Speech offline. Tự động chuyển mạch sang Backend STT offline...')
          setUseBackendSTT(true)
          return
        }

        let userMsg = 'Không thể nghe rõ. Vui lòng nhấn giữ và thử lại.'
        if (errType === 'not-allowed') {
          userMsg = '⚠️ Quyền sử dụng Microphone bị chặn. Vui lòng bấm vào biểu tượng camera/micro ở góc thanh địa chỉ trình duyệt để Cho phép (Allow) truy cập.'
        } else if (errType === 'network') {
          userMsg = '⚠️ Lỗi mạng: Trình duyệt cần Internet để chạy Web Speech. Hãy bật mạng hoặc chạy "download_models.py" để khởi động STT offline của máy chủ.'
        } else if (errType === 'no-speech') {
          userMsg = '⚠️ Không phát hiện giọng nói. Xin hãy nói rõ ràng hoặc kiểm tra lại âm lượng micro.'
        }
        
        setRecognitionError(userMsg)
        accessibility.setIsListening(false)
      }
    }, useBackendSTT)
    
    recognitionRef.current = rec
  }, [accessibility, useBackendSTT])

  // Lời chào mừng ban đầu
  useEffect(() => {
    setMessages([
      {
        id: 'bot-welcome',
        type: 'bot',
        text: '👋 Xin chào! Tôi là Trợ lý Sơ cứu Y tế Ngoại tuyến. Tôi có thể hỗ trợ bạn sơ cứu khẩn cấp (CPR, chảy máu, hóc dị vật, bỏng, đột quỵ, rắn cắn) hoàn toàn không cần kết nối mạng. Hãy nhấn giữ nút Microphone phía dưới hoặc gõ câu hỏi để bắt đầu.',
        timestamp: new Date()
      }
    ])
  }, [])

  // Nhận văn bản gõ từ bàn phím thông qua CustomEvent gửi từ ActionBar
  useEffect(() => {
    const handleSendTextEvent = (e: Event) => {
      const text = (e as CustomEvent).detail
      if (text) {
        handleAddUserMessage(text)
      }
    }
    window.addEventListener('send-emergency-text', handleSendTextEvent)
    return () => {
      window.removeEventListener('send-emergency-text', handleSendTextEvent)
    }
  }, [handleAddUserMessage])

  return (
    <main 
      className={`min-h-screen p-4 md:p-6 lg:p-8 flex flex-col justify-start transition-colors duration-300 bg-slate-950 text-white ${
        accessibility.isHighContrast ? 'high-contrast-mode' : ''
      } text-scale-${accessibility.textScale}`}
    >
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4 flex-1">
        {/* Bento Grid */}
        <div className="bento-grid">
          
          {/* Card 1: Status Bar (Col 12) */}
          <div className="col-span-12 bento-card glass-card !p-0 overflow-hidden">
            <StatusBar isOffline={isOffline} />
          </div>

          {/* Card 2: Cảnh báo an toàn (Col 12) - Chỉ hiện khi chưa ẩn */}
          {accessibility.disclaimerVisible && (
            <div className="col-span-12 bento-card !p-0 overflow-hidden">
              <SafetyBanner
                isVisible={accessibility.disclaimerVisible}
                onDismiss={() => {
                  triggerHaptic(40)
                  accessibility.setDisclaimerVisible(false)
                }}
                textScale={accessibility.textScale}
              />
            </div>
          )}

          {/* Card 3: Cửa sổ Chat (Col 7) */}
          <div className="col-span-12 md:col-span-7 bento-card glass-card min-h-[450px] max-h-[550px] flex flex-col overflow-hidden !p-0">
            <h3 className="accessibility-title text-emerald-400 mb-2 px-4 pt-3 flex items-center gap-2 border-b border-white/5 pb-2">
              💬 Hội thoại sơ cứu
            </h3>
            <ChatWindow
              messages={messages}
              isPlayingVoice={accessibility.isPlayingVoice}
              textScale={accessibility.textScale}
              activeWordRange={accessibility.activeWordRange}
            />
            {/* Hộp nhập liệu bằng chữ tích hợp trực tiếp dưới khung chat */}
            <div className="p-3 border-t border-slate-700/30 bg-slate-900/20">
              <form onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const input = form.elements.namedItem('query') as HTMLInputElement
                if (input.value.trim()) {
                  handleAddUserMessage(input.value.trim())
                  input.value = ''
                }
              }} className="flex gap-2 w-full">
                <div className="relative flex-1">
                  <MessageSquareText size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="query"
                    type="text"
                    placeholder="Nhập triệu chứng của bạn vào đây..."
                    className="w-full bg-slate-950/70 border-2 border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 font-bold focus:outline-none focus:border-emerald-500 transition-colors text-base"
                    aria-label="Nhập triệu chứng bằng bàn phím"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 px-4 rounded-xl border border-emerald-500 transition-colors flex items-center justify-center min-h-[48px] min-w-[48px]"
                  aria-label="Gửi tin nhắn bằng chữ"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>

          {/* Card 4: Đồ họa động Hướng dẫn SVG (Col 5) */}
          <div className="col-span-12 md:col-span-5 bento-card glass-card flex flex-col justify-between overflow-y-auto max-h-[500px]">
            <h3 className="accessibility-title text-emerald-400 mb-2 flex items-center gap-2 border-b border-white/5 pb-2">
              👁️ Hướng dẫn trực quan
            </h3>
            <div className="flex-1 flex items-center justify-center min-h-[220px]">
              <VisualGuide 
                textScale={accessibility.textScale} 
                activeCase={accessibility.activeCase}
              />
            </div>
            <div className="mt-3 bg-slate-900/60 p-3 rounded-lg border border-white/5 text-xs leading-relaxed text-gray-400">
              Hình ảnh SVG động giúp định vị vùng ép tim, thủ thuật thở Heimlich hoặc xử lý bỏng không cần tải qua Internet.
            </div>
          </div>

          {/* Card 5: Điều khiển giọng nói và Phím tắt ActionBar (Col 7) */}
          <div className="col-span-12 md:col-span-7 bento-card glass-card justify-center">
            <ActionBar
              isListening={accessibility.isListening}
              onMicPress={handleMicPress}
              onMicRelease={handleMicRelease}
              onPlayAudio={handlePlayAudio}
              onReset={handleReset}
              onSettings={handleSettings}
              recognitionError={recognitionError}
            />
          </div>

          {/* Card 6: Hướng dẫn nhanh / Bento Hỗ trợ (Col 5) */}
          <div className="col-span-12 md:col-span-5 bento-card glass-card justify-between">
            <div>
              <h3 className="accessibility-title text-emerald-400 mb-3">⚡ Các bước khẩn cấp</h3>
              <ul className="space-y-3 accessibility-text text-sm text-gray-300">
                <li className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">1</span>
                  <span><strong>Mô tả triệu chứng</strong>: Nói rõ chấn thương (ví dụ: bị bỏng nước sôi, chảy máu ở chân).</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">2</span>
                  <span><strong>Lắng nghe trợ lý</strong>: Nhìn Karaoke highlight tô xanh từng chữ đồng bộ giọng nói.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center flex-shrink-0 text-xs mt-0.5">3</span>
                  <span><strong>Làm theo hình ảnh</strong>: Thực hành sơ cứu dựa trên sơ đồ hình vẽ kế bên.</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Card 7: Cài đặt trợ năng (Col 12) - Chỉ hiện khi nhấn Options */}
          <div className={`col-span-12 transition-all duration-300 ${showSettings ? 'block' : 'hidden'}`}>
            <AccessibilityPanel
              isOpen={showSettings}
              onClose={() => setShowSettings(false)}
              textScale={accessibility.textScale}
              setTextScale={accessibility.setTextScale}
              isSlowSpeed={accessibility.isSlowSpeed}
              setIsSlowSpeed={accessibility.setIsSlowSpeed}
              isHighContrast={accessibility.isHighContrast}
              setIsHighContrast={accessibility.setIsHighContrast}
            />
          </div>

        </div>
      </div>
    </main>
  )
}
