const mongoose = require('mongoose');

const spaceSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Referência ao modelo User
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Referência ao modelo User
      },
    ],
    background: {
      type: String,
      default: '', // Pode ser uma URL de imagem ou um código HEX de cor
    },
    theme: {
      primaryColor: {
        type: String,
        default: '#3B82F6'
      },
      wallpaper: {
        type: String,
        default: ''
      }
    },
    events: [{
      title: String,
      date: Date,
      description: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    photoUrls: [{
      type: String
    }],
    audioUrls: [{
      type: String
    }],
  },
  {
    timestamps: true,
  }
);

const Space = mongoose.model('Space', spaceSchema);

module.exports = Space;