const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, optionalAuth } = require('../middleware/auth');
const {
  createPost,
  getFeed,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getExplorePosts,
  getPostsByHashtag,
  getSavedPosts
} = require('../controllers/postController');
const {
  addComment,
  getComments,
  deleteComment,
  likeComment
} = require('../controllers/commentController');

// Configure multer for post media upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'), false);
    }
  }
});

// Feed & explore (must be before /:id)
router.get('/feed', auth, getFeed);
router.get('/explore', auth, getExplorePosts);
router.get('/saved', auth, getSavedPosts);
router.get('/hashtag/:tag', optionalAuth, getPostsByHashtag);

// Posts CRUD
router.post('/', auth, upload.array('media', 10), createPost);
router.get('/:id', optionalAuth, getPost);
router.put('/:id', auth, updatePost);
router.delete('/:id', auth, deletePost);

// Likes
router.post('/:id/like', auth, likePost);
router.delete('/:id/like', auth, unlikePost);

// Save
router.post('/:id/save', auth, savePost);
router.delete('/:id/save', auth, unsavePost);

// Comments
router.post('/:id/comments', auth, addComment);
router.get('/:id/comments', optionalAuth, getComments);
router.delete('/comments/:commentId', auth, deleteComment);
router.post('/comments/:commentId/like', auth, likeComment);

module.exports = router;
