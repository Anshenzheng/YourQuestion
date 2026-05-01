import React from 'react';
import { Card, Tag, Button, Avatar, Typography } from 'antd';
import { LikeOutlined, LikeFilled, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

const QuestionCard = ({ question, onLike, onAnswer, showAnswerButton = false, showAnswer = false, disabledLike = false }) => {
  const handleLike = () => {
    if (!disabledLike && onLike) {
      onLike(question.id);
    }
  };

  const handleAnswer = () => {
    if (onAnswer) {
      onAnswer(question);
    }
  };

  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        borderRadius: 12,
        boxShadow: question.is_answered 
          ? '0 2px 8px rgba(82, 196, 26, 0.15)' 
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        borderLeft: question.is_answered 
          ? '4px solid #52c41a' 
          : '4px solid #1890ff',
        background: question.is_answered ? '#f6ffed' : '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar 
          icon={<UserOutlined />} 
          style={{ 
            backgroundColor: question.is_answered ? '#52c41a' : '#1890ff',
            marginTop: 4,
          }} 
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text strong style={{ fontSize: 14, color: '#262626' }}>
              {question.nickname}
            </Text>
            {question.is_answered && (
              <Tag icon={<CheckCircleOutlined />} color="success">
                已回答
              </Tag>
            )}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(question.created_at).toLocaleString('zh-CN')}
            </Text>
          </div>
          
          <Paragraph
            style={{
              marginBottom: 12,
              fontSize: 15,
              lineHeight: 1.6,
              color: '#262626',
            }}
            ellipsis={false}
          >
            {question.content}
          </Paragraph>
          
          {showAnswer && question.is_answered && question.answer && (
            <div
              style={{
                background: '#e6f7ff',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
                borderLeft: '3px solid #1890ff',
              }}
            >
              <Text strong style={{ color: '#1890ff', display: 'block', marginBottom: 4 }}>
                主持人回答：
              </Text>
              <Paragraph style={{ margin: 0, color: '#262626' }}>
                {question.answer}
              </Paragraph>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Button
              type="text"
              icon={question.likes > 0 ? <LikeFilled /> : <LikeOutlined />}
              onClick={handleLike}
              disabled={disabledLike}
              style={{
                color: question.likes > 0 ? '#1890ff' : '#8c8c8c',
                padding: '4px 12px',
              }}
            >
              <span style={{ marginLeft: 4 }}>{question.likes}</span>
            </Button>
            
            {showAnswerButton && !question.is_answered && (
              <Button 
                type="primary" 
                size="small" 
                onClick={handleAnswer}
                style={{ borderRadius: 4 }}
              >
                回答问题
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default QuestionCard;
