const Post = require('../models/postModel');
const path = require('path');

/**
 * @desc    Buscar todos os posts
 * @route   GET /api/posts
 * @access  Private
 */
const getPosts = async (req, res) => {
  const posts = await Post.find({})
    .populate('author', 'name')
    .sort({ createdAt: -1 });
  res.json(posts);
};

/**
 * @desc    Criar um novo post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = async (req, res) => {
  const { text } = req.body;
  let imageUrl = null;

  if (req.files && req.files.photo) {
    const photo = req.files.photo;
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', `${Date.now()}_${photo.name}`);
    await photo.mv(uploadPath);
    imageUrl = `/uploads/${path.basename(uploadPath)}`;
  }

  if (!text && !imageUrl) {
    return res.status(400).send('O post precisa de texto ou imagem.');
  }

  const post = await Post.create({
    author: req.user._id,
    text: text || '',
    imageUrl,
  });

  const createdPost = await Post.findById(post._id).populate('author', 'name');
  res.status(201).json(createdPost);
};

/**
 * @desc    Curtir/Descurtir um post
 * @route   PUT /api/posts/:id/like
 * @access  Private
 */
const likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).send('Post não encontrado');
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
};

/**
 * @desc    Comentar em um post
 * @route   POST /api/posts/:id/comments
 * @access  Private
 */
const createPostComment = async (req, res) => {
  const { text } = req.body;
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).send('Post não encontrado');
  }

  if (!text) {
    return res.status(400).send('O comentário não pode estar vazio');
  }

  const comment = {
    text,
    author: req.user._id,
  };

  post.comments.push(comment);
  await post.save();
  res.status(201).json({ message: 'Comentário adicionado' });
};

module.exports = { getPosts, createPost, likePost, createPostComment };