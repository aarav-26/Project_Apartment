const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all work orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    let query = `
      SELECT wo.*, c.title as complaint_title, f.flat_number, s.name as assigned_to_name, s.role as staff_role
      FROM work_orders wo
      LEFT JOIN complaints c ON wo.complaint_id = c.id
      LEFT JOIN flats f ON wo.flat_id = f.id
      LEFT JOIN staff s ON wo.assigned_to = s.id
    `;
    
    // Filter based on user role
    if (req.user.role === 'maintenance') {
      // Get staff ID for the logged-in maintenance user
      const [staffUser] = await connection.execute(
        'SELECT id FROM staff WHERE name = ? OR contact = ?',
        [req.user.username, req.user.username]
      );
      if (staffUser.length > 0) {
        query += ` WHERE wo.assigned_to = ${staffUser[0].id}`;
      }
    }
    
    query += ' ORDER BY wo.created_at DESC';
    
    const [workOrders] = await connection.execute(query);
    res.json(workOrders);
  } catch (error) {
    console.error('Error fetching work orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create work order
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const {
      complaint_id,
      assigned_to,
      flat_id,
      work_type,
      description,
      priority,
      estimated_hours,
      materials_needed
    } = req.body;

    const connection = db.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO work_orders (complaint_id, assigned_to, flat_id, work_type, description, priority, estimated_hours, materials_needed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [complaint_id, assigned_to, flat_id, work_type, description, priority, estimated_hours, materials_needed]
    );

    res.status(201).json({ id: result.insertId, message: 'Work order created successfully' });
  } catch (error) {
    console.error('Error creating work order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update work order status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actual_hours } = req.body;

    const connection = db.getConnection();
    let updateQuery = 'UPDATE work_orders SET status = ?';
    let params = [status];

    if (status === 'In Progress') {
      updateQuery += ', started_at = CURRENT_TIMESTAMP';
    } else if (status === 'Completed') {
      updateQuery += ', completed_at = CURRENT_TIMESTAMP';
      if (actual_hours) {
        updateQuery += ', actual_hours = ?';
        params.push(actual_hours);
      }
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    await connection.execute(updateQuery, params);
    res.json({ message: 'Work order updated successfully' });
  } catch (error) {
    console.error('Error updating work order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete work order
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const connection = db.getConnection();
    await connection.execute('DELETE FROM work_orders WHERE id = ?', [id]);
    res.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Error deleting work order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;