const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, optionalAuth } = require('../middleware/auth');
const {
  getUserProfile,
  changePassword,
  updateProfile,
  updateAvatar,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers,
  getUserPosts,
  getSettings,
  updateSettings,
  getInteractionUsers,
  updateInteractionUser
} = require('../controllers/userController');

// Configure multer for avatar upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed'), false);
    }
  }
});

// Must be before /:username to avoid conflicts
router.get('/search', auth, searchUsers);
router.get('/suggested', auth, getSuggestedUsers);
router.put('/security/password', auth, changePassword);
router.get('/settings', auth, getSettings);
router.put('/settings', auth, updateSettings);
router.get('/interactions/:type', auth, getInteractionUsers);
router.post('/interactions/:type/:targetId', auth, updateInteractionUser);

// Profile
router.get('/:username', optionalAuth, getUserProfile);
router.get('/:username/posts', optionalAuth, getUserPosts);
router.put('/profile', auth, updateProfile);
router.put('/avatar', auth, upload.single('avatar'), updateAvatar);

// Follow system
router.post('/:id/follow', auth, followUser);
router.delete('/:id/follow', auth, unfollowUser);
router.get('/:id/followers', auth, getFollowers);
router.get('/:id/following', auth, getFollowing);

module.exports = router;
