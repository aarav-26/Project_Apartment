const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all labor payments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    let query = `
      SELECT lp.*, s.name as staff_name, s.role as staff_role, wo.description as work_description
      FROM labor_payments lp
      LEFT JOIN staff s ON lp.staff_id = s.id
      LEFT JOIN work_orders wo ON lp.work_order_id = wo.id
    `;

    if (req.user.role === 'maintenance') {
      // Show only payments for this staff member
      const [staffUser] = await connection.execute(
        'SELECT id FROM staff WHERE name = ? OR contact = ?',
        [req.user.username, req.user.username]
      );
      if (staffUser.length > 0) {
        query += ` WHERE lp.staff_id = ${staffUser[0].id}`;
      }
    }

    query += ' ORDER BY lp.created_at DESC';
    
    const [payments] = await connection.execute(query);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching labor payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create labor payment
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      staff_id,
      work_order_id,
      amount,
      payment_type,
      hours_worked,
      payment_date,
      notes
    } = req.body;

    const connection = db.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO labor_payments (staff_id, work_order_id, amount, payment_type, hours_worked, payment_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [staff_id, work_order_id, amount, payment_type, hours_worked, payment_date, notes]
    );

    res.status(201).json({ id: result.insertId, message: 'Labor payment created successfully' });
  } catch (error) {
    console.error('Error creating labor payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update payment status
router.put('/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      'UPDATE labor_payments SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;