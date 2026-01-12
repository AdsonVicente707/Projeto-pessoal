const express = require('express');
const router = express.Router();
const {
  createSpace,
  getMySpaces,
  getSpaceById,
  inviteUserToSpace,
  uploadPhotoToSpace,
  uploadAudioToSpace,
  getUserSpaces,
  leaveSpace,
} = require('../controllers/spaceController.js');
const { protect } = require('../middleware/authMiddleware.js');
const ensureUploadsDir = require('../middleware/ensureUploadsDir.js');

// Todas as rotas aqui são protegidas e precisam de um token válido
router.route('/').post(protect, createSpace).get(protect, getMySpaces);
router.route('/user/:userId').get(protect, getUserSpaces); // Mover para cima para evitar conflito com /:id
router.route('/:id').get(protect, getSpaceById);
router.route('/:id/invite').post(protect, inviteUserToSpace);
router.route('/:id/photos').post(protect, ensureUploadsDir, uploadPhotoToSpace);
router.route('/:id/audios').post(protect, ensureUploadsDir, uploadAudioToSpace);
router.route('/:id/leave').post(protect, leaveSpace);

module.exports = router;