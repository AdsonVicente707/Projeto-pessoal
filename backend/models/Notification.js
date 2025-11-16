const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // O usuário que recebe a notificação
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // O usuário que iniciou a ação (ex: quem aceitou o pedido)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['connection_accepted', 'new_space_invite', 'new_connection_request'], // Pode ser expandido no futuro
  },
  read: {
    type: Boolean,
    default: false,
  },
  // Link opcional para onde a notificação deve levar (ex: perfil do usuário)
  link: {
    type: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);