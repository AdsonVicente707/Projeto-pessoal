const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    colors: {
        primary: {
            type: String,
            default: '#3B82F6'
        },
        secondary: {
            type: String,
            default: '#10B981'
        },
        accent: {
            type: String,
            default: '#F59E0B'
        },
        background: {
            type: String,
            default: '#F8FAFC'
        }
    },
    decorations: {
        headerIcon: {
            type: String,
            default: ''
        },
        particles: {
            type: Boolean,
            default: false
        },
        particleType: {
            type: String,
            enum: ['snow', 'confetti', 'hearts', 'flowers', 'bats', 'none'],
            default: 'none'
        }
    },
    customCSS: {
        type: String,
        default: ''
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Ensure only one theme is active at a time
themeSchema.pre('save', async function (next) {
    if (this.isActive) {
        await mongoose.model('Theme').updateMany(
            { _id: { $ne: this._id } },
            { isActive: false }
        );
    }
    next();
});

module.exports = mongoose.model('Theme', themeSchema);
