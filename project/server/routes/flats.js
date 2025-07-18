const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all flats
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    const [flats] = await connection.execute('SELECT * FROM flats ORDER BY flat_number');
    res.json(flats);
  } catch (error) {
    console.error('Error fetching flats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get flat by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const connection = db.getConnection();
    const [flats] = await connection.execute('SELECT * FROM flats WHERE id = ?', [id]);
    
    if (flats.length === 0) {
      return res.status(404).json({ message: 'Flat not found' });
    }
    
    res.json(flats[0]);
  } catch (error) {
    console.error('Error fetching flat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new flat (Admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      flat_number,
      owner_name,
      owner_contact,
      current_tenant,
      tenant_contact,
      occupancy_status,
      vehicle_info,
      monthly_rent
    } = req.body;

    if (!flat_number || !owner_name) {
      return res.status(400).json({ message: 'Flat number and owner name are required' });
    }

    const connection = db.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO flats (flat_number, owner_name, owner_contact, current_tenant, 
       tenant_contact, occupancy_status, vehicle_info, monthly_rent) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [flat_number, owner_name, owner_contact, current_tenant, tenant_contact, 
       occupancy_status, vehicle_info, monthly_rent || 0]
    );

    res.status(201).json({ id: result.insertId, message: 'Flat created successfully' });
  } catch (error) {
    console.error('Error creating flat:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Flat number already exists' });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
});

// Update flat (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      flat_number,
      owner_name,
      owner_contact,
      current_tenant,
      tenant_contact,
      occupancy_status,
      vehicle_info,
      monthly_rent
    } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      `UPDATE flats SET flat_number = ?, owner_name = ?, owner_contact = ?, 
       current_tenant = ?, tenant_contact = ?, occupancy_status = ?, 
       vehicle_info = ?, monthly_rent = ? WHERE id = ?`,
      [flat_number, owner_name, owner_contact, current_tenant, tenant_contact,
       occupancy_status, vehicle_info, monthly_rent, id]
    );

    res.json({ message: 'Flat updated successfully' });
  } catch (error) {
    console.error('Error updating flat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete flat (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = db.getConnection();
    await connection.execute('DELETE FROM flats WHERE id = ?', [id]);
    res.json({ message: 'Flat deleted successfully' });
  } catch (error) {
    console.error('Error deleting flat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;