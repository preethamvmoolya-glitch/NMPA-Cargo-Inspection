import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SystemAdmin from './pages/SystemAdmin';
import PortAuthority from './pages/PortAuthority';
import VerifyClearance from './pages/VerifyClearance';
import GrievancePortal from './pages/GrievancePortal';
import NotFound from './pages/NotFound';
import { LanguageProvider, useLanguage } from './LanguageContext';
import Sidebar from './components/Sidebar';

// GitHub Pages subpath basename
const BASENAME = import.meta.env.BASE_URL;

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userRole = localStorage.getItem('userRole');
  if (!userRole) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'system_admin') return <Navigate to="/admin" />;
    if (userRole === 'port_authority') return <Navigate to="/port-authority" />;
    return <Navigate to="/dashboard" />;
  }
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-container">
        <div className="inner-page-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { darkMode } = useLanguage();

  return (
    <ConfigProvider theme={{
      algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#1565C0',
      }
    }}>
      <Router basename={BASENAME}>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/verify-clearance" element={<VerifyClearance />} />
            <Route path="/grievance" element={<GrievancePortal />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['inspector']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/port-authority"
              element={
                <ProtectedRoute allowedRoles={['port_authority']}>
                  <PortAuthority />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdmin />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </ConfigProvider>
  );
};

function App() {
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (appLoading) {
    return (
      <div className="preloader-screen">
        <div className="preloader-container">
          <div className="preloader-logo-spin">
            <img src={`${import.meta.env.BASE_URL}nmpa-logo.png`} alt="NMPA Logo" />
          </div>
          <div className="preloader-bar">
            <div className="preloader-bar-fill"></div>
          </div>
          <h1 className="preloader-title">NEW MANGALORE PORT AUTHORITY</h1>
          <p className="preloader-subtitle">Cargo Inspection & Adjudication System</p>
          <p className="preloader-status">Initializing Secure Gate Access & RMS Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
