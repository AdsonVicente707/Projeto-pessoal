const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/userController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Rota para registrar um novo usuário
router.post('/register', registerUser);
// Rota para fazer login
router.post('/login', loginUser);
// Rota para obter o perfil do usuário (protegida)
router.get('/profile', protect, getUserProfile);

module.exports = router;