const express = require('express');
const router = express.Router();
const {
  getSpacePosts,
  createSpacePost,
  likeSpacePost,
  commentSpacePost,
} = require('../controllers/spacePostController');
const { protect } = require('../middleware/authMiddleware');
const ensureUploadsDir = require('../middleware/ensureUploadsDir.js');

router.route('/:spaceId').get(protect, getSpacePosts).post(protect, ensureUploadsDir, createSpacePost);
router.route('/:id/like').put(protect, likeSpacePost);
router.route('/:id/comments').post(protect, commentSpacePost);

module.exports = router;