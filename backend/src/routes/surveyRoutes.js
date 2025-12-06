// backend/routes/surveyRoutes.js
const express = require("express");
const router = express.Router();
const Survey = require("../models/Survey");

// GET: wszystkie ankiety (admin panel)
router.get("/", async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ error: "Błąd podczas pobierania ankiet" });
  }
});

// GET: jedna ankieta
router.get("/:id", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ error: "Ankieta nie istnieje" });

    res.json(survey);
  } catch {
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// POST: tworzenie ankiety
router.post("/", async (req, res) => {
  try {
    const survey = new Survey(req.body);
    await survey.save();
    res.status(201).json(survey);
  } catch (err) {
    res.status(500).json({ error: "Nie udało się stworzyć ankiety" });
  }
});

// PUT: edycja ankiety (nazwa, opis, pytania, status)
router.put("/:id", async (req, res) => {
  try {
    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(survey);
  } catch {
    res.status(500).json({ error: "Nie udało się zaktualizować ankiety" });
  }
});

// DELETE: usuwanie ankiety
router.delete("/:id", async (req, res) => {
  try {
    await Survey.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Nie udało się usunąć ankiety" });
  }
});

module.exports = router;
