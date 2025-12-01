const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  surveyId: mongoose.Schema.Types.ObjectId,
  answers: [
    {
      questionId: Number,
      value: mongoose.Schema.Types.Mixed,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Response", responseSchema);
