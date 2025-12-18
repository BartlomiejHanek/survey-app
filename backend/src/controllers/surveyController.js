const Survey = require("../models/Survey");

const normalizeQuestions = (questions) => {
  if (!Array.isArray(questions)) return [];

  return questions.map((q = {}, index) => {
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

const handleError = (res, err, message) => {
  console.error(err);
  res.status(500).json({ message });
};

exports.createSurvey = async (req, res) => {
  try {
    const { title, description, questions } = req.body || {};

    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "Tytuł jest wymagany i musi być tekstem" });
    }

    const normalizedQuestions = normalizeQuestions(questions);

    const survey = await Survey.create({
      title,
      description,
      questions: normalizedQuestions,
    });
    res.json(survey);
  } catch (error) {
    handleError(res, error, "Nie udało się utworzyć ankiety");
  }
};

exports.getSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Ankieta nie znaleziona' });
    res.json(survey);
  } catch (err) {
    handleError(res, err, 'Błąd serwera');
  }
};
