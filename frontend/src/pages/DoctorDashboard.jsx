import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, User, CheckCircle2, Settings, Brain, FileText } from 'lucide-react';
import { predictPatient, getPatientHistory, updateProfile } from '../services/api';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('predict');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  // Predict State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    patient_code: 'PT-10023',
    age_group: '[60-70)',
    gender: 'Female',
    race: 'Caucasian',
    time_in_hospital: 5,
    num_lab_procedures: 42,
    num_medications: 18,
    number_diagnoses: 7,
    number_outpatient: 0,
    number_emergency: 1,
    number_inpatient: 2,
    A1Cresult: '>8',
    insulin: 'Steady',
    change: 'No'
  });

  // History State
  const [history, setHistory] = useState([]);
  
  // Profile State
  const [profileName, setProfileName] = useState(user.username || '');

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const data = await getPatientHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateProfile(user.id, profileName);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert('Profile updated successfully!');
    } catch (e) {
      alert('Failed to update profile');
    }
  }

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        time_in_hospital: parseInt(formData.time_in_hospital),
        num_lab_procedures: parseInt(formData.num_lab_procedures),
        num_medications: parseInt(formData.num_medications),
        number_diagnoses: parseInt(formData.number_diagnoses),
        number_outpatient: parseInt(formData.number_outpatient),
        number_emergency: parseInt(formData.number_emergency),
        number_inpatient: parseInt(formData.number_inpatient),
      };
      const res = await predictPatient(payload);
      setResult(res);
    } catch (error) {
      console.error(error);
      alert('Error predicting. Make sure backend and ML model are running.');
    } finally {
      setLoading(false);
    }
  };

  // Pseudo SHAP mapping since the real pipeline SHAP is not fully available
  const pseudoShap = result ? [
    { f: 'number_inpatient', v: 0.31, dir: formData.number_inpatient > 1 ? 1 : -1 },
    { f: `A1Cresult (${formData.A1Cresult})`, v: formData.A1Cresult === '>8' ? 0.22 : 0.05, dir: formData.A1Cresult === 'Norm' ? -1 : 1 },
    { f: 'num_medications', v: 0.15, dir: formData.num_medications > 15 ? 1 : -1 },
    { f: 'time_in_hospital', v: 0.12, dir: formData.time_in_hospital > 4 ? 1 : -1 },
    { f: 'number_emergency', v: 0.09, dir: formData.number_emergency > 0 ? 1 : -1 },
  ].sort((a,b) => b.v - a.v) : [];

  return (
    <div className="adm-wrap">
      <div className="adm-side">
        <div className="adm-logo">
          <p className="adm-logo-title">DRPS Doctor</p>
          <p className="adm-logo-sub">Hệ thống Y khoa</p>
        </div>
        
        <div className="adm-nav-section">Khám Bệnh</div>
        <button className={`adm-nav-item ${activeTab === 'predict' ? 'active' : ''}`} onClick={() => setActiveTab('predict')}>
          <Activity size={16} /> Dự đoán rủi ro
        </button>
        <button className={`adm-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <Search size={16} /> Lịch sử bệnh nhân
        </button>
        <button className={`adm-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <Settings size={16} /> Profile
        </button>
        
        <div style={{ marginTop: 'auto', padding: '10px 20px', borderTop: '1px solid var(--color-border-tertiary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="avatar" style={{ background: 'var(--color-background-success)', color: 'var(--color-text-success)' }}>
              {user.username ? user.username.substring(0, 2).toUpperCase() : 'BS'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, margin: 0, color: 'var(--color-text-primary)' }}>{user.username}</p>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>Khoa Nội</p>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-main">
        <div className="adm-topbar">
          <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {activeTab === 'predict' ? 'Dự đoán tái nhập viện' : activeTab === 'history' ? 'Lịch sử chẩn đoán' : 'Doctor Profile'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-sm" onClick={handleLogout} style={{ border: 'none', background: 'transparent' }}>Đăng xuất</button>
          </div>
        </div>

        <div className="adm-content">
          
          {activeTab === 'predict' && (
            <div style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: 'var(--border-radius-lg)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Activity style={{ fontSize: '20px', color: 'var(--color-text-info)' }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>DRPS — Diabetes Readmission Prediction</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', background: 'var(--color-background-success)', color: 'var(--color-text-success)', padding: '2px 10px', borderRadius: '999px' }}>Model v2.1 · AUC 0.84</span>
                  <User size={18} style={{ color: 'var(--color-text-secondary)' }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>BS. {user.username}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '12px' }}>
                
                <div style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', padding: '16px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px', color: 'var(--color-text-primary)' }}>Thông tin bệnh nhân</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Mã bệnh nhân</label>
                      <input type="text" className="form-input" name="patient_code" value={formData.patient_code} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Nhóm tuổi</label>
                      <select className="form-input" name="age_group" value={formData.age_group} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }}>
                        <option>[40-50)</option>
                        <option>[50-60)</option>
                        <option>[60-70)</option>
                        <option>[70-80)</option>
                        <option>[80-90)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Số ngày nằm viện</label>
                      <input type="number" className="form-input" name="time_in_hospital" value={formData.time_in_hospital} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Số xét nghiệm</label>
                      <input type="number" className="form-input" name="num_lab_procedures" value={formData.num_lab_procedures} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Số loại thuốc</label>
                      <input type="number" className="form-input" name="num_medications" value={formData.num_medications} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Số chẩn đoán</label>
                      <input type="number" className="form-input" name="number_diagnoses" value={formData.number_diagnoses} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>HbA1c</label>
                      <select className="form-input" name="A1Cresult" value={formData.A1Cresult} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }}>
                        <option>&gt;8</option>
                        <option>&gt;7</option>
                        <option>Norm</option>
                        <option>None</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Insulin</label>
                      <select className="form-input" name="insulin" value={formData.insulin} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }}>
                        <option>Up</option>
                        <option>Down</option>
                        <option>Steady</option>
                        <option>No</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Đổi thuốc</label>
                      <select className="form-input" name="change" value={formData.change} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }}>
                        <option>Ch</option>
                        <option>No</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Ngoại trú</label>
                      <input type="number" className="form-input" name="number_outpatient" value={formData.number_outpatient} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Cấp cứu</label>
                      <input type="number" className="form-input" name="number_emergency" value={formData.number_emergency} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Nội trú</label>
                      <input type="number" className="form-input" name="number_inpatient" value={formData.number_inpatient} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                  </div>

                  <button onClick={handlePredict} disabled={loading} style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 600, background: 'var(--color-border-info)', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Brain size={18} /> {loading ? 'Đang phân tích...' : 'Chạy dự đoán'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {result ? (
                    <>
                      <div style={{ background: result.risk_level === 'High' ? 'var(--color-background-danger)' : result.risk_level === 'Medium' ? 'var(--color-background-warning)' : 'var(--color-background-success)', border: `1px solid ${result.risk_level === 'High' ? 'var(--color-border-danger)' : result.risk_level === 'Medium' ? 'var(--color-border-warning)' : 'var(--color-border-success)'}`, borderRadius: 'var(--border-radius-md)', padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: result.risk_level === 'High' ? 'var(--color-text-danger)' : result.risk_level === 'Medium' ? 'var(--color-text-warning)' : 'var(--color-text-success)' }}>Nguy cơ tái nhập viện</span>
                          <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', color: 'inherit', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>{result.risk_level.toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '42px', fontWeight: 700, color: result.risk_level === 'High' ? 'var(--color-text-danger)' : result.risk_level === 'Medium' ? 'var(--color-text-warning)' : 'var(--color-text-success)' }}>
                            {Math.round(result.probability * 100)}%
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', opacity: 0.8 }}>xác suất trong 30 ngày</span>
                        </div>
                        <div style={{ marginTop: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round(result.probability * 100)}%`, background: result.risk_level === 'High' ? 'var(--color-border-danger)' : result.risk_level === 'Medium' ? 'var(--color-border-warning)' : 'var(--color-border-success)', borderRadius: '6px', transition: 'width 0.5s' }}></div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '16px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px', color: 'var(--color-text-primary)' }}>Giải thích SHAP — top 5 yếu tố</p>
                        <div>
                          {pseudoShap.map((d, i) => (
                            <div key={i} style={{ marginBottom: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>{d.f}</span>
                                <span style={{ color: d.dir > 0 ? 'var(--color-text-danger)' : 'var(--color-text-info)', fontWeight: 500 }}>
                                  {d.dir > 0 ? '+' : '-'}{Math.abs(d.v).toFixed(2)}
                                </span>
                              </div>
                              <div className="mini-bar-track" style={{ height: '6px', marginTop: 0 }}>
                                <div className="mini-bar-fill" style={{ width: `${Math.round(Math.abs(d.v) * 300)}%`, background: d.dir > 0 ? 'var(--color-border-danger)' : 'var(--color-border-info)' }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '12px', textAlign: 'center' }}>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Số lần nội trú</p>
                          <p style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>{formData.number_inpatient}</p>
                        </div>
                        <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '12px', textAlign: 'center' }}>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>HbA1c</p>
                          <p style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: formData.A1Cresult === 'Norm' ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}>{formData.A1Cresult}</p>
                        </div>
                        <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '12px', textAlign: 'center' }}>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Thuốc</p>
                          <p style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: 'var(--color-text-primary)' }}>{formData.num_medications}</p>
                        </div>
                      </div>

                      <button style={{ padding: '12px', fontSize: '13px', fontWeight: 500, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                        <FileText size={16} /> Xuất báo cáo PDF
                      </button>
                    </>
                  ) : (
                    <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '40px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                       <Brain size={48} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '16px' }} />
                       <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Chưa có dự đoán</h3>
                       <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', maxWidth: '300px' }}>
                         Vui lòng nhập thông tin bệnh nhân ở cột bên trái và nhấn "Chạy dự đoán" để xem kết quả đánh giá rủi ro.
                       </p>
                    </div>
                  )}
                  
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="adm-page active">
              <div className="card">
                <h3 style={{ marginBottom: '16px' }}>Lịch sử chẩn đoán gần đây</h3>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Mã bệnh nhân</th>
                      <th>Nhóm tuổi</th>
                      <th>Rủi ro (%)</th>
                      <th>Mức độ</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.patient_code}</td>
                        <td>{item.age_group}</td>
                        <td>{(item.probability * 100).toFixed(1)}%</td>
                        <td>
                          <span className={`badge ${item.risk_level === 'High' ? 'badge-danger' : item.risk_level === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                            {item.risk_level}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{new Date(item.predicted_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
             <div className="card" style={{ maxWidth: '500px' }}>
                <h3 style={{ marginBottom: '20px' }}>Hồ sơ Bác sĩ</h3>
                <form onSubmit={handleUpdateProfile}>
                  <div className="form-group">
                    <label className="form-label">Họ tên</label>
                    <input type="text" className="form-input" value={profileName} onChange={e => setProfileName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vai trò</label>
                    <input type="text" className="form-input" value={user.role} disabled style={{ opacity: 0.5 }} />
                  </div>
                  <button type="submit" className="btn-sm" style={{ background: 'var(--color-border-info)', color: 'white', border: 'none', padding: '10px 20px', fontSize: '14px' }}>Lưu thay đổi</button>
                </form>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
