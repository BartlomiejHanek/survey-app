const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Invite = require('../models/Invite');
const Survey = require('../models/Survey');
const auth = require('../auth/authMiddleware');

const createInvite = async (surveyId, creatorId, maxUses, expiresAt) => {
  const token = crypto.randomBytes(12).toString('hex');
  const invite = new Invite({
    token,
    survey: surveyId,
    creator: creatorId,
    maxUses,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined
  });
  await invite.save();
  return invite;
};

router.post('/create', auth.requireAuth, async (req, res) => {
  try {
    const { surveyId, maxUses = 1, expiresAt, count = 1 } = req.body;
    if (!surveyId) return res.status(400).json({ error: 'Brak surveyId' });
    const survey = await Survey.findById(surveyId);
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });

    const quantity = Math.max(1, parseInt(count) || 1);

    if (quantity === 1) {
      const invite = await createInvite(surveyId, req.user.id, maxUses, expiresAt);
      res.json({ invite, invites: [invite] });
    } else {
      const invites = [];
      for (let i = 0; i < quantity; i++) {
        const invite = await createInvite(surveyId, req.user.id, maxUses, expiresAt);
        invites.push(invite);
      }
      res.json({ invites, invite: invites[0] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie udało się utworzyć zaproszenia' });
  }
});

router.get('/validate/:token', async (req, res) => {
  try {
    const token = req.params.token;
    const invite = await Invite.findOne({ token });
    if (!invite) return res.status(404).json({ valid: false, error: 'Nieprawidłowy token' });
    const now = new Date();
    if (invite.expiresAt && now > invite.expiresAt) return res.status(400).json({ valid: false, error: 'Token wygasł' });
    if (invite.uses >= invite.maxUses) return res.status(400).json({ valid: false, error: 'Token został wykorzystany' });
    res.json({ valid: true, invite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, error: 'Błąd weryfikacji tokena' });
  }
});

module.exports = router;
