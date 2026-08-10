import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Spin, Typography, Descriptions, Tag, Button, Result, Alert } from 'antd';
import { PrinterOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import API_BASE from '../api';
import { useLanguage } from '../LanguageContext';

const { Title, Text } = Typography;

const VerifyClearance = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    if (!token) {
      setError(language === 'en' 
        ? "Verification token missing. Please scan a valid NMPA clearance QR code." 
        : "सत्यापन टोकन गायब है। कृपया एक वैध एनएमपीए निकासी क्यूआर कोड स्कैन करें।");
      setLoading(false);
      return;
    }

    const fetchVerification = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/clearance/verify?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          setCertificate(data);
        } else {
          const err = await res.json();
          setError(err.message || (language === 'en' ? "Invalid clearance certificate." : "अमान्य निकासी प्रमाणपत्र।"));
        }
      } catch (err) {
        setError(language === 'en' ? "Failed to connect to NMPA verification registry." : "एनएमपीए सत्यापन रजिस्ट्री से जुड़ने में विफल।");
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [token, language]);

  const handlePrint = () => {
    if (!certificate) return;
    const printWindow = window.open('', '_blank', 'width=800,height=950');
    if (!printWindow) {
      return;
    }

    const isDetained = certificate.adjudication_status === 'Clearance Denied - Detained for Physical Audit' || 
      certificate.adjudication_status === 'Rejected' || 
      (token && token.startsWith('NMPA-QDO'));

    const verifyUrl = `${window.location.origin}${import.meta.env.BASE_URL || '/'}verify-clearance?token=${encodeURIComponent(token || '')}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
    const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL || '/'}nmpa-logo.png`;
    const emblemUrl = `${window.location.origin}${import.meta.env.BASE_URL || '/'}emblem-of-india.png`;
    const timestamp = new Date(certificate.date || Date.now()).toLocaleString('en-GB').replace(',', '');

    const vesselName = (certificate.vessel_name || 'N/A').toUpperCase();
    const countryOrigin = (certificate.country_of_origin || 'N/A').toUpperCase();
    const vesselImo = certificate.vessel_imo || 'N/A';
    const cargoType = (certificate.cargo_type || 'N/A').toUpperCase();
    const weight = certificate.gross_tonnage || certificate.weight || 'N/A';

    const paragraphText = isDetained
      ? `THE VESSEL ${vesselName} (IMO: ${vesselImo}) ARRIVED FROM ${countryOrigin} LOADED WITH CARGO ${cargoType} (DECLARED WEIGHT: ${weight} MT) HAS BEEN DETAINED FOR DETAILED PHYSICAL COMPLIANCE AUDIT UNDER THE CUSTOMS ACT, 1962 & THE INDIAN PORTS ACT, 1908. THE AUTOMATED RISK MANAGEMENT SYSTEM (RMS) IDENTIFIED AN OUT-OF-SPECIFICATION METRIC FLAGGED AS ${certificate.rms_risk_level || 'HIGH RISK'}. THE VESSEL IS STRICTLY PROHIBITED FROM DEPARTURE OR CARGO DISCHARGE UNTIL PHYSICAL AUDIT APPROVAL AND ADJUDICATION IS GRANTED BY THE PORT AUTHORITY OFFICER.`
      : `THE VESSEL ${vesselName} (IMO: ${vesselImo}) WITH ${countryOrigin} REGISTRATION/FLAG ARRIVED FROM ${countryOrigin} LOADED WITH CARGO ${cargoType} (GROSS TONNAGE: ${weight} MT) HAS COMPLIED WITH THE REGULATORY REQUIREMENTS UNDER THE CUSTOMS ACT, 1962 & THE INDIAN PORTS ACT, 1908 AND AI RISK MANAGEMENT SYSTEM (RMS) SECURITY AUDITS. THE VESSEL IS PERMITTED TO SAIL OUT OF THE PORT.`;

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('verifyCertTitle')} - ${certificate.bill_of_lading}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #fff;
            color: #000;
            padding: 20px;
            margin: 0;
          }
          .outer-border {
            border: 2px solid #0e3f27;
            padding: 12px;
            background-color: #94C9A9;
            max-width: 720px;
            margin: 0 auto;
            box-sizing: border-box;
          }
          .inner-border {
            border: 4px double #0e3f27;
            padding: 30px;
            box-sizing: border-box;
            min-height: 940px;
            position: relative;
          }
          .emblem-container {
            text-align: center;
            margin-bottom: 10px;
          }
          .emblem-img {
            height: 85px;
            width: auto;
            display: block;
            margin: 0 auto;
          }
          .logo-container {
            position: absolute;
            top: 30px;
            left: 30px;
            text-align: center;
          }
          .logo-img {
            width: 100px;
            height: 100px;
            object-fit: contain;
          }
          .qr-code-container {
            position: absolute;
            top: 30px;
            right: 30px;
            text-align: center;
          }
          .qr-code-img {
            width: 100px;
            height: 100px;
            border: 1px solid #0e3f27;
            background: #fff;
            padding: 4px;
          }
          .qr-token-text {
            font-family: monospace;
            font-size: 9px;
            color: #000;
            margin-top: 3px;
          }
          .header-text {
            text-align: center;
            margin-top: 10px;
            margin-bottom: 25px;
          }
          .gov-title {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            letter-spacing: 0.5px;
            margin: 2px 0;
          }
          .gov-title-hi {
            font-size: 15px;
            font-weight: bold;
            color: #000;
            margin: 2px 0;
          }
          .ministry-title {
            font-size: 11px;
            font-weight: bold;
            color: #000;
            margin: 2px 0;
          }
          .ministry-title-hi {
            font-size: 12px;
            font-weight: bold;
            color: #000;
            margin: 2px 0;
          }
          .organisation-title {
            font-size: 11px;
            font-weight: bold;
            color: #000;
            margin: 2px 0;
          }
          .organisation-title-hi {
            font-size: 12px;
            font-weight: bold;
            color: #000;
            margin: 2px 0;
          }
          .email-text {
            font-size: 10px;
            color: #000;
            margin: 4px 0 10px 0;
          }
          .certificate-title {
            font-size: 13.5px;
            font-weight: bold;
            color: #000;
            margin-top: 15px;
            text-decoration: underline;
            letter-spacing: 0.5px;
          }
          .body-text {
            font-size: 12.5px;
            line-height: 1.8;
            text-align: justify;
            margin: 40px 0;
            color: #000;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
          .meta-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-top: 40px;
            margin-bottom: 25px;
            font-size: 11.5px;
            color: #000;
            line-height: 1.8;
          }
          .meta-left {
            flex: 1.2;
          }
          .meta-right {
            flex: 0.8;
            text-align: left;
            padding-left: 20px;
          }
          .signature-title {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .signature-org {
            font-size: 10.5px;
          }
          .divider-line {
            border-top: 2px solid #fff;
            margin: 15px 0;
          }
          .note-text {
            font-size: 10px;
            line-height: 1.6;
            text-align: justify;
            color: #000;
            margin: 15px 0;
          }
          .footer-text {
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            color: #000;
            margin-top: 25px;
          }
          @media print {
            body {
              padding: 0;
              background-color: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .outer-border {
              background-color: #94C9A9 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              max-width: 100%;
              margin: 0;
              border: 2px solid #0e3f27 !important;
            }
            .inner-border {
              border: 4px double #0e3f27 !important;
              min-height: 95vh;
            }
          }
        </style>
      </head>
      <body>
        <div class="outer-border">
          <div class="inner-border">
            <div class="logo-container">
              <img class="logo-img" src="${logoUrl}" alt="NMPA Logo" />
            </div>
            <div class="emblem-container">
              <img src="${emblemUrl}" alt="National Emblem" class="emblem-img" />
            </div>

            <div class="qr-code-container">
              <img class="qr-code-img" src="${qrImageUrl}" alt="${isDetained ? 'Detainment QDO QR Link' : 'Clearance QR Link'}" />
              <div class="qr-token-text">${token}</div>
            </div>

            <div class="header-text">
              <div class="gov-title">GOVERNMENT OF INDIA</div>
              <div class="gov-title-hi">भारत सरकार</div>
              <div class="ministry-title">MINISTRY OF PORTS, SHIPPING AND WATERWAYS</div>
              <div class="ministry-title-hi">पत्तन, पोत परिवहन और जलमार्ग मंत्रालय</div>
              <div class="organisation-title">NEW MANGALORE PORT AUTHORITY</div>
              <div class="organisation-title-hi">नूतन मंगलूर पत्तन प्राधिकरण</div>
              <div class="email-text">ईमेल/Email: contact@nmpa.gov.in</div>
              <div class="certificate-title">PORT CLEARANCE CERTIFICATE - पत्तन निकासी का प्रमाण पत्र</div>
            </div>

            <div class="body-text">
              ${paragraphText}
            </div>

            <div class="meta-section">
              <div class="meta-left">
                <div><strong>PORT:</strong> New Mangalore ( INDIA )</div>
                <div><strong>DATED:</strong> ${timestamp}</div>
                <div><strong>OFFICER:</strong> Port Clearance Officer</div>
                <div><strong>NO.:</strong> PCC ${token} /NMPA/${new Date().getFullYear()}</div>
              </div>
              <div class="meta-right">
                <div class="signature-title">Port Clearance Officer</div>
                <div class="signature-org">NEW MANGALORE PORT AUTHORITY,</div>
              </div>
            </div>

            <div class="divider-line"></div>

            <div class="note-text">
              Note: THIS CERTIFICATE IS VALID TILL SAILING OF THE VESSEL FROM THE PORT. ONE COPY OF THE CERTIFICATE WILL BE FORWARDED TO THE CUSTOMS AND GATE SECURITY AUTHORITY FOR GRANTING PORT CLEARANCE, TWO COPIES OF THE CERTIFICATE TO BE HANDED OVER TO THE BOARDING PILOT FOR VOYAGE DEPARTURE INTEGRITY AUDIT BY THE PORT AUTHORITY.
            </div>

            <div class="divider-line"></div>

            <div class="footer-text">
              This Is System Generated Certificate.
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d2b5e 0%, #1e5ba4 100%)',
      padding: '20px'
    }}>
      
      {/* Top Header Selector for Public Page */}
      <div style={{
        maxWidth: '750px',
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '12px'
      }}>
        <div className="nmpa-lang-toggle-pill">
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
      </div>

      <Card style={{
        maxWidth: '750px',
        width: '100%',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: '20px', fontWeight: 600, color: 'var(--nmpa-blue)' }}>
              {language === 'en' ? 'Contacting NMPA Customs Registry...' : 'एनएमपीए सीमा शुल्क रजिस्ट्री से संपर्क किया जा रहा है...'}
            </div>
          </div>
        ) : error ? (
          <Result
            status="error"
            title={t('verifyFailedTitle')}
            subTitle={error}
            extra={
              <Text type="secondary">
                {t('verifyFailedDesc')}
              </Text>
            }
          />
        ) : (
          <div style={{ padding: '10px' }}>
            <div style={{
              textAlign: 'center',
              borderBottom: '2.5px double #0d2b5e',
              paddingBottom: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <div className="nmpa-logo-circle" style={{ width: 60, height: 60, border: '2px solid #0d2b5e', padding: '2px' }}>
                  <img src={`${import.meta.env.BASE_URL}nmpa-logo.png`} alt="NMPA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              <Title level={2} style={{ color: '#0d2b5e', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '1.5rem' }}>
                {t('nmpaTitle')}
              </Title>
              <Text type="secondary" style={{ fontStyle: 'italic', display: 'block' }}>
                {language === 'en' ? 'Official Maritime Custom Adjudication Portal' : 'आधिकारिक समुद्री सीमा शुल्क निर्णय पोर्टल'}
              </Text>
              <Tag 
                color={(certificate.adjudication_status === 'Clearance Denied - Detained for Physical Audit' || certificate.adjudication_status === 'Rejected' || (token && token.startsWith('NMPA-QDO'))) ? 'red' : 'green'} 
                icon={(certificate.adjudication_status === 'Clearance Denied - Detained for Physical Audit' || certificate.adjudication_status === 'Rejected' || (token && token.startsWith('NMPA-QDO'))) ? <CloseCircleOutlined /> : <CheckCircleOutlined />} 
                style={{ marginTop: '10px', fontSize: '0.9rem', padding: '4px 12px' }}
              >
                {(certificate.adjudication_status === 'Clearance Denied - Detained for Physical Audit' || certificate.adjudication_status === 'Rejected' || (token && token.startsWith('NMPA-QDO')))
                  ? (language === 'en' ? 'ENFORCEMENT HOLD (QDO) - DETAINED' : 'निरोध आदेश (QDO) - निरुद्ध') 
                  : t('verifyActivePass')}
              </Tag>
            </div>

            <Descriptions title={t('verifyCertTitle')} bordered column={{ xs: 1, sm: 2, md: 2 }} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label={t('clearanceCode')} span={2}>
                <Text copyable strong style={{ fontFamily: 'monospace' }}>{token}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('tblBlRef')}>{certificate.bill_of_lading}</Descriptions.Item>
              <Descriptions.Item label={t('tblVesselName')}>{certificate.vessel_name || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label={t('vesselImo')}>{certificate.vessel_imo || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label={t('grossTonnage')}>{certificate.gross_tonnage || 'N/A'} MT</Descriptions.Item>
              <Descriptions.Item label={t('commodityClass')} span={2}>{certificate.cargo_type}</Descriptions.Item>
              <Descriptions.Item label={t('countryOrigin')}>{certificate.country_of_origin}</Descriptions.Item>
              <Descriptions.Item label={language === 'en' ? 'AI RMS Risk Tier' : 'एआई आरएमएस जोखिम स्तर'}>
                <Tag color={certificate.rms_risk_level === 'CRITICAL RISK' ? 'red' : certificate.rms_risk_level === 'ELEVATED RISK' ? 'orange' : 'green'}>
                  {certificate.rms_risk_level === 'CRITICAL RISK' ? t('riskCritical') : certificate.rms_risk_level === 'ELEVATED RISK' ? t('riskElevated') : t('riskRoutine')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={language === 'en' ? 'Date of Clearance' : 'निकासी की तिथि'} span={2}>
                {new Date(certificate.date).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Alert
              message={(certificate.adjudication_status === 'Clearance Denied - Detained for Physical Audit' || certificate.adjudication_status === 'Rejected' || (token && token.startsWith('NMPA-QDO')))
                ? (language === 'en' ? 'OFFICIAL QUARANTINE & DETAINMENT ORDER (QDO)' : 'आधिकारिक क्वारंताइन और निरोध आदेश (QDO)')
                : t('verifyAuthenticTitle')}
              description={(certificate.adjudication_status === 'Clearance Denied - Detained for Physical Audit' || certificate.adjudication_status === 'Rejected' || (token && token.startsWith('NMPA-QDO')))
                ? (language === 'en' ? 'This vessel/cargo is under active custom detention. Sailing and cargo discharge are strictly prohibited.' : 'यह पोत/कार्गो सक्रिय सीमा शुल्क निरोध के तहत है। नौकायन और कार्गो उतराई सख्त वर्जित है।')
                : t('verifyAuthenticDesc')}
              type={(certificate.adjudication_status === 'Clearance Denied - Detained for Physical Audit' || certificate.adjudication_status === 'Rejected' || (token && token.startsWith('NMPA-QDO'))) ? 'error' : 'success'}
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <div style={{ textAlign: 'right' }}>
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint} size="large">
                {t('verifyPrintBtn')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifyClearance;
