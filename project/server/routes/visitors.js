const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all visitors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    const [visitors] = await connection.execute(`
      SELECT v.*, f.flat_number 
      FROM visitors v 
      LEFT JOIN flats f ON v.flat_id = f.id 
      ORDER BY v.time_in DESC
    `);
    res.json(visitors);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check in visitor
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { flat_id, visitor_name, visitor_contact, purpose } = req.body;

    if (!flat_id || !visitor_name) {
      return res.status(400).json({ message: 'Flat ID and visitor name are required' });
    }

    const connection = db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO visitors (flat_id, visitor_name, visitor_contact, purpose) VALUES (?, ?, ?, ?)',
      [flat_id, visitor_name, visitor_contact, purpose]
    );

    res.status(201).json({ id: result.insertId, message: 'Visitor checked in successfully' });
  } catch (error) {
    console.error('Error checking in visitor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check out visitor
router.put('/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = db.getConnection();
    
    await connection.execute(
      'UPDATE visitors SET time_out = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Visitor checked out successfully' });
  } catch (error) {
    console.error('Error checking out visitor:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;