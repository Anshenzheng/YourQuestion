import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Card, Form, Input, Button, Typography, Space, message, Divider, Radio } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { getRoom, getQuestions, createQuestion, likeQuestion } from '../services/api';
import socketService from '../services/socket';
import QuestionList from '../components/QuestionList';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const sortQuestions = (questions) => {
  return [...questions].sort((a, b) => {
    if (b.likes !== a.likes) {
      return b.likes - a.likes;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });
};

const UserPage = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchQuestions = useCallback(async () => {
    try {
      const response = await getQuestions(roomId, 'likes', 'desc');
      if (response.success) {
        setQuestions(sortQuestions(response.questions));
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
          const exists = prev.some(q => q.id === question.id);
          if (exists) {
            return prev;
          }
          const updated = [...prev, question];
          return sortQuestions(updated);
        });
      };
      
      const handleQuestionUpdated = (updatedQuestion) => {
        setQuestions(prev => {
          const updated = prev.map(q => 
            q.id === updatedQuestion.id ? updatedQuestion : q
          );
          return sortQuestions(updated);
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

  const handleSubmitQuestion = async (values) => {
    setLoading(true);
    try {
      const response = await createQuestion(
        roomId, 
        values.content, 
        values.nickname
      );
      if (response.success) {
        message.success('提问成功！');
        form.resetFields();
      } else {
        message.error('提问失败');
      }
    } catch (error) {
      console.error('提问失败:', error);
      message.error('提问失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (questionId) => {
    try {
      await likeQuestion(questionId);
      message.success('点赞成功！');
    } catch (error) {
      console.error('点赞失败:', error);
      message.error('点赞失败');
    }
  };

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
        background: '#fff', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Space>
          <MessageOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0, color: '#262626' }}>
            {room.name}
          </Title>
        </Space>
      </Header>
      
      <Content style={{ padding: '20px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        <Card
          style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}
          title={
            <Space>
              <span style={{ fontSize: 18 }}>✍️</span>
              <span>提出您的问题</span>
            </Space>
          }
        >
          <Form
            form={form}
            onFinish={handleSubmitQuestion}
            layout="vertical"
          >
            <Form.Item
              name="nickname"
              label="您的昵称"
              rules={[{ required: true, message: '请输入您的昵称' }]}
              tooltip="输入昵称即可匿名提问"
            >
              <Input placeholder="请输入您的昵称" maxLength={20} />
            </Form.Item>
            
            <Form.Item
              name="content"
              label="您的问题"
              rules={[{ required: true, message: '请输入您的问题' }]}
            >
              <TextArea
                rows={4}
                placeholder="请输入您想提问的问题..."
                maxLength={500}
                showCount
              />
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{ height: 44, borderRadius: 8 }}
              >
                提交问题
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Divider>
          <Text type="secondary">问题列表（按点赞数排序）</Text>
        </Divider>

        <QuestionList
          questions={questions}
          loading={false}
          onLike={handleLike}
          showAnswer={true}
        />
      </Content>
    </Layout>
  );
};

export default UserPage;
