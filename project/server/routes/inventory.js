const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all inventory items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    const [inventory] = await connection.execute(`
      SELECT *, 
        CASE WHEN current_stock <= minimum_stock THEN 'Low Stock' ELSE 'In Stock' END as stock_status
      FROM inventory 
      ORDER BY item_name
    `);
    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create inventory item
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      item_name,
      category,
      current_stock,
      minimum_stock,
      unit,
      cost_per_unit,
      supplier
    } = req.body;

    const connection = db.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO inventory (item_name, category, current_stock, minimum_stock, unit, cost_per_unit, supplier, last_restocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE)`,
      [item_name, category, current_stock, minimum_stock, unit, cost_per_unit, supplier]
    );

    res.status(201).json({ id: result.insertId, message: 'Inventory item created successfully' });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update inventory stock
router.put('/:id/stock', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { current_stock } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      'UPDATE inventory SET current_stock = ?, last_restocked = CURRENT_DATE WHERE id = ?',
      [current_stock, id]
    );

    res.json({ message: 'Stock updated successfully' });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get inventory requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    let query = `
      SELECT ir.*, i.item_name, i.unit, s.name as requested_by_name, s.role as staff_role
      FROM inventory_requests ir
      LEFT JOIN inventory i ON ir.inventory_id = i.id
      LEFT JOIN staff s ON ir.requested_by = s.id
    `;

    if (req.user.role === 'maintenance') {
      // Show only requests made by this staff member
      const [staffUser] = await connection.execute(
        'SELECT id FROM staff WHERE name = ? OR contact = ?',
        [req.user.username, req.user.username]
      );
      if (staffUser.length > 0) {
        query += ` WHERE ir.requested_by = ${staffUser[0].id}`;
      }
    }

    query += ' ORDER BY ir.created_at DESC';
    
    const [requests] = await connection.execute(query);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching inventory requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create inventory request
router.post('/requests', authenticateToken, async (req, res) => {
  try {
    const { inventory_id, quantity_requested, reason } = req.body;

    // Get staff ID for the requesting user
    const connection = db.getConnection();
    const [staffUser] = await connection.execute(
      'SELECT id FROM staff WHERE name = ? OR contact = ?',
      [req.user.username, req.user.username]
    );

    if (staffUser.length === 0) {
      return res.status(400).json({ message: 'Staff member not found' });
    }

    const [result] = await connection.execute(
      'INSERT INTO inventory_requests (requested_by, inventory_id, quantity_requested, reason) VALUES (?, ?, ?, ?)',
      [staffUser[0].id, inventory_id, quantity_requested, reason]
    );

    res.status(201).json({ id: result.insertId, message: 'Inventory request created successfully' });
  } catch (error) {
    console.error('Error creating inventory request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update inventory request status
router.put('/requests/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const connection = db.getConnection();
    
    if (status === 'Approved') {
      await connection.execute(
        'UPDATE inventory_requests SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, req.user.id, id]
      );
    } else {
      await connection.execute(
        'UPDATE inventory_requests SET status = ? WHERE id = ?',
        [status, id]
      );
    }

    res.json({ message: 'Request status updated successfully' });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;