const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['support', 'report'],
    required: true,
  },
  category: {
    type: String,
    default: '',
    trim: true,
    maxlength: [60, 'Category cannot exceed 60 characters'],
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [120, 'Subject cannot exceed 120 characters'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
