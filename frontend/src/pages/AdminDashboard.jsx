import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Cpu, ClipboardList, CheckCircle2, ArrowUpRight, Edit, Lock, Unlock, Play, RotateCcw, Settings, AlertTriangle, Clock, XCircle, Download, User, Plus, Eye, X } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAdminOverview, getDoctors, updateProfile, registerUser, getMLflowRegistry } from '../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  // Data States
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [profileName, setProfileName] = useState(user.username || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'doctor' });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [registeredModels, setRegisteredModels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchOverview();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (activeTab === 'mlops') {
      fetchMLflowModels();
    }
  }, [activeTab]);

  const fetchMLflowModels = async () => {
    try {
      const data = await getMLflowRegistry();
      if (data.status === 'success') {
        setRegisteredModels(data.models);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
        <button className={`adm-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <User size={16} /> Profile
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
            {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'users' ? 'Quản lý người dùng' : activeTab === 'mlops' ? 'MLOps / Quản lý model' : activeTab === 'logs' ? 'Audit logs' : 'Admin Profile'}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Quản lý người dùng</h2>
                  <span style={{ fontSize: '12px', background: 'var(--color-background-success)', color: 'var(--color-text-success)', padding: '4px 10px', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid var(--color-border-success)' }}>
                    <CheckCircle2 size={14} /> Hệ thống hoạt động
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <input 
                  type="text" 
                  placeholder="Tìm tên, email..." 
                  className="form-input" 
                  style={{ flex: 1, maxWidth: '250px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select 
                  className="form-input" 
                  style={{ width: '150px' }}
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="doctor">Bác sĩ</option>
                  <option value="admin">Quản trị viên</option>
                  <option value="data_scientist">Data Scientist</option>
                </select>
                <div style={{ flex: 1 }}></div>
                <button className="btn-sm" onClick={() => setShowAddUser(!showAddUser)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#bfdbfe', color: '#1e40af', border: 'none', fontWeight: 500 }}>
                  <Plus size={16} /> Thêm người dùng
                </button>
              </div>

              {showAddUser && (
                <div className="card" style={{ marginBottom: '16px', background: 'var(--color-background-secondary)' }}>
                  <h3 style={{ fontSize: '14px', marginBottom: '12px', marginTop: 0 }}>Thêm tài khoản mới</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await registerUser({
                        username: newUser.username,
                        password: newUser.password,
                        role: newUser.role
                      });
                      alert('Thêm người dùng thành công!');
                      setShowAddUser(false);
                      setNewUser({ username: '', password: '', role: 'doctor' });
                      fetchDoctors(); // Refresh the table
                      fetchOverview(); // Refresh the stats
                    } catch (error) {
                      alert('Lỗi: Tên đăng nhập đã tồn tại hoặc có lỗi xảy ra.');
                    }
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Tên đăng nhập</label>
                        <input type="text" className="form-input" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Mật khẩu</label>
                        <input type="password" className="form-input" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Vai trò</label>
                        <select className="form-input" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                          <option value="doctor">Bác sĩ</option>
                          <option value="admin">Quản trị viên</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-sm" onClick={() => setShowAddUser(false)} style={{ background: 'transparent', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>Huỷ</button>
                      <button type="submit" className="btn-sm" style={{ background: 'var(--color-background-success)', color: 'var(--color-text-success)', border: 'none' }}>Xác nhận thêm</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="card" style={{ padding: 0 }}>
                <table className="tbl">
                  <colgroup><col style={{ width: '30%' }}/><col style={{ width: '25%' }}/><col style={{ width: '15%' }}/><col style={{ width: '15%' }}/><col style={{ width: '15%' }}/></colgroup>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                      <th style={{ background: 'transparent' }}>Người dùng</th>
                      <th style={{ background: 'transparent' }}>Email</th>
                      <th style={{ background: 'transparent' }}>Vai trò</th>
                      <th style={{ background: 'transparent' }}>Trạng thái</th>
                      <th style={{ background: 'transparent', textAlign: 'center' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.filter(doc => {
                      const matchesSearch = doc.username.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesRole = roleFilter === 'all' || doc.role === roleFilter;
                      return matchesSearch && matchesRole;
                    }).map(doc => {
                      const isDataScientist = doc.role === 'data_scientist' || doc.username.includes('ds') || doc.username.includes('minh');
                      const roleDisplay = isDataScientist ? 'Data Scientist' : doc.role === 'admin' ? 'Quản trị viên' : 'Bác sĩ';
                      const roleBadgeClass = isDataScientist ? 'badge-warning' : doc.role === 'admin' ? 'badge-danger' : 'badge-info';
                      const depDisplay = isDataScientist ? 'ML Team' : doc.role === 'admin' ? 'Ban Giám đốc' : 'Khoa Nội';

                      return (
                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar" style={{ background: '#dbeafe', color: '#1e40af', width: '36px', height: '36px', fontSize: '13px' }}>
                              {doc.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {doc.username.charAt(0).toUpperCase() + doc.username.slice(1)}
                              </p>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                {depDisplay}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{doc.username.toLowerCase()}@hospital.vn</td>
                        <td>
                          <span className={`badge ${roleBadgeClass}`} style={{ borderRadius: '4px' }}>{roleDisplay}</span>
                        </td>
                        <td>
                          {doc.is_active ? (
                            <span className="badge" style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '16px' }}>Hoạt động</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', fontWeight: 500 }}>Bị khoá</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <button className="btn-sm" onClick={() => setSelectedDoctor(doc)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--color-border-tertiary)', borderRadius: '4px', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                              <Edit size={14} />
                            </button>
                            <button className="btn-sm" style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--color-border-tertiary)', borderRadius: '4px', color: doc.is_active ? 'var(--color-text-danger)' : 'var(--color-text-success)', cursor: 'pointer' }}>
                              {doc.is_active ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {selectedDoctor && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="card" style={{ width: '500px', padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-background-secondary)' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}><User size={18} /> Hồ sơ Bác sĩ</h3>
                  <button onClick={() => setSelectedDoctor(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '10px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Họ tên</span>
                      <span style={{ fontWeight: 500, fontSize: '13px' }}>{selectedDoctor.username}</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '10px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Email</span>
                      <span style={{ color: 'var(--color-text-info)', fontSize: '13px' }}>{selectedDoctor.username}@hospital.vn</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '10px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Điện thoại</span>
                      <span style={{ fontSize: '13px' }}>+84 912 345 678</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '10px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Chuyên khoa</span>
                      <span style={{ fontSize: '13px' }}>Nội tiết — Đái tháo đường</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '10px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Tổng ca dự đoán</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-success)' }}>{selectedDoctor.predictions_made}</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '10px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Ngày tạo tài khoản</span>
                      <span style={{ fontSize: '13px' }}>{new Date(selectedDoctor.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Trạng thái</span>
                      {selectedDoctor.is_active ? <span className="badge badge-success">Hoạt động</span> : <span className="badge badge-danger">Đã khoá</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mlops' && (
            <div className="adm-page active">
              {registeredModels.length > 0 ? (
              <>
              <div className="stat-grid">
                <div className="stat-card">
                  <p className="stat-label">Model hiện tại</p>
                  <p className="stat-val">{registeredModels[0].version}</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-success)' }}>{registeredModels[0].algorithm} · {registeredModels[0].status}</p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">AUC-ROC</p>
                  <p className="stat-val">{registeredModels[0].auc_roc}</p>
                  <p className="stat-delta" style={{ color: 'var(--color-text-success)' }}>Latest version</p>
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
                      {registeredModels.map(model => (
                        <tr key={model.version}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{model.version}</td>
                          <td>{model.algorithm}</td>
                          <td style={{ color: model.status === 'Production' ? 'var(--color-text-success)' : 'inherit' }}>{model.auc_roc}</td>
                          <td>{model.recall}</td>
                          <td>
                            <span className={`badge ${model.status === 'Production' ? 'badge-success' : 'badge-neutral'}`}>
                              {model.status}
                            </span>
                          </td>
                        </tr>
                      ))}
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
                    { d: '05-18', a: 0.82, r: 0.70, l: 95 },
                    { d: '05-19', a: 0.84, r: 0.73, l: 87 },
                    { d: '05-20', a: 0.84, r: 0.73, l: 85 },
                    { d: '05-21', a: 0.83, r: 0.72, l: 88 }
                  ].map(item => (
                    <div key={item.d} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px 60px', gap: '12px', fontSize: '13px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>{item.d}</span>
                      <div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${item.a * 100}%`, background: 'var(--color-border-info)' }}></div></div>
                      <span style={{ textAlign: 'right' }}>{item.r}</span>
                      <span style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{item.l}ms</span>
                    </div>
                  ))}
                </div>
              </div>
              </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', flexDirection: 'column', color: 'var(--color-text-secondary)' }}>
                  <p>Đang tải dữ liệu từ MLflow...</p>
                </div>
              )}
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

          {activeTab === 'profile' && (
             <div className="card" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px' }}><User size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }}/> Hồ sơ cá nhân & công tác</h3>
                  {!isEditingProfile && (
                    <button className="btn-sm" onClick={() => setIsEditingProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                      <Edit size={14} /> Chỉnh sửa
                    </button>
                  )}
                </div>

                {!isEditingProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Họ tên</span>
                      <span style={{ fontWeight: 500, fontSize: '13px' }}>{user.username}</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Email</span>
                      <span style={{ color: 'var(--color-text-info)', fontSize: '13px' }}>{user.username}@drps.vn</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Điện thoại</span>
                      <span style={{ fontSize: '13px' }}>+84 901 234 567</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Đơn vị</span>
                      <span style={{ fontSize: '13px' }}>Ban CNTT — Bệnh viện Đa khoa</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Ngày tạo</span>
                      <span style={{ fontSize: '13px' }}>15/01/2024</span>
                    </div>
                    <div style={{ display: 'flex', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Vai trò</span>
                      <span className="badge badge-danger">Quản trị viên</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const updatedUser = { ...user, username: profileName };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setUser(updatedUser);
                    setIsEditingProfile(false);
                    alert('Profile updated successfully!');
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Họ và tên</label>
                        <input type="text" className="form-input" value={profileName} onChange={e => setProfileName(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Email</label>
                        <input type="email" className="form-input" value={`${user.username}@drps.vn`} disabled style={{ opacity: 0.6 }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Điện thoại</label>
                        <input type="text" className="form-input" defaultValue="+84 901 234 567" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Đơn vị</label>
                        <input type="text" className="form-input" defaultValue="Ban CNTT — Bệnh viện Đa khoa" />
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border-tertiary)', paddingTop: '16px', marginTop: '8px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-sm" onClick={() => setIsEditingProfile(false)} style={{ background: 'transparent', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>Huỷ</button>
                      <button type="submit" className="btn-sm" style={{ background: 'var(--color-background-info)', color: 'var(--color-text-info)', border: 'none' }}>Lưu thay đổi</button>
                    </div>
                  </form>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
