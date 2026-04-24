const SupportTicket = require('../models/SupportTicket');

// @desc    Create support/report ticket
// @route   POST /api/support/tickets
// @access  Private
const createTicket = async (req, res, next) => {
  try {
    const { type, category, subject, message } = req.body;

    if (!['support', 'report'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid ticket type' });
    }

    const ticket = await SupportTicket.create({
      user: req.userId,
      type,
      category: category || '',
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Ticket submitted successfully',
      data: { ticket },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user tickets
// @route   GET /api/support/tickets
// @access  Private
const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ user: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { tickets },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
};
