const express = require('express');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Submit contact inquiry (public route)
router.post('/inquiry', async (req, res) => {
  try {
    const { name, email, phone, inquiry_type, message } = req.body;

    const connection = db.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO contact_inquiries (name, email, phone, inquiry_type, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone, inquiry_type, message]
    );

    res.status(201).json({ id: result.insertId, message: 'Inquiry submitted successfully' });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
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

// Update inquiry status
router.put('/inquiries/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      'UPDATE contact_inquiries SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );

    res.json({ message: 'Inquiry status updated successfully' });
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit vacancy application (public route)
router.post('/vacancy-application', async (req, res) => {
  try {
    const {
      flat_id,
      applicant_name,
      applicant_email,
      applicant_phone,
      occupation,
      family_size,
      preferred_move_date,
      documents
    } = req.body;

    const connection = db.getConnection();
    const [result] = await connection.execute(
      `INSERT INTO vacancy_applications 
       (flat_id, applicant_name, applicant_email, applicant_phone, occupation, family_size, preferred_move_date, documents)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [flat_id, applicant_name, applicant_email, applicant_phone, occupation, family_size, preferred_move_date, documents]
    );

    res.status(201).json({ id: result.insertId, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get vacancy applications (admin only)
router.get('/vacancy-applications', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const connection = db.getConnection();
    const [applications] = await connection.execute(`
      SELECT va.*, f.flat_number
      FROM vacancy_applications va
      LEFT JOIN flats f ON va.flat_id = f.id
      ORDER BY va.created_at DESC
    `);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update application status
router.put('/vacancy-applications/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    const connection = db.getConnection();
    await connection.execute(
      'UPDATE vacancy_applications SET status = ?, admin_notes = ? WHERE id = ?',
      [status, admin_notes, id]
    );

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;