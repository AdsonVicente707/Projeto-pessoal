const express = require('express');
const router = express.Router();
const { getPosts, createPost, likePost, createPostComment } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware.js');
const ensureUploadsDir = require('../middleware/ensureUploadsDir.js');

router.route('/').get(protect, getPosts).post(protect, ensureUploadsDir, createPost);
router.route('/:id/like').put(protect, likePost);
router.route('/:id/comments').post(protect, createPostComment);

module.exports = router;