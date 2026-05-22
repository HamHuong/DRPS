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

export const getDoctors = async () => {
    const response = await api.get('/stats/doctors');
    return response.data;
};

export const getPatientHistory = async () => {
    const response = await api.get('/stats/patients/history');
    return response.data;
};

export const updateProfile = async (userId, newUsername) => {
    const response = await api.put(`/stats/profile/${userId}?new_username=${newUsername}`);
    return response.data;
};

export default api;
