const User = require('../models/userModel.js');
const generateToken = require('../utils/generateToken.js');

/**
 * @desc    Registra um novo usuário
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('Usuário já existe');
  }

  const user = await User.create({
    name,
    email,
    password, // A senha será criptografada pelo middleware no userModel
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
    throw new Error('Dados de usuário inválidos');
  }
};

/**
 * @desc    Autentica o usuário & obtém o token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res) => {
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
    throw new Error('Email ou senha inválidos');
  }
};

/**
 * @desc    Obtém o perfil do usuário logado
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  // req.user é preenchido pelo middleware 'protect'
  const user = await User.findById(req.user._id);
  res.json(user);
};

module.exports = { registerUser, loginUser, getUserProfile };