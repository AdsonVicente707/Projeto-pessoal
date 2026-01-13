const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation.js');
const Message = require('../models/Message.js');
const User = require('../models/userModel.js');
const path = require('path');

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
    select: 'name avatar lastSeen',
    // Filtra o próprio usuário da lista de participantes para mostrar apenas o outro
    match: { _id: { $ne: req.user._id } },
  }).sort({ updatedAt: -1 }); // Ordena pela conversa mais recente

  // O populate com 'match' retorna um array com um único participante (o outro).
  // Vamos reformatar para ser mais fácil de usar no frontend.
  const formattedConversations = await Promise.all(conversations.map(async conv => {
    const participant = conv.participants[0];
    if (!participant) return null;

    // Busca a última mensagem desta conversa
    const lastMessage = await Message.findOne({
      $or: [
        { sender: req.user._id, recipient: participant._id },
        { sender: participant._id, recipient: req.user._id }
      ]
    }).sort({ createdAt: -1 });

    return {
      _id: conv._id,
      participant: participant,
      updatedAt: conv.updatedAt,
      lastMessage: lastMessage
    };
  }));

  // Filtra nulos (caso haja inconsistência de dados)
  res.json(formattedConversations.filter(c => c !== null));
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

  // Marcar mensagens não lidas do outro usuário como lidas
  await Message.updateMany(
    { sender: otherUserId, recipient: currentUserId, read: false },
    { read: true, readAt: Date.now() }
  );

  // Notificar o remetente que as mensagens foram lidas
  const io = req.app.get('socketio');
  io.to(otherUserId).emit('messages_read', { byUserId: currentUserId });

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
  console.log(`Recebendo mensagem de ${senderId} para ${otherUserId}. Body:`, req.body);

  let imageUrl = null;
  let fileUrl = null;
  let fileName = null;

  if (req.files && req.files.photo) {
    const photo = req.files.photo;
    // Salva fora da pasta public para evitar reload do frontend
    const uploadPath = path.join(__dirname, '..', 'uploads', `${Date.now()}_${photo.name}`);
    
    try {
      await photo.mv(uploadPath);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/${path.basename(uploadPath)}`;
    } catch (error) {
      res.status(500);
      throw new Error('Falha no upload da imagem.');
    }
  }

  if (req.files && req.files.file) {
    const file = req.files.file;
    // Salva fora da pasta public para evitar reload do frontend
    const uploadPath = path.join(__dirname, '..', 'uploads', `${Date.now()}_${file.name}`);
    
    try {
      await file.mv(uploadPath);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      fileUrl = `${baseUrl}/uploads/${path.basename(uploadPath)}`;
      fileName = file.name;
    } catch (error) {
      res.status(500);
      throw new Error('Falha no upload do arquivo.');
    }
  }

  if (!body && !imageUrl && !fileUrl) {
    res.status(400);
    throw new Error('A mensagem deve conter texto ou imagem.');
  }

  // Busca conversa existente independente da ordem dos participantes
  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, otherUserId] }
  });

  if (conversation) {
    // Se existir, atualiza o timestamp para subir na lista
    conversation.updatedAt = Date.now();
    await conversation.save();
  } else {
    // Se não existir, cria uma nova. O hook pre-save do model ordena automaticamente.
    conversation = await Conversation.create({
      participants: [senderId, otherUserId]
    });
  }

  const newMessage = await Message.create({
    sender: senderId,
    recipient: otherUserId,
    body,
    imageUrl,
    fileUrl,
    fileName,
    read: false
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