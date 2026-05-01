import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Frontend-Url': window.location.origin,
  },
});

export const createRoom = async (name) => {
  const response = await api.post('/rooms', { name });
  return response.data;
};

export const getRoom = async (roomId) => {
  const response = await api.get(`/rooms/${roomId}`);
  return response.data;
};

export const getQuestions = async (roomId, sortBy = 'likes', order = 'desc') => {
  const response = await api.get(`/rooms/${roomId}/questions`, {
    params: { sort: sortBy, order },
  });
  return response.data;
};

export const createQuestion = async (roomId, content, nickname) => {
  const response = await api.post(`/rooms/${roomId}/questions`, { content, nickname });
  return response.data;
};

export const likeQuestion = async (questionId, userId) => {
  const response = await api.post(`/questions/${questionId}/like`, { user_id: userId });
  return response.data;
};

export const getUserLikes = async (roomId, userId) => {
  const response = await api.post(`/rooms/${roomId}/user-likes`, { user_id: userId });
  return response.data;
};

export const answerQuestion = async (questionId, answer) => {
  const response = await api.post(`/questions/${questionId}/answer`, { answer });
  return response.data;
};

export default api;
