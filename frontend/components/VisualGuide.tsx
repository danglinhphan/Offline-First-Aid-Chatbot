'use client'

import { HeartHandshake } from 'lucide-react'

interface VisualGuideProps {
  textScale: 'normal' | 'large' | 'extra'
  activeCase: 'cpr' | 'bleeding' | 'choking' | 'burns' | 'stroke' | 'snakebite' | 'psychological' | 'general'
}

export function VisualGuide({ textScale, activeCase }: VisualGuideProps) {
  
  // Định nghĩa các dải màu và bộ lọc hiệu ứng phát sáng dùng chung
  const renderDefs = () => (
    <defs>
      {/* Bộ lọc phát sáng (Neon Glow) */}
      <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComponentTransfer in="blur" result="glow1">
          <feFuncA type="linear" slope="0.6" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="glow1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComponentTransfer in="blur" result="glow1">
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="glow1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComponentTransfer in="blur" result="glow1">
          <feFuncA type="linear" slope="0.5" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="glow1" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Dải màu (Gradients) */}
      <linearGradient id="grad-rose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fda4af" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
      
      <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>

      <linearGradient id="grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>

      <linearGradient id="grad-sky" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#7dd3fc" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>

      <linearGradient id="grad-teal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#99f6e4" />
        <stop offset="100%" stopColor="#0d9488" />
      </linearGradient>

      <radialGradient id="radial-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
        <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
      </radialGradient>
    </defs>
  )

  const renderSVG = () => {
    switch (activeCase) {
      case 'cpr':
        return (
          <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto text-rose-500" aria-label="Hình minh họa ép tim hồi sức phổi">
            {renderDefs()}
            {/* Lồng ngực phản quang */}
            <rect x="45" y="25" width="110" height="150" rx="25" fill="#0f172a" stroke="url(#grad-rose)" strokeWidth="3" opacity="0.9" />
            <line x1="100" y1="25" x2="100" y2="175" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6" />
            
            {/* Xương sườn */}
            <path d="M 55 65 Q 100 78 145 65 M 55 95 Q 100 108 145 95 M 55 125 Q 100 138 145 125" fill="none" stroke="#fda4af" strokeWidth="2" opacity="0.25" />
            
            {/* Vùng tâm ép tim nhấp nháy phát sáng */}
            <circle cx="100" cy="105" r="22" fill="none" stroke="#f43f5e" strokeWidth="2" className="animate-ping" opacity="0.4" />
            <circle cx="100" cy="105" r="16" fill="rgba(244, 63, 94, 0.15)" stroke="url(#grad-rose)" strokeWidth="3" filter="url(#glow-rose)" />
            <circle cx="100" cy="105" r="4" fill="#ffffff" />
            
            {/* Đồ họa hai bàn tay chồng lên nhau */}
            <g transform="translate(100, 105)" filter="url(#glow-emerald)">
              <path d="M-18,-8 L-6,-26 L16,-22 L12,6 L-10,12 Z" fill="rgba(16, 185, 129, 0.1)" stroke="url(#grad-emerald)" strokeWidth="2.5" />
              <path d="M-12,-4 L2,-22 L22,-18 L17,10 L-4,16 Z" fill="rgba(52, 211, 153, 0.2)" stroke="#6ee7b7" strokeWidth="2" />
            </g>
            
            {/* Mũi tên chỉ lực ép xuống chuyển động */}
            <g className="animate-bounce" style={{ animationDuration: '1.2s' }}>
              <path d="M 100 35 L 100 70 M 90 60 L 100 70 L 110 60" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-rose)" />
            </g>
            
            <text x="100" y="192" textAnchor="middle" fill="#fda4af" className="text-[11px] font-bold tracking-wider">
              ÉP MẠNH & NHANH (100-120 LẦN/P)
            </text>
          </svg>
        )

      case 'bleeding':
        return (
          <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto text-emerald-400" aria-label="Hình minh họa ép chặt cầm máu">
            {renderDefs()}
            {/* Chi bị thương */}
            <path d="M 25 105 Q 100 75 175 105 L 175 135 Q 100 105 25 135 Z" fill="#0f172a" stroke="url(#grad-emerald)" strokeWidth="3" />
            
            {/* Dòng máu chảy trực quan */}
            <path d="M 95 112 Q 100 125 105 112" fill="none" stroke="#ef4444" strokeWidth="4" filter="url(#glow-rose)" />
            <circle cx="100" cy="115" r="3.5" fill="#f43f5e" className="animate-pulse" />
            
            {/* Băng gạc vô trùng */}
            <rect x="70" y="88" width="60" height="28" rx="5" fill="#1e293b" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" opacity="0.85" />
            
            {/* Bàn tay ấn giữ */}
            <g transform="translate(100, 88)" filter="url(#glow-emerald)">
              <path d="M -18,6 Q -8,-16 16,-10 L 10,18 Z" fill="rgba(16, 185, 129, 0.15)" stroke="url(#grad-emerald)" strokeWidth="2.5" />
              {/* Mũi tên đè ép lực */}
              <path d="M 0,-32 L 0,-8 M -6,-14 L 0,-8 L 6,-14" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            
            <text x="100" y="190" textAnchor="middle" fill="#6ee7b7" className="text-[11px] font-bold tracking-wider">
              ẤN GIỮ LIÊN TỤC LÊN GẠC
            </text>
          </svg>
        )

      case 'choking':
        return (
          <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto text-amber-400" aria-label="Hình minh họa thủ thuật Heimlich">
            {renderDefs()}
            {/* Người bị nghẹn khom */}
            <g opacity="0.4">
              <path d="M 50 160 L 68 95 L 58 55 Q 52 35 68 35" fill="none" stroke="#ffffff" strokeWidth="3.5" />
              <circle cx="70" cy="20" r="10" fill="none" stroke="#ffffff" strokeWidth="3.5" />
            </g>
            
            {/* Người hỗ trợ ôm eo */}
            <g filter="url(#glow-emerald)">
              <path d="M 88 160 L 93 90 L 83 60 L 68 70" fill="none" stroke="url(#grad-emerald)" strokeWidth="4" strokeLinecap="round" />
              <circle cx="86" cy="42" r="9" fill="none" stroke="url(#grad-emerald)" strokeWidth="3" />
            </g>
            
            {/* Điểm kích hoạt nắm đấm */}
            <circle cx="68" cy="80" r="10" fill="rgba(217, 119, 6, 0.2)" stroke="url(#grad-amber)" strokeWidth="2.5" filter="url(#glow-amber)" />
            <circle cx="68" cy="80" r="4" fill="#ffffff" />
            
            {/* Hướng giật bụng lên trên */}
            <g className="animate-pulse">
              <path d="M 95 105 Q 75 92 75 65 M 70 73 L 75 65 L 82 71" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            
            <text x="100" y="190" textAnchor="middle" fill="#fde047" className="text-[11px] font-bold tracking-wider">
              GIẬT MẠNH VÀO TRONG & LÊN TRÊN
            </text>
          </svg>
        )

      case 'burns':
        return (
          <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto text-sky-400" aria-label="Hình minh họa xả nước mát lên vết bỏng">
            {renderDefs()}
            {/* Vòi nước kim loại */}
            <path d="M 40 30 L 95 30 L 95 55" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
            <rect x="87" y="52" width="16" height="6" rx="1" fill="#64748b" />
            
            {/* Dòng nước chảy mát lạnh */}
            <g filter="url(#glow-emerald)">
              <path d="M 91 60 L 91 135 M 95 60 L 95 140 M 99 60 L 99 135" fill="none" stroke="url(#grad-sky)" strokeWidth="2.5" strokeDasharray="12 6" className="animate-pulse" />
            </g>
            
            {/* Cánh tay bị bỏng */}
            <path d="M 50 145 L 135 125 L 165 145" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
            <path d="M 50 145 L 135 125 L 165 145" fill="none" stroke="url(#grad-emerald)" strokeWidth="6" strokeLinecap="round" />
            
            {/* Vết bỏng đỏ ửng */}
            <path d="M 85 133 Q 95 124 105 130" fill="none" stroke="#f43f5e" strokeWidth="4" filter="url(#glow-rose)" />
            
            <text x="100" y="190" textAnchor="middle" fill="#7dd3fc" className="text-[11px] font-bold tracking-wider">
              XỐI NƯỚC MÁT TRONG 10 - 20 PHÚT
            </text>
          </svg>
        )

      case 'stroke':
        return (
          <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto text-rose-400" aria-label="Hình minh họa quy tắc FAST nhận biết đột quỵ">
            {renderDefs()}
            {/* Đầu bệnh nhân */}
            <circle cx="100" cy="75" r="48" fill="#0f172a" stroke="url(#grad-rose)" strokeWidth="3" filter="url(#glow-rose)" />
            
            {/* Khuôn mặt đột quỵ */}
            <circle cx="82" cy="65" r="4.5" fill="#fda4af" /> {/* Mắt trái bình thường */}
            <path d="M 112 68 Q 118 63 124 68" fill="none" stroke="#f43f5e" strokeWidth="2.5" /> {/* Mắt phải sụp mí */}
            <path d="M 80 102 Q 100 112 114 94" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" /> {/* Miệng cười méo xệ */}
            
            {/* Đồng hồ thời gian vàng */}
            <g transform="translate(150, 135)" filter="url(#glow-emerald)">
              <circle cx="0" cy="0" r="20" fill="#0f172a" stroke="url(#grad-emerald)" strokeWidth="2.5" />
              <path d="M 0,-12 L 0,0 L 10,0" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            
            <text x="100" y="190" textAnchor="middle" fill="#fda4af" className="text-[11px] font-bold tracking-wider">
              FAST: MIỆNG MÉO - TAY YẾU - GIỌNG NGỌNG
            </text>
          </svg>
        )

      case 'snakebite':
        return (
          <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto text-emerald-500" aria-label="Hình minh họa sơ cứu rắn cắn">
            {renderDefs()}
            {/* Chi bị cắn đặt ngang */}
            <path d="M 25 110 L 175 110" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
            <path d="M 25 110 L 175 110" fill="none" stroke="url(#grad-emerald)" strokeWidth="6" strokeLinecap="round" />
            
            {/* Vết cắn nọc độc độc hại */}
            <circle cx="95" cy="110" r="3.5" fill="#f43f5e" filter="url(#glow-rose)" />
            <circle cx="105" cy="110" r="3.5" fill="#f43f5e" filter="url(#glow-rose)" />
            
            {/* Biểu tượng cấm rạch ga-rô */}
            <g transform="translate(100, 55)">
              <circle cx="0" cy="0" r="22" fill="none" stroke="#ef4444" strokeWidth="3" filter="url(#glow-rose)" />
              <line x1="-15" y1="-15" x2="15" y2="15" stroke="#ef4444" strokeWidth="3" />
              {/* Lưỡi dao bị gạch chéo */}
              <path d="M -10,10 L 10,-10" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />
            </g>
            
            <text x="100" y="190" textAnchor="middle" fill="#6ee7b7" className="text-[11px] font-bold tracking-wider">
              BẤT ĐỘNG CHI - CẤM RẠCH/HÚT NỌC
            </text>
          </svg>
        )

      case 'psychological':
        return (
          <svg viewBox="0 0 200 200" className="w-full max-w-[240px] h-auto text-teal-400" aria-label="Hình minh họa điều hòa nhịp thở sâu">
            {renderDefs()}
            {/* Vòng thở nhịp nhàng chuyển động */}
            <circle cx="100" cy="100" r="50" fill="none" stroke="url(#grad-teal)" strokeWidth="1.5" strokeDasharray="6 4" className="animate-spin" style={{ animationDuration: '20s' }} />
            <circle cx="100" cy="100" r="40" fill="rgba(13, 148, 136, 0.1)" stroke="url(#grad-teal)" strokeWidth="3.5" filter="url(#glow-emerald)" className="animate-pulse" style={{ animationDuration: '4s' }} />
            
            {/* Phổi biểu tượng */}
            <g transform="translate(100, 100)" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              {/* Phổi trái */}
              <path d="M -6,-15 C -20,-15 -25,-2 -25,12 C -25,22 -15,22 -6,12 C -6,5 -6,0 -6,-15 Z" />
              {/* Phổi phải */}
              <path d="M 6,-15 C 20,-15 25,-2 25,12 C 25,22 15,22 6,12 C 6,5 6,0 6,-15 Z" />
              {/* Khí quản */}
              <path d="M 0,-25 L 0,-15 M -4,-15 L 4,-15" strokeWidth="2" />
            </g>
            
            <text x="100" y="190" textAnchor="middle" fill="#99f6e4" className="text-[11px] font-bold tracking-wider">
              ĐIỀU HÒA HÍT THỞ SÂU (4-4-4)
            </text>
          </svg>
        )

      default:
        return (
          <div className="flex flex-col items-center justify-center text-slate-500 py-6">
            {/* Biểu tượng ống thở/trợ giúp nhấp nháy phát sáng */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="absolute w-20 h-20 bg-emerald-500/10 rounded-full animate-ping" />
              <div className="absolute w-16 h-16 bg-emerald-500/20 rounded-full animate-pulse" />
              <div className="relative z-10 w-12 h-12 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center">
                <HeartHandshake size={24} className="text-emerald-400" />
              </div>
            </div>
            
            <div className="accessibility-text text-sm font-bold text-slate-200 text-center">
              Trợ lý đang lắng nghe bạn...
            </div>
            <div className="text-xs text-slate-400 text-center mt-2 px-4 max-w-[280px] leading-relaxed">
              Vui lòng nhập triệu chứng hoặc nhấn nút micro để hiển thị sơ đồ hướng dẫn động tương ứng.
            </div>
          </div>
        )
    }
  }

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 h-full min-h-[220px]">
      {renderSVG()}
    </div>
  )
}
