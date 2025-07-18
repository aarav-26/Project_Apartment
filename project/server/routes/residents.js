const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all residents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    const [residents] = await connection.execute(`
      SELECT r.*, f.flat_number 
      FROM residents r 
      LEFT JOIN flats f ON r.flat_id = f.id 
      ORDER BY f.flat_number
    `);
    res.json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get residents by flat ID
router.get('/flat/:flatId', authenticateToken, async (req, res) => {
  try {
    const { flatId } = req.params;
    const connection = db.getConnection();
    const [residents] = await connection.execute(
      'SELECT * FROM residents WHERE flat_id = ?',
      [flatId]
    );
    res.json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new resident
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      flat_id,
      name,
      email,
      contact,
      id_proof_type,
      id_proof_number,
      id_proof_document,
      vehicle_info,
      is_owner
    } = req.body;

    if (!flat_id || !name) {
      return res.status(400).json({ message: 'Flat ID and name are required' });
    }

    const connection = db.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO residents (flat_id, name, email, contact, id_proof_type, 
       id_proof_number, id_proof_document, vehicle_info, is_owner) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [flat_id, name, email, contact, id_proof_type, id_proof_number,
       id_proof_document, vehicle_info, is_owner || false]
    );

    res.status(201).json({ id: result.insertId, message: 'Resident created successfully' });
  } catch (error) {
    console.error('Error creating resident:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update resident
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      flat_id,
      name,
      email,
      contact,
      id_proof_type,
      id_proof_number,
      id_proof_document,
      vehicle_info,
      is_owner
    } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      `UPDATE residents SET flat_id = ?, name = ?, email = ?, contact = ?, 
       id_proof_type = ?, id_proof_number = ?, id_proof_document = ?, 
       vehicle_info = ?, is_owner = ? WHERE id = ?`,
      [flat_id, name, email, contact, id_proof_type, id_proof_number,
       id_proof_document, vehicle_info, is_owner, id]
    );

    res.json({ message: 'Resident updated successfully' });
  } catch (error) {
    console.error('Error updating resident:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete resident
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = db.getConnection();
    await connection.execute('DELETE FROM residents WHERE id = ?', [id]);
    res.json({ message: 'Resident deleted successfully' });
  } catch (error) {
    console.error('Error deleting resident:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;