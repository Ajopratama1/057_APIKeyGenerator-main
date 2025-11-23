const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const dbConfig = require('./config/db.config');

// --- HANYA EDIT BAGIAN INI ---
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
// ------------------------------

// Buat koneksi
const connection = mysql.createConnection({
  host: dbConfig.HOST || process.env.DB_HOST || 'localhost',
  user: dbConfig.USER || process.env.DB_USER || 'root',
  password: dbConfig.PASSWORD || process.env.DB_PASSWORD || '',
  database: dbConfig.DB || process.env.DB_NAME || process.env.DB_DATABASE || 'pws_db',
  port: dbConfig.PORT || (process.env.DB_PORT ? Number(process.env.DB_PORT) : 3309)
});

connection.connect(async (err) => {
  if (err) {
    console.error("Koneksi gagal: ", err);
    return;
  }
  
  console.log("Koneksi berhasil. Membuat admin...");

  // Hash password
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  
  const sql = "INSERT INTO admins (email, password) VALUES (?, ?)";
  
  connection.query(sql, [ADMIN_EMAIL, hashedPassword], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log("Email admin tersebut sudah ada.");
      } else {
        console.error("Gagal membuat admin: ", err);
      }
    } else {
      console.log("Admin berhasil dibuat dengan ID:", result.insertId);
    }
    connection.end();
  });
});