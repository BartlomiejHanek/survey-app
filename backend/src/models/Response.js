const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  value: mongoose.Schema.Types.Mixed
}, { _id: false });

const ResponseSchema = new mongoose.Schema({
  survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  answers: [AnswerSchema],
  createdAt: { type: Date, default: Date.now },
  meta: {
    ip: String,
    userAgent: String,
    token: String
  }
});

module.exports = mongoose.model('Response', ResponseSchema);
