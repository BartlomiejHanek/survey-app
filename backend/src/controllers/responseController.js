const Response = require("../models/Response");

exports.sendResponse = async (req, res) => {
  const response = await Response.create({
    surveyId: req.params.surveyId,
    answers: req.body.answers,
  });
  res.json(response);
};

exports.getResponses = async (req, res) => {
  const responses = await Response.find({ surveyId: req.params.surveyId });
  res.json(responses);
};