const Invitation = require('../models/invitationModel');
const Space = require('../models/spaceModel');

/**
 * @desc    Buscar convites pendentes do usuário
 * @route   GET /api/invitations/my
 * @access  Private
 */
const getMyInvitations = async (req, res) => {
  const invitations = await Invitation.find({
    to: req.user._id,
    status: 'pending',
  }).populate('from', 'name').populate('space', 'name');

  res.json(invitations);
};

/**
 * @desc    Aceitar um convite
 * @route   POST /api/invitations/:id/accept
 * @access  Private
 */
const acceptInvitation = async (req, res) => {
  const invitation = await Invitation.findById(req.params.id);

  if (!invitation) {
    return res.status(404).send('Convite não encontrado');
  }

  // Verifica se o usuário logado é o destinatário do convite
  if (invitation.to.toString() !== req.user._id.toString()) {
    return res.status(403).send('Ação não autorizada');
  }

  // Adiciona o usuário aos membros do espaço
  await Space.updateOne(
    { _id: invitation.space },
    { $addToSet: { members: req.user._id } } // $addToSet previne duplicatas
  );

  // Atualiza o status do convite
  invitation.status = 'accepted';
  await invitation.save();

  res.json({ message: 'Convite aceito com sucesso!' });
};

module.exports = { getMyInvitations, acceptInvitation };