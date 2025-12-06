const Survey = require("../models/Survey");

exports.createSurvey = async (req, res) => {
  try {
    const { title, description, questions } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "Tytuł jest wymagany i musi być tekstem" });
    }

    const normalizedQuestions = Array.isArray(questions)
      ? questions.map((q = {}, index) => {
          const { title: qTitle, text, type = "text", options = [] } = q;
          return {
            text: qTitle || text || `Pytanie ${index + 1}`,
            type,
            required: !!q.required,
            options: Array.isArray(options) ? options.map(o => ({ text: (typeof o === 'string' ? o : (o.text || '')) })) : [],
            order: typeof q.order === 'number' ? q.order : index
          };
        })
      : [];

    const survey = await Survey.create({
      title,
      description,
      questions: normalizedQuestions,
    });
    res.json(survey);
  } catch (error) {
    console.error("Bład przy tworzeniu ankiety:", error);
    res.status(500).json({ message: "Nie udało się utworzyć ankiety", error: error.message });
  }
};

exports.getSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Ankieta nie znaleziona' });
    res.json(survey);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Błąd serwera' });
  }
};
