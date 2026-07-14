import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  LogOut, User, Shield, Clock, History, HelpCircle, 
  FileText, BarChart3, Settings, Users, MessageSquare, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Modal } from 'antd';
import { useLanguage } from '../LanguageContext';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const role = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || 'User';
  const { language, setLanguage, t } = useLanguage();

  const [logoModalVisible, setLogoModalVisible] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [approvalsCount, setApprovalsCount] = useState(0);

  // Extract active tab index from search parameters
  const activeTabIdx = parseInt(searchParams.get('tab') || '0');

  // Listen to custom window events for dynamic count updates
  useEffect(() => {
    const handlePendingCount = (e) => {
      if (typeof e.detail === 'number') {
        setPendingCount(e.detail);
      }
    };
    const handleApprovalsCount = (e) => {
      if (typeof e.detail === 'number') {
        setApprovalsCount(e.detail);
      }
    };

    window.addEventListener('nmpa-pending-count', handlePendingCount);
    window.addEventListener('nmpa-approvals-count', handleApprovalsCount);

    return () => {
      window.removeEventListener('nmpa-pending-count', handlePendingCount);
      window.removeEventListener('nmpa-approvals-count', handleApprovalsCount);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/');
  };

  const roleLabel = {
    inspector:      t('inspector'),
    port_authority: t('port_authority'),
    system_admin:   t('system_admin'),
  }[role] || t('user');

  const getRoleBasePath = () => {
    if (role === 'system_admin') return '/admin';
    if (role === 'port_authority') return '/port-authority';
    return '/dashboard';
  };

  const handleItemClick = (index) => {
    const basePath = getRoleBasePath();
    navigate(`${basePath}?tab=${index}`);
  };

  // Define sidebar navigation items based on role
  const menuItems = {
    inspector: [
      {
        label: t('pendingQueue'),
        icon: <Clock size={18} />,
        badge: pendingCount > 0 ? pendingCount : null,
        badgeColor: '#1890ff'
      },
      {
        label: t('mySubmissions'),
        icon: <History size={18} />
      },
      {
        label: t('helpSupport'),
        icon: <HelpCircle size={18} />
      }
    ],
    port_authority: [
      {
        label: t('tabIgmQueue'),
        icon: <Clock size={18} />,
        badge: approvalsCount > 0 ? approvalsCount : null,
        badgeColor: '#faad14'
      },
      {
        label: t('tabPccGranted'),
        icon: <CheckCircle2 size={18} style={{ color: '#52c41a' }} />
      },
      {
        label: t('tabQdoHold'),
        icon: <AlertTriangle size={18} style={{ color: '#ff4d4f' }} />
      },
      {
        label: t('tabAuditAnalytics'),
        icon: <BarChart3 size={18} />
      }
    ],
    system_admin: [
      {
        label: t('tabIdentity'),
        icon: <Users size={18} />
      },
      {
        label: t('tabAccessLogs'),
        icon: <Shield size={18} />
      },
      {
        label: t('tabSysConfig'),
        icon: <Settings size={18} />
      },
      {
        label: t('tabLaneAnalytics'),
        icon: <BarChart3 size={18} />
      },
      {
        label: 'Grievances',
        icon: <MessageSquare size={18} />
      }
    ]
  }[role] || [];

  return (
    <aside className="nmpa-sidebar">
      {/* Sidebar Top: Logo and Branding */}
      <div className="sidebar-brand">
        <div 
          className="sidebar-logo-circle" 
          onClick={() => setLogoModalVisible(true)}
        >
          <img
            src={`${import.meta.env.BASE_URL}nmpa-logo.png`}
            alt="NMPA Logo"
          />
        </div>
        <div className="sidebar-brand-text">
          <h1>NMPA</h1>
          <p>{t('nmpaSub')}</p>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Sidebar Navigation Items */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">
          {role === 'system_admin' && 'ADMIN CONSOLE'}
          {role === 'port_authority' && 'PORT AUTHORITY'}
          {role === 'inspector' && 'INSPECTOR GATE'}
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item, idx) => {
            const isActive = activeTabIdx === idx && location.pathname === getRoleBasePath();
            return (
              <li key={idx}>
                <button
                  type="button"
                  className={`sidebar-menu-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleItemClick(idx)}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  <span className="sidebar-item-label">{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span 
                      className="sidebar-badge"
                      style={{ backgroundColor: item.badgeColor || '#ff4d4f' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Language Selection */}
        <div className="sidebar-lang-toggle">
          <button 
            type="button" 
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
          <span className="lang-sep">|</span>
          <button 
            type="button" 
            className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
            onClick={() => setLanguage('hi')}
          >
            हिं
          </button>
        </div>

        {/* User Chip Info */}
        <div className="sidebar-user-chip">
          <div className="user-icon-circle">
            <User size={14} />
          </div>
          <div className="user-details">
            <span className="user-name">{userName}</span>
            <span className="user-role">
              <Shield size={10} style={{ marginRight: '2px' }} />
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button id="sidebar-logout" className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>{t('logout')}</span>
        </button>
      </div>

      {/* Large Logo Preview Modal */}
      <Modal
        open={logoModalVisible}
        onCancel={() => setLogoModalVisible(false)}
        footer={null}
        closable={false}
        centered
        width={340}
        modalRender={() => (
          <div style={{
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            border: '6px solid #42a5f5',
            boxShadow: '0 8px 32px rgba(13, 71, 161, 0.5)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            margin: '0 auto',
            outline: 'none'
          }}
          onClick={() => setLogoModalVisible(false)}
          >
            <img
              src={`${import.meta.env.BASE_URL}nmpa-logo.png`}
              alt="NMPA Logo Large"
              style={{ width: '90%', height: '90%', objectFit: 'contain', userSelect: 'none' }}
            />
          </div>
        )}
      />
    </aside>
  );
};

export default Sidebar;
