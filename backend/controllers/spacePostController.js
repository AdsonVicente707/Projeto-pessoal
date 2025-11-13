const SpacePost = require('../models/spacePostModel');
const Space = require('../models/spaceModel');
const path = require('path');

/**
 * @desc    Buscar posts de um espaço
 * @route   GET /api/space-posts/:spaceId
 * @access  Private
 */
const getSpacePosts = async (req, res) => {
  const space = await Space.findById(req.params.spaceId);
  if (!space.members.includes(req.user._id)) {
    return res.status(403).send('Acesso negado.');
  }

  const posts = await SpacePost.find({ space: req.params.spaceId })
    .populate('author', 'name')
    .sort({ createdAt: -1 });

  res.json(posts);
};

/**
 * @desc    Criar um novo post em um espaço
 * @route   POST /api/space-posts/:spaceId
 * @access  Private
 */
const createSpacePost = async (req, res) => {
  const { text } = req.body;
  const spaceId = req.params.spaceId;

  const space = await Space.findById(spaceId);
  if (!space.members.includes(req.user._id)) {
    return res.status(403).send('Apenas membros podem postar.');
  }

  let imageUrl = null;

  if (req.files && req.files.photo) {
    const photo = req.files.photo;
    const uploadPath = path.join(
      __dirname,
      '..',
      'public',
      'uploads',
      `${Date.now()}_${photo.name}`
    );

    try {
      await photo.mv(uploadPath);
      imageUrl = `/uploads/${path.basename(uploadPath)}`;
    } catch (err) {
      console.error(err);
      return res.status(500).send(err);
    }
  }

  if (!text && !imageUrl) {
    return res.status(400).send('O post precisa de texto ou imagem.');
  }

  const post = await SpacePost.create({
    space: spaceId,
    author: req.user._id,
    text: text || '',
    imageUrl,
  });

  const createdPost = await SpacePost.findById(post._id).populate('author', 'name');

  res.status(201).json(createdPost);
};

module.exports = { getSpacePosts, createSpacePost };