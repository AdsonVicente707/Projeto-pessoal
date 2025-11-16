const Space = require('../models/spaceModel.js');
const User = require('../models/userModel.js');
const Invitation = require('../models/invitationModel.js');
const path = require('path');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Criar um novo espaço
 * @route   POST /api/spaces
 * @access  Private
 */
const createSpace = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('O nome do espaço é obrigatório.');
  }

  const space = new Space({
    name,
    creator: req.user._id,
    members: [req.user._id],
  });

  const createdSpace = await space.save();
  res.status(201).json(createdSpace);
});

/**
 * @desc    Buscar os espaços do usuário logado
 * @route   GET /api/spaces
 * @access  Private
 */
const getMySpaces = asyncHandler(async (req, res) => {
  const spaces = await Space.find({ members: req.user._id });
  res.json(spaces);
});

/**
 * @desc    Buscar detalhes de um espaço específico
 * @route   GET /api/spaces/:id
 * @access  Private
 */
const getSpaceById = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id).populate(
    'creator members',
    'name email'
  );

  if (space) {
    const isMember = space.members?.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (isMember) {
      res.json(space);
    } else {
      res.status(403);
      throw new Error('Acesso negado. Você não é membro deste espaço.');
    }
  } else {
    res.status(404);
    throw new Error('Espaço não encontrado.');
  }
});

/**
 * @desc    Convidar um usuário para um espaço
 * @route   POST /api/spaces/:id/invite
 * @access  Private
 */
const inviteUserToSpace = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const spaceId = req.params.id;

  const space = await Space.findById(spaceId);
  if (!space) {
    res.status(404);
    throw new Error('Espaço não encontrado.');
  }

  if (space.creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Apenas o criador do espaço pode convidar membros.');
  }

  const userToInvite = await User.findOne({ email });
  if (!userToInvite) {
    res.status(404);
    throw new Error('Usuário com este email não encontrado.');
  }

  if (space.members?.includes(userToInvite._id)) {
    res.status(400);
    throw new Error('Este usuário já é membro do espaço.');
  }

  const existingInvitation = await Invitation.findOne({ space: spaceId, to: userToInvite._id, status: 'pending' });
  if (existingInvitation) {
    res.status(400);
    throw new Error('Um convite já foi enviado para este usuário.');
  }

  const invitation = await Invitation.create({
    space: spaceId,
    from: req.user._id,
    to: userToInvite._id,
  });

  res.status(201).json(invitation);
});

/**
 * @desc    Fazer upload de uma foto para um espaço
 * @route   POST /api/spaces/:id/photos
 * @access  Private
 */
const uploadPhotoToSpace = asyncHandler(async (req, res) => {
  const spaceId = req.params.id;

  const space = await Space.findById(spaceId);
  if (!space) {
    res.status(404);
    throw new Error('Espaço não encontrado.');
  }

  const isMember = space.members?.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(403);
    throw new Error('Apenas membros podem adicionar fotos.');
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400);
    throw new Error('Nenhum arquivo foi enviado.');
  }

  const photo = req.files.photo;
  const uploadPath = path.join(__dirname, '..', 'public', 'uploads', `${Date.now()}_${photo.name}`);

  await photo.mv(uploadPath);

  // Constrói a URL completa da imagem
  const baseUrl = `${req.protocol}://${req.get('host')}`; // ex: http://localhost:5000
  const imagePath = `/uploads/${path.basename(uploadPath)}`;
  const publicUrl = `${baseUrl}${imagePath}`;

  space.photoUrls.push(publicUrl);
  const updatedSpace = await space.save();

  res.json(updatedSpace);
});

/**
 * @desc    Fazer upload de um áudio para um espaço
 * @route   POST /api/spaces/:id/audios
 * @access  Private
 */
const uploadAudioToSpace = asyncHandler(async (req, res) => {
  const spaceId = req.params.id;

  const space = await Space.findById(spaceId);
  if (!space) {
    res.status(404);
    throw new Error('Espaço não encontrado.');
  }

  const isMember = space.members?.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );
  if (!isMember) {
    res.status(403);
    throw new Error('Apenas membros podem adicionar áudios.');
  }

  if (!req.files || !req.files.audio) {
    res.status(400);
    throw new Error('Nenhum arquivo de áudio foi enviado.');
  }

  const audio = req.files.audio;
  const uploadPath = path.join(__dirname, '..', 'public', 'uploads', `${Date.now()}.webm`);

  await audio.mv(uploadPath);

  // Constrói a URL completa do áudio
  const baseUrl = `${req.protocol}://${req.get('host')}`; // ex: http://localhost:5000
  const audioPath = `/uploads/${path.basename(uploadPath)}`;
  const publicUrl = `${baseUrl}${audioPath}`;
  space.audioUrls.push(publicUrl);
  await space.save();

  res.json(space);
});

module.exports = {
  createSpace,
  getMySpaces,
  getSpaceById,
  inviteUserToSpace,
  uploadPhotoToSpace,
  uploadAudioToSpace,
};