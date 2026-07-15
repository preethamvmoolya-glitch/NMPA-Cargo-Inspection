import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Sun, Moon, ArrowLeft, LifeBuoy } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { language, setLanguage, darkMode, toggleDarkMode, t } = useLanguage();

  return (
    <div className="not-found-page">
      {/* Top Header Bar */}
      <div className="login-header">
        <div 
          className="nmpa-logo-circle" 
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img src={`${import.meta.env.BASE_URL}nmpa-logo.png`} alt="NMPA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div 
          className="header-brand-text"
          onClick={() => window.open('https://newmangaloreport.gov.in/', '_blank')}
        >
          <div className="header-title">
            {t('nmpaTitle')}
          </div>
          <div className="header-underline"></div>
          <div className="header-subtitle">
            {t('nmpaSub')}
          </div>
        </div>
        <div className="header-actions">
          {/* Language Toggle */}
          <div className="language-toggle">
            <span 
              className={language === 'en' ? 'active' : ''}
              onClick={() => setLanguage('en')}
            >
              ENGLISH
            </span>
            <span className="separator">|</span>
            <span 
              className={language === 'hi' ? 'active' : ''}
              onClick={() => setLanguage('hi')}
            >
              HINDI
            </span>
          </div>
          <span className="separator">|</span>
          {/* Dark Mode Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="not-found-body">
        <div className="not-found-card animate-slide-in">
          <div className="not-found-icon-wrap">
            <Compass size={44} style={{ animation: 'preloader-spin 15s linear infinite' }} />
          </div>
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">{t('pageNotFound')}</h2>
          <p className="not-found-description">
            {t('pageNotFoundDesc')}
          </p>

          <div className="not-found-actions">
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
              style={{ gap: '8px', fontSize: '0.85rem' }}
            >
              <ArrowLeft size={16} />
              {t('goBackHome')}
            </button>
            <button
              onClick={() => navigate('/grievance')}
              className="btn btn-secondary"
              style={{ gap: '8px', fontSize: '0.85rem' }}
            >
              <LifeBuoy size={16} />
              {t('grievancePortal')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
