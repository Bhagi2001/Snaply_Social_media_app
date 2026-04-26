const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead
} = require('../controllers/chatController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed in chat'), false);
    }
  }
});

router.get('/conversations', auth, getConversations);
router.post('/conversations', auth, getOrCreateConversation);
router.get('/conversations/:id/messages', auth, getMessages);
router.post('/conversations/:id/messages', auth, upload.single('image'), sendMessage);
router.put('/messages/read/:conversationId', auth, markAsRead);

module.exports = router;
