const mongoose = require('mongoose');

const spaceMessageSchema = mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Space',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    message: { type: String },
    imageUrl: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SpaceMessage', spaceMessageSchema);