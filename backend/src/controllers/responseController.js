const Response = require("../models/Response");

exports.sendResponse = async (req, res) => {
  try {
    let answers = [];
    if (Array.isArray(req.body.answers)) {
      answers = req.body.answers.map(a => ({ questionId: a.questionId || a.question, value: a.value }));
    } else if (req.body.answers && typeof req.body.answers === 'object') {
      answers = Object.keys(req.body.answers).map(qId => ({ questionId: qId, value: req.body.answers[qId] }));
    }

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
    console.error(err);
    res.status(500).json({ error: 'Błąd zapisu odpowiedzi' });
  }
};

exports.getResponses = async (req, res) => {
  try {
    const responses = await Response.find({ survey: req.params.surveyId });
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd pobierania odpowiedzi' });
  }
};