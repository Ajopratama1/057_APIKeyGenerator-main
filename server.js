const express = require("express");
const mysql = require("mysql2");
const dbConfig = require("./config/db.config");
const path = require('path');
require('dotenv').config();
const session = require('express-session'); // Untuk login admin

const app = express();

// Konfigurasi EJS sebagai template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware untuk parsing request body (form data)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Middleware Session ---
// Dibutuhkan untuk melacak status login admin
app.use(session({
  secret: 'ini-adalah-secret-key-anda-ganti-nanti', // Ganti dengan string acak
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set 'true' jika Anda menggunakan HTTPS
}));


// --- Routes --- 
// (Didefinisikan sebelum koneksi, tapi digunakan setelahnya)

// 1. Route User (Halaman Utama)
const userRoutes = require('./routes/userroutes'); 
app.use('/', userRoutes); // URL / akan ditangani oleh userRoutes

// 2. Route Admin (/admin/...)
const adminRoutes = require('./routes/adminroutes');
// Semua rute di adminRoutes akan berawalan /admin
app.use('/admin', adminRoutes);


// --- Tentukan Port Server ---
const PORT = process.env.PORT || 3000;


// --- Koneksi Database & Jalankan Server ---
// Kita buat koneksi dulu
const connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB,
  port: dbConfig.PORT
});

// Coba hubungkan ke database
connection.connect(error => {
  if (error) {
    console.error("Kesalahan koneksi database: " + error.stack);
    return;
  }
  
  console.log("Berhasil terhubung ke database MySQL sebagai id " + connection.threadId);
  
  // Simpan koneksi di app.locals agar bisa diakses di semua controller
  app.locals.db = connection; 

  // JALANKAN SERVER HANYA SETELAH DATABASE SIAP
  app.listen(PORT, () => {
    // Log yang bisa di-klik
    console.log(`🚀 Server berjalan di: http://localhost:${PORT}`);
    console.log("(Klik link di atas atau Ctrl+Klik untuk membuka aplikasi)");
  });
});