const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admincontroller');

const requireLogin = (req, res, next) => {
  if (!req.session.adminId) {
    // Jika belum login, lempar ke halaman login
    return res.redirect('/admin/login');
  }
  // Jika sudah login, lanjut
  next();
};
// GET /admin/login -> Tampilkan halaman login
router.get('/login', adminController.renderLoginPage);

// POST /admin/login -> Proses login
router.post('/login', adminController.handleLogin);

// GET /admin/logout -> Proses logout
router.get('/logout', adminController.handleLogout);

// --- Rute yang Diproteksi ---
// Gunakan 'requireLogin' untuk semua rute di bawah ini

// GET /admin/dashboard
router.get('/dashboard', requireLogin, adminController.renderDashboard);

// GET /admin/detail/:id
router.get('/detail/:id', requireLogin, adminController.renderDetail);

// POST /admin/delete/:id (Kita pakai POST untuk aksi hapus)
router.post('/delete/:id', requireLogin, adminController.deleteApiKey);

module.exports = router;