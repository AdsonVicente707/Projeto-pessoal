const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation.js');
const Message = require('../models/Message.js');
const User = require('../models/userModel.js');

/**
 * @desc    Buscar todas as conversas do usuário
 * @route   GET /api/messages
 * @access  Private
 */
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  }).populate({
    path: 'participants',
    select: 'name avatar',
    // Filtra o próprio usuário da lista de participantes para mostrar apenas o outro
    match: { _id: { $ne: req.user._id } },
  });

  // O populate com 'match' retorna um array com um único participante (o outro).
  // Vamos reformatar para ser mais fácil de usar no frontend.
  const formattedConversations = conversations.map(conv => {
    return {
      _id: conv._id,
      participant: conv.participants[0],
      updatedAt: conv.updatedAt
    };
  });

  res.json(formattedConversations);
});

/**
 * @desc    Buscar mensagens de uma conversa
 * @route   GET /api/messages/:otherUserId
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const { otherUserId } = req.params;
  const currentUserId = req.user._id;

  // Parâmetros de paginação
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20; // Carrega 20 mensagens por padrão
  const skip = (page - 1) * limit;

  // Encontra a conversa entre os dois usuários
  const conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId] },
  });

  if (!conversation) {
    return res.json([]); // Retorna array vazio se não houver conversa
  }

  // Busca as mensagens trocadas entre os dois, com paginação
  const messages = await Message.find({
    $or: [
      { sender: currentUserId, recipient: otherUserId },
      { sender: otherUserId, recipient: currentUserId },
    ],
  }).sort({ createdAt: -1 }) // Ordena da mais nova para a mais antiga
    .skip(skip)
    .limit(limit);

  // Retorna as mensagens na ordem cronológica (mais antiga para mais nova) para facilitar a exibição no frontend
  res.json(messages.reverse());
});

/**
 * @desc    Enviar uma mensagem
 * @route   POST /api/messages/:otherUserId
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { body } = req.body;
  const { otherUserId } = req.params;
  const senderId = req.user._id;

  if (!body) {
    res.status(400);
    throw new Error('O corpo da mensagem não pode estar vazio.');
  }

  // Encontra ou cria a conversa. O 'upsert' garante que se não existir, será criada.
  // O hook 'pre-save' no modelo Conversation lida com a ordenação e unicidade.
  // Também atualizamos o timestamp para que a conversa apareça no topo da lista.
  const conversation = await Conversation.findOneAndUpdate(
    { participants: { $all: [senderId, otherUserId] } },
    { $set: { participants: [senderId, otherUserId] } }, // Garante que os participantes estão corretos e aciona a atualização
    { upsert: true, new: true }
  );

  const newMessage = await Message.create({
    sender: senderId,
    recipient: otherUserId,
    body,
  });

  // Popula a mensagem com os dados do remetente para enviar via socket
  const populatedMessage = await newMessage.populate('sender', 'name avatar');

  // Pega a instância do Socket.IO
  const io = req.app.get('socketio');

  // Emite o evento 'new_message' para a sala privada do destinatário
  io.to(otherUserId.toString()).emit('new_message', populatedMessage);

  // Retorna a mensagem criada para o remetente original
  res.status(201).json(populatedMessage);
});

module.exports = { getConversations, getMessages, sendMessage };