const express = require("express");
const router = express.Router();
const SavedQuestion = require("../models/SavedQuestion");
const auth = require('../auth/authMiddleware');

// GET /api/questions - Lista wszystkich pytań użytkownika
router.get("/", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  
  try {
    const { search, type, favorite, sort } = req.query;
    
    // Buduj query
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
    
    // Sortowanie
    let sortOption = { order: 1, createdAt: -1 };
    if (sort === 'oldest') {
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
  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: "Błąd podczas pobierania pytań" });
  }
});

// GET /api/questions/:id - Pobierz jedno pytanie
router.get("/:id", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  
  try {
    const question = await SavedQuestion.findOne({ 
      _id: req.params.id, 
      author: req.user.id 
    });
    
    if (!question) {
      return res.status(404).json({ error: "Pytanie nie istnieje" });
    }
    
    res.json(question);
  } catch (err) {
    console.error('Error fetching question:', err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// POST /api/questions - Dodaj nowe pytanie
router.post("/", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  
  try {
    const body = req.body || {};
    
    console.log('Creating question - body:', JSON.stringify(body, null, 2));
    console.log('User ID:', req.user?.id);
    
    // Walidacja
    if (!body.title || !body.type) {
      return res.status(400).json({ error: "Tytuł i typ pytania są wymagane" });
    }
    
    // Walidacja typu
    const validTypes = ['text', 'textarea', 'radio', 'checkbox', 'select', 'scale'];
    if (!validTypes.includes(body.type)) {
      return res.status(400).json({ error: `Nieprawidłowy typ pytania. Dozwolone: ${validTypes.join(', ')}` });
    }
    
    if (!req.user || !req.user.id) {
      return res.status(403).json({ error: 'Brak identyfikatora użytkownika' });
    }
    
    // Sprawdź maksymalną kolejność dla użytkownika
    const maxOrderDoc = await SavedQuestion.findOne({ author: req.user.id })
      .sort({ order: -1 })
      .select('order')
      .lean();
    
    // Przygotuj dane
    const questionData = {
      author: req.user.id,
      title: body.title.trim(),
      type: body.type,
      required: !!body.required,
      isFavorite: !!body.isFavorite,
      order: maxOrderDoc && maxOrderDoc.order !== undefined ? maxOrderDoc.order + 1 : 0
    };
    
    // Opcje - tylko dla typów, które ich wymagają
    if (['radio', 'checkbox', 'select'].includes(body.type)) {
      questionData.options = Array.isArray(body.options) 
        ? body.options
            .filter(o => o && (typeof o === 'string' ? o.trim() : (o.text || '').trim()))
            .map(o => ({ text: typeof o === 'string' ? o.trim() : (o.text || '').trim() }))
        : [];
    } else {
      questionData.options = [];
    }
    
    // Skala - tylko dla typu scale
    if (body.type === 'scale' && body.scale && typeof body.scale === 'object') {
      questionData.scale = {
        min: body.scale.min !== undefined ? Number(body.scale.min) : 1,
        max: body.scale.max !== undefined ? Number(body.scale.max) : 5
      };
    } else {
      questionData.scale = undefined;
    }
    
    // Obraz - tylko jeśli nie jest pustym stringiem
    if (body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
      questionData.imageUrl = body.imageUrl.trim();
    } else {
      questionData.imageUrl = undefined;
    }
    
    // Kategoria i tagi
    if (body.category && typeof body.category === 'string' && body.category.trim()) {
      questionData.category = body.category.trim();
    }
    if (Array.isArray(body.tags)) {
      questionData.tags = body.tags.filter(t => t && typeof t === 'string' && t.trim()).map(t => t.trim());
    }
    
    console.log('Question data to save:', JSON.stringify(questionData, null, 2));
    
    const question = new SavedQuestion(questionData);
    
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    console.error('Error creating question:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: "Nie udało się stworzyć pytania", details: err.message });
  }
});

// PUT /api/questions/:id - Edytuj pytanie
router.put("/:id", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  
  try {
    const question = await SavedQuestion.findOne({ 
      _id: req.params.id, 
      author: req.user.id 
    });
    
    if (!question) {
      return res.status(404).json({ error: "Pytanie nie istnieje" });
    }
    
    const body = req.body || {};
    
    // Aktualizuj pola
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

// DELETE /api/questions/:id - Usuń pytanie
router.delete("/:id", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  
  try {
    const question = await SavedQuestion.findOne({ 
      _id: req.params.id, 
      author: req.user.id 
    });
    
    if (!question) {
      return res.status(404).json({ error: "Pytanie nie istnieje" });
    }
    
    await SavedQuestion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ error: "Nie udało się usunąć pytania" });
  }
});

// PATCH /api/questions/:id/favorite - Przełącz ulubione
router.patch("/:id/favorite", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  
  try {
    const question = await SavedQuestion.findOne({ 
      _id: req.params.id, 
      author: req.user.id 
    });
    
    if (!question) {
      return res.status(404).json({ error: "Pytanie nie istnieje" });
    }
    
    question.isFavorite = !question.isFavorite;
    question.updatedAt = new Date();
    await question.save();
    
    res.json(question);
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: "Nie udało się zaktualizować ulubionego" });
  }
});

// PUT /api/questions/reorder - Zmień kolejność (drag & drop)
router.put("/reorder", auth.requireAuth, async (req, res) => {
  if (!req.user) return res.status(403).json({ error: 'Brak uprawnień' });
  
  try {
    const { order } = req.body; // Array of question IDs in new order
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ error: "Order musi być tablicą" });
    }
    
    // Aktualizuj kolejność dla każdego pytania
    const updates = order.map((questionId, index) => ({
      updateOne: {
        filter: { _id: questionId, author: req.user.id },
        update: { order: index, updatedAt: new Date() }
      }
    }));
    
    await SavedQuestion.bulkWrite(updates);
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error reordering questions:', err);
    res.status(500).json({ error: "Nie udało się zmienić kolejności" });
  }
});

module.exports = router;

