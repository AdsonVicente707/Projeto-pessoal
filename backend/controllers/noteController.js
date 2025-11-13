const Note = require('../models/noteModel');
const Space = require('../models/spaceModel');

const getNotesForSpace = async (req, res) => {
  const space = await Space.findById(req.params.spaceId);
  if (!space.members.includes(req.user._id)) {
    return res.status(403).send('Acesso negado.');
  }
  const notes = await Note.find({ space: req.params.spaceId })
    .populate('author', 'name')
    .sort({ createdAt: 'desc' });
  res.json(notes);
};

const createNote = async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).send('O texto da nota é obrigatório.');
  }

  const space = await Space.findById(req.params.spaceId);
  if (!space.members.includes(req.user._id)) {
    return res.status(403).send('Acesso negado.');
  }

  const note = await Note.create({
    space: req.params.spaceId,
    author: req.user._id,
    text,
  });

  const createdNote = await Note.findById(note._id).populate('author', 'name');
  res.status(201).json(createdNote);
};

const updateNote = async (req, res) => {
  const { text } = req.body;
  const note = await Note.findById(req.params.noteId);

  if (!note) {
    return res.status(404).send('Nota não encontrada.');
  }
  if (note.author.toString() !== req.user._id.toString()) {
    return res.status(403).send('Ação não autorizada.');
  }

  note.text = text || note.text;
  const updatedNote = await note.save();
  res.json(updatedNote);
};

const deleteNote = async (req, res) => {
  const note = await Note.findById(req.params.noteId);

  if (!note) {
    return res.status(404).send('Nota não encontrada.');
  }
  if (note.author.toString() !== req.user._id.toString()) {
    return res.status(403).send('Ação não autorizada.');
  }

  await note.deleteOne();
  res.json({ message: 'Nota removida' });
};

module.exports = { getNotesForSpace, createNote, updateNote, deleteNote };