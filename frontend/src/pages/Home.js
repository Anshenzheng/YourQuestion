import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, Typography, Row, Col, Divider, Space, Tag, message, Modal, Spin } from 'antd';
import { PlusOutlined, QrcodeOutlined, TeamOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { createRoom } from '../services/api';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentQr, setCurrentQr] = useState({ data: '', label: '' });

  const handleCreateRoom = async (values) => {
    setLoading(true);
    try {
      const response = await createRoom(values.name || '提问房间');
      if (response.success) {
        setRoomData(response);
        message.success('房间创建成功！');
      } else {
        message.error('创建房间失败');
      }
    } catch (error) {
      console.error('创建房间失败:', error);
      message.error('创建房间失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  const showQrModal = (qrData, label) => {
    setCurrentQr({ data: qrData, label });
    setQrModalVisible(true);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)' }}>
      <Header style={{ 
        background: '#fff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '0 50px',
        display: 'flex',
        alignItems: 'center',
      }}>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          💬 现场实时提问墙系统
        </Title>
      </Header>
      
      <Content style={{ padding: '50px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {!roomData ? (
          <Row justify="center">
            <Col xs={24} sm={20} md={16} lg={12}>
              <Card
                style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PlusOutlined style={{ color: '#1890ff' }} />
                    <span>创建提问房间</span>
                  </div>
                }
              >
                <Form onFinish={handleCreateRoom} layout="vertical">
                  <Form.Item
                    name="name"
                    label="房间名称"
                    rules={[{ required: false, message: '请输入房间名称' }]}
                    initialValue="现场提问房间"
                  >
                    <Input placeholder="例如：产品发布会提问环节" size="large" />
                  </Form.Item>
                  
                  <Form.Item>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      size="large" 
                      block
                      loading={loading}
                      style={{ height: 48, fontSize: 16, borderRadius: 8 }}
                    >
                      创建房间
                    </Button>
                  </Form.Item>
                </Form>

                <Divider style={{ margin: '24px 0' }}>
                  <Text type="secondary">功能说明</Text>
                </Divider>

                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Card size="small" bordered={false} style={{ background: '#e6f7ff', borderRadius: 8 }}>
                    <Space>
                      <TeamOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                      <Text strong>用户端</Text>
                    </Space>
                    <Paragraph style={{ marginTop: 8, marginBottom: 0, color: '#595959' }}>
                      线下用户扫码进入，无需登录即可提问，支持匿名提问（需输入昵称）和点赞功能。
                    </Paragraph>
                  </Card>

                  <Card size="small" bordered={false} style={{ background: '#fff7e6', borderRadius: 8 }}>
                    <Space>
                      <VideoCameraOutlined style={{ fontSize: 20, color: '#fa8c16' }} />
                      <Text strong>大屏端</Text>
                    </Space>
                    <Paragraph style={{ marginTop: 8, marginBottom: 0, color: '#595959' }}>
                      全屏实时展示问题列表，按点赞数从高到低排序，适合现场投影展示。
                    </Paragraph>
                  </Card>

                  <Card size="small" bordered={false} style={{ background: '#f6ffed', borderRadius: 8 }}>
                    <Space>
                      <QrcodeOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                      <Text strong>主办方后台</Text>
                    </Space>
                    <Paragraph style={{ marginTop: 8, marginBottom: 0, color: '#595959' }}>
                      主持人或嘉宾可选择问题回答，回答后标记已答，实时同步到所有端。
                    </Paragraph>
                  </Card>
                </Space>
              </Card>
            </Col>
          </Row>
        ) : (
          <Card
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>✅</span>
                <span>房间创建成功</span>
              </div>
            }
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <TeamOutlined style={{ color: '#1890ff' }} />
                      <span>用户端入口</span>
                      <Tag color="blue">线下用户扫码</Tag>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <div 
                      onClick={() => showQrModal(roomData.qrcodes.user, '用户端二维码')}
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      <img 
                        src={`data:image/png;base64,${roomData.qrcodes.user}`} 
                        alt="用户端二维码"
                        style={{ width: 180, height: 180, border: '1px solid #d9d9d9', borderRadius: 8 }}
                      />
                    </div>
                    <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                      <Text type="secondary">点击放大二维码</Text>
                    </Paragraph>
                    <Text copyable style={{ display: 'block', marginTop: 8, wordBreak: 'break-all' }}>
                      {roomData.urls.user}
                    </Text>
                  </div>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card 
                  size="small" 
                  title={
                    <Space>
                      <VideoCameraOutlined style={{ color: '#fa8c16' }} />
                      <span>大屏端入口</span>
                      <Tag color="orange">现场投影</Tag>
                    </Space>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <div style={{ textAlign: 'center', padding: 16 }}>
                    <div 
                      onClick={() => showQrModal(roomData.qrcodes.bigscreen, '大屏端二维码')}
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      <img 
                        src={`data:image/png;base64,${roomData.qrcodes.bigscreen}`} 
                        alt="大屏端二维码"
                        style={{ width: 180, height: 180, border: '1px solid #d9d9d9', borderRadius: 8 }}
                      />
                    </div>
                    <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                      <Text type="secondary">点击放大二维码</Text>
                    </Paragraph>
                    <Text copyable style={{ display: 'block', marginTop: 8, wordBreak: 'break-all' }}>
                      {roomData.urls.bigscreen}
                    </Text>
                    <Button 
                      type="primary" 
                      style={{ marginTop: 12 }}
                      onClick={() => window.open(roomData.urls.bigscreen, '_blank')}
                    >
                      在新窗口打开大屏端
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>

            <Card 
              size="small" 
              title={
                <Space>
                  <QrcodeOutlined style={{ color: '#52c41a' }} />
                  <span>主持人后台</span>
                  <Tag color="green">管理回答</Tag>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  主持人链接（请妥善保存）
                </Text>
                <Text copyable style={{ display: 'block', wordBreak: 'break-all' }}>
                  {roomData.urls.host}
                </Text>
                <Button 
                  type="primary" 
                  style={{ marginTop: 12 }}
                  onClick={() => window.open(roomData.urls.host, '_blank')}
                >
                  进入主持人后台
                </Button>
              </div>
            </Card>

            <Divider />

            <div style={{ textAlign: 'center' }}>
              <Button 
                onClick={() => setRoomData(null)}
                icon={<PlusOutlined />}
              >
                创建新房间
              </Button>
            </div>
          </Card>
        )}
      </Content>

      <Modal
        title={currentQr.label}
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        centered
      >
        <div style={{ textAlign: 'center', padding: 20 }}>
          <img 
            src={`data:image/png;base64,${currentQr.data}`} 
            alt="二维码"
            style={{ width: 300, height: 300 }}
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default Home;
