const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const connection = db.getConnection();
    
    // Get flat statistics
    const [flatStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_flats,
        SUM(CASE WHEN occupancy_status = 'Vacant' THEN 1 ELSE 0 END) as vacant_flats,
        SUM(CASE WHEN occupancy_status != 'Vacant' THEN 1 ELSE 0 END) as occupied_flats
      FROM flats
    `);

    // Get maintenance statistics
    const [maintenanceStats] = await connection.execute(`
      SELECT 
        SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as collected_amount,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count
      FROM maintenance
    `);

    // Get complaint statistics
    const [complaintStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_complaints,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_complaints,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_complaints
      FROM complaints
    `);

    // Get recent activities
    const [recentComplaints] = await connection.execute(`
      SELECT c.title, c.status, c.created_at, f.flat_number
      FROM complaints c
      LEFT JOIN flats f ON c.flat_id = f.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    const [recentVisitors] = await connection.execute(`
      SELECT v.visitor_name, v.time_in, f.flat_number
      FROM visitors v
      LEFT JOIN flats f ON v.flat_id = f.id
      ORDER BY v.time_in DESC
      LIMIT 5
    `);

    res.json({
      flats: flatStats[0],
      maintenance: maintenanceStats[0],
      complaints: complaintStats[0],
      recentComplaints,
      recentVisitors
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;