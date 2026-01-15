const express = require('express');
const router = express.Router();
const Theme = require('../models/themeModel');

// @desc    Get active theme (public route)
// @route   GET /api/themes/active
// @access  Public
router.get('/active', async (req, res) => {
    try {
        const activeTheme = await Theme.findOne({ isActive: true });
        if (!activeTheme) {
            return res.status(404).json({ message: 'Nenhum tema ativo' });
        }
        res.json(activeTheme);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
