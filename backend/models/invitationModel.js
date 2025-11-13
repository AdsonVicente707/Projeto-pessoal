const mongoose = require('mongoose');

const invitationSchema = mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Space',
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;