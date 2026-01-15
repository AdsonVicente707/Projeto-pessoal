const express = require('express');
const router = express.Router();
const Story = require('../models/storyModel');
const { protect } = require('../middleware/authMiddleware');
const path = require('path');

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { caption } = req.body;

        if (!req.files || !req.files.media) {
            return res.status(400).json({ message: 'Mídia é obrigatória' });
        }

        const mediaFile = req.files.media;
        const mediaType = mediaFile.mimetype.startsWith('video') ? 'video' : 'image';
        const fileName = `story-${Date.now()}${path.extname(mediaFile.name)}`;
        const uploadPath = path.join(__dirname, '../uploads', fileName);

        await mediaFile.mv(uploadPath);

        const story = await Story.create({
            user: req.user._id,
            media: `/uploads/${fileName}`,
            mediaType,
            caption: caption || ''
        });

        const populatedStory = await Story.findById(story._id).populate('user', 'name avatar');

        res.status(201).json(populatedStory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all active stories
// @route   GET /api/stories
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const stories = await Story.find({
            expiresAt: { $gt: new Date() }
        })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 });

        // Group stories by user
        const groupedStories = {};
        stories.forEach(story => {
            const userId = story.user._id.toString();
            if (!groupedStories[userId]) {
                groupedStories[userId] = {
                    user: story.user,
                    stories: []
                };
            }
            groupedStories[userId].stories.push(story);
        });

        res.json(Object.values(groupedStories));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Mark story as viewed
// @route   POST /api/stories/:id/view
// @access  Private
router.post('/:id/view', protect, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story não encontrado' });
        }

        // Check if user already viewed
        const alreadyViewed = story.views.some(
            view => view.user.toString() === req.user._id.toString()
        );

        if (!alreadyViewed) {
            story.views.push({ user: req.user._id });
            await story.save();
        }

        res.json({ message: 'Visualização registrada' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add reaction to story
// @route   POST /api/stories/:id/react
// @access  Private
router.post('/:id/react', protect, async (req, res) => {
    try {
        const { emoji } = req.body;
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story não encontrado' });
        }

        // Remove previous reaction if exists
        story.reactions = story.reactions.filter(
            r => r.user.toString() !== req.user._id.toString()
        );

        // Add new reaction
        story.reactions.push({ user: req.user._id, emoji });
        await story.save();

        res.json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const story = await Story.findById(req.params.id);

        if (!story) {
            return res.status(404).json({ message: 'Story não encontrado' });
        }

        if (story.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Não autorizado' });
        }

        await story.deleteOne();
        res.json({ message: 'Story deletado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
