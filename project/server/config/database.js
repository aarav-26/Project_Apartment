const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
};

let connection;

const createConnection = async () => {
  try {
    connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Error creating database connection:', error);
    throw error;
  }
};

const initializeDatabase = async () => {
  try {
    // Create database if it doesn't exist
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await tempConnection.end();

    // Connect to the database
    connection = await createConnection();

    // Create tables
    await createTables();
    await insertSampleData();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const createTables = async () => {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'tenant', 'maintenance') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Flats table
    `CREATE TABLE IF NOT EXISTS flats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flat_number VARCHAR(10) UNIQUE NOT NULL,
      owner_name VARCHAR(255) NOT NULL,
      owner_contact VARCHAR(15),
      current_tenant VARCHAR(255),
      tenant_contact VARCHAR(15),
      occupancy_status ENUM('Owner-occupied', 'Tenant-occupied', 'Vacant') DEFAULT 'Vacant',
      vehicle_info TEXT,
      monthly_rent DECIMAL(10,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Residents table
    `CREATE TABLE IF NOT EXISTS residents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flat_id INT,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      contact VARCHAR(15),
      id_proof_type VARCHAR(50),
      id_proof_number VARCHAR(100),
      id_proof_document LONGBLOB,
      vehicle_info TEXT,
      iv VARCHAR(64),
      is_owner BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
    )`,

    // Maintenance table
    `CREATE TABLE IF NOT EXISTS maintenance (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flat_id INT,
      month_year VARCHAR(7) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      due_date DATE,
      paid_date DATE NULL,
      payment_mode VARCHAR(50),
      status ENUM('Pending', 'Paid', 'Overdue') DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
    )`,

    // Complaints table
    `CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flat_id INT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('Pending', 'In Progress', 'Resolved') DEFAULT 'Pending',
      priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
      created_by VARCHAR(255),
      assigned_to VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
    )`,

    // Visitors table
    `CREATE TABLE IF NOT EXISTS visitors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flat_id INT,
      visitor_name VARCHAR(255) NOT NULL,
      visitor_contact VARCHAR(15),
      purpose VARCHAR(255),
      time_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      time_out TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
    )`,

    // Staff table
    `CREATE TABLE IF NOT EXISTS staff (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role ENUM('plumber', 'electrician', 'watchman', 'cleaner', 'gardener', 'security', 'maintenance') NOT NULL,
      contact VARCHAR(15),
      specialization VARCHAR(255),
      shift_start TIME,
      shift_end TIME,
      salary DECIMAL(10,2),
      hourly_rate DECIMAL(10,2),
      status ENUM('Active', 'Inactive') DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Work Orders table
    `CREATE TABLE IF NOT EXISTS work_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      complaint_id INT,
      assigned_to INT,
      flat_id INT,
      work_type ENUM('plumbing', 'electrical', 'cleaning', 'gardening', 'security', 'general') NOT NULL,
      description TEXT,
      priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
      status ENUM('Assigned', 'In Progress', 'Completed', 'On Hold') DEFAULT 'Assigned',
      estimated_hours DECIMAL(4,2),
      actual_hours DECIMAL(4,2),
      materials_needed TEXT,
      cost DECIMAL(10,2) DEFAULT 0,
      started_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES staff(id) ON DELETE SET NULL,
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
    )`,

    // Inventory table
    `CREATE TABLE IF NOT EXISTS inventory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_name VARCHAR(255) NOT NULL,
      category ENUM('plumbing', 'electrical', 'cleaning', 'gardening', 'security', 'general') NOT NULL,
      current_stock INT DEFAULT 0,
      minimum_stock INT DEFAULT 10,
      unit VARCHAR(50),
      cost_per_unit DECIMAL(10,2),
      supplier VARCHAR(255),
      last_restocked DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Inventory Requests table
    `CREATE TABLE IF NOT EXISTS inventory_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      requested_by INT,
      inventory_id INT,
      quantity_requested INT NOT NULL,
      reason TEXT,
      status ENUM('Pending', 'Approved', 'Rejected', 'Fulfilled') DEFAULT 'Pending',
      approved_by INT NULL,
      approved_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (requested_by) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )`,

    // Labor Payments table
    `CREATE TABLE IF NOT EXISTS labor_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      staff_id INT,
      work_order_id INT,
      amount DECIMAL(10,2) NOT NULL,
      payment_type ENUM('hourly', 'fixed', 'bonus') DEFAULT 'hourly',
      hours_worked DECIMAL(4,2),
      payment_date DATE,
      status ENUM('Pending', 'Paid') DEFAULT 'Pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
    )`,

    // Contact Inquiries table
    `CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(15),
      inquiry_type ENUM('vacancy', 'general', 'complaint', 'service') DEFAULT 'general',
      message TEXT,
      status ENUM('New', 'In Progress', 'Resolved') DEFAULT 'New',
      responded_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    // Vacancy Applications table
    `CREATE TABLE IF NOT EXISTS vacancy_applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flat_id INT,
      applicant_name VARCHAR(255) NOT NULL,
      applicant_email VARCHAR(255) NOT NULL,
      applicant_phone VARCHAR(15),
      occupation VARCHAR(255),
      family_size INT,
      preferred_move_date DATE,
      documents TEXT,
      status ENUM('Applied', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Applied',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE CASCADE
    )`
  ];

  for (const query of queries) {
    await connection.execute(query);
  }
};

const insertSampleData = async () => {
  try {
    // Check if data already exists
    const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (existingUsers[0].count > 0) {
      return; // Data already exists
    }

    // Insert sample users
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);

    await connection.execute(`
      INSERT INTO users (username, email, password, role) VALUES
      ('admin', 'admin@apartment.com', ?, 'admin'),
      ('tenant1', 'tenant1@example.com', ?, 'tenant'),
      ('maintenance1', 'maintenance@apartment.com', ?, 'maintenance')
    `, [hashedPassword, hashedPassword, hashedPassword]);

    // Insert sample flats
    await connection.execute(`
      INSERT INTO flats (flat_number, owner_name, owner_contact, current_tenant, tenant_contact, occupancy_status, vehicle_info, monthly_rent) VALUES
      ('A101', 'John Smith', '9876543210', 'Alice Johnson', '8765432109', 'Tenant-occupied', 'Car: MH01AB1234', 15000.00),
      ('A102', 'Michael Brown', '9876543211', NULL, NULL, 'Owner-occupied', 'Bike: MH01CD5678', 0.00),
      ('A103', 'Sarah Davis', '9876543212', 'Bob Wilson', '8765432108', 'Tenant-occupied', 'Car: MH01EF9012', 18000.00),
      ('A104', 'Robert Johnson', '9876543213', NULL, NULL, 'Vacant', NULL, 0.00),
      ('A105', 'Emily Wilson', '9876543214', NULL, NULL, 'Owner-occupied', 'Car: MH01GH3456', 0.00)
    `);

    // Insert sample residents
    await connection.execute(`
      INSERT INTO residents (flat_id, name, email, contact, id_proof_type, id_proof_number, vehicle_info, is_owner) VALUES
      (1, 'Alice Johnson', 'alice@example.com', '8765432109', 'Aadhar', '1234-5678-9012', 'Car: MH01AB1234', FALSE),
      (2, 'Michael Brown', 'michael@example.com', '9876543211', 'Aadhar', '1234-5678-9013', 'Bike: MH01CD5678', TRUE),
      (3, 'Bob Wilson', 'bob@example.com', '8765432108', 'Passport', 'P1234567', 'Car: MH01EF9012', FALSE)
    `);

    // Insert sample maintenance records
    await connection.execute(`
      INSERT INTO maintenance (flat_id, month_year, amount, due_date, status) VALUES
      (1, '2024-01', 2000.00, '2024-01-05', 'Paid'),
      (1, '2024-02', 2000.00, '2024-02-05', 'Pending'),
      (2, '2024-01', 2000.00, '2024-01-05', 'Paid'),
      (2, '2024-02', 2000.00, '2024-02-05', 'Pending'),
      (3, '2024-01', 2000.00, '2024-01-05', 'Overdue')
    `);

    // Insert sample complaints
    await connection.execute(`
      INSERT INTO complaints (flat_id, title, description, status, priority, created_by) VALUES
      (1, 'Water Leakage', 'There is water leakage in the bathroom', 'Pending', 'High', 'Alice Johnson'),
      (3, 'Elevator Not Working', 'Elevator on floor 5 is not working properly', 'In Progress', 'Medium', 'Bob Wilson'),
      (2, 'Parking Issue', 'Unauthorized vehicle parked in my spot', 'Resolved', 'Low', 'Michael Brown')
    `);

    // Insert sample staff
    await connection.execute(`
      INSERT INTO staff (name, role, contact, specialization, shift_start, shift_end, salary, hourly_rate, status) VALUES
      ('Ramesh Kumar', 'watchman', '9876543220', 'Gate Security', '06:00:00', '18:00:00', 25000.00, 150.00, 'Active'),
      ('Priya Sharma', 'cleaner', '9876543221', 'General Cleaning', '08:00:00', '17:00:00', 20000.00, 120.00, 'Active'),
      ('Suresh Patel', 'plumber', '9876543222', 'Pipe Fitting & Repair', '09:00:00', '18:00:00', 30000.00, 200.00, 'Active'),
      ('Amit Singh', 'electrician', '9876543223', 'Electrical Repairs', '09:00:00', '18:00:00', 32000.00, 220.00, 'Active'),
      ('Ravi Gupta', 'gardener', '9876543224', 'Landscaping', '07:00:00', '16:00:00', 22000.00, 130.00, 'Active')
    `);

    // Insert sample inventory
    await connection.execute(`
      INSERT INTO inventory (item_name, category, current_stock, minimum_stock, unit, cost_per_unit, supplier) VALUES
      ('LED Bulbs 9W', 'electrical', 50, 20, 'pieces', 150.00, 'Philips Store'),
      ('PVC Pipes 1 inch', 'plumbing', 25, 10, 'pieces', 120.00, 'Hardware Store'),
      ('Toilet Cleaner', 'cleaning', 15, 5, 'bottles', 80.00, 'Cleaning Supplies Co'),
      ('Garden Fertilizer', 'gardening', 8, 3, 'bags', 250.00, 'Garden Center'),
      ('Door Locks', 'security', 12, 5, 'pieces', 800.00, 'Security Systems Ltd'),
      ('Electrical Tape', 'electrical', 30, 10, 'rolls', 25.00, 'Electrical Store'),
      ('Pipe Joints', 'plumbing', 40, 15, 'pieces', 45.00, 'Plumbing Supplies')
    `);

    // Insert sample work orders
    await connection.execute(`
      INSERT INTO work_orders (complaint_id, assigned_to, flat_id, work_type, description, priority, status, estimated_hours, materials_needed) VALUES
      (1, 3, 1, 'plumbing', 'Fix bathroom water leakage', 'High', 'Assigned', 2.5, 'PVC pipes, pipe joints'),
      (2, 4, 3, 'electrical', 'Repair elevator electrical system', 'Medium', 'In Progress', 4.0, 'Electrical wires, switches'),
      (3, 1, 2, 'security', 'Investigate parking issue', 'Low', 'Completed', 1.0, 'None')
    `);

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

const getConnection = () => {
  if (!connection) {
    throw new Error('Database connection not established');
  }
  return connection;
};

module.exports = {
  getConnection,
  initializeDatabase,
  createConnection
};