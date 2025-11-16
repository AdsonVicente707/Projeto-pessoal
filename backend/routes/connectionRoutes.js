const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');

// @route   GET api/connections/search
// @desc    Pesquisar usuários por nome
// @access  Private
router.get('/search', auth, asyncHandler(async (req, res) => {
  const searchQuery = req.query.name || '';
  const currentUserId = req.user.id;

  // 1. Encontra usuários que correspondem à busca
  const users = await User.find({
    name: { $regex: searchQuery, $options: 'i' },
    _id: { $ne: currentUserId }
  }).select('name avatar connections').lean(); // .lean() para objetos JS puros

  // 2. Encontra todas as conexões pendentes envolvendo o usuário atual
  const pendingConnections = await Connection.find({
    status: 'pending',
    $or: [{ requester: currentUserId }, { recipient: currentUserId }]
  }).lean();

  // 3. Mapeia os resultados para adicionar o status da conexão
  const results = users.map(user => {
    let status = 'none';
    const userIdStr = user._id.toString();

    // Verifica se já estão conectados
    if (user.connections.some(connId => connId.toString() === currentUserId)) {
      status = 'connected';
    } else {
      // Verifica se há um pedido pendente
      const pending = pendingConnections.find(p => p.requester.toString() === userIdStr || p.recipient.toString() === userIdStr);
      if (pending) {
        // Verifica quem enviou o pedido
        status = pending.requester.toString() === currentUserId ? 'pending_sent' : 'pending_received';
      }
    }
    
    // Remove o campo 'connections' da resposta final para não expor dados desnecessários
    delete user.connections;
    return { ...user, status };
  });

  res.json(results);
}));

// @route   POST api/connections/request/:recipientId
// @desc    Enviar um pedido de conexão
// @access  Private
router.post('/request/:recipientId', auth, asyncHandler(async (req, res) => {
  const requesterId = req.user.id;
  const { recipientId } = req.params;

  // Verifica se já existe uma conexão ou pedido entre os dois
  const existingConnection = await Connection.findOne({
    $or: [
      { requester: requesterId, recipient: recipientId },
      { requester: recipientId, recipient: requesterId },
    ],
  });

  if (existingConnection) {
    res.status(400);
    throw new Error('Já existe um pedido de conexão ou uma conexão estabelecida.');
  }

  const newConnection = new Connection({
    requester: requesterId,
    recipient: recipientId,
  });

  await newConnection.save();

  // Cria e salva a notificação para o destinatário
  const notification = new Notification({
    recipient: recipientId,
    sender: requesterId,
    type: 'new_connection_request',
    link: `/profile/${requesterId}` // Link para o perfil de quem enviou o pedido
  });
  await notification.save();

  // Emite o evento em tempo real para o destinatário
  const io = req.app.get('socketio');
  const populatedNotification = await notification.populate('sender', 'name avatar');
  io.to(recipientId.toString()).emit('new_notification', populatedNotification);

  res.json({ msg: 'Pedido de conexão enviado.' });
}));

// @route   GET api/connections/pending
// @desc    Ver pedidos de conexão pendentes
// @access  Private
router.get('/pending', auth, asyncHandler(async (req, res) => {
  const pendingRequests = await Connection.find({
    recipient: req.user.id,
    status: 'pending',
  }).populate('requester', 'name avatar'); // Popula com dados do remetente

  res.json(pendingRequests);
}));

// @route   POST api/connections/:requestId/respond
// @desc    Aceitar ou recusar um pedido
// @access  Private
router.post('/:requestId/respond', auth, asyncHandler(async (req, res) => {
  const { response } = req.body; // 'accept' ou 'decline'
  const request = await Connection.findById(req.params.requestId);

  if (!request || request.recipient.toString() !== req.user.id) {
    res.status(404);
    throw new Error('Pedido não encontrado ou não autorizado.');
  }

  if (response === 'accept') {
    request.status = 'accepted';
    // Adiciona um ao outro na lista de conexões
    await User.findByIdAndUpdate(request.requester, { $addToSet: { connections: request.recipient } });
    await User.findByIdAndUpdate(request.recipient, { $addToSet: { connections: request.requester } });
    await request.save();

    // Cria e emite a notificação em tempo real
    const notification = new Notification({
      recipient: request.requester,
      sender: request.recipient,
      type: 'connection_accepted',
      link: `/profile/${request.recipient}` // Link para o perfil de quem aceitou
    });
    await notification.save();

    // Emite o evento para o usuário que originalmente enviou o pedido
    const io = req.app.get('socketio'); // Pega a instância do socket.io
    io.to(request.requester.toString()).emit('new_notification', notification);

    res.json({ msg: 'Conexão aceita.' });
  } else { // decline
    await Connection.findByIdAndDelete(req.params.requestId);
    res.json({ msg: 'Conexão recusada.' });
  }
}));

module.exports = router;