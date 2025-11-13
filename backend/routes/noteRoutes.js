const express = require('express');
const router = express.Router();
const {
  getNotesForSpace,
  createNote,
  updateNote,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:spaceId').get(protect, getNotesForSpace).post(protect, createNote);

router
  .route('/:noteId')
  .put(protect, updateNote)
  .delete(protect, deleteNote);

module.exports = router;