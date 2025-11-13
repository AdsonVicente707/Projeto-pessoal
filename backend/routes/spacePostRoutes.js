const express = require('express');
const router = express.Router();
const {
  getSpacePosts,
  createSpacePost,
} = require('../controllers/spacePostController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:spaceId').get(protect, getSpacePosts).post(protect, createSpacePost);

module.exports = router;