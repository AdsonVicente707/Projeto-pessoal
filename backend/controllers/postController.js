const Post = require('../models/postModel');
const path = require('path');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Buscar todos os posts
 * @route   GET /api/posts
 * @access  Private
 */
const getPosts = asyncHandler(async (req, res) => {
  // Cria um array com o ID do usuário logado e os IDs de suas conexões.
  const authorsToFetch = [req.user._id, ...req.user.connections];

  // Busca posts onde o autor esteja na lista de 'authorsToFetch'.
  const posts = await Post.find({ author: { $in: authorsToFetch } })
    .populate('author', 'name avatar') // Popula o autor com nome e avatar
    .sort({ createdAt: -1 });

  res.json(posts);
});

/**
 * @desc    Criar um novo post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = asyncHandler(async (req, res) => {
  const { text } = req.body;
  let imageUrl = null;

  if (req.files && req.files.photo) {
    const photo = req.files.photo;
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', `${Date.now()}_${photo.name}`);
    try {
      await photo.mv(uploadPath);
      // Constrói a URL completa da imagem
      const baseUrl = `${req.protocol}://${req.get('host')}`; // ex: http://localhost:5000
      const imagePath = `/uploads/${path.basename(uploadPath)}`;
      imageUrl = `${baseUrl}${imagePath}`;
    } catch (error) {
      console.error(error);
      res.status(500);
      throw new Error('Falha no upload da imagem.');
    }
  }

  if (!text && !imageUrl) {
    res.status(400);
    throw new Error('O post precisa de texto ou imagem.');
  }

  const post = await Post.create({
    author: req.user._id,
    text: text || '',
    imageUrl,
  });

  const createdPost = await Post.findById(post._id).populate('author', 'name');
  res.status(201).json(createdPost);
});

/**
 * @desc    Curtir/Descurtir um post
 * @route   PUT /api/posts/:id/like
 * @access  Private
 */
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post não encontrado.');
  }

  // Verifica se o post já foi curtido pelo usuário
  const alreadyLiked = post.likes.some(
    (like) => like.toString() === req.user._id.toString()
  );

  if (alreadyLiked) {
    // Descurtir
    post.likes = post.likes.filter(
      (like) => like.toString() !== req.user._id.toString()
    );
  } else {
    // Curtir
    post.likes.push(req.user._id);
  }

  await post.save();
  const updatedPost = await Post.findById(post._id).populate('author', 'name');
  res.json(updatedPost);
});

/**
 * @desc    Comentar em um post
 * @route   POST /api/posts/:id/comments
 * @access  Private
 */
const createPostComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post não encontrado.');
  }

  if (!text) {
    res.status(400);
    throw new Error('O comentário não pode estar vazio.');
  }

  const comment = {
    text,
    author: req.user._id,
  };

  post.comments.push(comment);
  await post.save();
  res.status(201).json({ message: 'Comentário adicionado.' });
});

module.exports = { getPosts, createPost, likePost, createPostComment };