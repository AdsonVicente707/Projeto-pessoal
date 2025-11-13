const Space = require('../models/spaceModel.js');
const User = require('../models/userModel.js');
const Invitation = require('../models/invitationModel.js');
const path = require('path');

/**
 * @desc    Criar um novo espaço
 * @route   POST /api/spaces
 * @access  Private
 */
const createSpace = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400).send('O nome do espaço é obrigatório');
    return;
  }

  const space = new Space({
    name,
    creator: req.user._id,
    members: [req.user._id], // O criador é automaticamente um membro
  });

  const createdSpace = await space.save();
  res.status(201).json(createdSpace);
};

/**
 * @desc    Buscar os espaços do usuário logado
 * @route   GET /api/spaces
 * @access  Private
 */
const getMySpaces = async (req, res) => {
  const spaces = await Space.find({ members: req.user._id });
  res.json(spaces);
};

/**
 * @desc    Buscar detalhes de um espaço específico
 * @route   GET /api/spaces/:id
 * @access  Private
 */
const getSpaceById = async (req, res) => {
  const space = await Space.findById(req.params.id).populate(
    'creator members',
    'name email'
  );

  if (space) {
    // Verifica se o usuário logado é membro do espaço
    const isMember = space.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (isMember) {
      res.json(space);
    } else {
      res.status(403).send('Acesso negado. Você não é membro deste espaço.');
    }
  } else {
    res.status(404).send('Espaço não encontrado');
  }
};

/**
 * @desc    Convidar um usuário para um espaço
 * @route   POST /api/spaces/:id/invite
 * @access  Private
 */
const inviteUserToSpace = async (req, res) => {
  const { email } = req.body;
  const spaceId = req.params.id;

  const space = await Space.findById(spaceId);
  if (!space) {
    return res.status(404).send('Espaço não encontrado');
  }

  // Apenas o criador pode convidar
  if (space.creator.toString() !== req.user._id.toString()) {
    return res.status(403).send('Apenas o criador do espaço pode convidar membros.');
  }

  const userToInvite = await User.findOne({ email });
  if (!userToInvite) {
    return res.status(404).send('Usuário com este email não encontrado.');
  }

  // Verifica se o usuário já é membro
  if (space.members.includes(userToInvite._id)) {
    return res.status(400).send('Este usuário já é membro do espaço.');
  }

  // Verifica se já existe um convite pendente
  const existingInvitation = await Invitation.findOne({ space: spaceId, to: userToInvite._id, status: 'pending' });
  if (existingInvitation) {
    return res.status(400).send('Um convite já foi enviado para este usuário.');
  }

  const invitation = await Invitation.create({
    space: spaceId,
    from: req.user._id,
    to: userToInvite._id,
  });

  res.status(201).json(invitation);
};

/**
 * @desc    Fazer upload de uma foto para um espaço
 * @route   POST /api/spaces/:id/photos
 * @access  Private
 */
const uploadPhotoToSpace = async (req, res) => {
  const spaceId = req.params.id;

  const space = await Space.findById(spaceId);
  if (!space) {
    return res.status(404).send('Espaço não encontrado');
  }

  // Verifica se o usuário é membro para poder fazer upload
  const isMember = space.members.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );
  if (!isMember) {
    return res.status(403).send('Apenas membros podem adicionar fotos.');
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  const photo = req.files.photo; // 'photo' deve ser o nome do campo no formulário
  const uploadPath = path.join(__dirname, '..', 'public', 'uploads', `${Date.now()}_${photo.name}`);

  // Move o arquivo para a pasta de uploads
  photo.mv(uploadPath, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    // Constrói a URL pública da imagem
    const publicUrl = `/uploads/${path.basename(uploadPath)}`;

    // Adiciona a URL ao array de fotos do espaço
    space.photoUrls.push(publicUrl);
    const updatedSpace = await space.save();

    res.json(updatedSpace);
  });
};

/**
 * @desc    Fazer upload de um áudio para um espaço
 * @route   POST /api/spaces/:id/audios
 * @access  Private
 */
const uploadAudioToSpace = async (req, res) => {
  const spaceId = req.params.id;

  const space = await Space.findById(spaceId);
  if (!space) {
    return res.status(404).send('Espaço não encontrado');
  }

  const isMember = space.members.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );
  if (!isMember) {
    return res.status(403).send('Apenas membros podem adicionar áudios.');
  }

  if (!req.files || !req.files.audio) {
    return res.status(400).send('Nenhum arquivo de áudio foi enviado.');
  }

  const audio = req.files.audio;
  const uploadPath = path.join(__dirname, '..', 'public', 'uploads', `${Date.now()}.webm`);

  audio.mv(uploadPath, async (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    const publicUrl = `/uploads/${path.basename(uploadPath)}`;
    space.audioUrls.push(publicUrl);
    await space.save();

    res.json(space);
  });
};

module.exports = {
  createSpace,
  getMySpaces,
  getSpaceById,
  inviteUserToSpace,
  uploadPhotoToSpace,
  uploadAudioToSpace,
};