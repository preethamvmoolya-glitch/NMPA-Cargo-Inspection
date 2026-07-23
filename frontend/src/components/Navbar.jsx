import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Shield } from 'lucide-react';
import { Image, Modal } from 'antd';
import { useLanguage } from '../LanguageContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || 'User';
  const { language, setLanguage, t } = useLanguage();

  const [logoModalVisible, setLogoModalVisible] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || '0';

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

  const navTabsKeys = {
    inspector:      ['tab_registry', 'tab_ledgers', 'tab_support'],
    port_authority: ['tab_igm_queue', 'tab_pcc', 'tab_qdo', 'tab_analytics_ledger'],
    system_admin:   ['tab_users', 'tab_audit_logs', 'tab_sys_config', 'tab_analytics', 'tab_complaints'],
  }[role] || [];

  const handleTabClick = (index) => {
    navigate(`${location.pathname}?tab=${index}`);
  };

  return (
    <nav className="nmpa-navbar">
      {/* Top bar */}
      <div className="nmpa-navbar-inner">
        <div className="nmpa-brand">
          <div 
            className="nmpa-logo-circle" 
            style={{ cursor: 'pointer' }}
            onClick={() => setLogoModalVisible(true)}
          >
            <img
              src={`${import.meta.env.BASE_URL}nmpa-logo.png`}
              alt="NMPA Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div className="nmpa-brand-text">
            <h1>{t('nmpaTitle')}</h1>
            <p>{t('nmpaSub')}</p>
          </div>
        </div>

        <div className="nmpa-nav-right">
          {/* Language Toggle */}
          <div className="nmpa-lang-toggle-pill" style={{ marginRight: '10px' }}>
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

          <div className="nmpa-user-chip">
            <User size={15} />
            <span>{userName}</span>
            <span style={{ opacity: 0.5, margin: '0 0.25rem' }}>|</span>
            <Shield size={13} />
            <span style={{ opacity: 0.8 }}>{roleLabel}</span>
          </div>
          <button id="navbar-logout" className="nmpa-logout-btn" onClick={handleLogout}>
            <LogOut size={15} />
            {t('logout')}
          </button>
        </div>
      </div>


      {/* Logo Modal */}
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
    </nav>
  );
};

export default Navbar;
