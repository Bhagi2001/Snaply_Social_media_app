const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { createTicket, getMyTickets } = require('../controllers/supportController');

router.post('/tickets', auth, createTicket);
router.get('/tickets', auth, getMyTickets);

module.exports = router;
