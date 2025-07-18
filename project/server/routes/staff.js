const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all staff
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    const [staff] = await connection.execute('SELECT * FROM staff ORDER BY name');
    res.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new staff member
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, role, contact, shift_start, shift_end, salary } = req.body;

    if (!name || !role) {
      return res.status(400).json({ message: 'Name and role are required' });
    }

    const connection = db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO staff (name, role, contact, shift_start, shift_end, salary) VALUES (?, ?, ?, ?, ?, ?)',
      [name, role, contact, shift_start, shift_end, salary]
    );

    res.status(201).json({ id: result.insertId, message: 'Staff member created successfully' });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update staff member
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, contact, shift_start, shift_end, salary, status } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      `UPDATE staff SET name = ?, role = ?, contact = ?, shift_start = ?, 
       shift_end = ?, salary = ?, status = ? WHERE id = ?`,
      [name, role, contact, shift_start, shift_end, salary, status, id]
    );

    res.json({ message: 'Staff member updated successfully' });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete staff member
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = db.getConnection();
    await connection.execute('DELETE FROM staff WHERE id = ?', [id]);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;