// backend/routes/responseRoutes.js
const express = require("express");
const router = express.Router();
const Response = require("../models/Response");
const Survey = require("../models/Survey");
const authMiddleware = require('../auth/authMiddleware');

// POST: zapis odpowiedzi respondenta
router.post("/:surveyId", authMiddleware.optionalAuth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) return res.status(404).json({ error: "Ankieta nie istnieje" });

    // check published/validity
    if (survey.status !== 'published') return res.status(400).json({ error: 'Ankieta nie jest opublikowana' });
    const now = new Date();
    if (survey.validFrom && now < survey.validFrom) return res.status(400).json({ error: 'Ankieta jeszcze nie aktywna' });
    if (survey.validUntil && now > survey.validUntil) return res.status(400).json({ error: 'Ankieta wygasła' });

    // check max responses
    if (survey.maxResponses && survey.maxResponses > 0) {
      const count = await Response.countDocuments({ survey: survey._id });
      if (count >= survey.maxResponses) return res.status(400).json({ error: 'Limit odpowiedzi dla tej ankiety został osiągnięty' });
    }

    // invite token handling (if present, validate and allow submission according to invite rules)
    let inviteRecord = null;
    if (req.body && req.body.inviteToken) {
      const Invite = require('../models/Invite');
      inviteRecord = await Invite.findOne({ token: req.body.inviteToken });
      if (!inviteRecord) return res.status(400).json({ error: 'Nieprawidłowy token zaproszenia' });
      if (String(inviteRecord.survey) !== String(survey._id)) return res.status(400).json({ error: 'Token nie pasuje do tej ankiety' });
      const now = new Date();
      if (inviteRecord.expiresAt && now > inviteRecord.expiresAt) return res.status(400).json({ error: 'Token wygasł' });
      if (inviteRecord.maxUses && inviteRecord.uses >= inviteRecord.maxUses) return res.status(400).json({ error: 'Token został wykorzystany' });
    }

    // enforce singleResponse for authenticated users or require login if anonymous not allowed
    // prevent survey author from submitting their own survey
    if (req.user && survey.author && String(req.user.id) === String(survey.author)) {
      return res.status(403).json({ error: 'Autor ankiety nie może wypełniać swojej ankiety' });
    }

    if (survey.singleResponse && !inviteRecord) {
      if (!req.user) {
        if (!survey.allowAnonymous) return res.status(401).json({ error: 'Ta ankieta wymaga zalogowania, aby zapewnić jedno wypełnienie na użytkownika' });
        // if anonymous allowed, attempt lightweight prevention by IP (best-effort)
        const existingByIp = await Response.findOne({ survey: survey._id, 'meta.ip': req.ip });
        if (existingByIp) return res.status(400).json({ error: 'Wygląda na to, że odpowiedź z tego miejsca już została wysłana' });
      } else {
        // authenticated user: ensure they haven't already responded
        const existing = await Response.findOne({ survey: survey._id, user: req.user.id });
        if (existing) return res.status(400).json({ error: 'Użytkownik już wypełnił tę ankietę' });
      }
    }

    // body.answers can be an object { questionId: value } or array of { questionId, value }
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

    // if used invite, increment uses and persist
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

// POST: save draft response and return resume token
router.post('/:surveyId/save', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });

    // allow saving drafts regardless of publish status
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

// GET: resume draft by token
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

// GET: wszystkie odpowiedzi do ankiety
router.get("/:surveyId", async (req, res) => {
  try {
    const responses = await Response.find({ survey: req.params.surveyId });
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd pobierania odpowiedzi" });
  }
});

// GET: eksport wyników CSV
router.get("/:surveyId/export", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    const responses = await Response.find({ survey: req.params.surveyId });

    if (!survey) return res.status(404).json({ error: "Ankieta nie istnieje" });

    let csv = "";

    // nagłówki — używamy tekstu pytań
    const headers = survey.questions.map(q => q.text);
    csv += headers.join(";") + "\n";

    // odpowiedzi
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
