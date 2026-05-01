import React from 'react';
import { Empty, Spin } from 'antd';
import QuestionCard from './QuestionCard';

const QuestionList = ({ questions, loading, onLike, onAnswer, showAnswerButton = false, showAnswer = false, disabledLike = false }) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <Empty
        description="暂无问题，快来提问吧！"
        style={{ padding: 40 }}
      />
    );
  }

  return (
    <div>
      {questions.map(question => (
        <QuestionCard
          key={question.id}
          question={question}
          onLike={onLike}
          onAnswer={onAnswer}
          showAnswerButton={showAnswerButton}
          showAnswer={showAnswer}
          disabledLike={disabledLike}
        />
      ))}
    </div>
  );
};

export default QuestionList;
