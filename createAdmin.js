const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const dbConfig = require('./config/db.config');

// --- HANYA EDIT BAGIAN INI ---
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "password123";
// ------------------------------

// Buat koneksi
const connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  port: dbConfig.PORT
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