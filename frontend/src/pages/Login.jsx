import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, setupUsers } from '../services/api';
import { Activity, ShieldCheck, Zap, Server } from 'lucide-react';

export default function LandingPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập!');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu!');
      return;
    }
    if (password.length < 5) {
      setError('Mật khẩu phải có ít nhất 5 ký tự!');
      return;
    }

    setLoading(true);
    
    try {
      const user = await loginUser(username, password);
      localStorage.setItem('user', JSON.stringify(user));
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/doctor');
      }
    } catch (err) {
      setError('Tài khoản hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      await setupUsers();
      alert("Đã tạo user demo thành công. Dùng tài khoản admin/admin hoặc doctor/doctor");
    } catch (e) {
      alert("Lỗi khi tạo user demo");
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#f9fafb' }}>
      
      {/* Left Side: System Overview */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', color: 'white', padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Activity size={40} color="#60a5fa" />
          <h1 style={{ fontSize: '32px', margin: 0, fontWeight: 700 }}>Hệ thống DRPS</h1>
        </div>
        
        <h2 style={{ fontSize: '48px', fontWeight: 800, lineHeight: 1.2, marginBottom: '24px' }}>
          Dự đoán nguy cơ tái nhập viện thời gian thực
        </h2>
        
        <p style={{ fontSize: '18px', color: '#bfdbfe', lineHeight: 1.6, marginBottom: '40px', maxWidth: '600px' }}>
          Hệ thống ứng dụng Machine Learning phân tích dữ liệu bệnh án điện tử, hỗ trợ bác sĩ đưa ra quyết định lâm sàng chính xác tại điểm chăm sóc (point-of-care).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '24px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
             <Zap size={24} color="#60a5fa" style={{ marginBottom: '12px' }} />
             <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Xử lý tức thời</h3>
             <p style={{ fontSize: '14px', color: '#bfdbfe', margin: 0 }}>Kết quả trả về dưới 100ms thông qua kiến trúc FastAPI hiệu năng cao.</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '24px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
             <ShieldCheck size={24} color="#34d399" style={{ marginBottom: '12px' }} />
             <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Chính xác cao</h3>
             <p style={{ fontSize: '14px', color: '#bfdbfe', margin: 0 }}>AUC-ROC đạt mức &gt;0.8, tối ưu hóa Recall để không bỏ sót bệnh nhân rủi ro cao.</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '24px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
             <Server size={24} color="#fbbf24" style={{ marginBottom: '12px' }} />
             <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Tích hợp MLOps</h3>
             <p style={{ fontSize: '14px', color: '#bfdbfe', margin: 0 }}>Tự động tracking phiên bản model và lưu trữ metadata bằng MLflow.</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div style={{ width: '450px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', boxShadow: '-10px 0 30px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Đăng nhập</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Vui lòng đăng nhập để sử dụng hệ thống DRPS</p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#4b5563', marginBottom: '6px' }}>Tên đăng nhập</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#4b5563', marginBottom: '6px' }}>Mật khẩu</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', transition: 'all 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            {error && <div style={{ color: '#dc2626', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
            
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: '#2563eb', color: 'white', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '8px' }}>
              {loading ? 'Đang xử lý...' : 'Đăng nhập vào hệ thống'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
             <button onClick={handleSetup} style={{ background: 'transparent', color: '#9ca3af', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
               Khởi tạo tài khoản Demo
             </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
