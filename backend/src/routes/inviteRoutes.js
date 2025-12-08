const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const Invite = require('../models/Invite');
const Survey = require('../models/Survey');
const auth = require('../auth/authMiddleware');

router.post('/create', auth.requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
    const { surveyId, maxUses = 1, expiresAt } = req.body;
    if (!surveyId) return res.status(400).json({ error: 'Brak surveyId' });
    const survey = await Survey.findById(surveyId);
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });

    const token = crypto.randomBytes(12).toString('hex');
    const invite = new Invite({ token, survey: surveyId, creator: req.user.id, maxUses, expiresAt: expiresAt ? new Date(expiresAt) : undefined });
    await invite.save();
    res.json({ invite });
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
    if (invite.maxUses && invite.uses >= invite.maxUses) return res.status(400).json({ valid: false, error: 'Token został wykorzystany' });
    res.json({ valid: true, invite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, error: 'Błąd weryfikacji tokena' });
  }
});

module.exports = router;
