const Response = require("../models/Response");

const normalizeAnswers = (answers) => {
  if (Array.isArray(answers)) {
    return answers.map(a => ({ questionId: a.questionId || a.question, value: a.value }));
  } else if (answers && typeof answers === 'object') {
    return Object.keys(answers).map(qId => ({ questionId: qId, value: answers[qId] }));
  }
  return [];
};

const handleError = (res, err, message) => {
  console.error(err);
  res.status(500).json({ error: message });
};

exports.sendResponse = async (req, res) => {
  try {
    const answers = normalizeAnswers(req.body.answers);

    const response = await Response.create({
      survey: req.params.surveyId,
      answers,
      meta: {
        ip: req.ip,
        userAgent: req.get('User-Agent') || ''
      }
    });
    res.json(response);
  } catch (err) {
    handleError(res, err, 'Błąd zapisu odpowiedzi');
  }
};

exports.getResponses = async (req, res) => {
  try {
    const responses = await Response.find({ survey: req.params.surveyId });
    res.json(responses);
  } catch (err) {
    handleError(res, err, 'Błąd pobierania odpowiedzi');
  }
};