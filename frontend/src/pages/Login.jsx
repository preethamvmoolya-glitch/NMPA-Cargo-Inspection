import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { Modal, Form, Input, Select, Checkbox, message, Button } from 'antd';
import { useLanguage } from '../LanguageContext';
import API_BASE from '../api';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [logoModalVisible, setLogoModalVisible] = useState(false);
  const [escalationModalVisible, setEscalationModalVisible] = useState(false);
  const [escalationForm] = Form.useForm();
  const [submittingEscalation, setSubmittingEscalation] = useState(false);
  const { language, setLanguage, darkMode, toggleDarkMode, t } = useLanguage();
  const [captchaCode, setCaptchaCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  });
  const [captchaInput, setCaptchaInput] = useState('');

  const refreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput('');
  };

  const handleInitialLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError(t('loginError'));
      return;
    }

    if (!captchaInput) {
      setError(t('loginEmptyCaptcha'));
      return;
    }

    if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
      setError(t('captchaError'));
      refreshCaptcha();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        finalizeLogin(data.user);
      } else {
        const errorMsg = data.message || 'Login failed. Please check your credentials.';
        setError(errorMsg === 'Invalid credentials.' ? (language === 'hi' ? 'अमान्य क्रेडेंशियल।' : errorMsg) : errorMsg);
        refreshCaptcha();
      }
    } catch (err) {
      setError(t('serverError'));
      refreshCaptcha();
    }
  };

  const finalizeLogin = (user) => {
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.username);
    if (user.role === 'system_admin') navigate('/admin');
    else if (user.role === 'port_authority') navigate('/port-authority');
    else navigate('/dashboard');
  };

  const handleEscalationSubmit = async (values) => {
    setSubmittingEscalation(true);
    
    // Format description dynamically based on the selected role/status
    let combinedDescription = `[User Role/Status]: ${values.status || 'Others'}\n`;
    if (values.status === 'Port Operator / Inspector') {
      combinedDescription += `[Inspector/Operator ID]: ${values.inspectorId || 'N/A'}\n`;
      combinedDescription += `[Gate/Location]: ${values.gateLocation || 'N/A'}\n`;
    } else if (values.status === 'Port Authority Officer') {
      combinedDescription += `[Officer ID]: ${values.officerId || 'N/A'}\n`;
      combinedDescription += `[Department]: ${values.department || 'N/A'}\n`;
    } else if (values.status === 'Vessel Agent / Employer') {
      combinedDescription += `[Company Name]: ${values.agentName || 'N/A'}\n`;
      combinedDescription += `[Vessel Name/IMO]: ${values.vesselImo || 'N/A'}\n`;
      combinedDescription += `[B/L Reference]: ${values.bolRef || 'N/A'}\n`;
    } else if (values.status === 'General Public / Others') {
      combinedDescription += `[Full Name]: ${values.fullName || 'N/A'}\n`;
      combinedDescription += `[Mobile]: ${values.mobile || 'N/A'}\n`;
    }
    combinedDescription += `\n[Grievance Details]:\n${values.description}`;

    try {
      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          category: values.category,
          description: combinedDescription,
          is_escalated_to_chairman: values.isEscalated,
          severity_level: values.severity
        })
      });
      if (response.ok) {
        message.success(language === 'en' ? 'Grievance submitted successfully.' : 'शिकायत सफलतापूर्वक सबमिट की गई।');
        setEscalationModalVisible(false);
        escalationForm.resetFields();
      } else {
        const err = await response.json();
        message.error(err.message || (language === 'en' ? 'Failed to submit grievance.' : 'शिकायत सबमिट करने में विफल।'));
      }
    } catch {
      message.error(language === 'en' ? 'Connection error.' : 'कनेक्शन त्रुटि।');
    } finally {
      setSubmittingEscalation(false);
    }
  };

  return (
    <div className="login-page">
      {/* Top Header Bar */}
      <div className="login-header">
        <div 
          className="nmpa-logo-circle" 
          style={{ cursor: 'pointer' }}
          onClick={() => setLogoModalVisible(true)}
        >
          <img src={`${import.meta.env.BASE_URL}nmpa-logo.png`} alt="NMPA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div 
          className="header-brand-text"
          onClick={() => window.location.href = 'https://newmangaloreport.gov.in/'}
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
          <span className="separator">|</span>
          <div className="header-version">
            {t('loginTitle')} · v2.0
          </div>
        </div>
      </div>

      {/* Notice Ticker Bar */}
      <div className="notice-ticker-container">
        <div className="notice-ticker-label">
          {t('circularNotice')}
        </div>
        <div className="notice-ticker-track">
          <div className="notice-ticker-text">
            <span className="notice-ticker-item">
              <span className="notice-ticker-bullet">•</span>
              {t('noticeText1')}
            </span>
            <span className="notice-ticker-item">
              <span className="notice-ticker-bullet">•</span>
              {t('noticeText2')}
            </span>
            <span className="notice-ticker-item">
              <span className="notice-ticker-bullet">•</span>
              {t('noticeText3')}
            </span>
            <span className="notice-ticker-item">
              <span className="notice-ticker-bullet">•</span>
              {t('noticeText4')}
            </span>
          </div>
        </div>
        <div className="notice-ticker-view-all">
          <a href="#view-all" onClick={(e) => e.preventDefault()}>{language === 'en' ? 'View all' : 'सभी देखें'}</a>
        </div>
      </div>

      {/* Main Body: Left image + Right form */}
      <div className="login-body">
        {/* Left: Port Image */}
        <div className="login-left">
          <img src={`${import.meta.env.BASE_URL}port-bg.png`} alt="New Mangalore Port" />
          <div className="login-left-overlay" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '4rem',
            background: 'linear-gradient(135deg, rgba(13, 43, 94, 0.8) 0%, rgba(13, 43, 94, 0.45) 100%)'
          }}>
            <h1 style={{
              color: '#fff',
              fontSize: '2.6rem',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: '1.5rem',
              maxWidth: '85%',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.25)'
            }}>
              {language === 'en' ? 'Make Your Cargo Inspections Hassle-Free' : 'अपने कार्गो निरीक्षण को परेशानी मुक्त बनाएं'}
            </h1>
            <h2 style={{
              color: '#fff',
              fontSize: '1.45rem',
              fontWeight: 600,
              marginBottom: '0.35rem',
              textShadow: '0 1px 5px rgba(0, 0, 0, 0.2)'
            }}>
              {language === 'en' ? 'Login as a Port Official' : 'पत्तन अधिकारी के रूप में लॉगिन करें'}
            </h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '1rem',
              fontWeight: 500,
              margin: 0,
              textShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
            }}>
              {language === 'en' ? 'Inspector, Port Authority, Admin' : 'इंस्पेक्टर, पत्तन प्राधिकरण, एडमिन'}
            </p>
          </div>
        </div>

        {/* Right: Login Panel */}
        <div className="login-right animate-slide-in">
          {/* Form Brand Header */}
          <div className="login-logo-wrap" style={{ marginBottom: '1.25rem' }}>
            <h1 className="login-brand-heading">
              {t('loginTitle').toUpperCase()}
            </h1>
          </div>

          {/* Error */}
          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleInitialLogin} style={{ width: '100%' }}>
            {/* Username */}
            <div className="input-group">
              <label>{t('username')}</label>
              <input
                id="login-username"
                type="text"
                name="secret_username_field"
                className="input-field"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* Password */}
            <div className="input-group">
              <label>{t('password')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: 'var(--nmpa-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  title={showPassword ? "Hide Password" : "Show Password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div className="input-group" style={{ marginBottom: '1.25rem' }}>
              <label>{t('enterCaptcha')}</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{
                  background: 'repeating-linear-gradient(45deg, #f0f0f0, #e0e0e0 10px, #d0d0d0 10px, #d0d0d0 20px)',
                  color: '#0d2b5e',
                  fontFamily: 'monospace, Courier',
                  fontSize: '1.3rem',
                  fontWeight: 'bold',
                  fontStyle: 'italic',
                  letterSpacing: '0.3em',
                  padding: '0.45rem 1rem',
                  borderRadius: '0.25rem',
                  border: '1.5px solid var(--nmpa-border-dark)',
                  userSelect: 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'line-through',
                  textDecorationColor: 'rgba(13,43,94,0.4)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                  flex: '1'
                }}>
                  {captchaCode}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  onClick={refreshCaptcha}
                  title="Refresh Captcha"
                >
                  Refresh
                </button>
              </div>
              <input
                id="login-captcha"
                type="text"
                className="input-field"
                placeholder={t('typeCaptcha')}
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                autoComplete="off"
              />
            </div>

            <button id="login-submit" type="submit" className="btn btn-primary btn-full"
              style={{ fontSize: '0.9rem', padding: '0.55rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {t('loginBtn')}
            </button>

            {/* Quick Demo Accounts Selection */}
            <div style={{
              marginTop: '0.75rem',
              padding: '0.6rem 0.75rem',
              background: 'rgba(21, 101, 192, 0.04)',
              border: '1.5px dashed var(--nmpa-border-dark)',
              borderRadius: '0.35rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--nmpa-text)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {t('demoCreds')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
                {[
                  { label: t('demoAdmin'), user: 'Admin99', pass: 'Admin@123' },
                  { label: t('demoAuthority'), user: 'Auth99', pass: 'Auth@123' },
                  { label: t('demoInspector'), user: 'Inspector99', pass: 'Insp@123' }
                ].map(cred => (
                  <button
                    key={cred.label}
                    type="button"
                    onClick={() => {
                      setUsername(cred.user);
                      setPassword(cred.pass);
                      setCaptchaInput(captchaCode);
                    }}
                    style={{
                      background: 'var(--nmpa-white)',
                      border: '1px solid var(--nmpa-border)',
                      borderRadius: '0.25rem',
                      padding: '0.35rem 0.2rem',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      color: 'var(--nmpa-text-body)',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--nmpa-blue-pale)';
                      e.target.style.color = 'var(--nmpa-blue)';
                      e.target.style.borderColor = 'var(--nmpa-blue)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--nmpa-white)';
                      e.target.style.color = 'var(--nmpa-text-body)';
                      e.target.style.borderColor = 'var(--nmpa-border)';
                    }}
                  >
                    {cred.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grievance Button */}
            <button
              type="button"
              className="btn btn-secondary btn-full"
              style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}
              onClick={() => navigate('/grievance')}
            >
              Grievance Portal
            </button>

            <div style={{ marginTop: '0.85rem', borderTop: '1px solid var(--nmpa-border)', paddingTop: '0.6rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { key: 'reqAccess', text: 'Request Access' },
                  { key: 'contactUs', text: 'Contact Us' },
                  { key: 'dataCalc', text: 'Data Calculator' },
                  { key: 'termsCond', text: 'Terms & Conditions' }
                ].map(link => (
                  <a key={link.key} href="#" style={{ fontSize: '0.75rem', color: 'var(--nmpa-blue)' }}>{t(link.key)}</a>
                ))}
              </div>
            </div>
          </form>
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

      {/* Grievance Portal Modal */}
      <Modal
        title={
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--nmpa-text)' }}>
            Grievance Redressal Portal
          </div>
        }
        open={escalationModalVisible}
        onCancel={() => {
          setEscalationModalVisible(false);
          escalationForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={escalationForm}
          layout="vertical"
          onFinish={handleEscalationSubmit}
          style={{ marginTop: '15px' }}
        >
          <Form.Item
            name="status"
            label="Your Status / Role"
            rules={[{ required: true, message: 'Please select your status' }]}
          >
            <Select placeholder="Select Status">
              <Select.Option value="Port Operator / Inspector">Port Operator / Inspector</Select.Option>
              <Select.Option value="Port Authority Officer">Port Authority Officer</Select.Option>
              <Select.Option value="Vessel Agent / Employer">Vessel Agent / Employer</Select.Option>
              <Select.Option value="General Public / Others">General Public / Others</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}>
            {({ getFieldValue }) => {
              const status = getFieldValue('status');
              if (status === 'Port Operator / Inspector') {
                return (
                  <>
                    <Form.Item name="inspectorId" label="Inspector / Operator ID" rules={[{ required: true, message: 'Please enter Operator ID' }]}>
                      <Input placeholder="e.g. INSP-99" />
                    </Form.Item>
                    <Form.Item name="gateLocation" label="Assigned Gate / Location" rules={[{ required: true, message: 'Please enter location' }]}>
                      <Input placeholder="e.g. Gate 3 Weighbridge" />
                    </Form.Item>
                  </>
                );
              }
              if (status === 'Port Authority Officer') {
                return (
                  <>
                    <Form.Item name="officerId" label="Officer ID / Username" rules={[{ required: true, message: 'Please enter Officer ID' }]}>
                      <Input placeholder="e.g. AUTH-99" />
                    </Form.Item>
                    <Form.Item name="department" label="Department / Section" rules={[{ required: true, message: 'Please enter department' }]}>
                      <Input placeholder="e.g. Custom Adjudication Section" />
                    </Form.Item>
                  </>
                );
              }
              if (status === 'Vessel Agent / Employer') {
                return (
                  <>
                    <Form.Item name="agentName" label="Establishment / Company Name" rules={[{ required: true, message: 'Please enter company name' }]}>
                      <Input placeholder="e.g. Mangalore Shipping Agency" />
                    </Form.Item>
                    <Form.Item name="vesselImo" label="Vessel Name / IMO Number" rules={[{ required: true, message: 'Please enter vessel details' }]}>
                      <Input placeholder="e.g. MV Mangalore Express (IMO 9497268)" />
                    </Form.Item>
                    <Form.Item name="bolRef" label="Bill of Lading (B/L) Reference" rules={[{ required: true, message: 'Please enter B/L reference' }]}>
                      <Input placeholder="e.g. BL-NMPA-2026-908" />
                    </Form.Item>
                  </>
                );
              }
              if (status === 'General Public / Others') {
                return (
                  <>
                    <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]}>
                      <Input placeholder="Enter your full name" />
                    </Form.Item>
                    <Form.Item name="mobile" label="Mobile Number" rules={[{ required: true, message: 'Please enter mobile number' }]}>
                      <Input placeholder="Enter mobile number" />
                    </Form.Item>
                  </>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item
            name="email"
            label="Contact Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input placeholder="name@domain.com" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Grievance Category"
            rules={[{ required: true, message: 'Please select grievance category' }]}
          >
            <Select placeholder="Select Category">
              <Select.Option value="Corruption/Bribery">Corruption/Bribery</Select.Option>
              <Select.Option value="Operational Bottleneck">Operational Bottleneck</Select.Option>
              <Select.Option value="Severe Misconduct">Severe Misconduct</Select.Option>
              <Select.Option value="General Malpractice">General Malpractice</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="severity"
            label="Severity Level"
            rules={[{ required: true, message: 'Please select severity level' }]}
          >
            <Select placeholder="Select Severity">
              <Select.Option value="Low">Low</Select.Option>
              <Select.Option value="Medium">Medium</Select.Option>
              <Select.Option value="High">High</Select.Option>
              <Select.Option value="Critical">Critical</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Grievance Description"
            rules={[{ required: true, message: 'Please enter details of the grievance' }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Provide a formal description of systemic corruption, misconduct, or operational bottleneck..."
              style={{ resize: 'none' }}
            />
          </Form.Item>

          <Form.Item
            name="isEscalated"
            valuePropName="checked"
            initialValue={true}
            style={{ marginBottom: '10px' }}
          >
            <Checkbox>Escalate this Grievance directly to the Chairman's Office</Checkbox>
          </Form.Item>

          <div style={{
            fontSize: '0.75rem',
            color: '#555',
            background: 'var(--nmpa-blue-pale)',
            padding: '8px 12px',
            borderLeft: '3px solid var(--nmpa-blue)',
            marginBottom: '20px',
            borderRadius: '0 4px 4px 0',
            lineHeight: '1.4'
          }}>
            Notice: Misuse of this high-level escalation channel for minor issues (e.g., password resets) may result in administrative action. Genuine anti-corruption or critical operational reports will be strictly encrypted and kept confidential.
          </div>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button
              style={{ marginRight: '8px' }}
              onClick={() => {
                setEscalationModalVisible(false);
                escalationForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              danger
              loading={submittingEscalation}
            >
              Submit Grievance
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Login;
