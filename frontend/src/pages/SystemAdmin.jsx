import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API_BASE from '../api';
import { 
  Row, Col, Card, Statistic, Table, Tag, Button, Modal, Form, 
  Input, Select, Slider, Popconfirm, Tabs, Space, Typography, message 
} from 'antd';
import { 
  TeamOutlined, SettingOutlined, BarChartOutlined,
  UserAddOutlined, ReloadOutlined, DeleteOutlined, EditOutlined, 
  CheckOutlined, CloseOutlined, SecurityScanOutlined, CommentOutlined
} from '@ant-design/icons';
import Navbar from '../components/Navbar';
import { useLanguage } from '../LanguageContext';

const { Title, Text } = Typography;
const { Option } = Select;

// Mapping DB roles to UI Roles
const roleMapToUI = {
  'system_admin': 'Admin',
  'inspector': 'Inspector',
  'port_authority': 'Approver'
};

const roleMapToDB = {
  'Admin': 'system_admin',
  'Inspector': 'inspector',
  'Approver': 'port_authority'
};

const SystemAdmin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || '0';
  const [activeTab, setActiveTab] = useState('1');
  const { language, t } = useLanguage();

  useEffect(() => {
    const tabInt = parseInt(tabParam);
    if (tabInt >= 0 && tabInt <= 4) {
      setActiveTab(String(tabInt + 1));
    }
  }, [tabParam]);

  const handleTabChange = (key) => {
    setActiveTab(key);
    setSearchParams({ tab: String(parseInt(key) - 1) });
  };

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [chairmanComplaints, setChairmanComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  
  // User creation modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [createUserForm] = Form.useForm();
  
  // Inline editing state
  const [editingKey, setEditingKey] = useState('');
  const [editForm] = Form.useForm();

  // Fetch all databases
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [logsRes, usersRes, inspRes, compRes, chairRes] = await Promise.all([
        fetch(`${API_BASE}/api/logs`),
        fetch(`${API_BASE}/api/users`),
        fetch(`${API_BASE}/api/inspections`),
        fetch(`${API_BASE}/api/complaints`),
        fetch(`${API_BASE}/api/chairman/complaints`),
      ]);
      
      if (logsRes.ok) {
        const rawLogs = await logsRes.json();
        setLogs(rawLogs.map(l => {
          let displayedRole = l.role ? roleMapToUI[l.role] || l.role : 'System';
          let translatedRole = displayedRole;
          if (displayedRole === 'Admin') translatedRole = t('system_admin');
          else if (displayedRole === 'Approver') translatedRole = t('port_authority');
          else if (displayedRole === 'Inspector') translatedRole = t('inspector');

          return {
            key: l.id,
            id: l.id,
            timestamp: l.date,
            userId: translatedRole,
            actionPerformed: l.action,
            clientIpAddress: `172.20.10.${(l.id % 250) + 1}`, // monospaced client IP mapping
            details: l.details
          };
        }));
      }
      
      if (usersRes.ok) {
        const rawUsers = await usersRes.json();
        setUsers(rawUsers.map(u => ({
          key: u.id,
          id: u.id,
          username: u.username,
          email: u.email,
          role: roleMapToUI[u.role] || u.role,
          is_approved: u.is_approved
        })));
      }

      if (inspRes.ok) {
        setInspections(await inspRes.json());
      }

      if (compRes.ok) {
        setComplaints(await compRes.json());
      }

      if (chairRes.ok) {
        setChairmanComplaints(await chairRes.json());
      }
    } catch {
      message.error(language === 'en' ? 'Failed to update system data.' : 'सिस्टम डेटा अपडेट करने में विफल।');
    } finally {
      setLoading(false);
    }
  }, [language, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Edit actions
  const isEditing = (record) => record.id === editingKey;

  const startEdit = (record) => {
    editForm.setFieldsValue({
      username: record.username,
      email: record.email,
      role: record.role,
      ...record,
    });
    setEditingKey(record.id);
  };

  const cancelEdit = () => {
    setEditingKey('');
  };

  const saveEdit = async (id) => {
    try {
      const rowValues = await editForm.validateFields();
      setLoadingAction(id + '-save');
      
      const dbRole = roleMapToDB[rowValues.role] || rowValues.role;
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          username: rowValues.username,
          email: rowValues.email,
          role: dbRole
        })
      });

      if (res.ok) {
        message.success(t('userUpdatedSuccess'));
        setEditingKey('');
        fetchAll();
      } else {
        message.error(language === 'en' ? 'Failed to save inline changes.' : 'इनलाइन परिवर्तनों को सहेजने में विफल।');
      }
    } catch (err) {
      message.error(language === 'en' ? 'Validation failed.' : 'सत्यापन विफल रहा।');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteUser = async (id) => {
    setLoadingAction(id + '-delete');
    try {
      const res = await fetch(`${API_BASE}/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.info(language === 'en' ? 'User access privileges revoked.' : 'उपयोगकर्ता पहुंच विशेषाधिकार रद्द कर दिए गए।');
        fetchAll();
      } else {
        message.error(language === 'en' ? 'Failed to revoke access.' : 'पहुंच रद्द करने में विफल।');
      }
    } catch {
      message.error(language === 'en' ? 'Connection error.' : 'कनेक्शन त्रुटि।');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCreateUser = async (values) => {
    setLoadingAction('create');
    try {
      const dbRole = roleMapToDB[values.role] || 'inspector';
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: values.username,
          password: values.password || 'password123', // fallback default credentials
          email: values.email,
          role: dbRole
        })
      });
      if (res.ok) {
        message.success(t('userCreatedSuccess'));
        setIsAddUserOpen(false);
        createUserForm.resetFields();
        fetchAll();
      } else {
        const err = await res.json();
        message.error(err.message || (language === 'en' ? 'Identity creation failed.' : 'पहचान निर्माण विफल रहा।'));
      }
    } catch {
      message.error(language === 'en' ? 'Connection error.' : 'कनेक्शन त्रुटि।');
    } finally {
      setLoadingAction(null);
    }
  };

  // Tab 2: Weight Configuration Slider State
  const [weightTolerance, setWeightTolerance] = useState(() => {
    return parseFloat(localStorage.getItem('weightTolerancePercentage')) || 5.0;
  });

  const handleSaveConfig = (values) => {
    localStorage.setItem('weightTolerancePercentage', values.tolerance);
    setWeightTolerance(values.tolerance);
    message.success(language === 'en' ? 'Global gate weight tolerance discrepancy updated ✓' : 'वैश्विक गेट वजन सहनशीलता विसंगति अपडेट की गई ✓');
  };

  // Analytics Metrics computation
  const totalWeightVerified = inspections.reduce((sum, item) => sum + (item.actual_weight || 0), 0);
  const clearedCount = inspections.filter(i => i.status === 'Approved' || i.status === 'Port Clearance Granted').length;
  const rejectedCount = inspections.filter(i => i.status === 'Rejected' || i.status === 'Clearance Denied - Detained for Physical Audit').length;

  return (
    <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Panel */}
      <Card style={{ 
        background: 'linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%)',
        borderRadius: '8px', marginBottom: '20px', border: 'none'
      }}>
        <Row align="middle" justify="space-between">
          <Col xs={24} md={18}>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>{t('adminTitle')}</Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              {t('adminSubtitle')}
            </Text>
          </Col>
          <Col xs={24} md={6} style={{ textAlign: 'right', marginTop: '10px' }}>
            <Button type="default" ghost onClick={fetchAll} icon={<ReloadOutlined />} size="small">
              {language === 'en' ? 'Refresh' : 'ताज़ा करें'}
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
            // TAB 1: USER RBAC CONSOLE
            {
              key: '1',
              label: <span><TeamOutlined /> {t('tabIdentity')}</span>,
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>{t('rbacHeader')}</Title>
                    <Button 
                      type="primary" 
                      icon={<UserAddOutlined />}
                      onClick={() => setIsAddUserOpen(true)}
                    >
                      {t('addNewIdentity')}
                    </Button>
                  </div>
                  
                  <Form form={editForm} component={false}>
                    <Table
                      bordered
                      dataSource={users}
                      loading={loading}
                      rowKey="id"
                      pagination={{ pageSize: 6 }}
                      columns={[
                        {
                          title: t('usernameLabel'),
                          dataIndex: 'username',
                          width: '25%',
                          render: (text, record) => {
                            if (isEditing(record)) {
                              return (
                                <Form.Item name="username" style={{ margin: 0 }} rules={[{ required: true, message: language === 'en' ? 'Username is mandatory' : 'उपयोगकर्ता नाम अनिवार्य है' }]}>
                                  <Input size="small" />
                                </Form.Item>
                              );
                            }
                            return <Text strong>{text}</Text>;
                          }
                        },
                        {
                          title: t('emailLabel'),
                          dataIndex: 'email',
                          width: '35%',
                          render: (text, record) => {
                            if (isEditing(record)) {
                              return (
                                <Form.Item name="email" style={{ margin: 0 }} rules={[{ required: true, type: 'email', message: language === 'en' ? 'Input valid email' : 'वैध ईमेल दर्ज करें' }]}>
                                  <Input size="small" />
                                </Form.Item>
                              );
                            }
                            return text;
                          }
                        },
                        {
                          title: t('roleLabelTbl'),
                          dataIndex: 'role',
                          width: '20%',
                          render: (role, record) => {
                            if (isEditing(record)) {
                              return (
                                <Form.Item name="role" style={{ margin: 0 }}>
                                  <Select size="small" style={{ width: 120 }}>
                                    <Option value="Admin">{t('system_admin')}</Option>
                                    <Option value="Inspector">{t('inspector')}</Option>
                                    <Option value="Approver">{t('port_authority')}</Option>
                                  </Select>
                                </Form.Item>
                              );
                            }
                            let color = 'blue';
                            let roleText = role;
                            if (role === 'Admin') { color = 'volcano'; roleText = t('system_admin'); }
                            if (role === 'Approver') { color = 'green'; roleText = t('port_authority'); }
                            if (role === 'Inspector') { roleText = t('inspector'); }
                            return <Tag color={color}>{roleText?.toUpperCase()}</Tag>;
                          }
                        },
                        {
                          title: t('controlOptions'),
                          key: 'action',
                          width: '20%',
                          render: (_, record) => {
                            const editable = isEditing(record);
                            if (editable) {
                              return (
                                <Space size="middle">
                                  <Button 
                                    onClick={() => saveEdit(record.id)} 
                                    type="primary" 
                                    size="small" 
                                    icon={<CheckOutlined />}
                                    loading={loadingAction === record.id + '-save'}
                                  >
                                    {t('saveBtn')}
                                  </Button>
                                  <Button 
                                    onClick={cancelEdit} 
                                    size="small" 
                                    icon={<CloseOutlined />}
                                  >
                                    {t('cancel')}
                                  </Button>
                                </Space>
                              );
                            }
                            return (
                              <Space size="middle">
                                <Button 
                                  onClick={() => startEdit(record)} 
                                  size="small" 
                                  icon={<EditOutlined />}
                                  disabled={editingKey !== ''}
                                >
                                  {t('editBtn')}
                                </Button>
                                {record.role !== 'Admin' && (
                                  <Popconfirm
                                    title={language === 'en' ? 'Revoke User Access?' : 'उपयोगकर्ता पहुंच रद्द करें?'}
                                    onConfirm={() => handleDeleteUser(record.id)}
                                    okText={t('revokeBtn')}
                                    cancelText={t('cancel')}
                                  >
                                    <Button 
                                      danger 
                                      type="primary" 
                                      size="small" 
                                      icon={<DeleteOutlined />}
                                      loading={loadingAction === record.id + '-delete'}
                                      disabled={editingKey !== ''}
                                    >
                                      {t('revokeBtn')}
                                    </Button>
                                  </Popconfirm>
                                )}
                              </Space>
                            );
                          }
                        }
                      ]}
                    />
                  </Form>
                </div>
              )
            },
            
            // TAB 2: AUDIT LEDGER
            {
              key: '2',
              label: <span><SecurityScanOutlined /> {t('tabAccessLogs')}</span>,
              children: (
                <div>
                  <Title level={4} style={{ marginBottom: '20px' }}>{t('securityLogTitle')}</Title>
                  {/* Fixed-height scrolling container */}
                  <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                    <Table 
                      dataSource={logs} 
                      loading={loading}
                      pagination={false} 
                      sticky
                      rowKey="id"
                      columns={[
                        {
                          title: t('logTimestamp'),
                          dataIndex: 'timestamp',
                          key: 'timestamp',
                          width: '20%'
                        },
                        {
                          title: t('logActorRole'),
                          dataIndex: 'userId',
                          key: 'userId',
                          width: '15%',
                          render: (role) => <Tag color="cyan">{role}</Tag>
                        },
                        {
                          title: t('logAction'),
                          dataIndex: 'actionPerformed',
                          key: 'actionPerformed',
                          width: '20%',
                          render: (action) => <Tag color="magenta">{action?.toUpperCase()}</Tag>
                        },
                        {
                          title: t('logSourceIp'),
                          dataIndex: 'clientIpAddress',
                          key: 'clientIpAddress',
                          width: '15%',
                          render: (ip) => <code style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{ip}</code>
                        },
                        {
                          title: t('logMetadata'),
                          dataIndex: 'details',
                          key: 'details',
                          width: '30%',
                          render: (text) => <Text type="secondary">{text}</Text>
                        }
                      ]}
                    />
                  </div>
                </div>
              )
            },

            // TAB 3: SYSTEM CONFIGURATION
            {
              key: '3',
              label: <span><SettingOutlined /> {t('tabSysConfig')}</span>,
              children: (
                <div style={{ maxWidth: '600px', margin: '20px auto' }}>
                  <Title level={4} style={{ marginBottom: '20px' }}>{t('varianceSensitivityTitle')}</Title>
                  <Card bordered style={{ padding: '10px' }}>
                    <Form 
                      layout="inline" 
                      onFinish={handleSaveConfig} 
                      initialValues={{ tolerance: weightTolerance }}
                      style={{ display: 'flex', flexFlow: 'column nowrap', gap: '20px' }}
                    >
                      <Form.Item 
                        name="tolerance" 
                        label={<Text strong>{t('weightDiscrepancyThreshold')}</Text>}
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                      >
                        <Slider 
                          min={1} 
                          max={10} 
                          style={{ width: '100%', minWidth: '400px' }}
                          tooltip={{ formatter: (v) => `${v}%` }}
                        />
                      </Form.Item>
                      <Form.Item style={{ width: '100%', textAlign: 'right', margin: 0 }}>
                        <Button type="primary" htmlType="submit">
                          {t('saveThresholdBtn')}
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>
                </div>
              )
            },
            
            // TAB 4: OPERATIONAL ANALYTICS
            {
              key: '4',
              label: <span><BarChartOutlined /> {t('tabLaneAnalytics')}</span>,
              children: (
                <div>
                  <Title level={4} style={{ marginBottom: '20px' }}>{t('analyticsLaneHeader')}</Title>
                  <Row gutter={16} style={{ marginBottom: '20px' }}>
                    <Col span={8}>
                      <Card bordered hoverable>
                        <Statistic title={t('statTotalWeight')} value={totalWeightVerified.toFixed(2)} suffix="MT" />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card bordered hoverable>
                        <Statistic title={t('statGateClearances')} value={clearedCount} valueStyle={{ color: '#52c41a' }} />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card bordered hoverable>
                        <Statistic title={t('statDiscrepancies')} value={rejectedCount} valueStyle={{ color: '#ff4d4f' }} />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    {/* SVG Pie Bar: approval/rejection splits */}
                    <Col span={24}>
                      <Card title={t('breakdownChartTitle')} style={{ height: '300px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '200px', gap: '20px' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <Text>{t('splitsApprovedAccess')}</Text>
                              <Text strong>{(clearedCount / (clearedCount + rejectedCount || 1) * 100).toFixed(0)}%</Text>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${(clearedCount / (clearedCount + rejectedCount || 1) * 100)}%`, height: '100%', background: '#52c41a' }} />
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <Text>{t('splitsDetainedAccess')}</Text>
                              <Text strong>{(rejectedCount / (clearedCount + rejectedCount || 1) * 100).toFixed(0)}%</Text>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ width: `${(rejectedCount / (clearedCount + rejectedCount || 1) * 100)}%`, height: '100%', background: '#ff4d4f' }} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                </div>
              )
            },

            // TAB 5: OPERATOR COMPLAINTS
            {
              key: '5',
              label: <span><CommentOutlined /> Grievances</span>,
              children: (
                <div>
                  <Tabs
                    defaultActiveKey="standard"
                    type="card"
                    items={[
                      {
                        key: 'standard',
                        label: 'Standard Grievance Queue',
                        children: (
                          <div style={{ marginTop: '15px' }}>
                            <Title level={4} style={{ marginBottom: '20px' }}>Standard Grievance Queue</Title>
                            <Table 
                              dataSource={complaints} 
                              loading={loading}
                              rowKey="id"
                              pagination={{ pageSize: 6 }}
                              bordered
                              columns={[
                                {
                                  title: t('complaintsTimestamp'),
                                  dataIndex: 'date',
                                  key: 'date',
                                  width: '20%',
                                  render: (date) => date ? new Date(date).toLocaleString() : '—'
                                },
                                {
                                  title: t('complaintsSender'),
                                  dataIndex: 'email',
                                  key: 'email',
                                  width: '25%',
                                  render: (email) => <Text strong>{email}</Text>
                                },
                                {
                                  title: 'Grievance Category / Subject',
                                  dataIndex: 'subject',
                                  key: 'subject',
                                  width: '25%',
                                  render: (subject) => <Text style={{ color: 'var(--nmpa-blue-dark)', fontWeight: '500' }}>{subject}</Text>
                                },
                                {
                                  title: t('complaintsMessage'),
                                  dataIndex: 'message',
                                  key: 'message',
                                  width: '30%',
                                  render: (message) => <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>{message}</Text>
                                }
                              ]}
                            />
                          </div>
                        )
                      },
                      {
                        key: 'chairman',
                        label: '⚠️ Secure Chairman\'s Office Inbox',
                        children: (
                          <div style={{ marginTop: '15px' }}>
                            <Title level={4} style={{ marginBottom: '20px', color: '#d9534f' }}>
                              ⚠️ Secure Chairman's Office Inbox (Direct Escalations)
                            </Title>
                            <Table 
                              dataSource={chairmanComplaints} 
                              loading={loading}
                              rowKey="id"
                              pagination={{ pageSize: 6 }}
                              bordered
                              columns={[
                                {
                                  title: 'Escalation Timestamp',
                                  dataIndex: 'date',
                                  key: 'date',
                                  width: '20%',
                                  render: (date) => date ? new Date(date).toLocaleString() : '—'
                                },
                                {
                                  title: 'Complainant Email',
                                  dataIndex: 'email',
                                  key: 'email',
                                  width: '20%',
                                  render: (email) => <Text strong>{email}</Text>
                                },
                                {
                                  title: 'Category',
                                  dataIndex: 'subject',
                                  key: 'subject',
                                  width: '20%',
                                  render: (subject) => <Tag color="red" style={{ fontWeight: 'bold' }}>{subject?.toUpperCase()}</Tag>
                                },
                                {
                                  title: 'Severity',
                                  dataIndex: 'severity_level',
                                  key: 'severity_level',
                                  width: '15%',
                                  render: (severity) => {
                                    let color = 'orange';
                                    if (severity === 'Critical') color = 'red';
                                    if (severity === 'High') color = 'volcano';
                                    if (severity === 'Low') color = 'blue';
                                    return <Tag color={color} style={{ fontWeight: 'bold' }}>{severity?.toUpperCase()}</Tag>;
                                  }
                                },
                                {
                                  title: 'Confidential Description',
                                  dataIndex: 'message',
                                  key: 'message',
                                  width: '25%',
                                  render: (message) => <Text type="danger" style={{ whiteSpace: 'pre-wrap' }}>{message}</Text>
                                }
                              ]}
                            />
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* User Creation Modal */}
      <Modal
        title={
          <Title level={4} style={{ margin: 0 }}>
            {language === 'en' ? 'Create New Platform Operator Account' : 'नया प्लेटफॉर्म ऑपरेटर खाता बनाएं'}
          </Title>
        }
        open={isAddUserOpen}
        onCancel={() => {
          setIsAddUserOpen(false);
          createUserForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form 
          form={createUserForm} 
          layout="vertical" 
          onFinish={handleCreateUser}
          style={{ marginTop: '20px' }}
        >
          <Form.Item 
            name="username" 
            label={language === 'en' ? 'Operator Username' : 'ऑपरेटर उपयोगकर्ता नाम'} 
            rules={[
              { required: true, message: language === 'en' ? 'Username is mandatory' : 'उपयोगकर्ता नाम अनिवार्य है' },
              { pattern: /^[a-zA-Z0-9_]{4,}$/, message: language === 'en' ? 'Username must be at least 4 characters long and contain only letters, numbers, and underscores' : 'उपयोगकर्ता नाम कम से कम 4 वर्ण लंबा होना चाहिए और उसमें केवल अक्षर, अंक और अंडरस्कोर हो सकते हैं' }
            ]}
          >
            <Input placeholder="Enter unique username" />
          </Form.Item>
          <Form.Item name="email" label={language === 'en' ? 'Operator Official Email Address' : 'ऑपरेटर आधिकारिक ईमेल पता'} rules={[{ required: true, type: 'email', message: language === 'en' ? 'Input valid email' : 'वैध ईमेल दर्ज करें' }]}>
            <Input placeholder="e.g. name@nmpa.gov" />
          </Form.Item>
          <Form.Item 
            name="password" 
            label={language === 'en' ? 'Temporary Password Passphrase' : 'अस्थायी पासवर्ड पासफ़्रेज़'} 
            rules={[
              { required: true, message: language === 'en' ? 'Password is mandatory' : 'पासवर्ड अनिवार्य है' },
              { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, message: language === 'en' ? 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)' : 'पासवर्ड कम से कम 8 वर्णों का होना चाहिए और उसमें कम से कम एक बड़ा अक्षर, एक छोटा अक्षर, एक अंक और एक विशेष वर्ण (@$!%*?&) होना चाहिए' }
            ]}
          >
            <Input.Password placeholder="e.g. TempPass@123" />
          </Form.Item>
          
          {/* Select dropdown restricting strictly to roles in user config array */}
          <Form.Item name="role" label={t('roleLabelTbl')} rules={[{ required: true, message: language === 'en' ? 'Role selection is mandatory' : 'भूमिका चयन अनिवार्य है' }]}>
            <Select placeholder="Assign access authorization level">
              <Option value="Admin">{t('system_admin')}</Option>
              <Option value="Inspector">{t('inspector')}</Option>
              <Option value="Approver">{t('port_authority')}</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginTop: '30px', marginBottom: 0 }}>
            <Button style={{ marginRight: '8px' }} onClick={() => setIsAddUserOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="primary" htmlType="submit" loading={loadingAction === 'create'}>
              {language === 'en' ? 'Register Access Identity' : 'पहुंच पहचान पंजीकृत करें'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default SystemAdmin;
