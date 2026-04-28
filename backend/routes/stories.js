const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const {
  createStory,
  getStories,
  getMyStories,
  viewStory,
  deleteStory
} = require('../controllers/storyController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'), false);
    }
  }
});

router.post('/', auth, upload.single('media'), createStory);
router.get('/', auth, getStories);
router.get('/mine', auth, getMyStories);
router.post('/:id/view', auth, viewStory);
router.delete('/:id', auth, deleteStory);

module.exports = router;
