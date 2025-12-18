const express = require("express");
const router = express.Router();
const SavedQuestion = require("../models/SavedQuestion");
const auth = require('../auth/authMiddleware');

const findUserQuestion = async (id, userId) => {
  const question = await SavedQuestion.findOne({ _id: id, author: userId });
  if (!question) throw new Error('Pytanie nie istnieje lub brak dostępu');
  return question;
};

const validateQuestionData = (body) => {
  if (!body.title || !body.type) {
    throw new Error("Tytuł i typ pytania są wymagane");
  }
  
  const validTypes = ['text', 'textarea', 'radio', 'checkbox', 'select', 'scale'];
  if (!validTypes.includes(body.type)) {
    throw new Error(`Nieprawidłowy typ pytania. Dozwolone: ${validTypes.join(', ')}`);
  }
  
  return body;
};

router.get("/", auth.requireAuth, async (req, res) => {
  const { search, type, favorite, sort } = req.query;
  
  const query = { author: req.user.id };
  
  if (favorite === 'true') {
    query.isFavorite = true;
  }
  
  if (type) {
    query.type = type;
  }
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { 'options.text': { $regex: search, $options: 'i' } }
    ];
  }
  
  let sortOption = { order: 1, createdAt: -1 };
  if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'alphabetical') {
    sortOption = { title: 1 };
  } else if (sort === 'alphabetical-desc') {
    sortOption = { title: -1 };
  } else if (sort === 'favorite') {
    sortOption = { isFavorite: -1, order: 1, createdAt: -1 };
  } else if (sort === 'usage') {
    sortOption = { usageCount: -1, createdAt: -1 };
  }
  
  const questions = await SavedQuestion.find(query).sort(sortOption);
  
  res.json(questions);
});

router.get("/:id", auth.requireAuth, async (req, res) => {
  try {
    const question = await findUserQuestion(req.params.id, req.user.id);
    res.json(question);
  } catch (err) {
    console.error('Error fetching question:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

router.post("/", auth.requireAuth, async (req, res) => {
  try {
    const body = validateQuestionData(req.body || {});
    
    const maxOrderDoc = await SavedQuestion.findOne({ author: req.user.id })
      .sort({ order: -1 })
      .select('order')
      .lean();
    
    const questionData = {
      author: req.user.id,
      title: body.title.trim(),
      type: body.type,
      required: !!body.required,
      isFavorite: !!body.isFavorite,
      order: maxOrderDoc && maxOrderDoc.order !== undefined ? maxOrderDoc.order + 1 : 0
    };
    
    if (['radio', 'checkbox', 'select'].includes(body.type)) {
      questionData.options = Array.isArray(body.options) 
        ? body.options
            .filter(o => o && (typeof o === 'string' ? o.trim() : (o.text || '').trim()))
            .map(o => ({ text: typeof o === 'string' ? o.trim() : (o.text || '').trim() }))
        : [];
    } else {
      questionData.options = [];
    }
    
    if (body.type === 'scale' && body.scale && typeof body.scale === 'object') {
      questionData.scale = {
        min: body.scale.min !== undefined ? Number(body.scale.min) : 1,
        max: body.scale.max !== undefined ? Number(body.scale.max) : 5
      };
    } else {
      questionData.scale = undefined;
    }
    
    if (body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
      questionData.imageUrl = body.imageUrl.trim();
    } else {
      questionData.imageUrl = undefined;
    }
    
    if (body.category && typeof body.category === 'string' && body.category.trim()) {
      questionData.category = body.category.trim();
    }
    if (Array.isArray(body.tags)) {
      questionData.tags = body.tags.filter(t => t && typeof t === 'string' && t.trim()).map(t => t.trim());
    }
    
    const question = new SavedQuestion(questionData);
    
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    if (err.message.includes('Tytuł') || err.message.includes('typ') || err.message.includes('Nieprawidłowy')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error creating question:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});
router.put("/reorder", auth.requireAuth, async (req, res) => {
  try {
    const { order } = req.body;
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: "Order musi być tablicą" });
    }
    
    const updates = order.map((questionId, index) => ({
      updateOne: {
        filter: { _id: questionId, author: req.user.id },
        update: { order: index }
      }
    }));
    
    await SavedQuestion.bulkWrite(updates);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error reordering questions:', err);
    res.status(500).json({ error: "Nie udało się zmienić kolejności" });
  }
});

router.put("/:id", auth.requireAuth, async (req, res) => {
  try {
    const question = await findUserQuestion(req.params.id, req.user.id);
    
    const body = req.body || {};
    
    if (body.title !== undefined) question.title = body.title;
    if (body.type !== undefined) question.type = body.type;
    if (body.required !== undefined) question.required = !!body.required;
    if (body.options !== undefined) {
      question.options = Array.isArray(body.options)
        ? body.options.map(o => ({ text: typeof o === 'string' ? o : (o.text || '') }))
        : [];
    }
    if (body.scale !== undefined) question.scale = body.scale;
    if (body.imageUrl !== undefined) question.imageUrl = body.imageUrl;
    if (body.isFavorite !== undefined) question.isFavorite = !!body.isFavorite;
    if (body.category !== undefined) question.category = body.category;
    if (body.tags !== undefined) question.tags = Array.isArray(body.tags) ? body.tags : [];
    
    question.updatedAt = new Date();
    await question.save();
    
    res.json(question);
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ error: "Nie udało się zaktualizować pytania" });
  }
});

router.delete("/:id", auth.requireAuth, async (req, res) => {
  try {
    await findUserQuestion(req.params.id, req.user.id);
    
    await SavedQuestion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ error: "Nie udało się usunąć pytania" });
  }
});

router.patch("/:id/favorite", auth.requireAuth, async (req, res) => {
  try {
    const question = await findUserQuestion(req.params.id, req.user.id);
    
    question.isFavorite = !question.isFavorite;
    question.updatedAt = new Date();
    await question.save();
    
    res.json(question);
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: "Nie udało się zaktualizować ulubionego" });
  }
});

module.exports = router;

