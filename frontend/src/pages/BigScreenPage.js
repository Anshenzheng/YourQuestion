import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Card, Typography, Space, Empty, Spin, Tag, Button, Modal, message, Divider } from 'antd';
import { VideoCameraOutlined, FullscreenOutlined, ReloadOutlined } from '@ant-design/icons';
import { getRoom, getQuestions } from '../services/api';
import socketService from '../services/socket';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const BigScreenPage = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [fullscreenModal, setFullscreenModal] = useState(false);
  const containerRef = useRef(null);

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await getQuestions(roomId, 'likes', 'desc');
      if (response.success) {
        setQuestions(response.questions);
      }
    } catch (error) {
      console.error('获取问题列表失败:', error);
    }
  }, [roomId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const roomResponse = await getRoom(roomId);
        if (roomResponse.success) {
          setRoom(roomResponse.room);
        }
      } catch (error) {
        console.error('获取房间信息失败:', error);
      }
      
      await fetchQuestions();
      setLoading(false);
      
      socketService.connect();
      socketService.joinRoom(roomId);
      
      const handleQuestionCreated = (question) => {
        setQuestions(prev => {
          const updated = [...prev, question];
          return updated.sort((a, b) => b.likes - a.likes);
        });
      };
      
      const handleQuestionUpdated = (updatedQuestion) => {
        setQuestions(prev => {
          const updated = prev.map(q => 
            q.id === updatedQuestion.id ? updatedQuestion : q
          );
          return updated.sort((a, b) => b.likes - a.likes);
        });
      };
      
      socketService.on('question_created', handleQuestionCreated);
      socketService.on('question_updated', handleQuestionUpdated);
      
      return () => {
        socketService.off('question_created', handleQuestionCreated);
        socketService.off('question_updated', handleQuestionUpdated);
      };
    };
    
    init();
  }, [roomId, fetchQuestions]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchQuestions();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchQuestions]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('进入全屏失败:', err);
        setFullscreenModal(true);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const unansweredQuestions = questions.filter(q => !q.is_answered);
  const answeredQuestions = questions.filter(q => q.is_answered);

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#001529' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" style={{ color: '#fff' }} />
            <Title level={3} style={{ color: '#fff', marginTop: 20 }}>加载中...</Title>
          </div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout 
      style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(180deg, #001529 0%, #002766 100%)',
        color: '#fff',
      }}
      ref={containerRef}
    >
      <Header style={{ 
        background: 'rgba(0, 0, 0, 0.3)',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        minHeight: 80,
      }}>
        <Space>
          <VideoCameraOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <div>
            <Title level={2} style={{ margin: 0, color: '#fff' }}>
              {room?.name || '提问墙'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
              实时提问与互动
            </Text>
          </div>
        </Space>
        
        <Space size="large">
          <Space>
            <Text style={{ fontSize: 16 }}>
              总问题数: <Text strong style={{ color: '#1890ff', fontSize: 20 }}>{questions.length}</Text>
            </Text>
            <Divider type="vertical" style={{ background: 'rgba(255,255,255,0.2)', height: 20 }} />
            <Text style={{ fontSize: 16 }}>
              待回答: <Text strong style={{ color: '#faad14', fontSize: 20 }}>{unansweredQuestions.length}</Text>
            </Text>
            <Divider type="vertical" style={{ background: 'rgba(255,255,255,0.2)', height: 20 }} />
            <Text style={{ fontSize: 16 }}>
              已回答: <Text strong style={{ color: '#52c41a', fontSize: 20 }}>{answeredQuestions.length}</Text>
            </Text>
          </Space>
          
          <Space>
            <Button
              type={autoRefresh ? 'primary' : 'default'}
              icon={<ReloadOutlined />}
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{ background: autoRefresh ? '#1890ff' : 'transparent', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              {autoRefresh ? '自动刷新中' : '自动刷新'}
            </Button>
            <Button
              type="primary"
              icon={<FullscreenOutlined />}
              onClick={toggleFullscreen}
              style={{ background: '#1890ff', borderColor: '#1890ff' }}
            >
              全屏模式
            </Button>
          </Space>
        </Space>
      </Header>
      
      <Content style={{ padding: '30px 40px', overflow: 'auto' }}>
        {questions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 100 }}>
            <Empty
              description={
                <Title level={3} style={{ color: 'rgba(255,255,255,0.65)' }}>
                  暂无问题，等待观众提问...
                </Title>
              }
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 24 }}>
            {questions.map((question, index) => (
              <Card
                key={question.id}
                style={{
                  background: question.is_answered 
                    ? 'rgba(82, 196, 26, 0.1)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  border: question.is_answered 
                    ? '2px solid rgba(82, 196, 26, 0.4)' 
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 16,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                  borderLeft: index === 0 && !question.is_answered ? '6px solid #faad14' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  <div
                    style={{
                      background: index === 0 && !question.is_answered 
                        ? 'linear-gradient(135deg, #faad14, #ff4d4f)' 
                        : 'linear-gradient(135deg, #1890ff, #597ef7)',
                      color: '#fff',
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: 'bold',
                      flexShrink: 0,
                      boxShadow: index === 0 && !question.is_answered 
                        ? '0 0 20px rgba(250, 173, 20, 0.5)' 
                        : '0 4px 12px rgba(24, 144, 255, 0.3)',
                    }}
                  >
                    {index + 1}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: 18, 
                          color: question.is_answered ? '#52c41a' : '#fff',
                        }}
                      >
                        {question.nickname}
                      </Text>
                      {question.is_answered ? (
                        <Tag color="success" style={{ fontSize: 14, padding: '2px 12px' }}>
                          ✓ 已回答
                        </Tag>
                      ) : index === 0 && !question.is_answered ? (
                        <Tag color="warning" style={{ fontSize: 14, padding: '2px 12px' }}>
                          🔥 热门问题
                        </Tag>
                      ) : null}
                    </div>
                    
                    <Paragraph
                      style={{
                        fontSize: 20,
                        lineHeight: 1.6,
                        color: '#fff',
                        marginBottom: 16,
                        wordBreak: 'break-word',
                      }}
                    >
                      {question.content}
                    </Paragraph>
                    
                    {question.is_answered && question.answer && (
                      <div
                        style={{
                          background: 'rgba(82, 196, 26, 0.2)',
                          padding: 16,
                          borderRadius: 8,
                          borderLeft: '4px solid #52c41a',
                          marginBottom: 12,
                        }}
                      >
                        <Text 
                          strong 
                          style={{ 
                            color: '#52c41a', 
                            display: 'block', 
                            marginBottom: 8,
                            fontSize: 16,
                          }}
                        >
                          🎤 主持人回答：
                        </Text>
                        <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
                          {question.answer}
                        </Paragraph>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          background: 'rgba(250, 173, 20, 0.2)',
                          padding: '8px 20px',
                          borderRadius: 20,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>👍</span>
                        <Text 
                          strong 
                          style={{ 
                            color: '#faad14', 
                            fontSize: 20,
                          }}
                        >
                          {question.likes}
                        </Text>
                      </div>
                      
                      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
                        {new Date(question.created_at).toLocaleString('zh-CN')}
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Content>

      <Modal
        title="全屏模式"
        open={fullscreenModal}
        onCancel={() => setFullscreenModal(false)}
        footer={[
          <Button key="close" onClick={() => setFullscreenModal(false)}>
            关闭
          </Button>,
        ]}
        centered
      >
        <Paragraph>
          按 <Text code>F11</Text> 键可以手动切换全屏模式。
        </Paragraph>
      </Modal>
    </Layout>
  );
};

export default BigScreenPage;
