const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    space: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Space',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        maxlength: 500
    },
    coverPhoto: {
        type: String // URL da foto de capa
    },
    photos: [{
        url: String,
        caption: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Album', albumSchema);
