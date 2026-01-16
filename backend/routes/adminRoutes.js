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

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
router.get('/users', async (req, res) => {
    try {
        console.log('👥 Admin Users Request - User:', req.user.email);

        const { search, role, page = 1, limit = 20 } = req.query;

        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) {
            query.role = role;
        }

        const users = await User.find(query)
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await User.countDocuments(query);

        console.log(`✅ Found ${users.length} users (total: ${count})`);

        res.json({
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error('❌ Error getting users:', error);
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

// @desc    Delete user
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

        // Delete user's posts, spaces, etc.
        await Post.deleteMany({ author: user._id });
        await Space.deleteMany({ creator: user._id });

        await user.deleteOne();

        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
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
        const theme = await Theme.create({
            ...req.body,
            createdBy: req.user._id
        });

        const populatedTheme = await Theme.findById(theme._id).populate('createdBy', 'name email');
        res.status(201).json(populatedTheme);
    } catch (error) {
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
