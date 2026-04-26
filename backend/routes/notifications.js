const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getNotifications,
  markAllAsRead,
  markAsRead,
  getUnreadCount
} = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.get('/unread-count', auth, getUnreadCount);
router.put('/read', auth, markAllAsRead);
router.put('/:id/read', auth, markAsRead);

module.exports = router;
