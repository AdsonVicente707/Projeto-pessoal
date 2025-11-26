const User = require('../models/userModel.js');
const generateToken = require('../utils/generateToken.js');
const path = require('path');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Registra um novo usuário
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validação de entrada
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Por favor, preencha todos os campos.');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Usuário com este email já existe.');
  }

  const user = await User.create({
    name,
    email,
    password, // A senha será criptografada pelo hook 'pre-save' no userModel
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Dados de usuário inválidos.');
  }
});

/**
 * @desc    Autentica o usuário e obtém o token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401); // 401 Unauthorized
    throw new Error('Email ou senha inválidos.');
  }
});

/**
 * @desc    Obtém o perfil do usuário logado
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user é preenchido pelo middleware 'protect'
  const user = await User.findById(req.user._id).select('-password'); // Exclui a senha da resposta

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado.');
  }
});

/**
 * @desc    Obtém as conexões (amigos) de um usuário
 * @route   GET /api/users/:id/connections
 * @access  Private
 */
const getUserConnections = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate(
    'connections',
    'name avatar'
  );

  if (user) {
    res.json(user.connections);
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado.');
  }
});

/**
 * @desc    Obtém um usuário pelo ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuário não encontrado.');
  }
});

/**
 * @desc    Atualiza a foto de perfil do usuário
 * @route   PUT /api/users/profile/picture
 * @access  Private
 */
const updateUserProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Usuário não encontrado.');
  }

  if (!req.files || !req.files.photo) {
    res.status(400);
    throw new Error('Nenhuma imagem foi enviada.');
  }

  const photo = req.files.photo;
  const uploadPath = path.join(
    __dirname,
    '..',
    'public',
    'uploads',
    `${user._id}_${Date.now()}_${photo.name}`
  );

  try {
    await photo.mv(uploadPath);
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error('Falha ao salvar o arquivo no servidor.');
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  user.avatar = `${baseUrl}/uploads/${path.basename(uploadPath)}`;

  const updatedUser = await user.save();
  res.json(updatedUser);
});

/**
 * @desc    Atualiza o banner do perfil do usuário
 * @route   PUT /api/users/profile/banner
 * @access  Private
 */
const updateUserBanner = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Usuário não encontrado.');
  }

  if (!req.files || !req.files.banner) {
    res.status(400);
    throw new Error('Nenhuma imagem de banner foi enviada.');
  }

  const bannerImage = req.files.banner;
  const uploadPath = path.join(
    __dirname,
    '..',
    'public',
    'uploads',
    `${user._id}_${Date.now()}_${bannerImage.name}`
  );

  try {
    await bannerImage.mv(uploadPath);
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error('Falha ao salvar o arquivo no servidor.');
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  user.bannerUrl = `${baseUrl}/uploads/${path.basename(uploadPath)}`;

  const updatedUser = await user.save();
  res.json(updatedUser);
});

module.exports = { registerUser, loginUser, getUserProfile, getUserConnections, getUserById, updateUserProfilePicture, updateUserBanner };