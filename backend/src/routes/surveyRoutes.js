 
const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const Survey = require("../models/Survey");
const auth = require('../auth/authMiddleware');

 
router.get("/", async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas pobierania ankiet" });
  }
});

 
router.get("/:id", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: "Ankieta nie istnieje" });
    try {
      const now = new Date();
      if (survey.validUntil && now > survey.validUntil && survey.status !== 'closed') {
        survey.status = 'closed';
        await survey.save();
      }
    } catch (e) { }

    
    const dto = {
      _id: survey._id,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      allowAnonymous: survey.allowAnonymous,
      singleResponse: survey.singleResponse,
      maxResponses: survey.maxResponses,
      validFrom: survey.validFrom,
      validUntil: survey.validUntil,
      questions: survey.questions.map(q => ({
        id: q._id,
        text: q.text,
        title: q.text,
        type: q.type,
        required: q.required,
        options: Array.isArray(q.options) ? q.options.map(o => (o.text || o)) : [],
        imageUrl: q.imageUrl || null,
        scale: q.scale || null,
        order: q.order
      })),
      createdAt: survey.createdAt,
      publishedAt: survey.publishedAt
    };

    res.json(dto);
  } catch {
    res.status(500).json({ error: "Błąd serwera" });
  }
});

 
router.post("/", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  try {
    const body = req.body || {};
    const questions = Array.isArray(body.questions) ? body.questions.map((q, i) => {
      const idCandidate = q._id || q.id;
      const out = {
        text: q.title || q.text || `Pytanie ${i + 1}`,
        type: q.type || 'text',
        required: !!q.required,
        options: Array.isArray(q.options) ? q.options.map(o => ({ text: (typeof o === 'string' ? o : (o.text || '')) })) : [],
        imageUrl: q.imageUrl || q.image || null,
        scale: q.scale,
        order: typeof q.order === 'number' ? q.order : i
      };
      if (idCandidate && mongoose.Types.ObjectId.isValid(String(idCandidate))) out._id = String(idCandidate);
      return out;
    }) : [];

    const survey = new Survey({
      title: body.title,
      description: body.description,
      status: body.status || 'draft',
      allowAnonymous: !!body.allowAnonymous,
      singleResponse: !!body.singleResponse,
      maxResponses: body.maxResponses || 0,
      validFrom: body.validFrom,
      validUntil: body.validUntil,
      questions
    });
    
    if (req.user && req.user.id) survey.author = req.user.id;

    await survey.save();
    res.status(201).json(survey);
  } catch (err) {
    console.error('Error creating survey:', err);
    res.status(500).json({ error: "Nie udało się stworzyć ankiety" });
  }
});

 
router.put("/:id", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  try {
    const existingSurvey = await Survey.findById(req.params.id);
    if (!existingSurvey) return res.status(404).json({ error: 'Ankieta nie istnieje' });
    if (existingSurvey.status === 'archived') {
      return res.status(403).json({ error: 'Nie można edytować zarchiwizowanej ankiety. Najpierw przywróć ankietę.' });
    }

    const body = req.body || {};
    const questions = Array.isArray(body.questions) ? body.questions.map((q, i) => {
      const idCandidate = q._id || q.id;
      const out = {
        text: q.title || q.text || `Pytanie ${i + 1}`,
        type: q.type || 'text',
        required: !!q.required,
        options: Array.isArray(q.options) ? q.options.map(o => ({ text: (typeof o === 'string' ? o : (o.text || '')) })) : [],
        imageUrl: q.imageUrl || q.image || null,
        scale: q.scale,
        order: typeof q.order === 'number' ? q.order : i
      };
      if (idCandidate && mongoose.Types.ObjectId.isValid(String(idCandidate))) out._id = String(idCandidate);
      return out;
    }) : undefined;

    const update = {
      title: body.title,
      description: body.description,
      status: body.status,
      allowAnonymous: body.allowAnonymous,
      singleResponse: body.singleResponse,
      maxResponses: body.maxResponses,
      validFrom: body.validFrom,
      validUntil: body.validUntil
    };
    if (questions) update.questions = questions;

    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });
    res.json(survey);
  } catch {
    console.error('Error updating survey:', arguments);
    res.status(500).json({ error: "Nie udało się zaktualizować ankiety" });
  }
});

 
router.delete("/:id", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  try {
    await Survey.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Nie udało się usunąć ankiety" });
  }
});

 
router.post('/:id/publish', auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });
    survey.status = 'published';
    survey.publishedAt = new Date();
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można opublikować ankiety' });
  }
});

 
router.post('/:id/close', auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });
    survey.status = 'closed';
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można zamknąć ankiety' });
  }
});

 
router.post('/:id/archive', auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });
    survey.status = 'archived';
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można zarchiwizować ankiety' });
  }
});

router.post('/:id/unarchive', auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: 'Ankieta nie istnieje' });
    if (survey.status !== 'archived') return res.status(400).json({ error: 'Ankieta nie jest zarchiwizowana' });
    // Przywróć do poprzedniego statusu lub draft
    survey.status = survey.publishedAt ? 'published' : 'draft';
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można przywrócić ankiety' });
  }
});

 
router.delete('/:id/responses', auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  try {
    const Response = require('../models/Response');
    await Response.deleteMany({ survey: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można usunąć odpowiedzi' });
  }
});

module.exports = router;
