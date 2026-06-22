export interface SafetyResult {
  isSafe: boolean
  reason?: 'jailbreak' | 'out_of_scope'
  message?: string
}

const JAILBREAK_PATTERNS = [
  /ignore\s+previous/i,
  /quên\s+đi\s+(vai\s+trò|nhiệm\s+vụ|chỉ\s+dẫn)/i,
  /bỏ\s+qua\s+các\s+(hướng\s+dẫn|chỉ\s+dẫn)/i,
  /lập\s+trình\s+lại/i,
  /hãy\s+đóng\s+vai/i,
  /system\s+override/i,
  /prompt\s+injection/i,
  /từ\s+bỏ\s+màng\s+lọc/i,
  /hack\s+chatbot/i,
  /you\s+are\s+now/i
]

const OUT_OF_SCOPE_WORDS = [
  // Lập trình & CNTT
  'lập trình', 'code', 'python', 'javascript', 'html', 'css', 'c++', 'java', 'react', 'nextjs', 'typescript',
  // Toán học & Khoa học khác
  'toán học', 'giải phương trình', 'tính tích phân', 'vật lý', 'hóa học', 'địa lý', 'lịch sử',
  // Chính trị & Tôn giáo
  'chính trị', 'đảng cộng sản', 'nhà nước', 'bầu cử', 'tôn giáo', 'chính phủ',
  // Thương mại & Quảng cáo
  'mua bán', 'giá tiền', 'quảng cáo', 'khuyến mãi', 'shopee', 'lazada', 'bitcoin', 'tiền điện tử',
  // Giải trí & Đời sống
  'phim ảnh', 'ca nhạc', 'game', 'nấu ăn', 'công thức bánh', 'du lịch'
]

// Từ khóa y tế / sức khỏe hợp lệ để đảm bảo câu hỏi y tế được thông qua
const VALID_MEDICAL_KEYWORDS = [
  'đau', 'sốt', 'máu', 'thở', 'nghẹn', 'hóc', 'sặc', 'tim', 'phổi', 'bỏng', 'đột quỵ', 'tai biến',
  'rắn', 'cắn', 'chấn thương', 'gãy', 'vết thương', 'sơ cứu', 'cấp cứu', 'băng', 'thuốc',
  'đầu', 'bụng', 'ngực', 'tay', 'chân', 'nôn', 'chóng mặt', 'ngất', 'bất tỉnh', 'co giật',
  'tâm lý', 'lo âu', 'sợ', 'hoảng', 'sốc', 'khóc', 'an ủi', 'cứu'
]

export function checkSafety(query: string): SafetyResult {
  if (!query || query.trim() === '') {
    return { isSafe: true }
  }

  const normalized = query.toLowerCase().trim()

  // 1. Kiểm tra tấn công bẻ khóa (Jailbreak / Prompt Injection) - LiteLMGuard
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isSafe: false,
        reason: 'jailbreak',
        message: '⚠️ CẢNH BÁO AN NINH: Phát hiện nỗ lực thay đổi cấu hình hệ thống. Yêu cầu bị chặn ngay lập tức để bảo vệ an toàn mô hình.'
      }
    }
  }

  // 2. Kiểm tra từ khóa ngoài phạm vi (Out of Scope) - CREST-Base
  const hasOutOfScopeWord = OUT_OF_SCOPE_WORDS.some(word => normalized.includes(word))

  // Nếu chứa từ ngoài phạm vi VÀ không chứa bất kỳ từ khóa y tế hợp lệ nào
  if (hasOutOfScopeWord) {
    const hasValidMedicalContext = VALID_MEDICAL_KEYWORDS.some(med => normalized.includes(med))
    if (!hasValidMedicalContext) {
      return {
        isSafe: false,
        reason: 'out_of_scope',
        message: 'Trợ lý y tế chỉ hỗ trợ cung cấp các hướng dẫn sơ cứu khẩn cấp và tư vấn sức khỏe ban đầu. Yêu cầu của bạn nằm ngoài phạm vi hoạt động của hệ thống.'
      }
    }
  }

  // 3. Kiểm tra tính liên quan y tế chung
  // Nếu câu hỏi quá xa lạ và không chứa từ khóa liên quan sơ cứu/sức khỏe nào
  const words = normalized.split(/\s+/)
  if (words.length > 3) {
    const hasAnyMedicalKeyword = VALID_MEDICAL_KEYWORDS.some(med => normalized.includes(med))
    if (!hasAnyMedicalKeyword) {
      // Cho phép một số câu hỏi hội thoại xã giao bình thường
      const generalConversations = ['xin chào', 'hello', 'chào bạn', 'ai đó', 'bạn là ai', 'giúp', 'cứu tôi']
      const isGeneral = generalConversations.some(convo => normalized.includes(convo))
      
      if (!isGeneral) {
        return {
          isSafe: false,
          reason: 'out_of_scope',
          message: 'Xin chào. Trợ lý y tế sơ cứu ngoại tuyến ở đây để trợ giúp bạn trong các tình huống khẩn cấp (như ngừng tim, chảy máu, bỏng, hóc dị vật...). Xin vui lòng mô tả triệu chứng hoặc yêu cầu liên quan đến sơ cứu y tế.'
        }
      }
    }
  }

  return { isSafe: true }
}
