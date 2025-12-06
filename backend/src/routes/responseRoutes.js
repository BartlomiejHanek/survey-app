// backend/routes/responseRoutes.js
const express = require("express");
const router = express.Router();
const Response = require("../models/Response");
const Survey = require("../models/Survey");

// POST: zapis odpowiedzi respondenta
router.post("/:surveyId", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    if (!survey) return res.status(404).json({ error: "Ankieta nie istnieje" });

    const response = new Response({
      surveyId: req.params.surveyId,
      answers: req.body.answers,
      createdAt: new Date(),
    });

    await response.save();
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Błąd zapisu odpowiedzi" });
  }
});

// GET: wszystkie odpowiedzi do ankiety
router.get("/:surveyId", async (req, res) => {
  try {
    const responses = await Response.find({ surveyId: req.params.surveyId });
    res.json(responses);
  } catch {
    res.status(500).json({ error: "Błąd pobierania odpowiedzi" });
  }
});

// GET: eksport wyników CSV
router.get("/:surveyId/export", async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.surveyId);
    const responses = await Response.find({ surveyId: req.params.surveyId });

    if (!survey) return res.status(404).json({ error: "Ankieta nie istnieje" });

    let csv = "";

    // nagłówki
    const headers = survey.questions.map(q => q.title);
    csv += headers.join(";") + "\n";

    // odpowiedzi
    responses.forEach(resp => {
      const row = survey.questions.map(q => {
        const answer = resp.answers[q._id]?.join(", ") || resp.answers[q._id] || "";
        return `"${answer}"`;
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
