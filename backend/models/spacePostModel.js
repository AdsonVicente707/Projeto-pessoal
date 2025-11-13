const mongoose = require('mongoose');

const spacePostSchema = mongoose.Schema(
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
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const SpacePost = mongoose.model('SpacePost', spacePostSchema);

module.exports = SpacePost;