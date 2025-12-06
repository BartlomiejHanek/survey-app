const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true }
}, { _id: false });

const QuestionSchema = new mongoose.Schema({
  type: { type: String, enum: ['radio','checkbox','text','textarea','scale','select'], required: true },
  text: { type: String, required: true },
  imageUrl: { type: String },
  required: { type: Boolean, default: false },
  options: [OptionSchema],
  scale: { min: Number, max: Number },
  order: { type: Number, default: 0 }
}, { _id: true });

const SurveySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft','published','closed'], default: 'draft' },
  allowAnonymous: { type: Boolean, default: true },
  singleResponse: { type: Boolean, default: false },
  maxResponses: { type: Number, default: 0 },
  validFrom: Date,
  validUntil: Date,
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now },
  publishedAt: Date
});

module.exports = mongoose.model('Survey', SurveySchema);
