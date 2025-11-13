const express = require('express');
const router = express.Router();
const {
  getMyInvitations,
  acceptInvitation,
} = require('../controllers/invitationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/my').get(protect, getMyInvitations);
router.route('/:id/accept').post(protect, acceptInvitation);

module.exports = router;