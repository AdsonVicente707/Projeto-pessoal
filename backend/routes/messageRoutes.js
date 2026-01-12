const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/authMiddleware');
const {
  getConversations,
  getMessages,
  sendMessage,
} = require('../controllers/messageController.js');
const ensureUploadsDir = require('../middleware/ensureUploadsDir.js');

// Rota para buscar todas as conversas do usuário logado
router.route('/').get(auth, getConversations);

// Rotas para buscar mensagens e enviar uma nova mensagem para um usuário específico
router.route('/:otherUserId').get(auth, getMessages).post(auth, ensureUploadsDir, sendMessage);

module.exports = router;