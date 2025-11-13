const express = require('express');
const router = express.Router();
const {
  createSpace,
  getMySpaces,
  getSpaceById,
  inviteUserToSpace,
  uploadPhotoToSpace,
  uploadAudioToSpace,
} = require('../controllers/spaceController.js');
const { protect } = require('../middleware/authMiddleware.js');

// Todas as rotas aqui são protegidas e precisam de um token válido
router.route('/').post(protect, createSpace).get(protect, getMySpaces);
router.route('/:id').get(protect, getSpaceById);
router.route('/:id/invite').post(protect, inviteUserToSpace);
router.route('/:id/photos').post(protect, uploadPhotoToSpace);
router.route('/:id/audios').post(protect, uploadAudioToSpace);

module.exports = router;