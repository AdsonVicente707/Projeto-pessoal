const mongoose = require('mongoose');

const ConnectionSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  isFamily: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Garante que não haja pedidos duplicados entre as mesmas duas pessoas
ConnectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Middleware para impedir a criação de uma conexão duplicada em qualquer direção
ConnectionSchema.pre('save', async function (next) {
  if (this.isNew) {
    const Connection = this.constructor;
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: this.requester, recipient: this.recipient },
        { requester: this.recipient, recipient: this.requester },
      ],
    });

    if (existingConnection) {
      return next(new Error('Connection request already exists between these users.'));
    }
  }
  next();
});

module.exports = mongoose.model('Connection', ConnectionSchema);