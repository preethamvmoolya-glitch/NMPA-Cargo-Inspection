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
          style={{ width: 52, height: 52, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <img src={`${import.meta.env.BASE_URL}nmpa-logo.png`} alt="NMPA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.02em' }}>
            {t('nmpaTitle')}
          </div>
          <div style={{ color: 'var(--nmpa-blue-pale)', fontSize: '0.72rem', fontStyle: 'italic' }}>
            {t('nmpaSub')}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Language Toggle */}
          <div className="language-toggle" style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
            <span 
              style={{ color: language === 'en' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', borderBottom: language === 'en' ? '2px solid #fff' : 'none', paddingBottom: '2px' }}
              onClick={() => setLanguage('en')}
            >
              ENGLISH
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>|</span>
            <span 
              style={{ color: language === 'hi' ? '#fff' : 'rgba(255,255,255,0.5)', cursor: 'pointer', borderBottom: language === 'hi' ? '2px solid #fff' : 'none', paddingBottom: '2px' }}
              onClick={() => setLanguage('hi')}
            >
              HINDI
            </span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              outline: 'none'
            }}
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
