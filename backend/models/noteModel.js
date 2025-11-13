const mongoose = require('mongoose');

const noteSchema = mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Space',
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;