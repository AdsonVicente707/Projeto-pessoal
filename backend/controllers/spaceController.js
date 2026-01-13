const Space = require('../models/spaceModel.js');
const User = require('../models/userModel.js');
const Invitation = require('../models/invitationModel.js');
const path = require('path');
const asyncHandler = require('express-async-handler');
const SpaceMessage = require('../models/SpaceMessage.js');

/**
 * @desc    Criar um novo espaço
 * @route   POST /api/spaces
 * @access  Private
 */
const createSpace = asyncHandler(async (req, res) => {
  const { name, color } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('O nome do espaço é obrigatório.');
  }

  const space = new Space({
    name,
    creator: req.user._id,
    members: [req.user._id],
    background: color || '' // Salva a cor se enviada
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
  const uploadPath = path.join(__dirname, '..', 'uploads', `${Date.now()}_${photo.name}`);

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
  const uploadPath = path.join(__dirname, '..', 'uploads', `${Date.now()}.webm`);

  await audio.mv(uploadPath);

  // Constrói a URL completa do áudio
  const baseUrl = `${req.protocol}://${req.get('host')}`; // ex: http://localhost:5000
  const audioPath = `/uploads/${path.basename(uploadPath)}`;
  const publicUrl = `${baseUrl}${audioPath}`;
  space.audioUrls.push(publicUrl);
  await space.save();

  res.json(space);
});

/**
 * @desc    Buscar espaços onde o usuário é membro (criados ou adicionados)
 * @route   GET /api/spaces/user/:userId
 * @access  Private
 */
const getUserSpaces = asyncHandler(async (req, res) => {
  const spaces = await Space.find({ members: req.params.userId });
  res.json(spaces);
});

/**
 * @desc    Sair de um espaço
 * @route   POST /api/spaces/:id/leave
 * @access  Private
 */
const leaveSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);

  if (!space) {
    res.status(404);
    throw new Error('Espaço não encontrado.');
  }

  // Verifica se o usuário é membro
  if (!space.members.includes(req.user._id)) {
    res.status(400);
    throw new Error('Você não é membro deste espaço.');
  }

  // Impede que o criador saia (ele deve deletar o espaço ou transferir)
  if (space.creator.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('O criador não pode sair do espaço. Delete-o se desejar.');
  }

  // Remove o usuário da lista de membros
  space.members = space.members.filter(
    (memberId) => memberId.toString() !== req.user._id.toString()
  );

  await space.save();
  res.json({ message: 'Você saiu do espaço.' });
});

/**
 * @desc    Atualizar configurações do espaço (Nome, Fundo)
 * @route   PUT /api/spaces/:id
 * @access  Private
 */
const updateSpaceSettings = asyncHandler(async (req, res) => {
  const spaceId = req.params.id;
  const { name, color } = req.body;
  
  const space = await Space.findById(spaceId);
  if (!space) {
    res.status(404);
    throw new Error('Espaço não encontrado.');
  }

  // Verifica se é o criador
  if (space.creator.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Apenas o criador pode editar as configurações do espaço.');
  }

  if (name) space.name = name;

  // Lógica de Fundo: Prioriza Imagem, senão usa Cor
  if (req.files && req.files.background) {
    const file = req.files.background;
    const uploadPath = path.join(__dirname, '..', 'uploads', `${Date.now()}_${file.name}`);
    await file.mv(uploadPath);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    space.background = `${baseUrl}/uploads/${path.basename(uploadPath)}`;
  } else if (color) {
    space.background = color;
  }

  const updatedSpace = await space.save();
  res.json(updatedSpace);
});

/**
 * @desc    Buscar mensagens do chat do espaço
 * @route   GET /api/spaces/:id/messages
 * @access  Private
 */
const getSpaceMessages = asyncHandler(async (req, res) => {
  const messages = await SpaceMessage.find({ space: req.params.id })
    .populate('sender', 'name avatar')
    .sort({ createdAt: 1 }); // Ordem cronológica (antigas primeiro)

  res.json(messages);
});

/**
 * @desc    Enviar mensagem no chat do espaço
 * @route   POST /api/spaces/:id/messages
 * @access  Private
 */
const sendSpaceMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const spaceId = req.params.id;
  const senderId = req.user._id;

  let imageUrl = null;
  let fileUrl = null;
  let fileName = null;

  if (req.files && req.files.photo) {
    const photo = req.files.photo;
    const uploadPath = path.join(__dirname, '..', 'uploads', `${Date.now()}_${photo.name}`);
    await photo.mv(uploadPath);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    imageUrl = `${baseUrl}/uploads/${path.basename(uploadPath)}`;
  }

  if (req.files && req.files.file) {
    const file = req.files.file;
    const uploadPath = path.join(__dirname, '..', 'uploads', `${Date.now()}_${file.name}`);
    await file.mv(uploadPath);
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    fileUrl = `${baseUrl}/uploads/${path.basename(uploadPath)}`;
    fileName = file.name;
  }

  if (!message && !imageUrl && !fileUrl) {
    res.status(400);
    throw new Error('A mensagem deve conter texto ou arquivo.');
  }

  const newMessage = await SpaceMessage.create({
    space: spaceId,
    sender: senderId,
    message,
    imageUrl,
    fileUrl,
    fileName
  });

  const populatedMessage = await newMessage.populate('sender', 'name avatar');
  
  const io = req.app.get('socketio');
  io.to(spaceId).emit('newChatMessage', { message: populatedMessage.message, user: populatedMessage.sender, fullMessage: populatedMessage });

  res.status(201).json(populatedMessage);
});

/**
 * @desc    Excluir um espaço
 * @route   DELETE /api/spaces/:id
 * @access  Private
 */
const deleteSpace = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.id);

  if (!space) {
    res.status(404);
    throw new Error('Espaço não encontrado.');
  }

  if (space.creator.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Não autorizado. Apenas o criador pode excluir o espaço.');
  }

  await space.deleteOne();
  res.json({ id: req.params.id, message: 'Espaço removido com sucesso.' });
});

module.exports = {
  createSpace,
  getMySpaces,
  getSpaceById,
  inviteUserToSpace,
  uploadPhotoToSpace,
  uploadAudioToSpace,
  getUserSpaces,
  leaveSpace,
  updateSpaceSettings,
  getSpaceMessages,
  deleteSpace,
  sendSpaceMessage,
};