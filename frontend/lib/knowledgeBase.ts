export interface FirstAidDocument {
  id: string
  title: string
  caseKey: 'cpr' | 'bleeding' | 'choking' | 'burns' | 'stroke' | 'snakebite' | 'psychological' | 'general'
  keywords: string[]
  emergencyAction: string
  detailedSteps: string[]
  references: string
}

export const firstAidDatabase: FirstAidDocument[] = [
  {
    id: 'cpr',
    title: 'Hồi sức tim phổi (CPR) & Ép tim lồng ngực',
    caseKey: 'cpr',
    keywords: ['ép tim', 'ngừng thở', 'ngưng tim', 'cpr', 'hồi sức tim phổi', 'bất tỉnh', 'không thở'],
    emergencyAction: 'Đặt nạn nhân nằm ngửa trên nền cứng. Tiến hành ÉP TIM MẠNH VÀ NHANH ngay lập tức ở chính giữa ngực: 100 - 120 lần/phút, sâu 5 - 6 cm. Cần gọi cấp cứu 115 ngay!',
    detailedSteps: [
      'Kiểm tra phản ứng của nạn nhân (gọi to, vỗ vai). Nếu không phản ứng và không thở bình thường, hãy chuẩn bị ép tim.',
      'Gọi ngay cấp cứu 115 (hoặc nhờ người xung quanh gọi và tìm máy khử rung tim tự động AED nếu có).',
      'Đặt gót một bàn tay lên trung tâm ngực nạn nhân (nửa dưới xương ức). Đặt gót bàn tay còn lại lên trên bàn tay thứ nhất, đan các ngón tay vào nhau.',
      'Giữ cánh tay thẳng, vai thẳng đứng trên bàn tay. Ép thẳng xuống với độ sâu 5 - 6 cm đối với người lớn.',
      'Thực hiện với tần số 100 - 120 lần mỗi phút. Đảm bảo lồng ngực nở lên hoàn toàn sau mỗi lần ép.',
      'Nếu bạn đã được đào tạo: Thực hiện chu kỳ 30 lần ép tim kèm 2 lần hà hơi thổi ngạt. Nếu chưa được đào tạo, chỉ cần ép tim liên tục (Hands-only CPR).'
    ],
    references: 'Hướng dẫn Sơ cấp cứu của Tổ chức Y tế Thế giới (WHO) & Hiệp hội Tim mạch Hoa Kỳ (AHA)'
  },
  {
    id: 'bleeding',
    title: 'Sơ cứu Cầm máu Vết thương',
    caseKey: 'bleeding',
    keywords: ['chảy máu', 'vết thương', 'đứt tay', 'cầm máu', 'mất máu', 'băng bó', 'vết rách'],
    emergencyAction: 'Ấn trực tiếp lên vết thương bằng gạc sạch hoặc vải sạch để ngăn chảy máu. Giữ vết thương cao hơn tim nếu có thể và KHÔNG lấy vật sắc nhọn găm sâu ra.',
    detailedSteps: [
      'Mang găng tay y tế bảo vệ nếu có để tránh lây nhiễm chéo qua đường máu.',
      'Đặt một miếng gạc hoặc khăn sạch trực tiếp lên vết thương và dùng tay ấn một lực mạnh, liên tục trong ít nhất 5-10 phút.',
      'Nếu máu thấm qua gạc, đừng lấy gạc cũ ra mà đặt thêm một lớp gạc sạch khác lên trên và tiếp tục ấn chặt.',
      'Khi vết thương đã ngừng chảy máu, băng ép vết thương lại bằng băng thun hoặc băng vải sạch nhưng không bó quá chặt làm cản trở lưu thông máu.',
      'Nếu vết thương chảy máu nghiêm trọng từ động mạch (máu phun thành tia) hoặc không cầm được máu sau 15 phút băng ép, hãy gọi ngay cấp cứu 115 và duy trì áp lực băng.',
      'Đối với dị vật găm sâu (mảnh kính, dao): KHÔNG tự ý rút ra. Hãy băng cố định xung quanh dị vật rồi chuyển nạn nhân đến bệnh viện.'
    ],
    references: 'Cẩm nang Sơ cứu chấn thương của WHO & Hội Chữ thập đỏ quốc tế'
  },
  {
    id: 'choking',
    title: 'Sơ cứu Dị vật đường thở (Thủ thuật Heimlich)',
    caseKey: 'choking',
    keywords: ['hóc', 'sặc', 'dị vật', 'khó thở', 'nghẹn', 'heimlich', 'ngạt thở', 'đường thở'],
    emergencyAction: 'Nếu nạn nhân không thể nói, ho hoặc thở được, tiến hành thực hiện 5 lần vỗ lưng giữa hai bả vai, sau đó thực hiện 5 lần ép bụng (thủ thuật Heimlich) cho đến khi dị vật văng ra.',
    detailedSteps: [
      'Hỏi nạn nhân: "Bạn có bị hóc không?". Nếu họ gật đầu nhưng không nói được, hãy hành động ngay.',
      'Đứng phía sau nạn nhân. Hơi cúi người nạn nhân về phía trước.',
      'Thực hiện 5 lần vỗ lưng: Sử dụng gót bàn tay vỗ mạnh 5 lần vào giữa hai xương bả vai của nạn nhân.',
      'Nếu dị vật không ra, chuyển sang 5 lần ép bụng (Heimlich): Vòng hai tay quanh eo nạn nhân. nắm một tay lại thành nắm đấm, đặt ngón cái của nắm đấm vào vùng bụng phía trên rốn và dưới xương ức của nạn nhân.',
      'Bàn tay kia ôm lấy nắm đấm, thực hiện động tác giật mạnh hướng vào trong và lên trên một cách dứt khoát.',
      'Lặp lại chu kỳ 5 lần vỗ lưng và 5 lần ép bụng cho đến khi dị vật được đẩy ra ngoài hoặc nạn nhân mất ý thức. Nếu nạn nhân bất tỉnh, đặt họ nằm ngửa và tiến hành ép tim (CPR).'
    ],
    references: 'Hướng dẫn Sơ cứu dị vật đường thở của WHO và Hội Chữ thập đỏ Việt Nam'
  },
  {
    id: 'burns',
    title: 'Sơ cứu vết bỏng nhiệt',
    caseKey: 'burns',
    keywords: ['bỏng', 'nước sôi', 'cháy', 'lửa', 'bỏng nhiệt', 'nóng', 'rộp da'],
    emergencyAction: 'Xối nước sạch mát (không dùng nước đá) lên vùng bị bỏng trong ít nhất 10 - 20 phút. KHÔNG tự ý bôi kem đánh răng, dầu mỡ hay chọc vỡ các nốt phồng rộp.',
    detailedSteps: [
      'Đưa nạn nhân ra khỏi nguồn nhiệt ngay lập tức để ngăn bỏng sâu hơn.',
      'Làm mát vết bỏng dưới vòi nước chảy nhẹ hoặc ngâm nước mát sạch trong 10-20 phút. Việc này giúp giảm đau và giảm độ sâu của vết bỏng.',
      'Cởi bỏ nhẹ nhàng quần áo hoặc đồ trang sức gần vùng bỏng trước khi vết bỏng bắt đầu sưng nề. KHÔNG cố lột quần áo nếu chúng đã dính chặt vào vết bỏng.',
      'Che phủ vết bỏng bằng băng gạc sạch, khô hoặc màng bọc thực phẩm sạch để tránh nhiễm khuẩn.',
      'Giữ ấm cơ thể cho nạn nhân để tránh sốc nhiệt, cho nạn nhân uống nước ấm nếu họ còn tỉnh táo.',
      'Đến cơ sở y tế nếu vết bỏng lớn hơn lòng bàn tay, bỏng ở mặt, tay, chân, vùng nhạy cảm hoặc có dấu hiệu nhiễm trùng.'
    ],
    references: 'Phác đồ điều trị bỏng lâm sàng - Viện Bỏng Quốc gia Việt Nam'
  },
  {
    id: 'stroke',
    title: 'Sơ cứu Đột quỵ (Nhận diện quy tắc FAST)',
    caseKey: 'stroke',
    keywords: ['đột quỵ', 'tai biến', 'méo miệng', 'yếu tay', 'nói ngọng', 'tê liệt', 'fast', 'đột ngột'],
    emergencyAction: 'Nhận diện dấu hiệu FAST (Mặt méo, Tay yếu, Giọng nói ngọng) và gọi ngay cấp cứu 115. KHÔNG cho nạn nhân ăn uống, uống thuốc hạ huyết áp hoặc tự ý châm cứu, cạo gió.',
    detailedSteps: [
      '**F (Face - Mặt)**: Yêu cầu nạn nhân cười. Kiểm tra xem một bên mặt có bị chảy xệ hoặc méo mó không.',
      '**A (Arms - Tay)**: Yêu cầu nạn nhân giơ cả hai tay lên. Kiểm tra xem một bên tay có bị yếu, rơi xuống hoặc không nâng lên được không.',
      '**S (Speech - Giọng nói)**: Yêu cầu nạn nhân lặp lại một câu đơn giản. Kiểm tra xem họ nói có bị ngọng, líu lưỡi hoặc không nói được không.',
      '**T (Time - Thời gian)**: Nếu xuất hiện bất kỳ dấu hiệu nào trên, ghi lại thời gian bắt đầu bị và gọi ngay cấp cứu 115 lập tức. Thời gian vàng cứu sống não là cực kỳ quan trọng!',
      'Đặt nạn nhân nằm nghiêng an toàn (tư thế hồi sức) nếu họ hôn mê nhưng còn thở, hoặc nằm ngửa kê đầu cao 30 độ nếu còn tỉnh.',
      'Nới lỏng quần áo, giữ thông thoáng đường thở. Tuyệt đối không cho ăn uống vì dễ gây sặc vào đường thở.'
    ],
    references: 'Hiệp hội Đột quỵ Thế giới (WSO) & Bộ Y Tế Việt Nam'
  },
  {
    id: 'snakebite',
    title: 'Sơ cứu khi bị Rắn cắn',
    caseKey: 'snakebite',
    keywords: ['rắn cắn', 'rắn độc', 'nọc độc', 'vết cắn', 'phù nề', 'bị rắn'],
    emergencyAction: 'Giữ yên lặng và hạn chế cử động tối đa vùng bị rắn cắn để ngăn nọc độc lan nhanh. KHÔNG rạch vết thương, hút nọc độc, hoặc ga-rô bó chặt làm hoại tử chi.',
    detailedSteps: [
      'Đưa nạn nhân rời xa tầm hoạt động của con rắn an toàn. Cố gắng ghi nhớ màu sắc, hình dáng đầu rắn để bác sĩ xác định loại huyết thanh kháng độc.',
      'Đặt nạn nhân nằm yên, giữ cho vùng bị cắn thấp hơn tim để làm chậm sự di chuyển của nọc độc.',
      'Rửa sạch vết cắn bằng nước sạch và xà phòng nếu có. Băng ép nhẹ nhàng bằng băng vải sạch từ trên vết cắn hướng về phía gốc chi (không băng quá chặt làm ngắt mạch máu).',
      'Tháo bỏ nhẫn, vòng tay hoặc giày dép gần vết cắn trước khi chi bị sưng phù nề.',
      'KHÔNG chườm đá, không bôi hóa chất, lá cây lạ lên vết thương và KHÔNG dùng miệng hút nọc độc.',
      'Đưa nạn nhân đến bệnh viện gần nhất có huyết thanh kháng nọc độc rắn càng nhanh càng tốt.'
    ],
    references: 'Hướng dẫn xử trí rắn độc cắn - Bộ Y Tế Việt Nam'
  },
  {
    id: 'psychological',
    title: 'Hỗ trợ Tâm lý ban đầu (Sơ cứu tâm lý)',
    caseKey: 'psychological',
    keywords: ['tâm lý', 'hoảng loạn', 'sợ hãi', 'khóc', 'lo âu', 'hoảng sợ', 'sốc tâm lý', 'an ủi'],
    emergencyAction: 'Tiếp cận nạn nhân một cách nhẹ nhàng, lắng nghe không phán xét, hướng dẫn họ thực hiện bài tập thở sâu (thở chậm 4-4-4) để ổn định nhịp tim và giảm hoảng loạn.',
    detailedSteps: [
      'Giới thiệu bản thân và giải thích rằng bạn ở đây để giúp đỡ. Đảm bảo môi trường xung quanh an toàn nhất có thể cho nạn nhân.',
      'Lắng nghe tích cực: Cho phép họ chia sẻ cảm xúc, không ngắt lời hay phán xét, không đưa ra những lời khuyên giả tạo như "mọi chuyện sẽ ổn thôi".',
      'Hướng dẫn kỹ thuật thở giảm hoảng loạn (Box Breathing): Hít vào chậm qua mũi trong 4 giây, giữ hơi thở trong 4 giây, thở ra nhẹ nhàng qua miệng trong 4 giây, giữ trống phổi trong 4 giây. Lặp lại 5-10 lần.',
      'Tập trung vào hiện tại: Sử dụng kỹ thuật 5-4-3-2-1 để giúp nạn nhân kết nối lại thực tế: Nhìn 5 vật xung quanh, Chạm 4 vật, Nghe 3 âm thanh, Ngửi 2 mùi, Nếm 1 vị.',
      'Kết nối nạn nhân với người thân, gia đình hoặc các dịch vụ hỗ trợ xã hội chuyên nghiệp.'
    ],
    references: 'Hướng dẫn Sơ cứu tâm lý khẩn cấp (PFA) - Tổ chức Y tế Thế giới (WHO)'
  }
]

/**
 * Thuật toán tìm kiếm lai hợp (Hybrid Retrieval) offline siêu nhẹ chạy trong trình duyệt:
 * - Bước 1: Tiền lọc từ vựng (Lexical Filtering) dựa trên từ khóa khớp.
 * - Bước 2: Tái sắp xếp (Reranking) dựa trên độ trùng lặp từ (Word Overlap / Jaccard Coefficient).
 */
const VIETNAMESE_STOPWORDS = new Set(["bị", "khi", "và", "hoặc", "cho", "gì", "ở", "tại", "là", "của", "có", "để", "sự", "cái", "con", "thế", "nào", "nhưng", "với", "ra", "nên"])

export function queryKnowledgeBase(query: string): FirstAidDocument | null {
  if (!query || query.trim() === '') return null

  const normalizedQuery = query.toLowerCase().trim()
  const queryWords = normalizedQuery
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !VIETNAMESE_STOPWORDS.has(w))

  if (queryWords.length === 0) return null

  let bestMatch: FirstAidDocument | null = null
  let maxScore = 0

  for (const doc of firstAidDatabase) {
    let score = 0

    // 1. Kiểm tra khớp chính xác các từ khóa y khoa (Keywords) - Trọng số rất cao
    const matchingKeywords = doc.keywords.filter(keyword => {
      // Cho phép khớp từ khóa con (ví dụ "ép tim" khớp trong "hướng dẫn ép tim lồng ngực")
      return normalizedQuery.includes(keyword)
    })
    
    score += matchingKeywords.length * 12.0

    // 2. Kiểm tra độ trùng lặp từ vựng chung trong tiêu đề (Title) - Trọng số trung bình
    const titleWords = doc.title.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '').split(/\s+/)
    const titleIntersection = queryWords.filter(word => titleWords.includes(word))
    score += titleIntersection.length * 5.0

    // 3. Kiểm tra độ trùng lặp từ vựng trong nội dung (Emergency & Steps) - Trọng số nhẹ
    const contentText = (doc.emergencyAction + ' ' + doc.detailedSteps.join(' ')).toLowerCase()
    const contentIntersection = queryWords.filter(word => contentText.includes(word))
    score += contentIntersection.length * 1.5

    // 4. Tính toán chỉ số tương đồng Jaccard cho tập từ khóa
    const docAllWords = new Set([...titleWords, ...doc.keywords])
    const querySet = new Set(queryWords)
    const intersection = new Set([...querySet].filter(x => docAllWords.has(x)))
    const union = new Set([...querySet, ...docAllWords])
    const jaccard = union.size > 0 ? intersection.size / union.size : 0
    score += jaccard * 10.0

    if (score > maxScore) {
      maxScore = score
      bestMatch = doc
    }
  }

  // Ngưỡng điểm tối thiểu để được coi là khớp hợp lệ
  const scoreThreshold = 4.0
  return maxScore >= scoreThreshold ? bestMatch : null
}
