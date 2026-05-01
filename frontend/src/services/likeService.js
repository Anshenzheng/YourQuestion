const USER_ID_KEY = 'qanda_user_id';
const LIKED_QUESTIONS_KEY = 'qanda_liked_questions';

const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const getUserId = () => {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
};

const getLikedQuestions = () => {
  const liked = localStorage.getItem(LIKED_QUESTIONS_KEY);
  return liked ? JSON.parse(liked) : [];
};

const saveLikedQuestions = (likedQuestions) => {
  localStorage.setItem(LIKED_QUESTIONS_KEY, JSON.stringify(likedQuestions));
};

const hasLiked = (questionId) => {
  const likedQuestions = getLikedQuestions();
  return likedQuestions.includes(questionId);
};

const addLike = (questionId) => {
  const likedQuestions = getLikedQuestions();
  if (!likedQuestions.includes(questionId)) {
    likedQuestions.push(questionId);
    saveLikedQuestions(likedQuestions);
    return true;
  }
  return false;
};

const likeService = {
  getUserId,
  hasLiked,
  addLike,
  getLikedQuestions,
};

export default likeService;
