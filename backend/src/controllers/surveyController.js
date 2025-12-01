const Survey = require("../models/Survey");

exports.createSurvey = async (req, res) => {
  try {
    const { title, description, questions } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "Tytuł jest wymagany i musi być tekstem" });
    }

    if (questions && !Array.isArray(questions)) {
      return res.status(400).json({ message: "Questions must be an array" });
    }

    const znormalizowanePytania = questions.map((q = {}, index) => {
      const { text = `Pytanie ${index + 1}`, type = "text", options = [] } = q;
      return { text, type, options: Array.isArray(options) ? options : [] };
    });

    const survey = await Survey.create({
      title,
      description,
      questions: znormalizowanePytania,
    });
    res.json(survey);
  } catch (error) {
    console.error("Bład przy tworzeniu ankiety:", error);
    res.status(500).json({ message: "Nie udało się utworzyć ankiety", error: error.message });
  }
};

exports.getSurvey = async (req, res) => {
  const survey = await Survey.findById(req.params.id);
  res.json(survey);
};
