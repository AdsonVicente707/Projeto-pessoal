const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'https://i.pravatar.cc/150'
    },
    avatarPosX: {
      type: Number,
      default: 50
    },
    avatarPosY: {
      type: Number,
      default: 50
    },
    bannerUrl: {
      type: String,
      // Um banner padrão para novos usuários
      default: 'https://placehold.co/1200x400/EFEFEF/AAAAAA&text=Banner'
    },
    // Lista de IDs de usuários com quem este usuário está conectado (status 'accepted')
    connections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isSuspended: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true, // Cria campos createdAt e updatedAt automaticamente
  }
);

// Sobrescreve o método toJSON para remover a senha do objeto retornado
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Método para comparar a senha digitada com a senha criptografada no banco
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware: Antes de salvar, criptografa a senha se ela foi modificada
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;