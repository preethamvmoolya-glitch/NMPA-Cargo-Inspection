import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API_BASE from '../api';
import { 
  Row, Col, Card, Statistic, Table, Tag, Button, Modal, Form, 
  InputNumber, Switch, Upload, Tabs, Input, Badge, message, Typography, Space,
  Select, Checkbox
} from 'antd';
import { 
  InboxOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  HistoryOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import Navbar from '../components/Navbar';
import { useLanguage } from '../LanguageContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get('tab') || '0';
  const [activeTab, setActiveTab] = useState('1');
  const { language, t } = useLanguage();

  useEffect(() => {
    // 0 => tab '1' (Pending Queue Dashboard)
    // 1 => tab '2' (My Submissions)
    // 2 => tab '3' (Help)
    if (tabParam === '0') setActiveTab('1');
    else if (tabParam === '1') setActiveTab('2');
    else if (tabParam === '2') setActiveTab('3');
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: String(parseInt(key) - 1) });
  };

  const [loading, setLoading] = useState(false);
  const [allCargo, setAllCargo] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManifestId, setSelectedManifestId] = useState(null);
  const [rmsLoadingText, setRmsLoadingText] = useState('');
  
  // Submission Form State (for creating new pending cargo)
  const [newCargoForm] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inspection Form State (for modal)
  const [inspectionForm] = Form.useForm();

  // Complaint Form State
  const [complaintForm] = Form.useForm();
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

  // Escalation Form State
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [escalationForm] = Form.useForm();
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);
  
  const userEmail = localStorage.getItem('userEmail');
  const userName  = localStorage.getItem('userName') || 'Inspector';

  // Fetch Inspections Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/inspections`);
      if (response.ok) {
        const raw = await response.json();
        // Map raw database cargo to UI structure
        const mapped = raw.map(item => ({
          key: item.id,
          id: item.id,
          vesselImo: item.vessel_imo,
          vesselName: item.vessel_name,
          countryOfOrigin: item.country_of_origin,
          manifestId: item.bill_of_lading,
          containerNo: item.containerNo || `MSCU${738402 + item.id}`,
          vehicleNo: item.vehicleNo || `KA-19-M-${5000 + item.id}`,
          cargoType: item.cargo_type,
          arrivalTime: item.date,
          declaredWeight: item.gross_tonnage || item.weight,
          actualWeight: item.actual_weight,
          status: item.status,
          imagePath: item.image_url,
          notes: item.notes,
          inspectorEmail: item.inspector_email,
          rmsRiskLevel: item.rms_risk_level || item.assigned_risk_level,
          rmsAnalysisMemo: item.rms_analysis_memo || item.inspection_summary
        }));
        setAllCargo(mapped);
      } else {
        message.error(language === 'en' ? 'Failed to retrieve cargo listings.' : 'कार्गो सूची प्राप्त करने में विफल।');
      }
    } catch (err) {
      message.error(language === 'en' ? 'Could not connect to the backend server.' : 'बैकएंड सर्वर से कनेक्ट नहीं हो सका।');
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived stats
  const pendingCargo = allCargo.filter(item => item.status === 'Pending' || item.status === 'Awaiting Physical Inspection');
  const shiftQueueCount = pendingCargo.length;
  const completedCount = allCargo.filter(item => item.status === 'Inspected' || item.status === 'Inspected - Awaiting Authority Adjudication').length;
  const approvedCount = allCargo.filter(item => item.status === 'Approved' || item.status === 'Port Clearance Granted').length;
  const rejectedCount = allCargo.filter(item => item.status === 'Rejected' || item.status === 'Clearance Denied - Detained for Physical Audit').length;

  const handleValidateForm = async () => {
    try {
      await newCargoForm.validateFields();
      message.success(t('manifestValidSuccess'));
    } catch (err) {
      message.error(t('manifestValidFail'));
    }
  };

  // New Cargo Registration Submission
  const handleCreateCargo = async (values) => {
    setIsSubmitting(true);
    setRmsLoadingText(language === 'en' ? 'Executing NMPA Risk Management System...' : 'एनएमपीए जोखिम प्रबंधन प्रणाली निष्पादित की जा रही है...');
    try {
      const response = await fetch(`${API_BASE}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vesselImo: values.vesselImo,
          vesselName: values.vesselName,
          countryOfOrigin: values.countryOfOrigin,
          billOfLading: values.billOfLading,
          commodityDescription: values.commodityDescription,
          grossTonnage: values.grossTonnage,
          inspectorEmail: userEmail
        })
      });
      
      // Delay for a short moment so the user can see the animated loader
      await new Promise(r => setTimeout(r, 1200));

      if (response.ok) {
        message.success(t('manifestSuccess'));
        newCargoForm.resetFields();
        fetchData();
      } else {
        const err = await response.json();
        message.error(err.message || (language === 'en' ? 'Manifest registration failed.' : 'मैनिफेस्ट पंजीकरण विफल रहा।'));
      }
    } catch {
      message.error(language === 'en' ? 'Server error. Check your network.' : 'सर्वर त्रुटि। अपने नेटवर्क की जांच करें।');
    } finally {
      setIsSubmitting(false);
      setRmsLoadingText('');
    }
  };

  // Complaint Submit
  const handleComplaintSubmit = async (values) => {
    setIsSubmittingComplaint(true);
    try {
      const response = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          subject: values.subject,
          message: values.message
        })
      });
      if (response.ok) {
        message.success(t('complaintSuccess'));
        complaintForm.resetFields();
      } else {
        message.error(language === 'en' ? 'Failed to submit complaint.' : 'शिकायत दर्ज करने में विफल।');
      }
    } catch {
      message.error(language === 'en' ? 'Connection error.' : 'कनेक्शन त्रुटि।');
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  const handleEscalationSubmit = async (values) => {
    setIsSubmittingEscalation(true);
    
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
          email: userEmail,
          category: values.category,
          description: combinedDescription,
          is_escalated_to_chairman: values.isEscalated,
          severity_level: values.severity
        })
      });
      if (response.ok) {
        message.success(language === 'en' ? 'Grievance submitted successfully.' : 'शिकायत सफलतापूर्वक सबमिट की गई।');
        setIsEscalationModalOpen(false);
        escalationForm.resetFields();
      } else {
        const err = await response.json();
        message.error(err.message || (language === 'en' ? 'Failed to submit grievance.' : 'शिकायत सबमिट करने में विफल।'));
      }
    } catch {
      message.error(language === 'en' ? 'Connection error.' : 'कनेक्शन त्रुटि।');
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  // Helper to convert files to base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Physical verification submit from the modal
  const handleFormSubmit = async (values) => {
    let base64Image = 'https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?w=400';
    if (fileList.length > 0) {
      try {
        base64Image = await getBase64(fileList[0].originFileObj || fileList[0]);
      } catch (err) {
        message.warning(language === 'en' ? 'Failed to encode image, using default.' : 'छवि को एनकोड करने में विफल, डिफ़ॉल्ट का उपयोग किया जा रहा है।');
      }
    }

    try {
      const response = await fetch(`${API_BASE}/api/inspections/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manifestId: selectedManifestId,
          actual_weight: values.actual_weight,
          seal_intact: values.seal_intact,
          structural_damage: values.structural_damage,
          image_url: base64Image
        })
      });

      if (response.status === 200) {
        message.success(t('verificationLogged'));
        setIsModalOpen(false);
        inspectionForm.resetFields();
        setFileList([]);
        fetchData();
      } else {
        message.error(language === 'en' ? 'Failed to submit inspection details.' : 'निरीक्षण विवरण सबमिट करने में विफल।');
      }
    } catch {
      message.error(language === 'en' ? 'Server connection error.' : 'सर्वर कनेक्शन त्रुटि।');
    }
  };

  // Status mapping utility for dynamic translation
  const renderStatusTag = (status) => {
    let color = 'gold';
    let statusKey = 'statusPending';
    if (status === 'Port Clearance Granted' || status === 'Approved') {
      color = 'green';
      statusKey = 'statusClearanceGranted';
    } else if (status === 'Clearance Denied - Detained for Physical Audit' || status === 'Rejected') {
      color = 'red';
      statusKey = 'statusClearanceDenied';
    } else if (status === 'Awaiting Authority Adjudication' || status === 'Pending Approval') {
      color = 'orange';
      statusKey = 'statusAwaitingAdjudication';
    } else if (status === 'Inspected') {
      color = 'blue';
      statusKey = 'statusInspected';
    } else if (status === 'Inspected - Awaiting Authority Adjudication') {
      color = 'blue';
      statusKey = 'statusInspectedAwaitingAdjudication';
    } else if (status === 'Awaiting Physical Inspection') {
      color = 'gold';
      statusKey = 'statusAwaitingPhysicalInspection';
    } else if (status === 'Re-Inspect') {
      color = 'blue';
      statusKey = 'statusReinspect';
    }
    return <Tag color={color} style={{ margin: 0 }}>{t(statusKey)?.toUpperCase()}</Tag>;
  };

  // Table Columns Setup
  const tableColumns = [
    {
      title: t('tblBlRef'),
      dataIndex: 'manifestId',
      key: 'manifestId',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: t('tblContainerNo'),
      dataIndex: 'containerNo',
      key: 'containerNo',
    },
    {
      title: t('tblCargoType'),
      dataIndex: 'cargoType',
      key: 'cargoType',
      render: (type) => {
        let color = 'blue';
        if (type === 'hazardous') color = 'volcano';
        if (type === 'perishable') color = 'orange';
        return <Tag color={color}>{type?.toUpperCase()}</Tag>;
      }
    },
    {
      title: t('tblArrivalTime'),
      dataIndex: 'arrivalTime',
      key: 'arrivalTime',
      render: (time) => time ? new Date(time).toLocaleString() : '—'
    },
    {
      title: t('tblAction'),
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => {
            setSelectedManifestId(record.manifestId);
            setIsModalOpen(true);
          }}
        >
          {t('btnBeginInspect')}
        </Button>
      )
    }
  ];

  // History Tab Columns
  const historyColumns = [
    {
      title: t('tblBlRef'),
      dataIndex: 'manifestId',
      key: 'manifestId',
      width: 170,
      render: (text) => <Text strong style={{ lineHeight: 1.25 }}>{text}</Text>
    },
    {
      title: t('tblVesselName'),
      dataIndex: 'vesselName',
      key: 'vesselName',
      width: 150,
      render: (text) => <span style={{ lineHeight: 1.25 }}>{text || '—'}</span>
    },
    {
      title: t('tblCommodity'),
      dataIndex: 'cargoType',
      key: 'cargoType',
      width: 200,
      render: (text) => <span style={{ lineHeight: 1.25 }}>{text}</span>
    },
    {
      title: t('tblGrossTonnage'),
      dataIndex: 'declaredWeight',
      key: 'declaredWeight',
      width: 110,
      render: (w) => <span style={{ lineHeight: 1.25 }}>{w} MT</span>
    },
    {
      title: t('tblStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (status) => renderStatusTag(status)
    },
    {
      title: t('tblRmsMemo'),
      dataIndex: 'rmsAnalysisMemo',
      key: 'rmsAnalysisMemo',
      width: 300,
      render: (memo, record) => {
        let riskLabel = record.rmsRiskLevel || 'ROUTINE RISK';
        let translatedRisk = riskLabel;
        if (riskLabel === 'CRITICAL RISK') translatedRisk = t('riskCritical');
        else if (riskLabel === 'ELEVATED RISK') translatedRisk = t('riskElevated');
        else if (riskLabel === 'ROUTINE RISK') translatedRisk = t('riskRoutine');

        return (
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 700, fontSize: '0.75rem', marginBottom: '0.2rem', color: record.rmsRiskLevel === 'CRITICAL RISK' ? '#ff4d4f' : record.rmsRiskLevel === 'ELEVATED RISK' ? '#faad14' : '#52c41a' }}>
              {translatedRisk}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#555', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.25 }}>
              {memo || record.notes || '—'}
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Panel */}
      <Card style={{ 
        background: 'linear-gradient(135deg, #0d2b5e 0%, #1e5ba4 100%)',
        borderRadius: '8px', marginBottom: '20px', border: 'none'
      }}>
        <Row align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>{t('inspectorStation')}</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              {t('operatorLabel')}: {userName} · {t('nmpaTitle')} {language === 'en' ? 'Gate Access' : 'गेट एक्सेस'}
            </Text>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right', marginTop: '10px' }}>
            <Button type="default" ghost onClick={fetchData} icon={<HistoryOutlined />}>
              {t('refreshLogs')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 1. SUMMARY STATISTIC CARDS */}
      <Row gutter={16} style={{ marginBottom: '20px' }}>
        <Col xs={12} sm={6}>
          <Card bordered={false} hoverable style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title={t('shiftQueueCount')} 
              value={shiftQueueCount} 
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} hoverable style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title={t('completedVerifications')} 
              value={completedCount} 
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} hoverable style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title={t('approvedGates')} 
              value={approvedCount} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card bordered={false} hoverable style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Statistic 
              title={t('rejectedAccess')} 
              value={rejectedCount} 
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs Layout */}
      <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={[
          {
            key: '1',
            label: (
              <span>
                <ClockCircleOutlined /> {t('pendingQueue')} <Badge count={shiftQueueCount} overflowCount={99} style={{ marginLeft: 5 }} />
              </span>
            ),
            children: (
              /* 2. PENDING QUEUE TABLE */
              <Table 
                dataSource={pendingCargo} 
                columns={tableColumns} 
                loading={loading} 
                rowKey="id" 
                pagination={{ pageSize: 8 }}
              />
            )
          },
          {
            key: '2',
            label: (
              <span>
                <HistoryOutlined /> {t('mySubmissions')}
              </span>
            ),
            children: (
              <Row gutter={24}>
                <Col xs={24} md={8}>
                  <Card title={t('igmRegistry')} size="small" style={{ marginBottom: '20px' }}>
                    <Form layout="vertical" form={newCargoForm} onFinish={handleCreateCargo} autoComplete="off">
                      <Form.Item name="vesselImo" label={t('vesselImo')} rules={[{ required: true, message: t('valImoRequired') }]}>
                        <Input placeholder="e.g. IMO 9497268" disabled={isSubmitting} autoComplete="off" />
                      </Form.Item>
                      <Form.Item name="vesselName" label={t('vesselName')} rules={[{ required: true, message: t('valVesselNameRequired') }]}>
                        <Input placeholder="e.g. MV Mangalore Express" disabled={isSubmitting} autoComplete="off" />
                      </Form.Item>
                      <Form.Item name="countryOfOrigin" label={t('countryOrigin')} rules={[{ required: true, message: t('valCountryRequired') }]}>
                        <Input placeholder="e.g. Singapore, UAE" disabled={isSubmitting} autoComplete="off" />
                      </Form.Item>
                      <Form.Item name="billOfLading" label={t('blRef')} rules={[{ required: true, message: t('valBlRequired') }]}>
                        <Input placeholder="e.g. BL-NMPA-2026-908" disabled={isSubmitting} autoComplete="off" />
                      </Form.Item>
                      <Form.Item name="commodityDescription" label={t('commodityClass')} rules={[{ required: true, message: t('valCommodityRequired') }]}>
                        <Input placeholder="e.g. Crude Petroleum Oil - Bulk Liquid" disabled={isSubmitting} autoComplete="off" />
                      </Form.Item>
                      <Form.Item name="grossTonnage" label={t('grossTonnage')} rules={[{ required: true, message: t('valGrossTonnageRequired') }]}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 25000" disabled={isSubmitting} autoComplete="off" />
                      </Form.Item>
                      
                       <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={isSubmitting} 
                        style={{ marginTop: '10px' }}
                        block
                      >
                        {t('transmitRms')}
                      </Button>
                      {rmsLoadingText && (
                        <div style={{ marginTop: '10px', color: '#e67e22', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                          <span className="animate-pulse">{rmsLoadingText}</span>
                        </div>
                      )}
                    </Form>
                  </Card>
                </Col>
                <Col xs={24} md={16}>
                  <Card title={t('submissionLogsStatus')} size="small">
                    <Table 
                      dataSource={allCargo} 
                      columns={historyColumns} 
                      loading={loading} 
                      rowKey="id" 
                      pagination={{ pageSize: 8 }}
                      scroll={{ x: 1100 }}
                      size="middle"
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: '3',
            label: (
              <span>
                <QuestionCircleOutlined /> {t('helpSupport')}
              </span>
            ),
            children: (
              <div style={{ maxWidth: '600px', margin: '20px auto' }}>
                <Card 
                  title="Grievance Redressal" 
                  bordered 
                  style={{ marginBottom: '20px', border: '1px solid var(--nmpa-border)' }}
                >
                  <p style={{ fontSize: '0.85rem', color: 'var(--nmpa-text-muted)', marginBottom: '15px' }}>
                    Register a formal grievance to the Chairman's Office or standard queue.
                  </p>
                  <Button 
                    type="default" 
                    block 
                    onClick={() => navigate('/grievance')}
                    style={{ fontWeight: '500' }}
                  >
                    Open Grievance Portal
                  </Button>
                </Card>

                <Card title={t('complaintFormTitle')} bordered>
                  <Form layout="vertical" form={complaintForm} onFinish={handleComplaintSubmit}>
                    <Form.Item name="subject" label={t('complaintSubject')} rules={[{ required: true, message: t('valSubjectRequired') }]}>
                      <Input placeholder="e.g. Weighbridge calibration discrepancy" />
                    </Form.Item>
                    <Form.Item name="message" label={t('complaintMsg')} rules={[{ required: true, message: t('valMessageRequired') }]}>
                      <TextArea rows={5} placeholder="Describe your issue or feedback in detail..." style={{ resize: 'none' }} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={isSubmittingComplaint} block danger>
                      {t('submitComplaint')}
                    </Button>
                  </Form>
                </Card>
              </div>
            )
          }
        ]} />
      </Card>

      {/* 3. INSPECTION MODAL FORM */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            {t('physicalGateVerify')}: {selectedManifestId}
          </Title>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          inspectionForm.resetFields();
          setFileList([]);
        }}
        footer={null}
        destroyOnClose
      >
        <Form 
          layout="vertical" 
          form={inspectionForm} 
          onFinish={handleFormSubmit}
          style={{ marginTop: '20px' }}
        >
          {/* Weighbridge Input */}
          <Form.Item
            name="actual_weight"
            label={t('weighbridgeWeight')}
            rules={[{ required: true, message: t('valWeightRequired') }]}
          >
            <InputNumber min={0} addonAfter="MT" style={{ width: '100%' }} placeholder="Input measured weighbridge mass" />
          </Form.Item>

          {/* Security Status Switches */}
          <Row gutter={16} style={{ marginBottom: '15px' }}>
            <Col span={12}>
              <Form.Item name="seal_intact" label={t('sealIntegrity')} valuePropName="checked" initialValue={true}>
                <Switch checkedChildren={t('sealIntact')} unCheckedChildren={t('sealBroken')} style={{ backgroundColor: '#52c41a' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="structural_damage" label={t('structuralDamage')} valuePropName="checked" initialValue={false}>
                <Switch checkedChildren={t('damageDetected')} unCheckedChildren={t('damageNone')} style={{ backgroundColor: '#ff4d4f' }} />
              </Form.Item>
            </Col>
          </Row>

          {/* Media Upload Container */}
          <Form.Item label={t('uploadProof')} required>
            <Upload.Dragger
              name="files"
              multiple={false}
              fileList={fileList}
              beforeUpload={(file) => {
                const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                if (!isJpgOrPng) {
                  message.error(language === 'en' ? 'Format restricted to JPG or PNG!' : 'प्रारूप केवल JPG या PNG तक सीमित है!');
                  return Upload.LIST_IGNORE;
                }
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error(language === 'en' ? 'Files must not exceed 5MB!' : 'फ़ाइल का आकार 5MB से अधिक नहीं होना चाहिए!');
                  return Upload.LIST_IGNORE;
                }
                setFileList([file]);
                return false; // manual trigger
              }}
              onRemove={() => setFileList([])}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                {language === 'en' ? 'Click or drag files here to upload' : 'अपलोड करने के लिए फ़ाइलों को यहां क्लिक करें या खींचें'}
              </p>
              <p className="ant-upload-hint">{t('uploadHint')}</p>
            </Upload.Dragger>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: '30px', marginBottom: 0 }}>
            <Button style={{ marginRight: '8px' }} onClick={() => setIsModalOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="primary" htmlType="submit">
              {t('completeInspect')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Grievance Portal Modal */}
      <Modal
        title={
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--nmpa-text)' }}>
            Grievance Redressal Portal
          </div>
        }
        open={isEscalationModalOpen}
        onCancel={() => {
          setIsEscalationModalOpen(false);
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
          initialValues={{ email: userEmail }}
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
            <Input disabled placeholder="name@domain.com" />
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
                setIsEscalationModalOpen(false);
                escalationForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              danger
              loading={isSubmittingEscalation}
            >
              Submit Grievance
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
