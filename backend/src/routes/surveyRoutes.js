const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const Survey = require("../models/Survey");
const Response = require("../models/Response");
const auth = require('../auth/authMiddleware');

const findUserSurvey = async (id, userId) => {
  const survey = await Survey.findOne({ _id: id, author: userId });
  if (!survey) throw new Error('Ankieta nie istnieje lub brak dostępu');
  return survey;
};

const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];

  return questions.map((q, index) => {
    const qTitle = q.title || q.text;
    const qType = q.type || 'text';
    const qRequired = !!q.required;
    const qOptions = Array.isArray(q.options)
      ? q.options.map(o => ({ text: typeof o === 'string' ? o : (o.text || '') }))
      : [];
    const qOrder = typeof q.order === 'number' ? q.order : index;

    return {
      text: qTitle || `Pytanie ${index + 1}`,
      type: qType,
      required: qRequired,
      options: qOptions,
      order: qOrder
    };
  });
};

 
router.get("/", auth.requireAuth, async (req, res) => {
  try {
    const { search, status, sort } = req.query;
    
    const query = { author: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {
      oldest: { createdAt: 1 },
      alphabetical: { title: 1 },
      'alphabetical-desc': { title: -1 }
    };
    let sortOption = sortOptions[sort] || { createdAt: -1 };
    
    const surveys = await Survey.find(query).sort(sortOption);
    res.json(surveys);
  } catch (err) {
    console.error('Error fetching surveys:', err);
    res.status(500).json({ error: 'Nie można pobrać ankiet' });
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
    } catch (err) {
      console.error('Error updating survey status:', err);
    }

    
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
  try {
    const body = req.body || {};
    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return res.status(400).json({ error: 'Tytuł ankiety jest wymagany' });
    }

    const questions = normalizeQuestions(body.questions);

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
  try {
    const existingSurvey = await findUserSurvey(req.params.id, req.user.id);
    
    if (existingSurvey.status === 'archived') {
      throw new Error('Nie można edytować zarchiwizowanej ankiety. Najpierw przywróć ankietę.');
    }

    const body = req.body || {};
    const questions = normalizeQuestions(body.questions);

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
  } catch (err) {
    console.error('Error updating survey:', err);
    res.status(500).json({ error: "Nie udało się zaktualizować ankiety" });
  }
});
 
router.delete("/:id", auth.requireAuth, async (req, res) => {
  try {
    await findUserSurvey(req.params.id, req.user.id);
    
    await Survey.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting survey:', err);
    res.status(500).json({ error: 'Nie można usunąć ankiety' });
  }
});

 
router.post('/:id/publish', auth.requireAuth, async (req, res) => {
  try {
    const survey = await findUserSurvey(req.params.id, req.user.id);
    
    survey.status = 'published';
    survey.publishedAt = new Date();
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    console.error('Error publishing survey:', err);
    res.status(500).json({ error: 'Nie można opublikować ankiety' });
  }
});

 
router.post('/:id/close', auth.requireAuth, async (req, res) => {
  try {
    const survey = await findUserSurvey(req.params.id, req.user.id);
    
    survey.status = 'closed';
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można zamknąć ankiety' });
  }
});

 
router.post('/:id/archive', auth.requireAuth, async (req, res) => {
  try {
    const survey = await findUserSurvey(req.params.id, req.user.id);
    
    survey.status = 'archived';
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można zarchiwizować ankiety' });
  }
});

router.post('/:id/unarchive', auth.requireAuth, async (req, res) => {
  try {
    const survey = await findUserSurvey(req.params.id, req.user.id);
    
    if (survey.status !== 'archived') return res.status(400).json({ error: 'Ankieta nie jest zarchiwizowana' });
    survey.status = survey.publishedAt ? 'published' : 'draft';
    await survey.save();
    res.json({ success: true, survey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można przywrócić ankiety' });
  }
});

 
router.delete('/:id/responses', auth.requireAuth, async (req, res) => {
  try {
    await findUserSurvey(req.params.id, req.user.id);
    
    await Response.deleteMany({ survey: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Nie można usunąć odpowiedzi' });
  }
});

module.exports = router;
