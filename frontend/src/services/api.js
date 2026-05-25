import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const setupUsers = async () => {
    const response = await api.post('/auth/setup');
    return response.data;
};

export const predictPatient = async (patientData) => {
  const response = await api.post('/predict/', patientData);
  return response.data;
};

export const getAdminOverview = async () => {
    const response = await api.get('/stats/admin/overview');
    return response.data;
};

export const getSystemStats = async () => {
    const response = await api.get('/stats/admin/system');
    return response.data;
};

export const getAuditLogs = async () => {
    const response = await api.get('/stats/admin/audit-logs');
    return response.data;
};

export const getDoctors = async () => {
    const response = await api.get('/stats/doctors');
    return response.data;
};

export const getPatientHistory = async (userId = null) => {
    const url = userId ? `/stats/patients/history?user_id=${userId}` : '/stats/patients/history';
    const response = await api.get(url);
    return response.data;
};

export const updateProfile = async (userId, newUsername) => {
    const response = await api.put(`/stats/profile/${userId}?new_username=${newUsername}`);
    return response.data;
};

export const getMLflowRegistry = async () => {
    const response = await api.get('/mlops/registry');
    return response.data;
};

export const fetchHisData = async (userId) => {
    const response = await api.post(`/predict/fetch-his?user_id=${userId}`);
    return response.data;
};

export const batchProcess = async (patientCodes, userId) => {
    const response = await api.post(`/predict/batch-process`, {
        patient_codes: patientCodes,
        user_id: userId
    });
    return response.data;
};

export const triggerRetrain = async () => {
    const response = await api.post('/mlops/retrain');
    return response.data;
};

export default api;
