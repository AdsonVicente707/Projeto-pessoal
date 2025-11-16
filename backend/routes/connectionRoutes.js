const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/authMiddleware'); // Corrigido: Extrai a função 'protect' e a renomeia para 'auth'
const User = require('../models/userModel');
const Connection = require('../models/Connection');
const Notification = require('../models/Notification');

// @route   GET api/connections/search
// @desc    Pesquisar usuários por nome
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no Servidor');
  }
});

// @route   POST api/connections/request/:recipientId
// @desc    Enviar um pedido de conexão
// @access  Private
router.post('/request/:recipientId', auth, async (req, res) => {
  try {
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
      return res.status(400).json({ msg: 'Já existe um pedido de conexão ou uma conexão estabelecida.' });
    }

    const newConnection = new Connection({
      requester: requesterId,
      recipient: recipientId,
    });

    await newConnection.save();
    res.json({ msg: 'Pedido de conexão enviado.' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no Servidor');
  }
});

// @route   GET api/connections/pending
// @desc    Ver pedidos de conexão pendentes
// @access  Private
router.get('/pending', auth, async (req, res) => {
  try {
    const pendingRequests = await Connection.find({
      recipient: req.user.id,
      status: 'pending',
    }).populate('requester', 'name avatar'); // Popula com dados do remetente

    res.json(pendingRequests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no Servidor');
  }
});

// @route   POST api/connections/:requestId/respond
// @desc    Aceitar ou recusar um pedido
// @access  Private
router.post('/:requestId/respond', auth, async (req, res) => {
  const { response } = req.body; // 'accept' ou 'decline'

  try {
    const request = await Connection.findById(req.params.requestId);

    if (!request || request.recipient.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Pedido não encontrado ou não autorizado.' });
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
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erro no Servidor');
  }
});

module.exports = router;