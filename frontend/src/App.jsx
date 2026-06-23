import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SystemAdmin from './pages/SystemAdmin';
import PortAuthority from './pages/PortAuthority';
import VerifyClearance from './pages/VerifyClearance';
import GrievancePortal from './pages/GrievancePortal';
import { LanguageProvider } from './LanguageContext';
import Navbar from './components/Navbar';

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
    <>
      <Navbar />
      <div className="inner-page-wrapper">
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <LanguageProvider>
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
          </Routes>
        </div>
      </Router>
    </LanguageProvider>
  );
}

export default App;
