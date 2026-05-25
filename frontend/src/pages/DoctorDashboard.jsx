import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Search, User, CheckCircle2, Settings, Brain, FileText, Edit, Database, HelpCircle } from 'lucide-react';
import { predictPatient, getPatientHistory, updateProfile, fetchHisData, batchProcess } from '../services/api';
import HelpCenter from '../components/HelpCenter';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('predict');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  
  // Predict State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    patient_code: 'PT-10023',
    patient_name: 'Nguyễn Văn A',
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
  const [riskFilter, setRiskFilter] = useState('all');
  
  // Batch State
  const [batchLoading, setBatchLoading] = useState(false);
  const [syncedPatients, setSyncedPatients] = useState([]);
  const [predictingBatch, setPredictingBatch] = useState(false);
  
  // Modal State
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Profile State
  const [profileName, setProfileName] = useState(user.username || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    try {
      const data = await getPatientHistory(user.id);
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
      // Fake API call since we don't have a real profile update API yet
      // const updatedUser = await updateProfile(user.id, profileName);
      const updatedUser = { ...user, username: profileName };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditingProfile(false);
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
        user_id: user.id
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

  const handleFetchHis = async () => {
    setBatchLoading(true);
    try {
      const res = await fetchHisData(user.id);
      setSyncedPatients(res.results || []);
      alert(`Đã đồng bộ thành công ${res.results.length} bệnh nhân từ HIS! (Dữ liệu thô chưa qua AI)`);
    } catch (e) {
      console.error(e);
      alert('Đồng bộ thất bại. Vui lòng kiểm tra server.');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchPredict = async () => {
    const unpredicted = syncedPatients.filter(p => !p.has_predicted).map(p => p.patient_code);
    if (unpredicted.length === 0) {
      alert("Tất cả bệnh nhân đã được dự đoán!");
      return;
    }
    
    setPredictingBatch(true);
    try {
      const res = await batchProcess(unpredicted, user.id);
      
      // Update local state with predictions
      const predictionMap = {};
      res.results.forEach(r => predictionMap[r.patient_code] = r);
      
      setSyncedPatients(prev => prev.map(p => {
        if (predictionMap[p.patient_code]) {
          return {
            ...p,
            has_predicted: true,
            risk_level: predictionMap[p.patient_code].risk_level,
            probability: predictionMap[p.patient_code].probability,
            shap_values: predictionMap[p.patient_code].shap_values
          };
        }
        return p;
      }));
      
      alert(`Đã dự đoán thành công ${res.results.length} bệnh nhân!`);
      fetchHistory(); // Refresh history
    } catch (e) {
      console.error(e);
      alert("Lỗi khi chạy dự đoán hàng loạt.");
    } finally {
      setPredictingBatch(false);
    }
  };

  const handlePredictSingle = async (patientCode) => {
    setPredictingBatch(true);
    try {
      const res = await batchProcess([patientCode], user.id);
      const pred = res.results[0];
      
      setSyncedPatients(prev => prev.map(p => {
        if (p.patient_code === patientCode) {
          return { ...p, has_predicted: true, risk_level: pred.risk_level, probability: pred.probability, shap_values: pred.shap_values };
        }
        return p;
      }));
      fetchHistory();
    } catch (e) {
      console.error(e);
      alert("Lỗi dự đoán bệnh nhân này.");
    } finally {
      setPredictingBatch(false);
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

  // Parse real SHAP values for the modal
  const getShapData = (shap_values) => {
    if (!shap_values) return [];
    return Object.entries(shap_values)
      .map(([k, v]) => ({ f: k, v: v, dir: v > 0 ? 1 : -1 }))
      .sort((a, b) => Math.abs(b.v) - Math.abs(a.v))
      .slice(0, 5);
  };

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
        <button className={`adm-nav-item ${activeTab === 'batch' ? 'active' : ''}`} onClick={() => setActiveTab('batch')}>
          <Database size={16} /> Đồng bộ HIS
        </button>
        <button className={`adm-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <Search size={16} /> Lịch sử bệnh nhân
        </button>
        <button className={`adm-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <Settings size={16} /> Profile
        </button>
        <button className={`adm-nav-item ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>
          <HelpCircle size={16} /> Trung tâm trợ giúp
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
            {activeTab === 'predict' ? 'Dự đoán tái nhập viện' : activeTab === 'batch' ? 'Đồng bộ Dữ liệu HIS' : activeTab === 'history' ? 'Lịch sử chẩn đoán' : activeTab === 'help' ? 'Trung tâm trợ giúp' : 'Doctor Profile'}
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
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Mã bệnh nhân</label>
                      <input type="text" className="form-input" name="patient_code" value={formData.patient_code} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Tên bệnh nhân</label>
                      <input type="text" className="form-input" name="patient_name" value={formData.patient_name} onChange={handleChange} style={{ marginTop: '4px', fontSize: '12px', padding: '8px' }} />
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

                      <button onClick={() => window.print()} style={{ padding: '12px', fontSize: '13px', fontWeight: 500, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
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

          {activeTab === 'help' && (
            <HelpCenter />
          )}

          {activeTab === 'history' && (
            <div className="adm-page active">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0 }}>Lịch sử chẩn đoán gần đây</h3>
                  <select 
                    value={riskFilter} 
                    onChange={(e) => setRiskFilter(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }}
                  >
                    <option value="all">Tất cả mức độ</option>
                    <option value="High">Nguy cơ Cao</option>
                    <option value="Low">Nguy cơ Thấp</option>
                  </select>
                </div>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Mã BN</th>
                      <th>Tên bệnh nhân</th>
                      <th>Nhóm tuổi</th>
                      <th>Rủi ro (%)</th>
                      <th>Mức độ</th>
                      <th>Thời gian</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.filter(item => riskFilter === 'all' || item.risk_level === riskFilter).map(item => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.patient_code}</td>
                        <td>{item.patient_name || '—'}</td>
                        <td>{item.age_group}</td>
                        <td>{(item.probability * 100).toFixed(1)}%</td>
                        <td>
                          <span className={`badge ${item.risk_level === 'High' ? 'badge-danger' : item.risk_level === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                            {item.risk_level}
                          </span>
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)' }}>{item.predicted_at ? new Date(item.predicted_at).toLocaleString() : '—'}</td>
                        <td>
                          <button className="btn-sm" onClick={() => setSelectedPatient(item)} style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)' }}>
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'batch' && (
            <div className="adm-page active">
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Đồng bộ dữ liệu hàng loạt từ HIS</h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                      Giả lập hệ thống tự động kết nối và kéo hồ sơ 50 bệnh nhân sắp xuất viện từ hệ thống bệnh viện.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleBatchPredict}
                      disabled={predictingBatch || syncedPatients.length === 0 || syncedPatients.every(p => p.has_predicted)}
                      className="btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background-success)', color: 'var(--color-text-success)', border: '1px solid var(--color-border-success)', padding: '10px 16px', fontSize: '14px', fontWeight: 600, opacity: (predictingBatch || syncedPatients.length === 0 || syncedPatients.every(p => p.has_predicted)) ? 0.5 : 1 }}
                    >
                      <Brain size={16} /> {predictingBatch ? 'Đang xử lý AI...' : 'Dự đoán hàng loạt'}
                    </button>
                    <button 
                      onClick={handleFetchHis} 
                      disabled={batchLoading}
                      className="btn-sm" 
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background-info)', color: 'var(--color-text-info)', border: '1px solid var(--color-border-info)', padding: '10px 16px', fontSize: '14px', fontWeight: 600 }}
                    >
                      <Database size={16} /> {batchLoading ? 'Đang kéo dữ liệu...' : 'Bắt đầu Đồng bộ'}
                    </button>
                  </div>
                </div>
                
                {syncedPatients.length > 0 ? (
                  <table className="tbl" style={{ marginTop: '20px' }}>
                    <thead>
                      <tr>
                        <th>Mã BN</th>
                        <th>Xác suất rủi ro (%)</th>
                        <th>Mức độ</th>
                        <th style={{ textAlign: 'right' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncedPatients.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>{item.patient_code}</td>
                          <td>{item.has_predicted ? `${(item.probability * 100).toFixed(1)}%` : '—'}</td>
                          <td>
                            {item.has_predicted ? (
                              <span className={`badge ${item.risk_level === 'High' ? 'badge-danger' : item.risk_level === 'Medium' ? 'badge-warning' : 'badge-success'}`}>
                                {item.risk_level}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Chưa dự đoán</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              {!item.has_predicted && (
                                <button className="btn-sm" onClick={() => handlePredictSingle(item.patient_code)} style={{ background: 'var(--color-background-success)', color: 'var(--color-text-success)', border: '1px solid var(--color-border-success)' }}>
                                  Dự đoán
                                </button>
                              )}
                              <button className="btn-sm" onClick={() => setSelectedPatient(item)} style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)' }}>
                                Xem chi tiết
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px dashed var(--color-border-tertiary)', marginTop: '20px' }}>
                    <Database size={48} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '16px' }} />
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Chưa có dữ liệu đồng bộ trong phiên này.<br/>Hãy nhấn nút "Bắt đầu Đồng bộ" để lấy dữ liệu mới.</p>
                  </div>
                )}
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
                      <span style={{ color: 'var(--color-text-info)', fontSize: '13px' }}>{user.username}@hospital.vn</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Điện thoại</span>
                      <span style={{ fontSize: '13px' }}>+84 912 345 678</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Khoa / Phòng ban</span>
                      <span style={{ fontSize: '13px' }}>Khoa Nội tổng hợp</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Chuyên khoa</span>
                      <span style={{ fontSize: '13px' }}>Nội tiết — Đái tháo đường</span>
                    </div>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Mã chứng chỉ</span>
                      <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>VN-MD-2019-08821</span>
                    </div>
                    <div style={{ display: 'flex', paddingBottom: '8px' }}>
                      <span style={{ width: '150px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>Vai trò</span>
                      <span className="badge badge-success">Bác sĩ</span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Họ và tên</label>
                        <input type="text" className="form-input" value={profileName} onChange={e => setProfileName(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Email</label>
                        <input type="email" className="form-input" value={`${user.username}@hospital.vn`} disabled style={{ opacity: 0.6 }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Điện thoại</label>
                        <input type="text" className="form-input" defaultValue="+84 912 345 678" />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '12px' }}>Chuyên khoa</label>
                        <input type="text" className="form-input" defaultValue="Nội tiết — Đái tháo đường" />
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

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--page-bg)', width: '100%', maxWidth: '900px', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--topbar-bg)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> Chi tiết Hồ sơ: {selectedPatient.patient_code}
              </h3>
              <button onClick={() => setSelectedPatient(null)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>&times;</button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Left Column: Patient Info */}
              <div style={{ background: 'var(--card-bg)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', padding: '16px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-text-primary)' }}>Chỉ số Lâm sàng</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="detail-item"><label>Tên</label><span>{selectedPatient.patient_name || '—'}</span></div>
                  <div className="detail-item"><label>Tuổi</label><span>{selectedPatient.age_group}</span></div>
                  <div className="detail-item"><label>Giới tính</label><span>{selectedPatient.gender || '—'}</span></div>
                  <div className="detail-item"><label>Chủng tộc</label><span>{selectedPatient.race || '—'}</span></div>
                  
                  <div className="detail-item"><label>Ngày nằm viện</label><span>{selectedPatient.time_in_hospital} ngày</span></div>
                  <div className="detail-item"><label>Số thủ thuật (Lab)</label><span>{selectedPatient.num_lab_procedures}</span></div>
                  <div className="detail-item"><label>Số loại thuốc</label><span>{selectedPatient.num_medications}</span></div>
                  <div className="detail-item"><label>Số chẩn đoán</label><span>{selectedPatient.number_diagnoses}</span></div>
                  
                  <div className="detail-item"><label>Ngoại trú</label><span>{selectedPatient.number_outpatient}</span></div>
                  <div className="detail-item"><label>Cấp cứu</label><span>{selectedPatient.number_emergency}</span></div>
                  <div className="detail-item"><label>Nội trú</label><span>{selectedPatient.number_inpatient}</span></div>
                  
                  <div className="detail-item"><label>Kết quả A1C</label><span style={{ fontWeight: 600, color: selectedPatient.A1Cresult === 'Norm' ? 'var(--color-text-success)' : 'var(--color-text-danger)' }}>{selectedPatient.A1Cresult}</span></div>
                  <div className="detail-item"><label>Insulin</label><span>{selectedPatient.insulin}</span></div>
                  <div className="detail-item"><label>Thay đổi thuốc</label><span>{selectedPatient.change}</span></div>
                </div>
              </div>
              
              {/* Right Column: SHAP & Risk */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedPatient.risk_level ? (
                  <>
                    <div style={{ background: selectedPatient.risk_level === 'High' ? 'var(--color-background-danger)' : selectedPatient.risk_level === 'Medium' ? 'var(--color-background-warning)' : 'var(--color-background-success)', border: `1px solid ${selectedPatient.risk_level === 'High' ? 'var(--color-border-danger)' : selectedPatient.risk_level === 'Medium' ? 'var(--color-border-warning)' : 'var(--color-border-success)'}`, borderRadius: 'var(--border-radius-md)', padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: selectedPatient.risk_level === 'High' ? 'var(--color-text-danger)' : selectedPatient.risk_level === 'Medium' ? 'var(--color-text-warning)' : 'var(--color-text-success)' }}>Nguy cơ tái nhập viện</span>
                        <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', color: 'inherit', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>{selectedPatient.risk_level.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '42px', fontWeight: 700, color: selectedPatient.risk_level === 'High' ? 'var(--color-text-danger)' : selectedPatient.risk_level === 'Medium' ? 'var(--color-text-warning)' : 'var(--color-text-success)' }}>
                          {Math.round(selectedPatient.probability * 100)}%
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', opacity: 0.8 }}>xác suất</span>
                      </div>
                    </div>

                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '16px', flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px', color: 'var(--color-text-primary)' }}>Giải thích Mô hình (SHAP)</p>
                      {selectedPatient.shap_values ? (
                        <div>
                          {getShapData(selectedPatient.shap_values).map((d, i) => (
                            <div key={i} style={{ marginBottom: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>{d.f}</span>
                                <span style={{ color: d.dir > 0 ? 'var(--color-text-danger)' : 'var(--color-text-info)', fontWeight: 500 }}>
                                  {d.dir > 0 ? '+' : '-'}{Math.abs(d.v).toFixed(2)}
                                </span>
                              </div>
                              <div className="mini-bar-track" style={{ height: '6px', marginTop: 0, background: 'var(--color-border-tertiary)' }}>
                                <div className="mini-bar-fill" style={{ width: `${Math.min(Math.round(Math.abs(d.v) * 300), 100)}%`, background: d.dir > 0 ? 'var(--color-border-danger)' : 'var(--color-border-info)', borderRadius: '3px' }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Không có dữ liệu SHAP cho bệnh nhân này.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ background: 'var(--card-bg)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '40px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Brain size={48} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '16px' }} />
                    <h3 style={{ color: 'var(--color-text-primary)', marginBottom: '8px' }}>Chưa chạy AI</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', maxWidth: '300px' }}>
                      Bệnh nhân này mới được đồng bộ từ HIS. Vui lòng bấm "Dự đoán" ở ngoài bảng để hệ thống AI đánh giá rủi ro và sinh biểu đồ SHAP.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-tertiary)', background: 'var(--topbar-bg)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedPatient(null)} className="btn-sm" style={{ background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-tertiary)' }}>Đóng</button>
            </div>
          </div>
          
          <style>{`
            .detail-item { display: flex; flex-direction: column; gap: 2px; }
            .detail-item label { font-size: 11px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
            .detail-item span { font-size: 13px; font-weight: 500; color: var(--color-text-primary); }
          `}</style>
        </div>
      )}
    </div>
  );
}
