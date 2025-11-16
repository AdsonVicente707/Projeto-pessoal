const express = require('express');
const router = express.Router();
const {
  getSpacePosts,
  createSpacePost,
} = require('../controllers/spacePostController');
const { protect } = require('../middleware/authMiddleware');
const ensureUploadsDir = require('../middleware/ensureUploadsDir.js');

router.route('/:spaceId').get(protect, getSpacePosts).post(protect, ensureUploadsDir, createSpacePost);

module.exports = router;