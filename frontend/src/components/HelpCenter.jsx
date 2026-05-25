import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, FileText, Brain, AlertTriangle } from 'lucide-react';

const HelpCenter = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      icon: <Brain size={18} style={{ color: 'var(--color-text-info)' }} />,
      question: "Hệ thống DRPS là gì?",
      answer: "DRPS (Diabetes Readmission Prediction System) là hệ thống Ứng dụng Trí tuệ Nhân tạo hỗ trợ Bác sĩ dự đoán nguy cơ tái nhập viện trong vòng 30 ngày của bệnh nhân đái tháo đường. Hệ thống sử dụng mô hình Random Forest kết hợp với MLflow để quản lý vòng đời và độ chính xác của dự đoán."
    },
    {
      icon: <AlertTriangle size={18} style={{ color: 'var(--color-text-danger)' }} />,
      question: "Ý nghĩa của các mức Nguy cơ (Thấp, Trung bình, Cao)?",
      answer: "Hệ thống chia mức độ rủi ro dựa trên xác suất do AI tính toán: \n- Dưới 40%: Nguy cơ Thấp (Bệnh nhân an toàn xuất viện). \n- 40% - 69%: Nguy cơ Trung bình (Cần theo dõi thêm). \n- Từ 70% trở lên: Nguy cơ Cao (Cảnh báo đỏ, bác sĩ nên xem xét can thiệp y tế hoặc điều chỉnh phác đồ điều trị trước khi cho bệnh nhân xuất viện)."
    },
    {
      icon: <FileText size={18} style={{ color: 'var(--color-text-warning)' }} />,
      question: "Biểu đồ SHAP (Top 5 yếu tố) là gì?",
      answer: "SHAP (SHapley Additive exPlanations) là công cụ giúp giải thích 'TẠI SAO' AI lại đưa ra kết quả dự đoán đó. \n- Thanh màu đỏ (+): Là yếu tố Đẩy nguy cơ nhập viện LÊN CAO. \n- Thanh màu xanh (-): Là yếu tố Kéo nguy cơ nhập viện XUỐNG THẤP. \n- Chiều dài của thanh biểu thị mức độ tác động mạnh hay yếu của yếu tố đó."
    },
    {
      icon: <HelpCircle size={18} style={{ color: 'var(--color-text-success)' }} />,
      question: "Các chỉ số y khoa đầu vào (HbA1c, Đổi thuốc,...) nghĩa là gì?",
      answer: "- HbA1c: Mức độ đường huyết trung bình trong 2-3 tháng qua. \n- Đổi thuốc (Change): Bệnh nhân có được đổi phác đồ thuốc tiểu đường hay không (Ch = Có, No = Không). \n- Số lần nội trú/ngoại trú: Lịch sử số lần đến bệnh viện của bệnh nhân trong năm trước đó."
    },
    {
      icon: <FileText size={18} style={{ color: 'var(--color-text-secondary)' }} />,
      question: "Làm sao để In Báo cáo PDF?",
      answer: "Sau khi thực hiện chức năng 'Chạy dự đoán', một nút 'Xuất báo cáo PDF' sẽ hiện ra ở góc dưới cùng bên phải. Bấm vào nút đó, hệ thống sẽ tự động dọn dẹp các thanh menu dư thừa và định dạng lại trang để In hoặc Lưu dưới dạng file PDF chuẩn Y khoa."
    }
  ];

  return (
    <div className="adm-page active" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px', padding: '20px' }}>
        <HelpCircle size={48} style={{ color: 'var(--color-text-info)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', margin: '0 0 8px' }}>Trung tâm Trợ giúp DRPS</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: 0 }}>
          Tìm hiểu cách vận hành và giải thích các chỉ số của Hệ thống Trí tuệ Nhân tạo.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className="card" 
              style={{ 
                cursor: 'pointer', 
                border: isOpen ? '1px solid var(--color-border-info)' : '1px solid var(--color-border-tertiary)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {faq.icon}
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 500, color: isOpen ? 'var(--color-text-info)' : 'var(--color-text-primary)' }}>
                    {faq.question}
                  </h3>
                </div>
                {isOpen ? <ChevronUp size={20} style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--color-text-secondary)' }} />}
              </div>
              
              {isOpen && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-tertiary)' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default HelpCenter;
