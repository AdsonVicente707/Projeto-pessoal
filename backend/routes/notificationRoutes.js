const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');
const asyncHandler = require('express-async-handler');

// @route   GET api/notifications
// @desc    Buscar todas as notificações do usuário logado
// @access  Private
router.get('/', auth, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(notifications);
}));

// @route   POST api/notifications/read
// @desc    Marcar todas as notificações como lidas
// @access  Private
router.post('/read', auth, asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { $set: { read: true } }
  );

  res.json({ msg: 'Notificações marcadas como lidas.' });
}));

module.exports = router;