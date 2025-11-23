const crypto = require('crypto');
const userModel = require('../models/user.model');
const apikeyModel = require('../models/apikey.model');

// 1. Menampilkan halaman formulir
exports.renderCreatePage = (req, res) => {
  // message: null berarti tidak ada pesan sukses/error saat pertama load
  res.render('user/create', { message: null }); 
};

// 2. (AJAX) Menghasilkan key baru
exports.generateNewKey = (req, res) => {
  // Buat 24 karakter acak (48 char hex)
  const newKey = crypto.randomBytes(24).toString('hex'); 
  res.json({ apiKey: newKey });
};

// 3. Menyimpan data (Form submission)
exports.handleSaveKey = (req, res) => {
  const { first_name, last_name, email, api_key } = req.body;
  
  // Ambil koneksi DB dari app.locals
  const db = req.app.locals.db; 

  // Validasi sederhana
  if (!first_name || !last_name || !email || !api_key) {
    return res.render('user/create', { message: { type: 'error', text: 'Semua field harus diisi!' } });
  }

  let finalUserId;

  // Alur:
  // 1. Cek apakah user (email) sudah ada.
  userModel.findByEmail(db, email, (err, existingUser) => {
    if (err) {
      console.error(err);
      return res.render('user/create', { message: { type: 'error', text: 'Error database (1).' } });
    }

    if (existingUser) {
      // 1a. Jika user ada, kita pakai ID-nya
      finalUserId = existingUser.id;
      // Langsung lanjut ke step 2 (simpan apikey)
      saveApiKey(finalUserId);
    } else {
      // 1b. Jika user tidak ada, buat user baru
      const newUser = { first_name, last_name, email };
      userModel.create(db, newUser, (err, newUserId) => {
        if (err) {
          console.error(err);
          return res.render('user/create', { message: { type: 'error', text: 'Error database (2).' } });
        }
        finalUserId = newUserId;
        // Lanjut ke step 2 (simpan apikey)
        saveApiKey(finalUserId);
      });
    }
  });

  // 2. Fungsi untuk menyimpan API Key
  function saveApiKey(userId) {
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 1); // Set 1 bulan dari sekarang

    const apiKeyData = {
      user_id: userId,
      api_key: api_key,
      start_date: today.toISOString().slice(0, 10), // Format YYYY-MM-DD
      end_date: endDate.toISOString().slice(0, 10), // Format YYYY-MM-DD
      status: 'valid'
    };

    apikeyModel.create(db, apiKeyData, (err, result) => {
      if (err) {
        console.error(err);
        // Jika error (misal API key duplikat/sudah dipakai)
        return res.render('user/create', { message: { type: 'error', text: 'API Key ini sudah terdaftar. Coba generate lagi.' } });
      }

      // Sukses!
      res.render('user/create', { 
        message: { type: 'success', text: 'API Key berhasil disimpan!' } 
      });
    });
  }
};