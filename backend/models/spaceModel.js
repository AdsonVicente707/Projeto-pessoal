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
  },
  {
    timestamps: true,
  }
);

const Space = mongoose.model('Space', spaceSchema);

module.exports = Space;