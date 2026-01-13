const SpacePost = require('../models/spacePostModel');
const Space = require('../models/spaceModel');
const path = require('path');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Buscar posts de um espaço
 * @route   GET /api/space-posts/:spaceId
 * @access  Private
 */
const getSpacePosts = asyncHandler(async (req, res) => {
  const space = await Space.findById(req.params.spaceId);
  if (!space?.members.includes(req.user._id)) {
    res.status(403);
    throw new Error('Acesso negado.');
  }

  const posts = await SpacePost.find({ space: req.params.spaceId })
    .populate('author', 'name avatar')
    .populate('comments.author', 'name avatar')
    .sort({ createdAt: -1 });

  res.json(posts);
});

/**
 * @desc    Criar um novo post em um espaço
 * @route   POST /api/space-posts/:spaceId
 * @access  Private
 */
const createSpacePost = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const spaceId = req.params.spaceId;

  const space = await Space.findById(spaceId);
  if (!space?.members.includes(req.user._id)) {
    res.status(403);
    throw new Error('Apenas membros podem postar.');
  }

  let imageUrl = null;

  if (req.files && req.files.photo) {
    const photo = req.files.photo;
    const uploadPath = path.join(
      __dirname,
      '..',
      'uploads',
      `${Date.now()}_${photo.name}`
    );

    try {
      await photo.mv(uploadPath);
      // Constrói a URL completa da imagem
      const baseUrl = `${req.protocol}://${req.get('host')}`; // ex: http://localhost:5000
      const imagePath = `/uploads/${path.basename(uploadPath)}`;
      imageUrl = `${baseUrl}${imagePath}`;
    } catch (error) {
      res.status(500);
      throw new Error('Falha no upload da imagem.');
    }
  }

  if (!text && !imageUrl) {
    res.status(400);
    throw new Error('O post precisa de texto ou imagem.');
  }

  const post = await SpacePost.create({
    space: spaceId,
    author: req.user._id,
    text: text || '',
    imageUrl,
  });

  const createdPost = await SpacePost.findById(post._id).populate('author', 'name avatar');

  res.status(201).json(createdPost);
});

const likeSpacePost = asyncHandler(async (req, res) => {
  const post = await SpacePost.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post não encontrado.');
  }

  const alreadyLiked = post.likes.some(
    (like) => like.toString() === req.user._id.toString()
  );

  if (alreadyLiked) {
    post.likes = post.likes.filter(
      (like) => like.toString() !== req.user._id.toString()
    );
  } else {
    post.likes.push(req.user._id);
  }

  await post.save();
  const updatedPost = await SpacePost.findById(post._id)
    .populate('author', 'name avatar')
    .populate('comments.author', 'name avatar');
  res.json(updatedPost);
});

const commentSpacePost = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const post = await SpacePost.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post não encontrado.');
  }
  if (!text) {
    res.status(400);
    throw new Error('Comentário vazio.');
  }

  const comment = {
    text,
    author: req.user._id,
  };
  post.comments.push(comment);
  await post.save();
  res.status(201).json({ message: 'Comentário adicionado' });
});

module.exports = { getSpacePosts, createSpacePost, likeSpacePost, commentSpacePost };