const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      required: true,
      validate: [
        (val) => val.length === 2,
        'A conversa deve ter exatamente dois participantes.',
      ],
    },
  },
  { timestamps: true }
);

// Para garantir que a ordem dos participantes não crie duplicatas,
// vamos ordenar os IDs antes de salvar. Isso garante que [userA, userB] e [userB, userA] sejam tratados como iguais.
conversationSchema.pre('save', function (next) {
  if (this.isNew) {
    this.participants.sort();
  }
  next();
});

// Depois de ordenar, um índice único no campo de participantes impede a criação de conversas duplicadas.
conversationSchema.index({ participants: 1 }, { unique: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;