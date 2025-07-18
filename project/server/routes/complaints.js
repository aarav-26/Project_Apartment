const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all complaints
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    const [complaints] = await connection.execute(`
      SELECT c.*, f.flat_number 
      FROM complaints c 
      LEFT JOIN flats f ON c.flat_id = f.id 
      ORDER BY c.created_at DESC
    `);
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all inquiries (admin only)
router.get('/inquiries', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const connection = db.getConnection();
    const [inquiries] = await connection.execute(
      'SELECT * FROM contact_inquiries ORDER BY created_at DESC'
    );
    res.json(inquiries);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { flat_id, title, description, priority } = req.body;

    if (!flat_id || !title) {
      return res.status(400).json({ message: 'Flat ID and title are required' });
    }

    const connection = db.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO complaints (flat_id, title, description, priority, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [flat_id, title, description, priority || 'Medium', req.user.username]
    );

    res.status(201).json({ id: result.insertId, message: 'Complaint created successfully' });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update complaint status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      'UPDATE complaints SET status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, assigned_to, id]
    );

    res.json({ message: 'Complaint updated successfully' });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete complaint
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = db.getConnection();
    await connection.execute('DELETE FROM complaints WHERE id = ?', [id]);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;