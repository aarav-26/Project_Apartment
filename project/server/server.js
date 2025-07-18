const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Import routes
const authRoutes = require('./routes/auth');
const flatRoutes = require('./routes/flats');
const residentRoutes = require('./routes/residents');
const maintenanceRoutes = require('./routes/maintenance');
const complaintRoutes = require('./routes/complaints');
const visitorRoutes = require('./routes/visitors');
const staffRoutes = require('./routes/staff');
const dashboardRoutes = require('./routes/dashboard');
const workOrderRoutes = require('./routes/work-orders');
const inventoryRoutes = require('./routes/inventory');
const laborPaymentRoutes = require('./routes/labor-payments');
const contactRoutes = require('./routes/contact');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/flats', flatRoutes);
app.use('/api/residents', residentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/labor-payments', laborPaymentRoutes);
app.use('/api/contact', contactRoutes);

// Initialize database and start server
const initializeApp = async () => {
  try {
    const db = require('./config/database');
    await db.initializeDatabase();
    console.log('Database initialized successfully');
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

initializeApp();