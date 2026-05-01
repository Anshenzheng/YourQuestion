import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Card, Typography, Space, message, Button, Modal, Input, Tabs, Empty, Spin, Radio } from 'antd';
import { CrownOutlined, MessageOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getRoom, getQuestions, likeQuestion, answerQuestion } from '../services/api';
import socketService from '../services/socket';
import QuestionCard from '../components/QuestionCard';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const HostPage = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answerModalVisible, setAnswerModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [activeTab, setActiveTab] = useState('unanswered');

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
      try {
        const roomResponse = await getRoom(roomId);
        if (roomResponse.success) {
          setRoom(roomResponse.room);
        }
      } catch (error) {
        console.error('获取房间信息失败:', error);
        message.error('房间不存在或已过期');
      }
      
      fetchQuestions();
      
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

  const handleAnswerClick = (question) => {
    setCurrentQuestion(question);
    setAnswerContent(question.answer || '');
    setAnswerModalVisible(true);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    
    setLoading(true);
    try {
      const response = await answerQuestion(currentQuestion.id, answerContent);
      if (response.success) {
        message.success('回答提交成功！');
        setAnswerModalVisible(false);
        setCurrentQuestion(null);
        fetchQuestions();
      } else {
        message.error('回答提交失败');
      }
    } catch (error) {
      console.error('回答提交失败:', error);
      message.error('回答提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (questionId) => {
    try {
      await likeQuestion(questionId);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const unansweredQuestions = questions.filter(q => !q.is_answered);
  const answeredQuestions = questions.filter(q => q.is_answered);

  const tabItems = [
    {
      key: 'unanswered',
      label: (
        <Space>
          <ClockCircleOutlined style={{ color: '#faad14' }} />
          <span>待回答</span>
          {unansweredQuestions.length > 0 && (
            <Text type="danger" style={{ marginLeft: -8 }}>({unansweredQuestions.length})</Text>
          )}
        </Space>
      ),
      children: unansweredQuestions.length > 0 ? (
        unansweredQuestions.map(question => (
          <QuestionCard
            key={question.id}
            question={question}
            onLike={handleLike}
            onAnswer={handleAnswerClick}
            showAnswerButton={true}
            showAnswer={false}
            disabledLike={false}
          />
        ))
      ) : (
        <Empty description="暂无待回答的问题" style={{ padding: 40 }} />
      ),
    },
    {
      key: 'answered',
      label: (
        <Space>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>已回答</span>
          {answeredQuestions.length > 0 && (
            <Text type="success" style={{ marginLeft: -8 }}>({answeredQuestions.length})</Text>
          )}
        </Space>
      ),
      children: answeredQuestions.length > 0 ? (
        answeredQuestions.map(question => (
          <QuestionCard
            key={question.id}
            question={question}
            onLike={handleLike}
            onAnswer={handleAnswerClick}
            showAnswerButton={false}
            showAnswer={true}
            disabledLike={false}
          />
        ))
      ) : (
        <Empty description="暂无已回答的问题" style={{ padding: 40 }} />
      ),
    },
  ];

  if (!room) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Card style={{ textAlign: 'center', padding: 40 }}>
            <Title level={4}>加载中...</Title>
          </Card>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)' }}>
      <Header style={{ 
        background: '#1890ff', 
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
      }}>
        <Space>
          <CrownOutlined style={{ fontSize: 24, color: '#fff' }} />
          <Title level={4} style={{ margin: 0, color: '#fff' }}>
            主持人后台 - {room.name}
          </Title>
        </Space>
        <Space>
          <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
            总问题数: <Text strong style={{ color: '#fff' }}>{questions.length}</Text>
          </Text>
        </Space>
      </Header>
      
      <Content style={{ padding: '20px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
        <Card
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>
      </Content>

      <Modal
        title={
          <Space>
            <MessageOutlined style={{ color: '#1890ff' }} />
            <span>回答问题</span>
          </Space>
        }
        open={answerModalVisible}
        onCancel={() => setAnswerModalVisible(false)}
        footer={
          <Space>
            <Button onClick={() => setAnswerModalVisible(false)}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmitAnswer}
              loading={loading}
            >
              提交回答
            </Button>
          </Space>
        }
        width={700}
        centered
      >
        {currentQuestion && (
          <div>
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16, 
                background: '#f5f5f5',
                borderRadius: 8,
              }}
            >
              <Space style={{ marginBottom: 8 }}>
                <Text strong>{currentQuestion.nickname}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(currentQuestion.created_at).toLocaleString('zh-CN')}
                </Text>
              </Space>
              <Paragraph style={{ margin: 0, fontSize: 15 }}>
                {currentQuestion.content}
              </Paragraph>
              <Text type="secondary" style={{ fontSize: 12 }}>
                点赞数: {currentQuestion.likes}
              </Text>
            </Card>

            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              输入回答内容：
            </Text>
            <TextArea
              rows={6}
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="请输入您的回答内容..."
              maxLength={1000}
              showCount
            />
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default HostPage;
