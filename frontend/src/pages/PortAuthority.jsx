import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API_BASE from '../api';
import {
  Row, Col, Card, Statistic, Table, Tag, Button, Drawer, Descriptions,
  Image, Modal, Input, Badge, Typography, Space, message, Alert, Tabs, Select
} from 'antd';
import {
  AlertOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SafetyCertificateOutlined, ReloadOutlined, WarningOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { QRCode } from 'antd';
import Navbar from '../components/Navbar';
import { useLanguage } from '../LanguageContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const placeholderBase64 = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='100' viewBox='0 0 150 100'><rect width='150' height='100' fill='%23eee'/><text x='50%' y='50%' font-size='12' text-anchor='middle' alignment-baseline='middle' fill='%23aaa'>No Preview Available</text></svg>";

const printCertificate = (record, qrToken, qrDataUrl, language, t) => {
  const printWindow = window.open('', '_blank', 'width=800,height=950');
  if (!printWindow) {
    message.error(language === 'en' ? "Pop-up blocked. Please allow pop-ups to print the certificate." : "पॉप-अप ब्लॉक हो गया है। कृपया सर्टिफिकेट प्रिंट करने के लिए पॉप-अप की अनुमति दें।");
    return;
  }

  const qrImageUrl = qrDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrToken || '')}`;
  const timestamp = new Date().toLocaleString('en-GB').replace(',', '');

  const vesselName = (record.vesselName || 'N/A').toUpperCase();
  const countryOrigin = (record.countryOfOrigin || 'N/A').toUpperCase();
  const vesselImo = record.vesselImo || 'N/A';
  const cargoType = (record.cargoType || 'N/A').toUpperCase();
  const weight = record.declaredWeight || record.grossTonnage || 'N/A';

  const paragraphText = `THE VESSEL ${vesselName} (IMO: ${vesselImo}) WITH ${countryOrigin} REGISTRATION/FLAG ARRIVED FROM ${countryOrigin} LOADED WITH CARGO ${cargoType} (GROSS TONNAGE: ${weight} MT) HAS COMPLIED WITH THE REGULATORY REQUIREMENTS UNDER THE CUSTOMS ACT, 1962 & THE INDIAN PORTS ACT, 1908 AND AI RISK MANAGEMENT SYSTEM (RMS) SECURITY AUDITS. THE VESSEL IS PERMITTED TO SAIL OUT OF THE PORT.`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t('verifyCertTitle')} - ${record.manifestId}</title>
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
          <div class="emblem-container">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/200px-Emblem_of_India.svg.png" alt="Emblem of India" class="emblem-img" />
          </div>

          <div class="qr-code-container">
            <img class="qr-code-img" src="${qrImageUrl}" alt="Clearance QR Link" />
            <div class="qr-token-text">${qrToken}</div>
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
              <div><strong>NO.:</strong> PCC ${qrToken} /NMPA/${new Date().getFullYear()}</div>
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

const PortAuthority = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || '0';
  const [activeTab, setActiveTab] = useState('1');
  const { language, t } = useLanguage();

  useEffect(() => {
    const tabInt = parseInt(tabParam);
    if (tabInt >= 0 && tabInt <= 2) {
      setActiveTab(String(tabInt + 1));
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: String(parseInt(key) - 1) });
  };

  const [loading, setLoading] = useState(false);
  const [inspectedCargoList, setInspectedCargoList] = useState([]);
  const [reviewDrawerVisible, setReviewDrawerVisible] = useState(false);
  const [activeDossier, setActiveDossier] = useState(null);

  // Rejection/Decision inputs
  const [isRejecting, setIsRejecting] = useState(false);
  const [denialRemarks, setDenialRemarks] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [adjStatus, setAdjStatus] = useState('Port Clearance Granted');
  const [adjNotes, setAdjNotes] = useState('');

  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/inspections`);
      if (res.ok) {
        const raw = await res.json();
        // Map raw DB inspections
        const mapped = raw.map(item => ({
          key: item.id,
          id: item.id,
          manifestId: item.bill_of_lading,
          containerNo: item.containerNo || `MSCU${849201 + item.id}`,
          vehicleNo: item.vehicleNo || `KA-19-M-${6000 + item.id}`,
          cargoType: item.cargo_type,
          declaredWeight: item.weight,
          actualWeight: item.actual_weight,
          status: item.status,
          imagePath: item.image_url || placeholderBase64,
          notes: item.notes,
          date: item.date,
          inspectorEmail: item.inspector_email,
          sealIntact: item.seal_intact !== null ? item.seal_intact : true,
          structuralDamage: item.structural_damage !== null ? item.structural_damage : false,
          qrToken: item.qr_token,
          assignedRiskLevel: item.assigned_risk_level,
          inspectionSummary: item.inspection_summary,
          vesselImo: item.vessel_imo,
          vesselName: item.vessel_name,
          countryOfOrigin: item.country_of_origin,
          rmsRiskLevel: item.rms_risk_level || item.assigned_risk_level,
          rmsAnalysisMemo: item.rms_analysis_memo || item.inspection_summary
        }));
        setInspectedCargoList(mapped);
      } else {
        message.error(language === 'en' ? 'Failed to retrieve inspection queue.' : 'निरीक्षण कतार प्राप्त करने में विफल।');
      }
    } catch {
      message.error(language === 'en' ? 'Backend connection error.' : 'बैकएंड कनेक्शन त्रुटि।');
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchInspections();
  }, [fetchInspections]);

  // Derived counts for stats cards
  const pendingVerificationCount = inspectedCargoList.filter(item => item.status === 'Inspected - Awaiting Authority Adjudication' || item.status === 'Awaiting Authority Adjudication' || item.status === 'Pending Approval').length;
  const clearedCount = inspectedCargoList.filter(item => item.status === 'Port Clearance Granted' || item.status === 'Approved').length;
  const detainedCount = inspectedCargoList.filter(item => item.status === 'Clearance Denied - Detained for Physical Audit' || item.status === 'Rejected').length;

  const handleReviewDossier = (record) => {
    setActiveDossier(record);
    setDenialRemarks('');
    setIsRejecting(false);
    setAdjStatus('Port Clearance Granted');
    setAdjNotes('');
    setReviewDrawerVisible(true);
  };

  // Submit Adjudication Decision
  const handleSubmitAdjudication = async (status, notes) => {
    if (!activeDossier) return;

    if (status !== 'Re-Inspect' && !notes.trim()) {
      message.warning(language === 'en' ? 'Please input adjudication notes.' : 'कृपया अधिनिर्णय टिप्पणी दर्ज करें।');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const response = await fetch(`${API_BASE}/api/inspections/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeDossier.id,
          status: status,
          notes: notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReviewDrawerVisible(false);
        fetchInspections();

        if (status === 'Port Clearance Granted' || status === 'Approved') {
          const qrToken = data.qrToken || `NMPA-PCC-${activeDossier.id}-${Math.floor(100000 + Math.random() * 900000)}`;
          const verifyUrl = `${window.location.origin}${import.meta.env.BASE_URL || '/'}verify-clearance?token=${qrToken}`;
          Modal.success({
            title: t('passCleared'),
            okText: t('done'),
            content: (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                <Text type="success" strong style={{ fontSize: '1.05rem' }}>
                  {t('cargoApproveSuccess')}
                </Text>
                <div style={{ padding: '10px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                  <QRCode value={verifyUrl} size={160} />
                </div>
                <Text style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#555' }}>
                  {t('clearingCode')}: {qrToken}
                </Text>
                <Button 
                  type="primary" 
                  style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', marginTop: '10px' }}
                  onClick={() => {
                    const canvas = document.querySelector('.ant-modal-body canvas');
                    const qrDataUrl = canvas ? canvas.toDataURL() : '';
                    printCertificate(activeDossier, qrToken, qrDataUrl, language, t);
                  }}
                >
                  {t('printClearanceBtn')}
                </Button>
              </div>
            ),
          });

          // Auto-trigger printing after short render delay
          setTimeout(() => {
            const canvas = document.querySelector('.ant-modal-body canvas');
            const qrDataUrl = canvas ? canvas.toDataURL() : '';
            printCertificate(activeDossier, qrToken, qrDataUrl, language, t);
          }, 600);
        } else if (status === 'Clearance Denied - Detained for Physical Audit' || status === 'Rejected') {
          message.error(language === 'en' ? `Cargo entry ${activeDossier.manifestId} rejected/detained.` : `कार्गो प्रविष्टि ${activeDossier.manifestId} अस्वीकृत/निरुद्ध कर दी गई।`);
        } else {
          message.info(language === 'en' ? `Cargo ${activeDossier.manifestId} returned to Inspector queue.` : `कार्गो ${activeDossier.manifestId} निरीक्षक कतार में वापस भेज दिया गया।`);
        }
      } else {
        message.error(language === 'en' ? 'Transaction failed.' : 'लेनदेन विफल रहा।');
      }
    } catch {
      message.error(language === 'en' ? 'Connection error.' : 'कनेक्शन त्रुटि।');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleQuickAction = async (id, targetStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/inspections/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          status: targetStatus,
          notes: `Decision from Authority: ${targetStatus}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        message.success(language === 'en' ? `Manifest ID ${id} adjudication updated successfully.` : `मैनिफेस्ट आईडी ${id} निर्णय सफलतापूर्वक अपडेट किया गया।`);
        fetchInspections();
        
        if (targetStatus === 'Port Clearance Granted') {
          const record = inspectedCargoList.find(item => item.id === id) || {
            manifestId: `BL-NMPA-2026-${id}`,
            id: id,
            status: 'Port Clearance Granted'
          };
          const qrToken = data.qrToken || `NMPA-PCC-${id}-${Math.floor(100000 + Math.random() * 900000)}`;
          const verifyUrl = `${window.location.origin}${import.meta.env.BASE_URL || '/'}verify-clearance?token=${qrToken}`;

          Modal.success({
            title: t('pccIssuedTitle'),
            okText: t('done'),
            content: (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
                <Text type="success" strong style={{ fontSize: '1.05rem' }}>
                  {t('vesselPassActive')}
                </Text>
                <div style={{ padding: '10px', background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                  <QRCode value={verifyUrl} size={160} />
                </div>
                <Text style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#555' }}>
                  {t('clearingCode')}: {qrToken}
                </Text>
                <Text type="secondary" style={{ fontSize: '0.75rem' }}>
                  {t('timestampLabel')}: {new Date().toLocaleString()}
                </Text>
                <Button 
                  type="primary" 
                  style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', marginTop: '10px' }}
                  onClick={() => {
                    const canvas = document.querySelector('.ant-modal-body canvas');
                    const qrDataUrl = canvas ? canvas.toDataURL() : '';
                    printCertificate(record, qrToken, qrDataUrl, language, t);
                  }}
                >
                  {t('printClearanceBtn')}
                </Button>
              </div>
            ),
          });

          // Auto-trigger printing after short render delay
          setTimeout(() => {
            const canvas = document.querySelector('.ant-modal-body canvas');
            const qrDataUrl = canvas ? canvas.toDataURL() : '';
            printCertificate(record, qrToken, qrDataUrl, language, t);
          }, 600);
        } else if (targetStatus === 'Clearance Denied - Detained for Physical Audit') {
          message.error(language === 'en' ? `Manifest ID ${id} detained for physical custom audit.` : `मैनिफेस्ट आईडी ${id} को भौतिक सीमा शुल्क ऑडिट के लिए रोक लिया गया।`);
        }
      } else {
        message.error(language === 'en' ? 'Adjudication action failed.' : 'अधिनिर्णय कार्रवाई विफल रही।');
      }
    } catch {
      message.error(language === 'en' ? 'Connection error.' : 'कनेक्शन त्रुटि।');
    }
  };

  const renderStatusTag = (status) => {
    let color = 'gold';
    let statusKey = 'statusPending';
    if (status === 'Approved' || status === 'Port Clearance Granted') {
      color = 'green';
      statusKey = 'statusClearanceGranted';
    } else if (status === 'Rejected' || status === 'Clearance Denied - Detained for Physical Audit') {
      color = 'red';
      statusKey = 'statusClearanceDenied';
    } else if (status === 'Inspected') {
      color = 'blue';
      statusKey = 'statusInspected';
    } else if (status === 'Inspected - Awaiting Authority Adjudication') {
      color = 'blue';
      statusKey = 'statusInspectedAwaitingAdjudication';
    } else if (status === 'Awaiting Physical Inspection') {
      color = 'gold';
      statusKey = 'statusAwaitingPhysicalInspection';
    } else if (status === 'Pending Approval' || status === 'Awaiting Authority Adjudication') {
      color = 'orange';
      statusKey = 'statusAwaitingAdjudication';
    } else if (status === 'Re-Inspect') {
      color = 'blue';
      statusKey = 'statusReinspect';
    }
    return <Tag color={color}>{t(statusKey)?.toUpperCase()}</Tag>;
  };

  const pendingApprovalsColumns = [
    {
      title: t('tblBlRef'),
      dataIndex: 'manifestId',
      key: 'manifestId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: t('tblVesselName'),
      dataIndex: 'vesselName',
      key: 'vesselName',
      render: (text) => text || '—'
    },
    {
      title: t('tblCommodity'),
      dataIndex: 'cargoType',
      key: 'cargoType',
    },
    {
      title: t('tblRmsMemo') + ' (' + (language === 'en' ? 'Risk Level' : 'जोखिम स्तर') + ')',
      dataIndex: 'rmsRiskLevel',
      key: 'rmsRiskLevel',
      render: (level) => {
        let color = 'green';
        let riskText = level || 'ROUTINE RISK';
        if (level === 'CRITICAL RISK') { color = 'red'; riskText = t('riskCritical'); }
        else if (level === 'ELEVATED RISK') { color = 'orange'; riskText = t('riskElevated'); }
        else if (level === 'ROUTINE RISK') { riskText = t('riskRoutine'); }
        return (
          <Tag color={color} style={{ fontWeight: 'bold' }}>
            {riskText}
          </Tag>
        );
      }
    },
    {
      title: t('tblRmsMemo') + ' (' + (language === 'en' ? 'Details' : 'विवरण') + ')',
      dataIndex: 'rmsAnalysisMemo',
      key: 'rmsAnalysisMemo',
      render: (text) => <Text style={{ fontSize: '0.82rem' }}>{text || 'No RMS memo available'}</Text>
    },
    {
      title: t('tblAction'),
      key: 'action',
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Button 
            type="default" 
            style={{ fontSize: '0.8rem', height: 'auto', padding: '4px 8px' }}
            onClick={() => handleReviewDossier(record)}
            block
          >
            Review Details
          </Button>
          <Button 
            type="primary" 
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', fontSize: '0.8rem', height: 'auto', padding: '4px 8px' }}
            onClick={() => handleQuickAction(record.id, 'Port Clearance Granted')}
            block
          >
            {t('issuePcc')}
          </Button>
          <Button 
            type="primary" 
            danger 
            style={{ fontSize: '0.8rem', height: 'auto', padding: '4px 8px' }}
            onClick={() => handleQuickAction(record.id, 'Clearance Denied - Detained for Physical Audit')}
            block
          >
            {t('issueQdo')}
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header Strip */}
      <Card style={{
        background: 'linear-gradient(135deg, #0f3057 0%, #00587a 100%)',
        borderRadius: '8px', marginBottom: '20px', border: 'none'
      }}>
        <Row align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>{t('authorityStation')}</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              {t('authoritySubtitle')}
            </Text>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right', marginTop: '10px' }}>
            <Button type="default" ghost onClick={fetchInspections} icon={<ReloadOutlined />}>
              {t('syncQueue')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tabs Layout */}
      <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          centered
          items={[
            // Tab 1: Review Queue Dashboard
            {
              key: '1',
              label: <span><Badge status="processing" style={{ marginRight: '6px' }} />{t('tabIgmQueue')}</span>,
              children: (
                <div>
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={24}>
                      <Card bordered={false} style={{ background: '#f0f5ff', borderLeft: '4px solid #1890ff' }}>
                        <Statistic
                          title={t('awaitingCustoms')}
                          value={pendingVerificationCount}
                          valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                          prefix={<WarningOutlined style={{ marginRight: '8px', color: '#1890ff' }} />}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Title level={4} style={{ marginBottom: '15px' }}>{t('igmQueueHeader')}</Title>
                  <Table
                    dataSource={inspectedCargoList.filter(item => item.status === 'Inspected - Awaiting Authority Adjudication' || item.status === 'Awaiting Authority Adjudication' || item.status === 'Pending Approval')}
                    columns={pendingApprovalsColumns}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                </div>
              )
            },

            // Tab 2: Port Clearances Granted Dashboard
            {
              key: '2',
              label: <span><CheckCircleOutlined style={{ color: '#52c41a', marginRight: '6px' }} />{t('tabPccGranted')}</span>,
              children: (
                <div>
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={24}>
                      <Card bordered={false} style={{ background: '#f6ffed', borderLeft: '4px solid #52c41a' }}>
                        <Statistic
                          title={t('clearedVesselsTitle')}
                          value={clearedCount}
                          valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                          prefix={<CheckCircleOutlined style={{ marginRight: '8px', color: '#52c41a' }} />}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Title level={4} style={{ marginBottom: '15px' }}>{t('approvedVesselClearances')}</Title>
                  <Table
                    dataSource={inspectedCargoList.filter(item => item.status === 'Port Clearance Granted' || item.status === 'Approved')}
                    columns={[
                      {
                        title: t('tblBlRef'),
                        dataIndex: 'manifestId',
                        key: 'manifestId',
                        render: (text) => <Text strong>{text}</Text>
                      },
                      {
                        title: t('tblVesselName'),
                        dataIndex: 'vesselName',
                        key: 'vesselName',
                      },
                      {
                        title: t('tblCargoType'),
                        dataIndex: 'cargoType',
                        key: 'cargoType',
                      },
                      {
                        title: t('tblGrossTonnage'),
                        dataIndex: 'declaredWeight',
                        key: 'declaredWeight',
                        render: (val) => `${val} MT`
                      },
                      {
                        title: t('tblRmsMemo'),
                        dataIndex: 'rmsRiskLevel',
                        key: 'rmsRiskLevel',
                        render: (level) => {
                          let color = 'green';
                          let riskText = level || 'ROUTINE RISK';
                          if (level === 'CRITICAL RISK') { color = 'red'; riskText = t('riskCritical'); }
                          else if (level === 'ELEVATED RISK') { color = 'orange'; riskText = t('riskElevated'); }
                          else if (level === 'ROUTINE RISK') { riskText = t('riskRoutine'); }
                          return <Tag color={color}>{riskText}</Tag>;
                        }
                      },
                      {
                        title: t('clearanceCode'),
                        dataIndex: 'qrToken',
                        key: 'qrToken',
                        render: (token) => <Text copyable style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{token || '—'}</Text>
                      }
                    ]}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                </div>
              )
            },

            // Tab 3: Enforcement Hold Log (QDO)
            {
              key: '3',
              label: <span><AlertOutlined style={{ color: '#ff4d4f', marginRight: '6px' }} />{t('tabQdoHold')}</span>,
              children: (
                <div>
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={24}>
                      <Card bordered={false} style={{ background: '#fff2f0', borderLeft: '4px solid #ff4d4f' }}>
                        <Statistic
                          title={t('detainedVesselsTitle')}
                          value={detainedCount}
                          valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
                          prefix={<WarningOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Title level={4} style={{ marginBottom: '15px' }}>{t('quarantineLogHeader')}</Title>
                  <Table
                    dataSource={inspectedCargoList.filter(item => item.status === 'Clearance Denied - Detained for Physical Audit' || item.status === 'Rejected')}
                    columns={[
                      {
                        title: t('tblBlRef'),
                        dataIndex: 'manifestId',
                        key: 'manifestId',
                        render: (text) => <Text strong>{text}</Text>
                      },
                      {
                        title: t('tblVesselName'),
                        dataIndex: 'vesselName',
                        key: 'vesselName',
                      },
                      {
                        title: t('tblCargoType'),
                        dataIndex: 'cargoType',
                        key: 'cargoType',
                      },
                      {
                        title: t('tblGrossTonnage'),
                        dataIndex: 'declaredWeight',
                        key: 'declaredWeight',
                        render: (val) => `${val} MT`
                      },
                      {
                        title: t('tblRmsMemo'),
                        dataIndex: 'rmsRiskLevel',
                        key: 'rmsRiskLevel',
                        render: (level) => {
                          let color = 'green';
                          let riskText = level || 'ROUTINE RISK';
                          if (level === 'CRITICAL RISK') { color = 'red'; riskText = t('riskCritical'); }
                          else if (level === 'ELEVATED RISK') { color = 'orange'; riskText = t('riskElevated'); }
                          else if (level === 'ROUTINE RISK') { riskText = t('riskRoutine'); }
                          return <Tag color={color}>{riskText}</Tag>;
                        }
                      },
                      {
                        title: t('tblEnforcementAction'),
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => <Tag color="red">{language === 'en' ? 'DETAINED (QDO)' : 'निरुद्ध (QDO)'}</Tag>
                      }
                    ]}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                </div>
              )
            },

            // Tab 4: Analytics Dashboard
            {
              key: '4',
              label: <span><ReloadOutlined style={{ marginRight: '6px' }} />{t('tabAuditAnalytics')}</span>,
              children: (
                <div>
                  <Title level={4} style={{ marginBottom: '20px' }}>{t('analyticsHeader')}</Title>
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={12}>
                      <Card bordered hoverable style={{ background: '#fff2f0', borderLeft: '4px solid #ff4d4f' }}>
                        <Statistic title={t('statDetained')} value={detainedCount} valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }} />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card bordered hoverable style={{ background: '#f5f5f5', borderLeft: '4px solid #555' }}>
                        <Statistic title={t('statWeightCleared')} value={inspectedCargoList.filter(item => item.status === 'Port Clearance Granted').reduce((sum, item) => sum + (item.declaredWeight || 0), 0).toFixed(2)} suffix="MT" />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={24} style={{ marginBottom: '30px' }}>
                    {/* SVG Pie/Bar: Clearances to Detention Splits */}
                    <Col span={24}>
                      <Card title={t('splitsTitle')} style={{ height: '300px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '200px', gap: '20px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <Text>{t('splitsPcc')}</Text>
                              <Text strong>{(clearedCount / (clearedCount + detainedCount || 1) * 100).toFixed(0)}%</Text>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${(clearedCount / (clearedCount + detainedCount || 1) * 100)}%`, height: '100%', background: '#52c41a' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <Text>{t('splitsQdo')}</Text>
                              <Text strong>{(detainedCount / (clearedCount + detainedCount || 1) * 100).toFixed(0)}%</Text>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${(detainedCount / (clearedCount + detainedCount || 1) * 100)}%`, height: '100%', background: '#ff4d4f' }} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Title level={4} style={{ marginBottom: '15px' }}>{t('allVesselLedgerTitle')}</Title>
                  <Table
                    dataSource={inspectedCargoList}
                    columns={[
                      {
                        title: t('tblBlRef'),
                        dataIndex: 'manifestId',
                        key: 'manifestId',
                        render: (text) => <Text strong>{text}</Text>
                      },
                      {
                        title: t('tblVesselName'),
                        dataIndex: 'vesselName',
                        key: 'vesselName',
                      },
                      {
                        title: t('tblCargoType'),
                        dataIndex: 'cargoType',
                        key: 'cargoType',
                      },
                      {
                        title: t('tblRmsMemo'),
                        dataIndex: 'rmsRiskLevel',
                        key: 'rmsRiskLevel',
                        render: (level) => {
                          let color = 'green';
                          let riskText = level || 'ROUTINE RISK';
                          if (level === 'CRITICAL RISK') { color = 'red'; riskText = t('riskCritical'); }
                          else if (level === 'ELEVATED RISK') { color = 'orange'; riskText = t('riskElevated'); }
                          else if (level === 'ROUTINE RISK') { riskText = t('riskRoutine'); }
                          return <Tag color={color}>{riskText}</Tag>;
                        }
                      },
                      {
                        title: t('tblStatus'),
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => renderStatusTag(status)
                      }
                    ]}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* 3. SIDE-BY-SIDE Drawer Review Container */}
      <Drawer
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
            <span>{t('dossierPanelTitle')}: {activeDossier?.manifestId}</span>
          </Space>
        }
        width={750}
        open={reviewDrawerVisible}
        onClose={() => setReviewDrawerVisible(false)}
        destroyOnClose
      >
        {activeDossier && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Weight discrepancy warning alert */}
            {(() => {
              const declared = activeDossier.declaredWeight || 0;
              const actual = activeDossier.actualWeight;
              if (actual !== null && declared > 0) {
                const threshold = parseFloat(localStorage.getItem('weightTolerancePercentage')) || 5.0;
                const deviation = (Math.abs(actual - declared) / declared) * 100;
                if (deviation > threshold) {
                  return (
                    <Alert
                      message={
                        <span>
                          <strong>Warning: </strong>
                          Weight deviation is {deviation.toFixed(2)}% which exceeds the configured threshold of {threshold}%.
                        </span>
                      }
                      type="warning"
                      showIcon
                      style={{ marginBottom: '20px' }}
                    />
                  );
                }
              }
              return null;
            })()}

            {/* Side by side columns */}
            <Row gutter={24} style={{ flex: 1, overflowY: 'auto' }}>

              {/* Left Column: Declared parameters */}
              <Col span={12} style={{ borderRight: '1px solid #f0f0f0', paddingRight: '20px' }}>
                <Descriptions title={t('declaredDetailsTitle')} bordered column={1} size="small">
                  <Descriptions.Item label={t('tblBlRef')}>{activeDossier.manifestId}</Descriptions.Item>
                  <Descriptions.Item label={t('tblCargoType')}>{activeDossier.cargoType?.toUpperCase()}</Descriptions.Item>
                  <Descriptions.Item label={t('tblContainerNo')}>{activeDossier.containerNo}</Descriptions.Item>
                  <Descriptions.Item label={t('tblGrossTonnage')}>{activeDossier.declaredWeight} MT</Descriptions.Item>
                </Descriptions>
              </Col>

              {/* Right Column: Physical inspector inputs */}
              <Col span={12} style={{ paddingLeft: '20px' }}>
                <Descriptions title={language === 'en' ? 'Physical Gate Inspection Details' : 'भौतिक गेट निरीक्षण विवरण'} bordered column={1} size="small" style={{ marginBottom: '20px' }}>
                  <Descriptions.Item label={t('measuredWeight')}>
                    {activeDossier.actualWeight !== null ? (
                      <span style={{
                        fontWeight: 'bold',
                        color: Math.abs(activeDossier.actualWeight - activeDossier.declaredWeight) > 1.5 ? '#f5222d' : '#222'
                      }}>
                        {activeDossier.actualWeight} MT
                      </span>
                    ) : t('certNotVerified')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('sealIntegrityLabel')}>
                    {activeDossier.sealIntact ? (
                      <Tag color="success">{t('sealIntact')?.toUpperCase()} ✓</Tag>
                    ) : (
                      <Tag color="error">{t('sealBroken')?.toUpperCase()} ✗</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('structuralDamageLabel')}>
                    {activeDossier.structuralDamage ? (
                      <Tag color="error">{t('damageDetected')?.toUpperCase()} ✗</Tag>
                    ) : (
                      <Tag color="success">{t('damageNone')?.toUpperCase()} ✓</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>

                {/* Evidence Image Zoom Component */}
                <Card title={t('evidenceCardTitle')} size="small" style={{ textAlign: 'center' }}>
                  <Image
                    src={activeDossier.imagePath}
                    fallback={placeholderBase64}
                    preview={{
                      visible: previewOpen,
                      onVisibleChange: (val) => setPreviewOpen(val)
                    }}
                    style={{ maxHeight: '180px', borderRadius: '4px', objectFit: 'contain' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Adjudication Decision Panel */}
            {activeDossier.status === 'Approved' || activeDossier.status === 'Port Clearance Granted' ? (
              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                <Alert
                  message={t('accessClearanceLocked')}
                  description={t('accessLockedDesc')}
                  type="success"
                  showIcon
                />
              </div>
            ) : (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
                <Title level={5} style={{ marginBottom: '15px', color: '#0f3057' }}>Adjudication Decision Panel</Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '5px' }}>Select Status:</label>
                    <Select 
                      value={adjStatus} 
                      onChange={(val) => setAdjStatus(val)} 
                      style={{ width: '100%' }}
                    >
                      <Select.Option value="Port Clearance Granted">Port Clearance Granted</Select.Option>
                      <Select.Option value="Clearance Denied - Detained for Physical Audit">Clearance Denied - Detained for Physical Audit</Select.Option>
                      <Select.Option value="Re-Inspect">Re-Inspect</Select.Option>
                    </Select>
                  </div>
                  <div>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '5px' }}>Review Notes:</label>
                    <Input.TextArea 
                      rows={3} 
                      value={adjNotes} 
                      onChange={(e) => setAdjNotes(e.target.value)} 
                      placeholder="Enter adjudication or review remarks..."
                      style={{ resize: 'none' }}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Button 
                      type="primary" 
                      onClick={() => handleSubmitAdjudication(adjStatus, adjNotes)}
                      loading={isSubmittingAction}
                      style={{ backgroundColor: adjStatus === 'Port Clearance Granted' ? '#52c41a' : adjStatus === 'Re-Inspect' ? '#1890ff' : '#ff4d4f', borderColor: adjStatus === 'Port Clearance Granted' ? '#52c41a' : adjStatus === 'Re-Inspect' ? '#1890ff' : '#ff4d4f' }}
                    >
                      Submit Adjudication
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </Drawer>

    </div>
  );
};

export default PortAuthority;
