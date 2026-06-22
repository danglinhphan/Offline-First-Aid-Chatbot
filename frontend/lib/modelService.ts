import { checkSafety } from './safetyGuardrail'
import { queryKnowledgeBase, FirstAidDocument } from './knowledgeBase'

export interface ModelResponse {
  text: string
  isSafe: boolean
  caseKey: 'cpr' | 'bleeding' | 'choking' | 'burns' | 'stroke' | 'snakebite' | 'psychological' | 'general'
  document?: FirstAidDocument
}

const BACKEND_URL = 'http://127.0.0.1:8000'

/**
 * Gọi API suy luận của FastAPI backend. 
 * Nếu backend chưa bật hoặc mất kết nối, tự động chuyển về chế độ giả lập offline để đảm bảo hoạt động liên tục.
 */
export async function generateResponse(query: string): Promise<ModelResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    
    if (response.ok) {
      const data = await response.json()
      // Tìm tài liệu tương ứng cục bộ để lấy metadata nếu cần
      const matchedDoc = queryKnowledgeBase(query) || undefined
      return {
        text: data.text,
        isSafe: data.isSafe,
        caseKey: data.caseKey,
        document: matchedDoc
      }
    }
  } catch (error) {
    console.warn("Không kết nối được với Python Backend. Sử dụng bộ máy suy luận cục bộ (JS Fallback):", error)
  }

  // --- LOCAL FALLBACK (Nếu backend ngoại tuyến chưa khởi động) ---
  const safetyCheck = checkSafety(query)
  if (!safetyCheck.isSafe) {
    return {
      text: safetyCheck.message || '⚠️ Phát hiện truy vấn không an toàn hoặc ngoài phạm vi hỗ trợ.',
      isSafe: false,
      caseKey: 'general'
    }
  }

  const matchedDoc = queryKnowledgeBase(query)
  if (matchedDoc) {
    const responseText = `🚨 HÀNH ĐỘNG KHẨN CẤP CẦN LÀM NGAY:
${matchedDoc.emergencyAction}

📋 CÁC BƯỚC SƠ CỨU CHI TIẾT:
${matchedDoc.detailedSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

📚 NGUỒN TÀI LIỆU THAM KHẢO:
${matchedDoc.references}`

    return {
      text: responseText,
      isSafe: true,
      caseKey: matchedDoc.caseKey,
      document: matchedDoc
    }
  }

  const fallbackText = `Xin chào! Trợ lý sơ cứu y tế ngoại tuyến đã nhận được thông tin: "${query}".

Tuy nhiên, câu hỏi này chưa khớp với cẩm nang sơ cứu khẩn cấp cụ thể trong kho dữ liệu ngoại tuyến hiện tại.

Để nhận chỉ dẫn sơ cứu chính xác nhất, bạn vui lòng mô tả rõ hơn hoặc hỏi về các tình huống khẩn cấp sau:
- Hồi sức tim phổi (CPR) / Ngừng tim ngưng thở
- Chảy máu nghiêm trọng / Cách cầm máu vết thương
- Hóc dị vật đường thở (Thủ thuật Heimlich)
- Vết bỏng nhiệt (nước sôi, lửa)
- Nhận biết Đột quỵ (Quy tắc FAST)
- Sơ cứu khi bị Rắn cắn
- Hỗ trợ tâm lý ban đầu cho người hoảng loạn

Nếu tình trạng nghiêm trọng, hãy gọi ngay cấp cứu 115 lập tức!`

  return {
    text: fallbackText,
    isSafe: true,
    caseKey: 'general'
  }
}

/**
 * Trình tổng hợp giọng nói (Text-To-Speech). 
 * Ưu tiên gọi API TTS của backend, nếu lỗi thì sử dụng Web Speech API có sẵn của trình duyệt làm fallback.
 */
let currentAudioContext: AudioContext | null = null
let currentAudioSource: AudioBufferSourceNode | null = null
let currentUtterance: SpeechSynthesisUtterance | null = null
let wordTimers: number[] = []

export async function speakText(
  text: string,
  options: {
    rate?: number
    onWordBoundary?: (charIndex: number, charLength: number, word: string) => void
    onEnd?: () => void
    onError?: (err: any) => void
  }
) {
  // Dừng phát âm thanh hiện tại
  stopSpeaking()

  const cleanText = text
    .replace(/[🚨📋📚⚠️✓👋]/g, '')
    .replace(/[-*#]/g, '')
    .trim()

  try {
    // 1. Gọi backend TTS
    const response = await fetch(`${BACKEND_URL}/api/tts?text=${encodeURIComponent(cleanText)}`)
    if (response.ok) {
      const data = await response.json()
      
      // Khởi tạo AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      currentAudioContext = new AudioContextClass()
      
      // Giải mã dữ liệu base64
      const binaryString = atob(data.audio)
      const len = binaryString.length
      const bytes = new Uint8Array(len)
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      const audioBuffer = await currentAudioContext.decodeAudioData(bytes.buffer)
      currentAudioSource = currentAudioContext.createBufferSource()
      currentAudioSource.buffer = audioBuffer
      currentAudioSource.connect(currentAudioContext.destination)
      
      // Thực hiện highlight chữ đồng bộ Karaoke dựa trên timestamps
      if (options.onWordBoundary && data.timestamps) {
        let textAccumulated = ""
        data.timestamps.forEach((item: any) => {
          const timerId = window.setTimeout(() => {
            const charIndex = cleanText.indexOf(item.word, textAccumulated.length)
            options.onWordBoundary?.(charIndex >= 0 ? charIndex : textAccumulated.length, item.word.length, item.word)
            textAccumulated += item.word + " "
          }, item.start * 1000 / (options.rate || 1.0))
          wordTimers.push(timerId)
        })
      }
      
      currentAudioSource.onended = () => {
        options.onEnd?.()
      }
      
      currentAudioSource.start(0)
      return
    }
  } catch (error) {
    console.warn("TTS Backend không khả dụng, chuyển sang Web Speech API fallback:", error)
  }

  // --- BROWSER FALLBACK ---
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onError?.('Trình duyệt không hỗ trợ tổng hợp giọng nói.')
    return
  }

  const utterance = new SpeechSynthesisUtterance(cleanText)
  utterance.lang = 'vi-VN'
  utterance.rate = options.rate ?? 1.0

  const voices = window.speechSynthesis.getVoices()
  const viVoice = voices.find(voice => voice.lang.includes('vi') || voice.lang.includes('VI'))
  if (viVoice) {
    utterance.voice = viVoice
  }

  utterance.onboundary = (event) => {
    if (event.name === 'word' && options.onWordBoundary) {
      const charIndex = event.charIndex
      const textFromIndex = cleanText.substring(charIndex)
      const nextSpace = textFromIndex.search(/\s/)
      const wordLength = nextSpace > -1 ? nextSpace : textFromIndex.length
      const currentWord = cleanText.substring(charIndex, charIndex + wordLength)
      options.onWordBoundary(charIndex, wordLength, currentWord)
    }
  }

  utterance.onend = () => {
    currentUtterance = null
    options.onEnd?.()
  }

  utterance.onerror = (err) => {
    currentUtterance = null
    options.onError?.(err)
  }

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  // Dừng Web Audio API của backend TTS
  if (currentAudioSource) {
    try { currentAudioSource.stop() } catch(e) {}
    currentAudioSource = null
  }
  if (currentAudioContext) {
    try { currentAudioContext.close() } catch(e) {}
    currentAudioContext = null
  }
  
  // Xóa các timers highlight
  wordTimers.forEach(id => clearTimeout(id))
  wordTimers = []

  // Dừng Web Speech API
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
    currentUtterance = null
  }
}

/**
 * Trình ghi âm để gửi lên Backend ASR. 
 * Tự động đóng vai trò như lớp giả lập SpeechRecognition để page.tsx không phải thay đổi logic gọi.
 */
class BackendAudioRecorderASR {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private isRecording = false

  constructor(private options: {
    onResult: (text: string, isFinal: boolean) => void
    onEnd: () => void
    onError: (err: any) => void
  }) {}

  async start() {
    this.audioChunks = []
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(stream)
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data)
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' })
        await this.uploadAndTranscribe(audioBlob)
      }

      this.mediaRecorder.start()
      this.isRecording = true
    } catch (err) {
      this.options.onError(err)
    }
  }

  stop() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop()
      this.isRecording = false
      // Dừng toàn bộ tracks để tắt biểu tượng micro trình duyệt
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop())
    }
  }

  private async uploadAndTranscribe(blob: Blob) {
    try {
      const formData = new FormData()
      formData.append("file", blob, "recording.wav")
      
      const response = await fetch(`${BACKEND_URL}/api/stt`, {
        method: "POST",
        body: formData
      })
      
      if (response.ok) {
        const data = await response.json()
        this.options.onResult(data.text, true)
      } else {
        throw new Error("Lỗi phản hồi từ STT server.")
      }
    } catch (err) {
      console.warn("Backend STT thất bại, không thể nhận diện giọng nói cục bộ:", err)
      this.options.onError(err)
    } finally {
      this.options.onEnd()
    }
  }
}

/**
 * Trình khởi tạo Speech Recognition.
 */
export function getSpeechRecognition(
  options: {
    onResult: (text: string, isFinal: boolean) => void
    onEnd: () => void
    onError: (err: any) => void
  },
  forceBackend: boolean = false
) {
  if (typeof window === 'undefined') return null

  // Nếu ép buộc chạy STT qua backend (chế độ offline hoàn toàn)
  if (forceBackend) {
    if (typeof MediaRecorder !== 'undefined') {
      return new BackendAudioRecorderASR(options)
    }
    return null
  }

  // 1. Ưu tiên Web Speech API của trình duyệt trước
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (SpeechRecognition) {
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'vi-VN'

    rec.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        } else {
          interimTranscript += event.results[i][0].transcript
        }
      }

      const transcript = finalTranscript || interimTranscript
      options.onResult(transcript, !!finalTranscript)
    }

    rec.onend = () => {
      options.onEnd()
    }

    rec.onerror = (err: any) => {
      options.onError(err)
    }

    return rec
  }

  // 2. Fallback về bộ ghi âm backend nếu trình duyệt không hỗ trợ Web Speech API trực tiếp (như Firefox)
  if (typeof MediaRecorder !== 'undefined') {
    return new BackendAudioRecorderASR(options)
  }

  return null
}
