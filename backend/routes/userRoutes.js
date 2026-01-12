const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUserConnections,
  getUserById,
  updateUserProfilePicture,
  updateUserBanner,
  getUserProfileInfo,
  getPrivateMemories,
  updateAvatarPosition
} = require('../controllers/userController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Rota para registrar um novo usuário
router.post('/register', registerUser);
// Rota para fazer login
router.post('/login', loginUser);
// Rota para obter o perfil do usuário (protegida)
router.get('/profile', protect, getUserProfile);
// Rota para obter a lista de conexões de um usuário (protegida)
router.get('/:id/connections', protect, getUserConnections);
// Rota para obter um usuário pelo ID (protegida)
router.get('/:id', protect, getUserById);
// Rota para atualizar a foto de perfil (protegida)
router.put('/profile/picture', protect, updateUserProfilePicture);
// Rota para atualizar o banner do perfil (protegida)
router.put('/profile/banner', protect, updateUserBanner);
// Novas rotas para perfil avançado
router.get('/:id/profile-info', protect, getUserProfileInfo);
router.get('/:id/private-memories', protect, getPrivateMemories);
// Rota para atualizar a posição do avatar
router.put('/profile/position', protect, updateAvatarPosition);

module.exports = router;