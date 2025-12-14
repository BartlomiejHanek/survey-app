const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true }
}, { _id: false });

const SavedQuestionSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['text', 'textarea', 'radio', 'checkbox', 'select', 'scale'], 
    required: true 
  },
  required: { 
    type: Boolean, 
    default: false 
  },
  options: [OptionSchema],
  scale: {
    min: { type: Number },
    max: { type: Number }
  },
  imageUrl: { 
    type: String 
  },
  isFavorite: { 
    type: Boolean, 
    default: false 
  },
  category: { 
    type: String 
  },
  tags: [{ 
    type: String 
  }],
  usageCount: { 
    type: Number, 
    default: 0 
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true // Automatycznie dodaje createdAt i updatedAt
});

module.exports = mongoose.model('SavedQuestion', SavedQuestionSchema);

