import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Cpu, ClipboardList, CheckCircle2, ArrowUpRight, Edit, Lock, Unlock, Play, RotateCcw, Settings, AlertTriangle, Clock, XCircle, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAdminOverview, getDoctors, updateProfile } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  // Data States
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [profileName, setProfileName] = useState(user.username || '');

  useEffect(() => {
    fetchOverview();
    fetchDoctors();
  }, []);

  const fetchOverview = async () => {
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (error) {
      console.error("Failed to fetch overview", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error("Failed to fetch doctors", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="adm-wrap">
      <div className="adm-side">
        <div className="adm-logo">
          <p className="adm-logo-title">DRPS Admin</p>
          <p className="adm-logo-sub">Quản trị hệ thống</p>
        </div>
        
        <div className="adm-nav-section">Tổng quan</div>
        <button className={`adm-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={16} /> Dashboard
        </button>
        
        <div className="adm-nav-section">Quản lý</div>
        <button className={`adm-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} /> Người dùng
        </button>
        <button className={`adm-nav-item ${activeTab === 'mlops' ? 'active' : ''}`} onClick={() => setActiveTab('mlops')}>
          <Cpu size={16} /> MLOps / Model
        </button>
        <button className={`adm-nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <ClipboardList size={16} /> Audit logs
        </button>
        
        <div style={{ marginTop: 'auto', padding: '10px 20px', borderTop: '1px solid var(--color-border-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar">AD</div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>{user.username}</p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>admin@drps.vn</p>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-main">
        <div className="adm-topbar">
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'users' ? 'Quản lý người dùng' : activeTab === 'mlops' ? 'MLOps / Quản lý model' : 'Audit logs'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', background: 'var(--color-background-success)', color: 'var(--color-text-success)', padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Hệ thống hoạt động
            </span>
            <button className="btn-sm" onClick={handleLogout} style={{ border: 'none', background: 'transparent' }}>Đăng xuất</button>
          </div>
        </div>

        <div className="adm-content">
          
          {activeTab === 'dashboard' && overview && (
            <div className="adm-page active">
              <div className="stat-grid">
                <div className="stat-card">
                  <p className="stat-label">Tổng người dùng</p>
                  <p className="stat-val">{doctors.length}</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-success)' }}>Bao gồm bác sĩ & admin</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Tổng lượt dự đoán</p>
                  <p className="stat-val">{overview.total_predictions}</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-success)' }}>Hoạt động ổn định</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Model đang dùng</p>
                  <p className="stat-val">{overview.active_model.split('_')[0]}</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-secondary)' }}>AUC {overview.auc.toFixed(2)}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Cảnh báo rủi ro cao</p>
                  <p className="stat-val" style={{ color: 'var(--color-text-danger)' }}>{overview.high_risk_percentage}%</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-danger)' }}>Tỉ lệ trong tổng dự đoán</p>
                </div>
              </div>

              <div className="row3">
                <div className="card">
                  <p className="card-title" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Hoạt động dự đoán 7 ngày gần đây</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { d: 'T2', v: 142 }, { d: 'T3', v: 165 }, { d: 'T4', v: 158 },
                      { d: 'T5', v: 187 }, { d: 'T6', v: 171 }, { d: 'T7', v: 134 }, { d: 'CN', v: 96 }
                    ].map(item => (
                      <div key={item.d} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 500, width: '20px' }}>{item.d}</span>
                        <div style={{ flex: 1, background: 'var(--color-background-tertiary)', height: '12px', borderRadius: '4px' }}>
                          <div style={{ width: `${(item.v / 200) * 100}%`, height: '100%', background: 'var(--color-border-info)', borderRadius: '4px' }}></div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, width: '30px', textAlign: 'right' }}>{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <p className="card-title" style={{ fontSize: '14px', fontWeight: 600 }}>Phân bố mức rủi ro</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Thấp (&lt;40%)</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{Math.round(overview.total_predictions * (100 - overview.high_risk_percentage - 20) / 100)}</span>
                      </div>
                      <div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${100 - overview.high_risk_percentage - 20}%`, background: 'var(--color-border-success)' }}></div></div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Trung bình (40-70%)</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{Math.round(overview.total_predictions * 0.2)}</span>
                      </div>
                      <div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `20%`, background: 'var(--color-border-warning)' }}></div></div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Cao (&gt;70%)</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-danger)' }}>{Math.round(overview.total_predictions * (overview.high_risk_percentage) / 100)}</span>
                      </div>
                      <div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${overview.high_risk_percentage}%`, background: 'var(--color-border-danger)' }}></div></div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-border-tertiary)', marginTop: '20px', paddingTop: '16px' }}>
                    <p className="card-title" style={{ marginBottom: '10px', fontSize: '13px', fontWeight: 600 }}>Trạng thái model</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Data drift (PSI)</span>
                      <span style={{ color: 'var(--color-text-success)', fontWeight: 500 }}>0.08 — OK</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Latency trung bình</span>
                      <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>87ms</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Uptime tháng này</span>
                      <span style={{ color: 'var(--color-text-success)', fontWeight: 500 }}>99.7%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <p className="card-title" style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Hoạt động gần đây</p>
                <div className="log-row">
                  <div className="log-dot" style={{ background: 'var(--color-border-info)' }}></div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>Dr. Nguyễn Văn A chạy dự đoán — BN #1042 · rủi ro 78%</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>2 phút trước</span>
                  </div>
                </div>
                <div className="log-row">
                  <div className="log-dot" style={{ background: 'var(--color-border-success)' }}></div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>Model v2.1 được deploy thành công bởi ds_minh</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>1 giờ trước</span>
                  </div>
                </div>
                <div className="log-row">
                  <div className="log-dot" style={{ background: 'var(--color-border-warning)' }}></div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>Dr. Trần Thị B xuất báo cáo PDF — BN #998</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>3 giờ trước</span>
                  </div>
                </div>
                <div className="log-row">
                  <div className="log-dot" style={{ background: 'var(--color-border-danger)' }}></div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500 }}>Đăng nhập thất bại 3 lần liên tiếp — IP 192.168.1.54</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>5 giờ trước</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="adm-page active">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Danh sách Bác sĩ</h2>
              </div>

              <div className="card" style={{ padding: 0 }}>
                <table className="tbl">
                  <colgroup><col style={{ width: '10%' }}/><col style={{ width: '30%' }}/><col style={{ width: '20%' }}/><col style={{ width: '20%' }}/><col style={{ width: '20%' }}/></colgroup>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Người dùng</th>
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                      <th>Lượt khám</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(doc => (
                      <tr key={doc.id}>
                        <td style={{ color: 'var(--color-text-secondary)' }}>#{doc.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="avatar" style={{ background: doc.is_active ? 'var(--color-background-success)' : 'var(--color-background-danger)', color: doc.is_active ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}>
                              {doc.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>{doc.username}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-info">Bác sĩ</span></td>
                        <td>
                          {doc.is_active ? (
                            <span className="badge badge-success">Hoạt động</span>
                          ) : (
                            <span className="badge badge-danger">Đã khoá</span>
                          )}
                        </td>
                        <td><span style={{ fontWeight: 500 }}>{doc.predictions_made}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'mlops' && (
            <div className="adm-page active">
              <div className="stat-grid">
                <div className="stat-card">
                  <p className="stat-label">Model hiện tại</p>
                  <p className="stat-val">v2.1</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-success)' }}>XGBoost · Production</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">AUC-ROC</p>
                  <p className="stat-val">0.84</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-success)' }}>+0.03 vs v2.0</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Data drift (PSI)</p>
                  <p className="stat-val">0.08</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-success)' }}>Ngưỡng: 0.20</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Lần retrain cuối</p>
                  <p className="stat-val">3 ngày</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-secondary)' }}>2026-05-19</p>
                </div>
              </div>

              <div className="row2">
                <div className="card">
                  <p className="card-title" style={{ fontSize: '14px', fontWeight: 600 }}>Lịch sử các phiên bản model</p>
                  <table className="tbl" style={{ marginTop: '10px' }}>
                    <colgroup><col style={{ width: '18%' }}/><col style={{ width: '22%' }}/><col style={{ width: '18%' }}/><col style={{ width: '18%' }}/><col style={{ width: '24%' }}/></colgroup>
                    <thead><tr>
                      <th>Phiên bản</th><th>Thuật toán</th><th>AUC-ROC</th><th>Recall</th><th>Trạng thái</th>
                    </tr></thead>
                    <tbody>
                      <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>v2.1</td><td>XGBoost</td><td style={{ color: 'var(--color-text-success)' }}>0.84</td><td>0.73</td><td><span className="badge badge-success">Production</span></td></tr>
                      <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>v2.0</td><td>XGBoost</td><td>0.81</td><td>0.69</td><td><span className="badge badge-neutral">Archived</span></td></tr>
                      <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>v1.5</td><td>Random Forest</td><td>0.79</td><td>0.65</td><td><span className="badge badge-neutral">Archived</span></td></tr>
                      <tr><td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>v1.0</td><td>Logistic Reg.</td><td>0.74</td><td>0.61</td><td><span className="badge badge-neutral">Archived</span></td></tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="card">
                  <p className="card-title" style={{ fontSize: '14px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    Điều khiển MLOps
                    <a href="http://localhost:5000" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--color-text-info)', fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Mở MLflow <ArrowUpRight size={14} />
                    </a>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                    <button className="btn-sm" style={{ padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => alert('Mockup: Pipeline retrain đang được kích hoạt...')}>
                      <Play style={{ color: 'var(--color-text-success)' }} size={20} />
                      <div><p style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Kích hoạt retrain</p><p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>Chạy pipeline huấn luyện mới</p></div>
                    </button>
                    <button className="btn-sm" style={{ padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => alert('Mockup: Mở giao diện Rollback')}>
                      <RotateCcw style={{ color: 'var(--color-text-warning)' }} size={20} />
                      <div><p style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Rollback model ↗</p><p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>Quay về phiên bản trước</p></div>
                    </button>
                    <button className="btn-sm" style={{ padding: '12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => alert('Mockup: Mở giao diện cấu hình Threshold')}>
                      <Settings style={{ color: 'var(--color-text-info)' }} size={20} />
                      <div><p style={{ margin: 0, fontWeight: 600, fontSize: '13px' }}>Cấu hình drift threshold ↗</p><p style={{ margin: 0, fontSize: '11px', color: 'var(--color-text-secondary)' }}>PSI hiện tại: 0.20</p></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <p className="card-title" style={{ fontSize: '14px', fontWeight: 600 }}>Theo dõi hiệu suất model theo ngày</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px 60px', gap: '12px', fontSize: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }}>
                    <span>Ngày</span><span>AUC-ROC</span><span style={{ textAlign: 'right' }}>Recall</span><span style={{ textAlign: 'right' }}>Latency</span>
                  </div>
                  {[
                    { label: 'T2 2026-05-22', auc: 0.84, rec: 0.73, lat: 85 },
                    { label: 'CN 2026-05-21', auc: 0.83, rec: 0.72, lat: 91 },
                    { label: 'T7 2026-05-20', auc: 0.84, rec: 0.74, lat: 88 },
                    { label: 'T6 2026-05-19', auc: 0.82, rec: 0.71, lat: 94 },
                    { label: 'T5 2026-05-18', auc: 0.83, rec: 0.70, lat: 87 }
                  ].map((m, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px 60px', gap: '12px', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{m.label}</span>
                      <div style={{ background: 'var(--color-background-secondary)', borderRadius: '4px', height: '8px' }}>
                        <div style={{ width: `${Math.round(m.auc * 100)}%`, height: '100%', background: 'var(--color-border-success)', borderRadius: '4px' }}></div>
                      </div>
                      <span style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.rec.toFixed(2)}</span>
                      <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{m.lat}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="adm-page active">
              <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                <ClipboardList size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <h3>Tính năng đang phát triển</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  Hệ thống Audit Logs thực tế sẽ được ra mắt trong phiên bản cập nhật tiếp theo.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
