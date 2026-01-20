const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const User = require('../models/userModel');
const Theme = require('../models/themeModel');
const Post = require('../models/postModel');
const Space = require('../models/spaceModel');

// All routes require authentication and admin role
router.use(protect);
router.use(adminMiddleware);

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
router.get('/stats', async (req, res) => {
    try {
        console.log('📊 Admin Stats Request - User:', req.user.email, 'Role:', req.user.role);

        const totalUsers = await User.countDocuments();
        const totalPosts = await Post.countDocuments();
        const totalSpaces = await Space.countDocuments();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
        const newPostsToday = await Post.countDocuments({ createdAt: { $gte: today } });

        // Users online in last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const usersOnline = await User.countDocuments({ lastSeen: { $gte: fiveMinutesAgo } });

        const stats = {
            totalUsers,
            totalPosts,
            totalSpaces,
            newUsersToday,
            newPostsToday,
            usersOnline
        };

        console.log('✅ Stats retrieved successfully:', stats);
        res.json(stats);
    } catch (error) {
        console.error('❌ Error getting stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all users with advanced search and filters
// @route   GET /api/admin/users
// @access  Admin
router.get('/users', async (req, res) => {
    try {
        console.log('👥 Admin Users Request - User:', req.user.email);

        const {
            search,
            role,
            status,
            sortBy = 'recent',
            page = 1,
            limit = 12
        } = req.query;

        let query = {};

        // Search by name, email or bio
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { bio: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by role
        if (role) {
            query.role = role;
        }

        // Filter by status (suspended or active)
        if (status === 'suspended') {
            query.isSuspended = true;
        } else if (status === 'active') {
            query.isSuspended = { $ne: true };
        }

        // Sorting
        let sort = {};
        switch (sortBy) {
            case 'name':
                sort = { name: 1 };
                break;
            case 'oldest':
                sort = { createdAt: 1 };
                break;
            case 'recent':
            default:
                sort = { createdAt: -1 };
        }

        const users = await User.find(query)
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(sort);

        const count = await User.countDocuments(query);

        console.log(`✅ Found ${users.length} users (total: ${count})`);

        res.json({
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            total: count,
            hasMore: page * limit < count
        });
    } catch (error) {
        console.error('❌ Error getting users:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get user details with statistics
// @route   GET /api/admin/users/:id
// @access  Admin
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('connections', 'name avatar');

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Get user statistics
        const totalPosts = await Post.countDocuments({ author: user._id });
        const totalConnections = user.connections ? user.connections.length : 0;
        const totalMessages = await require('../models/Message').countDocuments({
            $or: [{ sender: user._id }, { recipient: user._id }]
        });

        // Get recent posts
        const recentPosts = await Post.find({ author: user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('content createdAt');

        res.json({
            user,
            statistics: {
                totalPosts,
                totalConnections,
                totalMessages
            },
            recentPosts
        });
    } catch (error) {
        console.error('❌ Error getting user details:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user profile (admin)
// @route   PUT /api/admin/users/:id
// @access  Admin
router.put('/users/:id', async (req, res) => {
    try {
        const { name, email, bio, role, isSuspended } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user._id.toString() && role && role !== user.role) {
            return res.status(400).json({ message: 'Você não pode alterar seu próprio role' });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (bio !== undefined) user.bio = bio;
        if (role && ['user', 'admin'].includes(role)) user.role = role;
        if (isSuspended !== undefined) user.isSuspended = isSuspended;

        await user.save();

        res.json({
            message: 'Usuário atualizado com sucesso',
            user: { ...user.toJSON(), password: undefined }
        });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Role inválido' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        user.role = role;
        await user.save();

        res.json({ message: `Usuário ${role === 'admin' ? 'promovido a' : 'rebaixado para'} ${role}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Suspend/Unsuspend user
// @route   PUT /api/admin/users/:id/suspend
// @access  Admin
router.put('/users/:id/suspend', async (req, res) => {
    try {
        const { suspend } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        user.isSuspended = suspend;
        await user.save();

        res.json({ message: `Usuário ${suspend ? 'suspenso' : 'reativado'}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete user with cascade
// @route   DELETE /api/admin/users/:id
// @access  Admin
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Don't allow deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Você não pode deletar sua própria conta' });
        }

        console.log(`🗑️ Deleting user ${user.name} (${user.email}) and all associated data...`);

        // Cascade delete: posts
        const deletedPosts = await Post.deleteMany({ author: user._id });
        console.log(`   Deleted ${deletedPosts.deletedCount} posts`);

        // Cascade delete: spaces created by user
        const deletedSpaces = await Space.deleteMany({ creator: user._id });
        console.log(`   Deleted ${deletedSpaces.deletedCount} spaces`);

        // Remove user from spaces they're a member of
        await Space.updateMany(
            { members: user._id },
            { $pull: { members: user._id } }
        );

        // Cascade delete: messages
        const Message = require('../models/Message');
        const deletedMessages = await Message.deleteMany({
            $or: [{ sender: user._id }, { recipient: user._id }]
        });
        console.log(`   Deleted ${deletedMessages.deletedCount} messages`);

        // Remove from other users' connections
        await User.updateMany(
            { connections: user._id },
            { $pull: { connections: user._id } }
        );

        // Delete the user
        await user.deleteOne();

        console.log(`✅ User ${user.name} deleted successfully`);

        res.json({ message: 'Usuário e todos os dados associados foram deletados com sucesso' });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ message: error.message });
    }
});

// ===== THEME ROUTES =====

// @desc    Get all themes
// @route   GET /api/admin/themes
// @access  Admin
router.get('/themes', async (req, res) => {
    try {
        console.log('🎨 Admin Themes Request - User:', req.user.email);

        const themes = await Theme.find().populate('createdBy', 'name email').sort({ createdAt: -1 });

        console.log(`✅ Found ${themes.length} themes`);
        res.json(themes);
    } catch (error) {
        console.error('❌ Error getting themes:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create new theme
// @route   POST /api/admin/themes
// @access  Admin
router.post('/themes', async (req, res) => {
    try {
        const path = require('path');
        const fs = require('fs');

        let themeData = { ...req.body, createdBy: req.user._id };

        // Handle background image upload
        if (req.files && req.files.backgroundImage) {
            const file = req.files.backgroundImage;

            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.mimetype)) {
                return res.status(400).json({
                    message: 'Tipo de arquivo inválido. Apenas imagens são permitidas (JPG, PNG, GIF, WEBP).'
                });
            }

            // Validate file size (max 50MB)
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (file.size > maxSize) {
                return res.status(400).json({
                    message: 'Arquivo muito grande. Tamanho máximo: 50MB.'
                });
            }

            // Create uploads/themes directory if it doesn't exist
            const uploadsDir = path.join(__dirname, '../uploads/themes');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const ext = path.extname(file.name);
            const filename = `theme-${timestamp}${ext}`;
            const filepath = path.join(uploadsDir, filename);

            // Save file
            await file.mv(filepath);

            // Update theme data with image URL
            themeData.background = {
                type: 'image',
                value: `/uploads/themes/${filename}`,
                opacity: req.body.backgroundOpacity || 1,
                size: req.body.backgroundSize || 'cover',
                position: req.body.backgroundPosition || 'center',
                repeat: req.body.backgroundRepeat || 'no-repeat'
            };
        }

        const theme = await Theme.create(themeData);
        const populatedTheme = await Theme.findById(theme._id).populate('createdBy', 'name email');
        res.status(201).json(populatedTheme);
    } catch (error) {
        console.error('Error creating theme:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update theme
// @route   PUT /api/admin/themes/:id
// @access  Admin
router.put('/themes/:id', async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) {
            return res.status(404).json({ message: 'Tema não encontrado' });
        }

        Object.assign(theme, req.body);
        await theme.save();

        const populatedTheme = await Theme.findById(theme._id).populate('createdBy', 'name email');
        res.json(populatedTheme);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Activate theme
// @route   PUT /api/admin/themes/:id/activate
// @access  Admin
router.put('/themes/:id/activate', async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) {
            return res.status(404).json({ message: 'Tema não encontrado' });
        }

        // Deactivate all other themes
        await Theme.updateMany({ _id: { $ne: theme._id } }, { isActive: false });

        theme.isActive = true;
        await theme.save();

        res.json({ message: 'Tema ativado com sucesso', theme });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Deactivate all themes
// @route   POST /api/admin/themes/deactivate-all
// @access  Admin
router.post('/themes/deactivate-all', async (req, res) => {
    try {
        await Theme.updateMany({}, { isActive: false });
        res.json({ message: 'Todos os temas foram desativados' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete theme
// @route   DELETE /api/admin/themes/:id
// @access  Admin
router.delete('/themes/:id', async (req, res) => {
    try {
        const theme = await Theme.findById(req.params.id);
        if (!theme) {
            return res.status(404).json({ message: 'Tema não encontrado' });
        }

        await theme.deleteOne();
        res.json({ message: 'Tema deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
