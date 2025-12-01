const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: { type: String, default: "text" },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  questions: { type: [questionSchema], default: [] },
});

module.exports = mongoose.model("Survey", surveySchema);