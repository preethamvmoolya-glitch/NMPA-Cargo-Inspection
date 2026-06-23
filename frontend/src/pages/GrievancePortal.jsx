import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, Input, Radio, Select, Button, Checkbox, 
  message, Card, Breadcrumb, Tabs, Alert, Spin, Tag, Upload 
} from 'antd';
import { 
  HomeOutlined, EditOutlined, BellOutlined, 
  EyeOutlined, UploadOutlined, RetweetOutlined, SearchOutlined 
} from '@ant-design/icons';
import API_BASE from '../api';
import { useLanguage } from '../LanguageContext';

const IndianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", 
  "Lakshadweep", "Puducherry"
];

const GrievancePortal = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('register');
  const [statusValue, setStatusValue] = useState('Others');
  
  // Captcha codes
  const [captchaRegister, setCaptchaRegister] = useState('');
  const [captchaReminder, setCaptchaReminder] = useState('');
  const [captchaStatus, setCaptchaStatus] = useState('');
  const [captchaUpload, setCaptchaUpload] = useState('');
  
  const [captchaInputRegister, setCaptchaInputRegister] = useState('');
  const [captchaInputReminder, setCaptchaInputReminder] = useState('');
  const [captchaInputStatus, setCaptchaInputStatus] = useState('');
  const [captchaInputUpload, setCaptchaInputUpload] = useState('');

  // Form states
  const [memberDetailsFetched, setMemberDetailsFetched] = useState(false);
  const [memberIdValue, setMemberIdValue] = useState('');
  const [memberIdType, setMemberIdType] = useState('UAN');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [corporateName, setCorporateName] = useState('');

  // Status search states
  const [statusGrievanceId, setStatusGrievanceId] = useState('');
  const [searchedGrievance, setSearchedGrievance] = useState(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Form instances
  const [registerForm] = Form.useForm();
  const [reminderForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [uploadForm] = Form.useForm();

  // Generate Captcha Helper
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    refreshAllCaptchas();
  }, []);

  const refreshAllCaptchas = () => {
    setCaptchaRegister(generateCaptcha());
    setCaptchaReminder(generateCaptcha());
    setCaptchaStatus(generateCaptcha());
    setCaptchaUpload(generateCaptcha());
    setCaptchaInputRegister('');
    setCaptchaInputReminder('');
    setCaptchaInputStatus('');
    setCaptchaInputUpload('');
  };

  // Handle get member details (for PF Member, EPS Pensioner, Employer)
  const handleGetDetails = async (values) => {
    if (captchaInputRegister.toLowerCase() !== captchaRegister.toLowerCase()) {
      message.error(t('captchaInvalid'));
      setCaptchaRegister(generateCaptcha());
      setCaptchaInputRegister('');
      return;
    }
    setFetchingDetails(true);
    // Simulate API fetch delay
    setTimeout(() => {
      setFetchingDetails(false);
      setMemberDetailsFetched(true);
      if (memberIdType === 'Establishment Number' && values.identifierValue === 'EST-MNG-908') {
        registerForm.setFieldsValue({
          address1: 'Gate 3 Logistics Hub',
          address2: 'Panambur Port Area',
          address3: 'Mangalore',
          pincode: '575010',
          state: 'Karnataka',
          country: 'India'
        });
        setCorporateName('Mangalore Shipping Corp');
      } else {
        setCorporateName('');
      }
      message.success(`Identity Verified successfully for ${memberIdType}: ${values.identifierValue}`);
    }, 1000);
  };

  // Handle complaint submission
  const handleGrievanceSubmit = async (values) => {
    if (statusValue !== 'Others' && !memberDetailsFetched) {
      message.warning(t('verifyFirstMsg'));
      return;
    }
    if (statusValue === 'Others' && captchaInputRegister.toLowerCase() !== captchaRegister.toLowerCase()) {
      message.error(t('captchaInvalid'));
      setCaptchaRegister(generateCaptcha());
      setCaptchaInputRegister('');
      return;
    }

    setSubmitting(true);
    let combinedDescription = `[Grievance Status/Role]: ${statusValue}\n`;
    if (statusValue !== 'Others') {
      combinedDescription += `[${memberIdType} Identifier]: ${values.identifierValue || memberIdValue}\n`;
    }
    combinedDescription += `[Name]: ${values.name}\n`;
    combinedDescription += `[Gender]: ${values.gender}\n`;
    combinedDescription += `[Address]: ${values.address1} ${values.address2 || ''} ${values.address3 || ''}\n`;
    combinedDescription += `[Pincode]: ${values.pincode || 'N/A'}\n`;
    combinedDescription += `[Country]: ${values.country}\n`;
    combinedDescription += `[State]: ${values.state}\n`;
    combinedDescription += `[Contact]: ${values.contactNumber || 'N/A'}\n\n`;
    combinedDescription += `[Grievance details]:\n${values.description}`;

    try {
      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          category: values.category,
          description: combinedDescription,
          is_escalated_to_chairman: values.isEscalated,
          severity_level: values.severity || 'Medium'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const routedQueue = data.routed_to === 'CHAIRMAN_OFFICE_INBOX' 
          ? (language === 'en' ? "Chairman's Office Inbox" : "अध्यक्ष कार्यालय इनबॉक्स") 
          : (language === 'en' ? "Standard Grievance Queue" : "मानक शिकायत कतार");
        ModalSuccess(routedQueue, data.id);
        resetRegisterForm();
      } else {
        const err = await response.json();
        message.error(err.message || 'Failed to submit grievance.');
      }
    } catch {
      message.error('Server connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const ModalSuccess = (queue, id) => {
    const regNum = `NMPA-GRV-${1000 + id}`;
    Modal.success({
      title: t('grvSuccessTitle'),
      content: (
        <div>
          <p>{t('grvSuccessText').replace('{queue}', queue)}</p>
          <p>{t('saveRefText')}</p>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            background: '#f0f0f0',
            padding: '10px',
            textAlign: 'center',
            borderRadius: '4px',
            fontFamily: 'monospace',
            color: '#1a237e'
          }}>
            {regNum}
          </div>
        </div>
      ),
      okText: t('done')
    });
  };

  const resetRegisterForm = () => {
    registerForm.resetFields();
    setMemberDetailsFetched(false);
    setCorporateName('');
    setCaptchaRegister(generateCaptcha());
    setCaptchaInputRegister('');
  };

  // View Status Search logic
  const handleViewStatus = async (values) => {
    if (captchaInputStatus.toLowerCase() !== captchaStatus.toLowerCase()) {
      message.error(t('captchaInvalid'));
      setCaptchaStatus(generateCaptcha());
      setCaptchaInputStatus('');
      return;
    }

    setFetchingDetails(true);
    setSearchAttempted(true);
    try {
      // Parse ID out of "NMPA-GRV-1001" or similar
      const rawInput = values.registrationNumber.trim();
      let searchId = rawInput;
      const grvMatch = rawInput.match(/NMPA-GRV-(\d+)/i);
      if (grvMatch) {
        searchId = grvMatch[1];
      }

      // Fetch standard complaints
      const [resComp, resChair] = await Promise.all([
        fetch(`${API_BASE}/api/complaints`),
        fetch(`${API_BASE}/api/chairman/complaints`)
      ]);

      let allComps = [];
      if (resComp.ok) {
        allComps = [...allComps, ...(await resComp.json())];
      }
      if (resChair.ok) {
        allComps = [...allComps, ...(await resChair.json())];
      }

      // Find by parsed ID or exact ID
      const found = allComps.find(c => String(c.id) === String(searchId) || String(c.id) === String(searchId - 1000));
      
      if (found) {
        setSearchedGrievance({
          regNum: `NMPA-GRV-${1000 + found.id}`,
          date: found.date,
          category: found.subject || found.category,
          status: found.is_escalated_to_chairman ? "ESCALATED TO CHAIRMAN'S OFFICE - UNDER REVIEW" : "PENDING REDRESSAL",
          description: found.message || found.description
        });
      } else {
        setSearchedGrievance(null);
      }
    } catch {
      message.error("Failed to query grievance database.");
    } finally {
      setFetchingDetails(false);
    }
  };

  // Send Reminder logic
  const handleSendReminder = (values) => {
    if (captchaInputReminder.toLowerCase() !== captchaReminder.toLowerCase()) {
      message.error(t('captchaInvalid'));
      setCaptchaReminder(generateCaptcha());
      setCaptchaInputReminder('');
      return;
    }
    
    setFetchingDetails(true);
    setTimeout(() => {
      setFetchingDetails(false);
      message.success(`${t('reminderSuccessMsg')}${values.registrationNumber}!`);
      reminderForm.resetFields();
      setCaptchaReminder(generateCaptcha());
      setCaptchaInputReminder('');
    }, 1000);
  };

  // Upload Document logic
  const handleUploadDocument = (values) => {
    if (captchaInputUpload.toLowerCase() !== captchaUpload.toLowerCase()) {
      message.error(t('captchaInvalid'));
      setCaptchaUpload(generateCaptcha());
      setCaptchaInputUpload('');
      return;
    }

    setFetchingDetails(true);
    setTimeout(() => {
      setFetchingDetails(false);
      message.success(`${t('uploadSuccessMsg')}${values.registrationNumber}!`);
      uploadForm.resetFields();
      setCaptchaUpload(generateCaptcha());
      setCaptchaInputUpload('');
    }, 1000);
  };

  const updateStatusValue = (val) => {
    setStatusValue(val);
    setMemberDetailsFetched(false);
    if (val === 'PF Member') {
      setMemberIdType('UAN');
    } else if (val === 'EPS Pensioner') {
      setMemberIdType('PPO Number');
    } else if (val === 'Employer') {
      setMemberIdType('Establishment Number');
    }
  };

  const getBreadcrumbName = () => {
    if (activeTab === 'register') return t('tabRegisterGrievance');
    if (activeTab === 'reminder') return t('tabSendReminder');
    if (activeTab === 'status') return t('tabViewStatus');
    if (activeTab === 'upload') return t('tabUploadDocument');
    return '';
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOP HEADER BANNER */}
      <div style={{ 
        background: '#fff', 
        padding: '12px 30px', 
        display: 'flex', 
        alignItems: 'center', 
        borderBottom: '1px solid #e0e0e0',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
      }}>
        {/* NMPA Logo */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '2px solid #1565C0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#fff',
          marginRight: '15px'
        }}>
          <img 
            src={`${import.meta.env.BASE_URL}nmpa-logo.png`} 
            alt="NMPA Logo" 
            style={{ width: '90%', height: '90%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <span style={{ fontSize: '1.65rem', fontWeight: '800', color: '#1A237E', letterSpacing: '0.02em' }}>
            {t('nmpaGrmsTitle')}
          </span>
          <div style={{ fontSize: '0.75rem', color: '#546E7A', fontStyle: 'italic', marginTop: '-2px' }}>
            {t('nmpaGrmsSub')}
          </div>
        </div>

        {/* Language Toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="language-toggle" style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
            <span 
              style={{ color: language === 'en' ? '#1A237E' : '#757575', cursor: 'pointer', borderBottom: language === 'en' ? '2px solid #1A237E' : 'none', paddingBottom: '2px' }}
              onClick={() => setLanguage('en')}
            >
              ENGLISH
            </span>
            <span style={{ color: '#757575' }}>|</span>
            <span 
              style={{ color: language === 'hi' ? '#1A237E' : '#757575', cursor: 'pointer', borderBottom: language === 'hi' ? '2px solid #1A237E' : 'none', paddingBottom: '2px' }}
              onClick={() => setLanguage('hi')}
            >
              HINDI
            </span>
          </div>
        </div>
      </div>

      {/* 2. BLACK NAVIGATION TABS BAR */}
      <div style={{ background: '#000000', padding: '0 30px', display: 'flex' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            padding: '12px 20px',
            fontSize: '0.88rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <HomeOutlined /> {t('homeLabel')}
        </button>

        {[
          { key: 'register', label: t('tabRegisterGrievance'), icon: <EditOutlined /> },
          { key: 'reminder', label: t('tabSendReminder'), icon: <BellOutlined /> },
          { key: 'status', label: t('tabViewStatus'), icon: <EyeOutlined /> },
          { key: 'upload', label: t('tabUploadDocument'), icon: <UploadOutlined /> }
        ].map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                background: isActive ? '#fff' : 'transparent',
                border: 'none',
                color: isActive ? '#000000' : '#fff',
                padding: '12px 20px',
                fontSize: '0.88rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                borderRadius: isActive ? '4px 4px 0 0' : '0'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.target.style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.target.style.background = 'transparent';
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. BREADCRUMBS LINE */}
      <div style={{ background: '#EAEAEA', padding: '8px 45px' }}>
        <Breadcrumb separator="•">
          <Breadcrumb.Item href="#" onClick={() => navigate('/')}>{t('homeLabel')}</Breadcrumb.Item>
          <Breadcrumb.Item>{getBreadcrumbName()}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 4. MAIN FORM WRAPPER PANEL */}
      <div style={{ flex: 1, padding: '25px 45px 50px' }}>
        <Card bordered={false} style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.06)', borderRadius: '4px' }}>
          
          {/* TAB CONTENT: REGISTER GRIEVANCE */}
          {activeTab === 'register' && (
            <div>
              {/* Card Header Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '20px' }}>
                <span style={{ color: '#D32F2F', fontWeight: '800', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EditOutlined /> {t('tabRegisterGrievance').toUpperCase()}
                </span>
                <span style={{ color: '#555', fontSize: '0.82rem' }}>
                  {t('mandatoryFieldsNote')}
                </span>
              </div>

              {/* Informational Yellow Alert Alert */}
              <Alert
                message={
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4F3F10', lineHeight: 1.4 }}>
                    {t('grievanceAlertInfo')}
                  </span>
                }
                type="warning"
                showIcon
                style={{ 
                  backgroundColor: '#FFF9C4', 
                  border: '1px solid #FFE082', 
                  borderRadius: '4px', 
                  padding: '12px 16px',
                  marginBottom: '25px'
                }}
              />

              {/* Form Component */}
              <Form
                form={registerForm}
                layout="vertical"
                onFinish={handleGrievanceSubmit}
                initialValues={{ country: 'India' }}
              >
                {/* 1. Status Selection Radio buttons */}
                <Form.Item 
                  label={<span style={{ fontWeight: 700, color: '#333' }}><span style={{ color: 'red' }}>*</span> {t('statusLabel')}</span>}
                  required={false}
                  style={{ marginBottom: '25px' }}
                >
                  <Radio.Group 
                    value={statusValue} 
                    onChange={(e) => updateStatusValue(e.target.value)}
                    style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}
                  >
                    <Radio value="Employer">{t('statusEmployer')}</Radio>
                    <Radio value="Others">{t('statusOthers')}</Radio>
                  </Radio.Group>
                </Form.Item>

                {/* 2. Identifier fields (UAN / PPO / Establishment) */}
                {statusValue !== 'Others' && !memberDetailsFetched && (
                  <div style={{ 
                    border: '1px solid #BBDEFB', 
                    background: '#F5F8FC', 
                    padding: '20px', 
                    borderRadius: '4px', 
                    marginBottom: '25px' 
                  }}>
                    <Form.Item
                      name="identifierValue"
                      label={<span style={{ fontWeight: 700 }}>{memberIdType === 'Establishment Number' ? t('estId') : memberIdType}</span>}
                      rules={[{ required: true, message: `${t('inputIdentifierReq')} ${memberIdType === 'Establishment Number' ? t('estId') : memberIdType}` }]}
                    >
                      <Input 
                        placeholder={`${t('enterIdentifier')} ${memberIdType === 'Establishment Number' ? t('estId') : memberIdType}`} 
                        onChange={(e) => setMemberIdValue(e.target.value)}
                        style={{ maxWidth: '400px' }}
                      />
                    </Form.Item>

                    {/* Captcha Security Code */}
                    <Form.Item
                      label={<span style={{ fontWeight: 700 }}>{t('securityCode')}</span>}
                      required
                      style={{ marginBottom: 0 }}
                    >
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <Input 
                          placeholder={t('typeSecurityCode')}
                          value={captchaInputRegister}
                          onChange={(e) => setCaptchaInputRegister(e.target.value)}
                          style={{ maxWidth: '200px' }}
                        />
                        <div style={{
                          background: 'repeating-linear-gradient(45deg, #f5f5f5, #e8e8e8 10px, #d8d8d8 10px, #d8d8d8 20px)',
                          color: '#2e1c7d',
                          fontFamily: 'monospace',
                          fontSize: '1.25rem',
                          fontWeight: 'bold',
                          fontStyle: 'italic',
                          letterSpacing: '0.25em',
                          padding: '4px 16px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          userSelect: 'none',
                          textDecoration: 'line-through'
                        }}>
                          {captchaRegister}
                        </div>
                        <Button 
                          icon={<RetweetOutlined />} 
                          onClick={() => setCaptchaRegister(generateCaptcha())}
                          title="Refresh Captcha"
                        />
                      </div>
                    </Form.Item>

                    <Button 
                      type="primary" 
                      onClick={() => registerForm.validateFields(['identifierValue']).then(handleGetDetails)}
                      loading={fetchingDetails}
                      style={{ marginTop: '20px', background: '#00ACC1', borderColor: '#00ACC1', fontWeight: 600 }}
                      icon={<SearchOutlined />}
                    >
                      {t('getDetailsBtn')}
                    </Button>
                  </div>
                )}

                {/* 3. Detailed registration form fields (Visible for 'Others' or after Fetch details) */}
                {(statusValue === 'Others' || memberDetailsFetched) && (
                  <div style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
                    {corporateName && (
                      <div style={{
                        background: '#e8f5e9',
                        border: '1px solid #a5d6a7',
                        padding: '15px',
                        borderRadius: '4px',
                        marginBottom: '20px'
                      }}>
                        <span style={{ fontWeight: 700, color: '#2e7d32', display: 'block', marginBottom: '5px' }}>
                          {t('verifiedProfile')}:
                        </span>
                        <div><strong>{t('estName')}:</strong> {corporateName}</div>
                        <div><strong>{t('estId')}:</strong> {memberIdValue || 'EST-MNG-908'}</div>
                      </div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1565C0', borderBottom: '1px dashed #e0e0e0', paddingBottom: '6px', marginBottom: '20px' }}>
                      {t('personalDetailsHeader')}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Name */}
                      <Form.Item
                        name="name"
                        label={<span style={{ fontWeight: 700 }}>{t('nameLabel')}</span>}
                        rules={[{ required: true, message: t('nameReq') }]}
                      >
                        <Input placeholder={t('namePlaceholder')} />
                      </Form.Item>
 
                      {/* Gender */}
                      <Form.Item
                        name="gender"
                        label={<span style={{ fontWeight: 700 }}>{t('genderLabel')}</span>}
                        rules={[{ required: true, message: t('genderReq') }]}
                      >
                        <Radio.Group>
                          <Radio value="Male">{t('genderMale')}</Radio>
                          <Radio value="Female">{t('genderFemale')}</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </div>

                    {/* Address inputs (three lines) */}
                    <div style={{ border: '1px solid #e8e8e8', padding: '16px', borderRadius: '4px', marginBottom: '20px', background: '#fafafa' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#333', display: 'block', marginBottom: '10px' }}>
                        <span style={{ color: 'red' }}>*</span> {t('addressHeader')}
                      </span>
                      <Form.Item
                        name="address1"
                        rules={[{ required: true, message: t('address1Req') }]}
                        style={{ marginBottom: '10px' }}
                      >
                        <Input placeholder={t('address1Placeholder')} />
                      </Form.Item>
                      <Form.Item
                        name="address2"
                        style={{ marginBottom: '10px' }}
                      >
                        <Input placeholder={t('address2Placeholder')} />
                      </Form.Item>
                      <Form.Item
                        name="address3"
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder={t('address3Placeholder')} />
                      </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                      {/* Pincode */}
                      <Form.Item
                        name="pincode"
                        label={<span style={{ fontWeight: 700 }}>{t('pincodeLabel')}</span>}
                        rules={[{ pattern: /^\d{6}$/, message: t('pincodeInvalid') }]}
                      >
                        <Input placeholder={t('pincodePlaceholder')} />
                      </Form.Item>

                      {/* Country */}
                      <Form.Item
                        name="country"
                        label={<span style={{ fontWeight: 700 }}>{t('countryLabel')}</span>}
                        rules={[{ required: true }]}
                      >
                        <Select disabled>
                          <Select.Option value="India">{language === 'en' ? 'India' : 'भारत'}</Select.Option>
                        </Select>
                      </Form.Item>
 
                      {/* State */}
                      <Form.Item
                        name="state"
                        label={<span style={{ fontWeight: 700 }}>{t('stateLabel')}</span>}
                        rules={[{ required: true, message: t('stateReq') }]}
                      >
                        <Select placeholder={t('statePlaceholder')}>
                          {IndianStates.map(st => (
                            <Select.Option key={st} value={st}>{st}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Contact Number */}
                      <Form.Item
                        name="contactNumber"
                        label={<span style={{ fontWeight: 700 }}>{t('contactLabel')}</span>}
                        rules={[{ pattern: /^\d{10}$/, message: t('contactReq') }]}
                      >
                        <Input placeholder={t('contactPlaceholder')} />
                      </Form.Item>

                      {/* Email */}
                      <Form.Item
                        name="email"
                        label={<span style={{ fontWeight: 700 }}>{t('emailLabel')}</span>}
                        rules={[
                          { required: true, message: t('emailReq') },
                          { type: 'email', message: t('emailInvalid') }
                        ]}
                      >
                        <Input placeholder={t('emailPlaceholder')} />
                      </Form.Item>
                    </div>

                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1565C0', borderBottom: '1px dashed #e0e0e0', paddingBottom: '6px', marginTop: '15px', marginBottom: '20px' }}>
                      {t('grievanceDetailsHeader')}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {/* Category */}
                      <Form.Item
                        name="category"
                        label={<span style={{ fontWeight: 700 }}>{t('categoryLabel')}</span>}
                        rules={[{ required: true, message: t('categoryReq') }]}
                      >
                        <Select placeholder={t('categoryPlaceholder')}>
                          <Select.Option value="Corruption/Bribery">{language === 'en' ? 'Corruption/Bribery' : 'भ्रष्टाचार/रिश्वत'}</Select.Option>
                          <Select.Option value="Operational Bottleneck">{language === 'en' ? 'Operational Bottleneck' : 'परिचालन बाधा'}</Select.Option>
                          <Select.Option value="Severe Misconduct">{language === 'en' ? 'Severe Misconduct' : 'गंभीर कदाचार'}</Select.Option>
                          <Select.Option value="General Malpractice">{language === 'en' ? 'General Malpractice' : 'सामान्य कदाचार'}</Select.Option>
                        </Select>
                      </Form.Item>

                      {/* Severity */}
                      <Form.Item
                        name="severity"
                        label={<span style={{ fontWeight: 700 }}>{t('severityLabel')}</span>}
                        initialValue="Medium"
                      >
                        <Select>
                          <Select.Option value="Low">{language === 'en' ? 'Low' : 'कम'}</Select.Option>
                          <Select.Option value="Medium">{language === 'en' ? 'Medium' : 'मध्यम'}</Select.Option>
                          <Select.Option value="High">{language === 'en' ? 'High' : 'उच्च'}</Select.Option>
                          <Select.Option value="Critical">{language === 'en' ? 'Critical' : 'गंभीर'}</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>

                    {/* Description */}
                    <Form.Item
                      name="description"
                      label={<span style={{ fontWeight: 700 }}>{t('descriptionLabel')}</span>}
                      rules={[{ required: true, message: t('descriptionReq') }]}
                    >
                      <Input.TextArea rows={4} placeholder={t('descriptionPlaceholder')} style={{ resize: 'none' }} />
                    </Form.Item>

                    {/* Escalate directly to Chairman */}
                    <Form.Item
                      name="isEscalated"
                      valuePropName="checked"
                      initialValue={true}
                    >
                      <Checkbox>{t('escalateLabel')}</Checkbox>
                    </Form.Item>

                    {/* Captcha block for 'Others' */}
                    {statusValue === 'Others' && (
                      <div style={{ 
                        border: '1px solid #e0e0e0', 
                        padding: '16px', 
                        borderRadius: '4px', 
                        marginBottom: '25px', 
                        background: '#fafafa',
                        maxWidth: '500px'
                      }}>
                        <Form.Item
                          label={<span style={{ fontWeight: 700 }}>{t('securityCode')}</span>}
                          required
                          style={{ marginBottom: 0 }}
                        >
                          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <Input 
                              placeholder={t('typeSecurityCode')}
                              value={captchaInputRegister}
                              onChange={(e) => setCaptchaInputRegister(e.target.value)}
                              style={{ maxWidth: '180px' }}
                            />
                            <div style={{
                              background: 'repeating-linear-gradient(45deg, #f5f5f5, #e8e8e8 10px, #d8d8d8 10px, #d8d8d8 20px)',
                              color: '#2e1c7d',
                              fontFamily: 'monospace',
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                              fontStyle: 'italic',
                              letterSpacing: '0.25em',
                              padding: '4px 12px',
                              border: '1px solid #ccc',
                              borderRadius: '4px',
                              userSelect: 'none',
                              textDecoration: 'line-through'
                            }}>
                              {captchaRegister}
                            </div>
                            <Button 
                              icon={<RetweetOutlined />} 
                              onClick={() => setCaptchaRegister(generateCaptcha())}
                              title="Refresh Captcha"
                            />
                          </div>
                        </Form.Item>
                      </div>
                    )}

                    {/* Action buttons */}
                    <Form.Item style={{ marginBottom: 0, marginTop: '20px' }}>
                      <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={submitting} 
                        style={{ background: '#000000', borderColor: '#000000', padding: '6px 24px', fontWeight: 600 }}
                      >
                        {t('submitGrievanceBtn')}
                      </Button>
                      <Button 
                        onClick={resetRegisterForm} 
                        style={{ marginLeft: '12px' }}
                      >
                        {t('resetBtn')}
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form>
            </div>
          )}

          {/* TAB CONTENT: SEND REMINDER */}
          {activeTab === 'reminder' && (
            <div>
              <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '20px' }}>
                <span style={{ color: '#000000', fontWeight: '800', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BellOutlined /> {t('sendReminderTitle')}
                </span>
              </div>

              <Form
                form={reminderForm}
                layout="vertical"
                onFinish={handleSendReminder}
              >
                <Form.Item
                  name="registrationNumber"
                  label={<span style={{ fontWeight: 700 }}>{t('regNumberLabel')}</span>}
                  rules={[{ required: true, message: t('regNumberLabel') }]}
                >
                  <Input placeholder={t('regNumberPlaceholder')} style={{ maxWidth: '400px' }} />
                </Form.Item>

                <Form.Item
                  name="contactDetail"
                  label={<span style={{ fontWeight: 700 }}>{t('mobileEmailLabel')}</span>}
                  rules={[{ required: true, message: t('mobileEmailLabel') }]}
                >
                  <Input placeholder={t('mobileEmailPlaceholder')} style={{ maxWidth: '400px' }} />
                </Form.Item>

                {/* Captcha */}
                <Form.Item
                  label={<span style={{ fontWeight: 700 }}>{t('securityCode')}</span>}
                  required
                  style={{ marginBottom: '25px' }}
                >
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Input 
                      placeholder={t('typeSecurityCode')}
                      value={captchaInputReminder}
                      onChange={(e) => setCaptchaInputReminder(e.target.value)}
                      style={{ maxWidth: '200px' }}
                    />
                    <div style={{
                      background: 'repeating-linear-gradient(45deg, #f5f5f5, #e8e8e8 10px, #d8d8d8 10px, #d8d8d8 20px)',
                      color: '#2e1c7d',
                      fontFamily: 'monospace',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      letterSpacing: '0.25em',
                      padding: '4px 16px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      userSelect: 'none',
                      textDecoration: 'line-through'
                    }}>
                      {captchaReminder}
                    </div>
                    <Button 
                      icon={<RetweetOutlined />} 
                      onClick={() => setCaptchaReminder(generateCaptcha())}
                      title="Refresh Captcha"
                    />
                  </div>
                </Form.Item>

                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={fetchingDetails}
                  style={{ background: '#000000', borderColor: '#000000', fontWeight: 600 }}
                >
                  {t('submitReminderBtn')}
                </Button>
              </Form>
            </div>
          )}

          {/* TAB CONTENT: VIEW STATUS */}
          {activeTab === 'status' && (
            <div>
              <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '20px' }}>
                <span style={{ color: '#000000', fontWeight: '800', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EyeOutlined /> {t('viewStatusTitle')}
                </span>
              </div>

              <Form
                form={statusForm}
                layout="vertical"
                onFinish={handleViewStatus}
                style={{ marginBottom: '25px' }}
              >
                <Form.Item
                  name="registrationNumber"
                  label={<span style={{ fontWeight: 700 }}>{t('regNumberLabel')}</span>}
                  rules={[{ required: true, message: t('regNumberLabel') }]}
                >
                  <Input placeholder={t('regNumberPlaceholder')} style={{ maxWidth: '400px' }} />
                </Form.Item>

                {/* Captcha */}
                <Form.Item
                  label={<span style={{ fontWeight: 700 }}>{t('securityCode')}</span>}
                  required
                  style={{ marginBottom: '25px' }}
                >
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Input 
                      placeholder={t('typeSecurityCode')}
                      value={captchaInputStatus}
                      onChange={(e) => setCaptchaInputStatus(e.target.value)}
                      style={{ maxWidth: '200px' }}
                    />
                    <div style={{
                      background: 'repeating-linear-gradient(45deg, #f5f5f5, #e8e8e8 10px, #d8d8d8 10px, #d8d8d8 20px)',
                      color: '#2e1c7d',
                      fontFamily: 'monospace',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      letterSpacing: '0.25em',
                      padding: '4px 16px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      userSelect: 'none',
                      textDecoration: 'line-through'
                    }}>
                      {captchaStatus}
                    </div>
                    <Button 
                      icon={<RetweetOutlined />} 
                      onClick={() => setCaptchaStatus(generateCaptcha())}
                      title="Refresh Captcha"
                    />
                  </div>
                </Form.Item>

                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={fetchingDetails}
                  style={{ background: '#000000', borderColor: '#000000', fontWeight: 600 }}
                  icon={<SearchOutlined />}
                >
                  {t('searchStatusBtn')}
                </Button>
              </Form>

              {/* Status details display area */}
              {fetchingDetails && (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <Spin /> {t('searchingArchives')}
                </div>
              )}

              {!fetchingDetails && searchAttempted && (
                <div style={{ animation: 'fadeIn 0.3s ease-out forwards' }}>
                  {searchedGrievance ? (
                    <div style={{ border: '1px solid #c8e6c9', borderRadius: '4px', background: '#e8f5e9', padding: '20px' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2e7d32', borderBottom: '1px solid #c8e6c9', paddingBottom: '8px', marginBottom: '15px' }}>
                        {t('grvFoundTitle')}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#555' }}>{t('tblRegNumber')}: </span>
                          <strong>{searchedGrievance.regNum}</strong>
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: '#555' }}>{t('tblDateOfSub')}: </span>
                          {new Date(searchedGrievance.date).toLocaleString()}
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: '#555' }}>{t('tblCategory')}: </span>
                          <Tag color="blue">{
                            searchedGrievance.category === "Corruption/Bribery" ? (language === 'en' ? "Corruption/Bribery" : "भ्रष्टाचार/रिश्वत") :
                            searchedGrievance.category === "Operational Bottleneck" ? (language === 'en' ? "Operational Bottleneck" : "परिचालन बाधा") :
                            searchedGrievance.category === "Severe Misconduct" ? (language === 'en' ? "Severe Misconduct" : "गंभीर कदाचार") :
                            searchedGrievance.category === "General Malpractice" ? (language === 'en' ? "General Malpractice" : "सामान्य कदाचार") :
                            searchedGrievance.category
                          }</Tag>
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: '#555' }}>{t('tblCurrentStatus')}: </span>
                          <Tag color="orange" style={{ fontWeight: 'bold' }}>{
                            searchedGrievance.status === "ESCALATED TO CHAIRMAN'S OFFICE - UNDER REVIEW" ? (language === 'en' ? "ESCALATED TO CHAIRMAN'S OFFICE - UNDER REVIEW" : "अध्यक्ष कार्यालय को अग्रेषित - समीक्षा के अधीन") :
                            searchedGrievance.status === "PENDING REDRESSAL" ? (language === 'en' ? "PENDING REDRESSAL" : "निवारण लंबित") :
                            searchedGrievance.status
                          }</Tag>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px dashed #c8e6c9', paddingTop: '12px' }}>
                        <span style={{ fontWeight: 700, color: '#555', display: 'block', marginBottom: '5px' }}>{t('tblDescription')}:</span>
                        <div style={{ whiteSpace: 'pre-wrap', color: '#333', background: '#fff', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.85rem' }}>
                          {searchedGrievance.description}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #ffcdd2', borderRadius: '4px', background: '#ffebee', padding: '20px', color: '#c62828', fontWeight: 600 }}>
                      {t('grvNotFound')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: UPLOAD DOCUMENT */}
          {activeTab === 'upload' && (
            <div>
              <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px', marginBottom: '20px' }}>
                <span style={{ color: '#000000', fontWeight: '800', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UploadOutlined /> {t('uploadDocTitle')}
                </span>
              </div>

              <Form
                form={uploadForm}
                layout="vertical"
                onFinish={handleUploadDocument}
              >
                <Form.Item
                  name="registrationNumber"
                  label={<span style={{ fontWeight: 700 }}>{t('regNumberLabel')}</span>}
                  rules={[{ required: true, message: t('regNumberLabel') }]}
                >
                  <Input placeholder={t('regNumberPlaceholder')} style={{ maxWidth: '400px' }} />
                </Form.Item>

                {/* Upload File Input */}
                <Form.Item
                  label={<span style={{ fontWeight: 700 }}>{t('selectDocLabel')}</span>}
                  required
                >
                  <Upload beforeUpload={() => false} maxCount={1}>
                    <Button icon={<UploadOutlined />}>{t('selectFileBtn')}</Button>
                  </Upload>
                </Form.Item>

                {/* Captcha */}
                <Form.Item
                  label={<span style={{ fontWeight: 700 }}>{t('securityCode')}</span>}
                  required
                  style={{ marginBottom: '25px' }}
                >
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <Input 
                      placeholder={t('typeSecurityCode')}
                      value={captchaInputUpload}
                      onChange={(e) => setCaptchaInputUpload(e.target.value)}
                      style={{ maxWidth: '200px' }}
                    />
                    <div style={{
                      background: 'repeating-linear-gradient(45deg, #f5f5f5, #e8e8e8 10px, #d8d8d8 10px, #d8d8d8 20px)',
                      color: '#2e1c7d',
                      fontFamily: 'monospace',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      letterSpacing: '0.25em',
                      padding: '4px 16px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      userSelect: 'none',
                      textDecoration: 'line-through'
                    }}>
                      {captchaUpload}
                    </div>
                    <Button 
                      icon={<RetweetOutlined />} 
                      onClick={() => setCaptchaUpload(generateCaptcha())}
                      title="Refresh Captcha"
                    />
                  </div>
                </Form.Item>

                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={fetchingDetails}
                  style={{ background: '#000000', borderColor: '#000000', fontWeight: 600 }}
                >
                  {t('uploadDocBtn')}
                </Button>
              </Form>
            </div>
          )}

        </Card>
      </div>

      {/* 5. BLACK FOOTER */}
      <div style={{ 
        background: '#000000', 
        padding: '16px 45px', 
        textAlign: 'center', 
        color: '#fff', 
        fontSize: '0.78rem',
        borderTop: '3px solid #00ACC1'
      }}>
        {t('grmsFooterText')}
      </div>

    </div>
  );
};

export default GrievancePortal;
