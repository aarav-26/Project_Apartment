const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all maintenance records
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    const [maintenance] = await connection.execute(`
      SELECT m.*, f.flat_number 
      FROM maintenance m 
      LEFT JOIN flats f ON m.flat_id = f.id 
      ORDER BY m.month_year DESC
    `);
    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get pending dues
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    const [pending] = await connection.execute(`
      SELECT m.*, f.flat_number, f.owner_name 
      FROM maintenance m 
      LEFT JOIN flats f ON m.flat_id = f.id 
      WHERE m.status = 'Pending' OR m.status = 'Overdue'
      ORDER BY m.due_date ASC
    `);
    res.json(pending);
  } catch (error) {
    console.error('Error fetching pending dues:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create maintenance record
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { flat_id, month_year, amount, due_date } = req.body;

    if (!flat_id || !month_year || !amount) {
      return res.status(400).json({ message: 'Flat ID, month/year, and amount are required' });
    }

    const connection = db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO maintenance (flat_id, month_year, amount, due_date) VALUES (?, ?, ?, ?)',
      [flat_id, month_year, amount, due_date]
    );

    res.status(201).json({ id: result.insertId, message: 'Maintenance record created successfully' });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update payment
router.put('/:id/payment', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { paid_date, payment_mode } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      'UPDATE maintenance SET paid_date = ?, payment_mode = ?, status = "Paid" WHERE id = ?',
      [paid_date, payment_mode, id]
    );

    res.json({ message: 'Payment updated successfully' });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete maintenance record
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = db.getConnection();
    await connection.execute('DELETE FROM maintenance WHERE id = ?', [id]);
    res.json({ message: 'Maintenance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;