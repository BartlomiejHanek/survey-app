const Survey = require("../models/Survey");

exports.createSurvey = async (req, res) => {
  const survey = await Survey.create(req.body);
  res.json(survey);
};

exports.getSurvey = async (req, res) => {
  const survey = await Survey.findById(req.params.id);
  res.json(survey);
};
