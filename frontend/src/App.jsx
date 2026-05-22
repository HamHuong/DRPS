import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import './index.css';

// Simple auth guard
const PrivateRoute = ({ children, role }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/" />;
  
  const user = JSON.parse(userStr);
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/doctor'} />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/doctor" 
            element={
              <PrivateRoute role="doctor">
                <DoctorDashboard />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
