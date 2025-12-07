 
const express = require("express");
const router = express.Router();
const Response = require("../models/Response");
const Survey = require("../models/Survey");
const authMiddleware = require('../auth/authMiddleware');

 
router.post("/:surveyId", authMiddleware.optionalAuth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) return res.status(404).json({ error: "Ankieta nie istnieje" });

    const now = new Date();
    if (survey.validUntil && now > survey.validUntil) {
      if (survey.status !== 'closed') {
        survey.status = 'closed';
        try { await survey.save(); } catch (e) { }
      }
      return res.status(400).json({ error: 'Ankieta wygasła' });
    }
    if (survey.validFrom && now < survey.validFrom) return res.status(400).json({ error: 'Ankieta jeszcze nie aktywna' });
    if (survey.status !== 'published') return res.status(400).json({ error: 'Ankieta nie jest opublikowana' });

    if (survey.maxResponses && survey.maxResponses > 0) {
      const count = await Response.countDocuments({ survey: survey._id });
      if (count >= survey.maxResponses) return res.status(400).json({ error: 'Limit odpowiedzi dla tej ankiety został osiągnięty' });
    }

    
    let inviteRecord = null;
    if (req.body && req.body.inviteToken) {
      const Invite = require('../models/Invite');
      inviteRecord = await Invite.findOne({ token: req.body.inviteToken });
      if (!inviteRecord) return res.status(400).json({ error: 'Nieprawidłowy token zaproszenia' });
      if (String(inviteRecord.survey) !== String(survey._id)) return res.status(400).json({ error: 'Token nie pasuje do tej ankiety' });
      if (inviteRecord.expiresAt && now > inviteRecord.expiresAt) return res.status(400).json({ error: 'Token wygasł' });
      if (inviteRecord.maxUses && inviteRecord.uses >= inviteRecord.maxUses) return res.status(400).json({ error: 'Token został wykorzystany' });
    }

    
    if (req.user && survey.author && String(req.user.id) === String(survey.author)) {
      return res.status(403).json({ error: 'Autor ankiety nie może wypełniać swojej ankiety' });
    }

    
    if (survey.singleResponse) {
      
      if (!inviteRecord) {
        return res.status(400).json({ error: 'Ta ankieta wymaga tokena zaproszenia (jednorazowe wypełnienie)'});
      }
      
    }

    
    let answers = [];
    if (Array.isArray(req.body.answers)) {
      answers = req.body.answers.map(a => ({ questionId: a.questionId || a.question, value: a.value }));
    } else if (req.body.answers && typeof req.body.answers === 'object') {
      answers = Object.keys(req.body.answers).map(qId => ({ questionId: qId, value: req.body.answers[qId] }));
    }

    const response = new Response({
      survey: req.params.surveyId,
      user: req.user && req.user.id,
      answers,
      createdAt: new Date(),
      meta: {
        ip: req.ip,
        userAgent: req.get('User-Agent') || ''
      }
    });

    await response.save();

    
    if (inviteRecord) {
      inviteRecord.uses = (inviteRecord.uses || 0) + 1;
      await inviteRecord.save();
    }

    res.json({ success: true, id: response._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd zapisu odpowiedzi" });
  }
});

 
router.post('/:surveyId/save', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });

    
    let answers = [];
    if (Array.isArray(req.body.answers)) {
      answers = req.body.answers.map(a => ({ questionId: a.questionId || a.question, value: a.value }));
    } else if (req.body.answers && typeof req.body.answers === 'object') {
      answers = Object.keys(req.body.answers).map(qId => ({ questionId: qId, value: req.body.answers[qId] }));
    }

    const crypto = require('crypto');
    let token = req.body.resumeToken;
    let response;
    if (token) {
      response = await Response.findOne({ 'meta.token': token });
      if (response) {
        response.answers = answers;
        response.meta = response.meta || {};
        response.meta.updatedAt = new Date();
        await response.save();
        return res.json({ success: true, resumeToken: token });
      }
    }

    token = crypto.randomBytes(12).toString('hex');
    response = new Response({
      survey: req.params.surveyId,
      answers,
      createdAt: new Date(),
      meta: { token, ip: req.ip, userAgent: req.get('User-Agent') || '' }
    });
    await response.save();
    res.json({ success: true, resumeToken: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd zapisu szkicu odpowiedzi' });
  }
});

 
router.get('/resume/:token', async (req, res) => {
  try {
    const resp = await Response.findOne({ 'meta.token': req.params.token });
    if (!resp) return res.status(404).json({ error: 'Nie znaleziono szkicu odpowiedzi' });
    res.json({ survey: resp.survey, answers: resp.answers, resumeToken: req.params.token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania szkicu' });
  }
});

 
router.get("/:surveyId", async (req, res) => {
  try {
    const responses = await Response.find({ survey: req.params.surveyId });
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd pobierania odpowiedzi" });
  }
});

 
router.get("/:surveyId/export", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    const responses = await Response.find({ survey: req.params.surveyId });

    if (!survey) return res.status(404).json({ error: "Ankieta nie istnieje" });

    let csv = "";

    const headers = survey.questions.map(q => q.text);
    csv += headers.join(";") + "\n";

    
    responses.forEach(resp => {
      const row = survey.questions.map(q => {
        const ansObj = resp.answers.find(a => String(a.questionId) === String(q._id));
        let answer = '';
        if (ansObj) {
          if (Array.isArray(ansObj.value)) answer = ansObj.value.join(', ');
          else answer = ansObj.value != null ? String(ansObj.value) : '';
        }
        return `"${answer.replace(/"/g, '""')}"`;
      });
      csv += row.join(";") + "\n";
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=survey_${survey._id}.csv`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd generowania CSV" });
  }
});

module.exports = router;
