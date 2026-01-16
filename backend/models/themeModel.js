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

    // Date Scheduling
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    autoActivate: {
        type: Boolean,
        default: false
    },

    // Colors
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
        },
        text: {
            type: String,
            default: '#1F2937'
        }
    },

    // Background Customization
    background: {
        type: {
            type: String,
            enum: ['color', 'gradient', 'image'],
            default: 'color'
        },
        value: {
            type: String,
            default: ''
        },
        opacity: {
            type: Number,
            default: 1,
            min: 0,
            max: 1
        }
    },

    // Fonts
    fonts: {
        primary: {
            type: String,
            default: 'Nunito'
        },
        secondary: {
            type: String,
            default: 'Nunito'
        }
    },

    // Visual Effects
    effects: {
        shadows: {
            type: Boolean,
            default: true
        },
        blur: {
            type: Number,
            default: 0,
            min: 0,
            max: 20
        },
        brightness: {
            type: Number,
            default: 100,
            min: 50,
            max: 150
        }
    },

    // Decorations
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

    // Theme Icon/Emoji
    icon: {
        type: String,
        default: '🎨'
    },

    customCSS: {
        type: String,
        default: ''
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
