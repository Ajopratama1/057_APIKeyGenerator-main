const bcrypt = require('bcryptjs');
const adminModel = require('../models/admin.model');
const apikeyModel = require('../models/apikey.model');

// 1. Menampilkan halaman login
exports.renderLoginPage = (req, res) => {
  // Jika sudah login, lempar ke dashboard
  if (req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: null });
};

// 2. Memproses data login
exports.handleLogin = (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  // --- DEBUGGING LOG BARU ---
  console.log('--- PERCOBAAN LOGIN ---');
  console.log(`Email dari form: ${email}`);
  console.log(`Password dari form (teks biasa): ${password}`);
  // ----------------------------

  adminModel.findByEmail(db, email, (err, admin) => {
    if (err) {
      console.error(err);
      return res.render('admin/login', { error: 'Terjadi kesalahan server.' });
    }

    // Cek jika admin tidak ditemukan
    if (!admin) {
      console.log('Admin tidak ditemukan di database.'); // DEBUG
      return res.render('admin/login', { error: 'Email atau password salah.' });
    }

    console.log(`Password HASH dari DB: ${admin.password}`); // DEBUG: Lihat hash di DB

    // Cek password
    bcrypt.compare(password, admin.password, (err, isMatch) => {
      // --- DEBUGGING LOG BARU ---
      if (err) {
        console.error("Error saat bcrypt.compare:", err); // DEBUG
        return res.render('admin/login', { error: 'Terjadi kesalahan server.' });
      }
      
      console.log(`Hasil Perbandingan (isMatch): ${isMatch}`); // DEBUG: Ini yang paling penting
      // ----------------------------
      
      if (isMatch) {
        // Password cocok! Buat session
        req.session.adminId = admin.id;
        res.redirect('/admin/dashboard');
      } else {
        // Password tidak cocok
        return res.render('admin/login', { error: 'Email atau password salah.' });
      }
    });
  });
};

// 3. Logout
exports.handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/admin/login');
  });
};

// 4. Menampilkan Dashboard
exports.renderDashboard = (req, res) => {
  const db = req.app.locals.db;

  // 1. Update dulu status key yang kadaluwarsa
  apikeyModel.updateExpiredKeys(db, (err, updateResult) => {
    if (err) {
      console.error(err);
      return res.send("Error updating keys");
    }

    // 2. Ambil semua key yang sudah ter-update
    apikeyModel.getAllWithUser(db, (err, keys) => {
      if (err) {
        console.error(err);
        return res.send("Error fetching keys");
      }

      res.render('admin/dashboard', { 
        title: 'Dashboard', 
        keys: keys 
      });
    });
  });
};

// 5. Menampilkan Halaman Detail
exports.renderDetail = (req, res) => {
  const db = req.app.locals.db;
  const keyId = req.params.id;

  apikeyModel.getOneWithUser(db, keyId, (err, detail) => {
    if (err) {
      console.error(err);
      return res.send("Error fetching detail");
    }
    
    if (!detail) {
      return res.redirect('/admin/dashboard'); // Jika key tidak ditemukan
    }

    res.render('admin/detail', { 
      title: 'Detail API Key', 
      detail: detail 
    });
  });
};

// 6. Menghapus API Key
exports.deleteApiKey = (req, res) => {
  const db = req.app.locals.db;
  const keyId = req.params.id;

  apikeyModel.deleteById(db, keyId, (err, result) => {
    if (err) {
      console.error(err);
      return res.send("Error deleting key");
    }
    // Setelah hapus, kembali ke dashboard
    res.redirect('/admin/dashboard');
  });
};