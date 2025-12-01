const mongoose = require("mongoose");

const surveySchema = new mongoose.Schema({
  title: String,
  description: String,
  questions: [
    {
      text: String,
      type: String,
      options: [String],
      required: Boolean,
    },
  ],
});

module.exports = mongoose.model("Survey", surveySchema);
